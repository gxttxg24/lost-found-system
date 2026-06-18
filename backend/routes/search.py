from flask import Blueprint, request
from db import get_db_connection
from utils.response import success, fail
from utils.match import compute_batch_text_similarity

search_bp = Blueprint('search', __name__)


def _normalize(values):
    max_v = max(values) if values else 0
    if max_v == 0:
        return [0.0] * len(values)
    return [v / max_v for v in values]


def _item_to_dict(row, images):
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
        'view_count': row.get('view_count', 0),
        'created_at': str(row['created_at']) if row.get('created_at') else None,
        'username': row.get('username'),
        'images': images,
    }


def _fetch_images(cursor, item_ids):
    if not item_ids:
        return {}
    placeholders = ','.join(['%s'] * len(item_ids))
    cursor.execute(
        f"SELECT item_id, image_url FROM item_images WHERE item_id IN ({placeholders})",
        item_ids,
    )
    images_map = {}
    for img in cursor.fetchall():
        images_map.setdefault(img['item_id'], []).append(img['image_url'])
    return images_map


@search_bp.route('/items', methods=['GET'])
def search_items():
    q = request.args.get('q', '').strip()
    item_type = request.args.get('type', '').strip()
    category_id = request.args.get('category_id', type=int)
    status = request.args.get('status', '').strip()
    location = request.args.get('location', '').strip()
    start_date = request.args.get('start_date', '').strip()
    end_date = request.args.get('end_date', '').strip()
    sort = request.args.get('sort', 'relevance').strip()
    page = max(1, request.args.get('page', 1, type=int))
    page_size = min(50, max(1, request.args.get('page_size', 10, type=int)))

    if item_type not in ('lost', 'found'):
        return fail("type 参数必须为 lost 或 found"), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        where_parts = ["i.type = %s"]
        where_params = [item_type]

        if status:
            where_parts.append("i.status = %s")
            where_params.append(status)
        if category_id:
            where_parts.append("i.category_id = %s")
            where_params.append(category_id)
        if location:
            where_parts.append("i.location LIKE %s")
            where_params.append(f'%{location}%')
        if start_date:
            where_parts.append("i.event_time >= %s")
            where_params.append(start_date)
        if end_date:
            where_parts.append("i.event_time <= %s")
            where_params.append(end_date + ' 23:59:59')

        use_fulltext = False
        select_score_expr = "0"
        select_score_params = []

        if q:
            ft_expr = "MATCH(i.title, i.description, i.location) AGAINST (%s IN BOOLEAN MODE)"
            try:
                cursor.execute(f"SELECT {ft_expr} FROM items LIMIT 1", [q])
                cursor.fetchall()
                use_fulltext = True
            except Exception:
                use_fulltext = False

            if use_fulltext:
                select_score_expr = ft_expr
                select_score_params = [q]
                where_parts.append(ft_expr)
                where_params.append(q)
            else:
                like_q = f'%{q}%'
                where_parts.append("(i.title LIKE %s OR i.description LIKE %s OR i.location LIKE %s)")
                where_params.extend([like_q, like_q, like_q])

        where_clause = " AND ".join(where_parts)

        if sort == 'time_asc':
            order_clause = "i.event_time ASC"
        elif sort == 'time_desc':
            order_clause = "i.created_at DESC"
        elif use_fulltext and q:
            order_clause = "relevance_db DESC"
        else:
            order_clause = "i.created_at DESC"

        cursor.execute(
            f"SELECT COUNT(*) AS total FROM items i WHERE {where_clause}",
            where_params,
        )
        total = cursor.fetchone()['total']

        main_sql = f"""
            SELECT i.*, c.name AS category_name, u.username,
                   ({select_score_expr}) AS relevance_db
            FROM items i
            LEFT JOIN categories c ON i.category_id = c.id
            LEFT JOIN users u ON i.user_id = u.id
            WHERE {where_clause}
            ORDER BY {order_clause}
            LIMIT %s OFFSET %s
        """
        cursor.execute(
            main_sql,
            select_score_params + where_params + [page_size, (page - 1) * page_size],
        )
        rows = cursor.fetchall()

        if q and sort == 'relevance' and rows:
            cand_texts = [(r['title'] or '') + ' ' + (r['description'] or '') for r in rows]
            text_sims = compute_batch_text_similarity(q, cand_texts)
            db_scores = [float(r.get('relevance_db') or 0) for r in rows]
            db_norm = _normalize(db_scores)
            for i, row in enumerate(rows):
                row['relevance_score'] = round(0.7 * text_sims[i] + 0.3 * db_norm[i], 4)
            rows = sorted(rows, key=lambda r: r.get('relevance_score', 0), reverse=True)
        else:
            for row in rows:
                row['relevance_score'] = None

        images_map = _fetch_images(cursor, [r['id'] for r in rows])

        return success({
            'total': total,
            'page': page,
            'page_size': page_size,
            'items': [
                {**_item_to_dict(r, images_map.get(r['id'], [])),
                 'relevance_score': r.get('relevance_score')}
                for r in rows
            ],
        })
    except Exception as e:
        return fail(f"搜索失败: {str(e)}"), 500
    finally:
        cursor.close()
        conn.close()


@search_bp.route('/categories', methods=['GET'])
def get_categories():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, name, description FROM categories ORDER BY id")
        return success(cursor.fetchall())
    except Exception as e:
        return fail(f"获取分类失败: {str(e)}"), 500
    finally:
        cursor.close()
        conn.close()
