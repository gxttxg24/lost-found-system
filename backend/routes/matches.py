from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from db import get_db_connection
from utils.response import success, fail
from utils.match import run_matching

matches_bp = Blueprint('matches', __name__)


def _serialize_item(row, images):
    return {
        'id': row['id'],
        'type': row['type'],
        'title': row['title'],
        'description': row.get('description'),
        'category_id': row.get('category_id'),
        'category_name': row.get('category_name'),
        'location': row.get('location'),
        'event_time': str(row['event_time']) if row.get('event_time') else None,
        'status': row['status'],
        'contact_info': row.get('contact_info'),
        'username': row.get('username'),
        'images': images,
    }


@matches_bp.route('/item/<int:item_id>', methods=['GET'])
def get_item_matches(item_id):
    """Get smart matches for an item. Auto-computes if none exist."""
    force = request.args.get('force', 'false').lower() == 'true'

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT i.*, c.name AS category_name, u.username
            FROM items i
            LEFT JOIN categories c ON i.category_id = c.id
            LEFT JOIN users u ON i.user_id = u.id
            WHERE i.id = %s
        """, (item_id,))
        target = cursor.fetchone()
        if not target:
            return fail("物品不存在"), 404

        if target['type'] == 'lost':
            cursor.execute(
                "SELECT * FROM matches WHERE lost_item_id = %s ORDER BY similarity_score DESC",
                (item_id,),
            )
        else:
            cursor.execute(
                "SELECT * FROM matches WHERE found_item_id = %s ORDER BY similarity_score DESC",
                (item_id,),
            )
        existing = cursor.fetchall()

        if not existing or force:
            run_matching(item_id, conn)
            if target['type'] == 'lost':
                cursor.execute(
                    "SELECT * FROM matches WHERE lost_item_id = %s ORDER BY similarity_score DESC",
                    (item_id,),
                )
            else:
                cursor.execute(
                    "SELECT * FROM matches WHERE found_item_id = %s ORDER BY similarity_score DESC",
                    (item_id,),
                )
            existing = cursor.fetchall()

        matches_out = []
        for match in existing:
            matched_id = (
                match['found_item_id'] if target['type'] == 'lost'
                else match['lost_item_id']
            )
            cursor.execute("""
                SELECT i.*, c.name AS category_name, u.username
                FROM items i
                LEFT JOIN categories c ON i.category_id = c.id
                LEFT JOIN users u ON i.user_id = u.id
                WHERE i.id = %s
            """, (matched_id,))
            matched = cursor.fetchone()
            if not matched:
                continue
            cursor.execute(
                "SELECT image_url FROM item_images WHERE item_id = %s", (matched_id,)
            )
            imgs = [r['image_url'] for r in cursor.fetchall()]
            matches_out.append({
                'match_id': match['id'],
                'similarity_score': float(match['similarity_score']),
                'match_reason': match['match_reason'],
                'item': _serialize_item(matched, imgs),
            })

        cursor.execute(
            "SELECT image_url FROM item_images WHERE item_id = %s", (item_id,)
        )
        target_imgs = [r['image_url'] for r in cursor.fetchall()]

        return success({
            'target_item': _serialize_item(target, target_imgs),
            'matches': matches_out,
        })
    except Exception as e:
        return fail(f"获取匹配结果失败: {str(e)}"), 500
    finally:
        cursor.close()
        conn.close()


@matches_bp.route('/trigger/<int:item_id>', methods=['POST'])
@jwt_required()
def trigger_matching(item_id):
    """Force recompute matches for user's own item."""
    current_user_id = int(get_jwt_identity())

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM items WHERE id = %s", (item_id,))
        item = cursor.fetchone()
        if not item:
            return fail("物品不存在"), 404
        if item['user_id'] != current_user_id:
            return fail("无权操作他人物品"), 403

        results = run_matching(item_id, conn)
        return success({'matched_count': len(results)}, "匹配完成")
    except Exception as e:
        return fail(f"匹配失败: {str(e)}"), 500
    finally:
        cursor.close()
        conn.close()


@matches_bp.route('/my', methods=['GET'])
@jwt_required()
def get_my_matches():
    """Summary of matches for all current user's open items."""
    current_user_id = int(get_jwt_identity())

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT id, type, title, status FROM items
            WHERE user_id = %s AND status IN ('open', 'matching')
            ORDER BY created_at DESC
        """, (current_user_id,))
        my_items = cursor.fetchall()

        result = []
        for item in my_items:
            if item['type'] == 'lost':
                cursor.execute("""
                    SELECT m.id, m.similarity_score, m.match_reason, i.title AS matched_title
                    FROM matches m JOIN items i ON i.id = m.found_item_id
                    WHERE m.lost_item_id = %s
                    ORDER BY m.similarity_score DESC LIMIT 3
                """, (item['id'],))
            else:
                cursor.execute("""
                    SELECT m.id, m.similarity_score, m.match_reason, i.title AS matched_title
                    FROM matches m JOIN items i ON i.id = m.lost_item_id
                    WHERE m.found_item_id = %s
                    ORDER BY m.similarity_score DESC LIMIT 3
                """, (item['id'],))
            top = cursor.fetchall()
            result.append({
                'item_id': item['id'],
                'item_type': item['type'],
                'item_title': item['title'],
                'item_status': item['status'],
                'match_count': len(top),
                'top_matches': [
                    {
                        'match_id': m['id'],
                        'similarity_score': float(m['similarity_score']),
                        'match_reason': m['match_reason'],
                        'matched_title': m['matched_title'],
                    }
                    for m in top
                ],
            })

        return success(result)
    except Exception as e:
        return fail(f"获取匹配列表失败: {str(e)}"), 500
    finally:
        cursor.close()
        conn.close()
