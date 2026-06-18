import os
import uuid

from flask import Blueprint, request, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename

from db import get_db_connection
from utils.response import success, fail

items_bp = Blueprint('items', __name__, url_prefix='/api/items')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def _serialize_item(row, images=None):
    return {
        'id': row['id'],
        'user_id': row.get('user_id'),
        'type': row['type'],
        'category_id': row.get('category_id'),
        'category_name': row.get('category_name'),
        'title': row['title'],
        'description': row.get('description'),
        'location': row.get('location'),
        'event_time': str(row['event_time']) if row.get('event_time') else None,
        'status': row['status'],
        'contact_info': row.get('contact_info'),
        'view_count': row.get('view_count', 0),
        'username': row.get('username'),
        'created_at': str(row['created_at']) if row.get('created_at') else None,
        'images': images or [],
    }


@items_bp.route('', methods=['POST'])
@jwt_required()
def create_item():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    if not data.get('type') or not data.get('title'):
        return fail("type 和 title 为必填项"), 400
    if data['type'] not in ('lost', 'found'):
        return fail("type 必须为 lost 或 found"), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO items
                   (user_id, category_id, type, title, description, location, event_time, contact_info)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                (
                    user_id,
                    data.get('category_id') or None,
                    data['type'],
                    data['title'].strip(),
                    data.get('description', '').strip() or None,
                    data.get('location', '').strip() or None,
                    data.get('event_time') or None,
                    data.get('contact_info', '').strip() or None,
                ),
            )
            item_id = cur.lastrowid
        conn.commit()
        return success({'item_id': item_id}, '发布成功')
    except Exception as e:
        conn.rollback()
        return fail(str(e)), 500
    finally:
        conn.close()


@items_bp.route('', methods=['GET'])
def list_items():
    page = max(1, int(request.args.get('page', 1)))
    page_size = min(50, max(1, int(request.args.get('page_size', 10))))
    item_type = request.args.get('type', '').strip()
    category_id = request.args.get('category_id', '')
    status = request.args.get('status', '').strip()

    where = []
    params = []
    if item_type:
        where.append('i.type = %s')
        params.append(item_type)
    if category_id:
        where.append('i.category_id = %s')
        params.append(category_id)
    if status:
        where.append('i.status = %s')
        params.append(status)

    where_sql = ('WHERE ' + ' AND '.join(where)) if where else ''
    offset = (page - 1) * page_size

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT COUNT(*) AS cnt FROM items i {where_sql}", params
            )
            total = cur.fetchone()['cnt']

            cur.execute(
                f"""SELECT i.*, c.name AS category_name, u.username
                    FROM items i
                    LEFT JOIN categories c ON i.category_id = c.id
                    LEFT JOIN users u ON i.user_id = u.id
                    {where_sql}
                    ORDER BY i.created_at DESC
                    LIMIT %s OFFSET %s""",
                params + [page_size, offset],
            )
            rows = cur.fetchall()

            item_ids = [r['id'] for r in rows]
            images_map = {}
            if item_ids:
                placeholders = ','.join(['%s'] * len(item_ids))
                cur.execute(
                    f"SELECT item_id, image_url FROM item_images WHERE item_id IN ({placeholders})",
                    item_ids,
                )
                for img in cur.fetchall():
                    images_map.setdefault(img['item_id'], []).append(img['image_url'])

        return success({
            'total': total,
            'page': page,
            'page_size': page_size,
            'items': [_serialize_item(r, images_map.get(r['id'], [])) for r in rows],
        })
    except Exception as e:
        return fail(str(e)), 500
    finally:
        conn.close()


@items_bp.route('/mine', methods=['GET'])
@jwt_required()
def list_my_items():
    user_id = int(get_jwt_identity())
    page = max(1, int(request.args.get('page', 1)))
    page_size = min(50, max(1, int(request.args.get('page_size', 20))))
    status = request.args.get('status', '').strip()

    where = ['i.user_id = %s']
    params = [user_id]
    if status:
        where.append('i.status = %s')
        params.append(status)

    where_sql = 'WHERE ' + ' AND '.join(where)
    offset = (page - 1) * page_size

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(f"SELECT COUNT(*) AS cnt FROM items i {where_sql}", params)
            total = cur.fetchone()['cnt']

            cur.execute(
                f"""SELECT i.*, c.name AS category_name, u.username
                    FROM items i
                    LEFT JOIN categories c ON i.category_id = c.id
                    LEFT JOIN users u ON i.user_id = u.id
                    {where_sql}
                    ORDER BY i.created_at DESC
                    LIMIT %s OFFSET %s""",
                params + [page_size, offset],
            )
            rows = cur.fetchall()

            item_ids = [r['id'] for r in rows]
            images_map = {}
            if item_ids:
                placeholders = ','.join(['%s'] * len(item_ids))
                cur.execute(
                    f"SELECT item_id, image_url FROM item_images WHERE item_id IN ({placeholders})",
                    item_ids,
                )
                for img in cur.fetchall():
                    images_map.setdefault(img['item_id'], []).append(img['image_url'])

        return success({
            'total': total, 'page': page, 'page_size': page_size,
            'items': [_serialize_item(r, images_map.get(r['id'], [])) for r in rows],
        })
    except Exception as e:
        return fail(str(e)), 500
    finally:
        conn.close()


@items_bp.route('/<int:item_id>', methods=['GET'])
def get_item(item_id):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT i.*, c.name AS category_name, u.username
                   FROM items i
                   LEFT JOIN categories c ON i.category_id = c.id
                   LEFT JOIN users u ON i.user_id = u.id
                   WHERE i.id = %s""",
                (item_id,),
            )
            item = cur.fetchone()
            if not item:
                return fail('物品不存在'), 404

            cur.execute(
                "UPDATE items SET view_count = view_count + 1 WHERE id = %s", (item_id,)
            )
            conn.commit()

            cur.execute(
                "SELECT image_url FROM item_images WHERE item_id = %s ORDER BY id", (item_id,)
            )
            images = [r['image_url'] for r in cur.fetchall()]

        return success(_serialize_item(item, images))
    except Exception as e:
        return fail(str(e)), 500
    finally:
        conn.close()


@items_bp.route('/<int:item_id>', methods=['PUT'])
@jwt_required()
def update_item(item_id):
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT user_id FROM items WHERE id = %s", (item_id,))
            row = cur.fetchone()
            if not row:
                return fail('物品不存在'), 404
            if row['user_id'] != user_id:
                return fail('无权限修改他人发布的物品'), 403

            fields = []
            params = []
            for k in ('category_id', 'title', 'description', 'location',
                      'event_time', 'contact_info', 'status'):
                if k in data:
                    fields.append(f"{k} = %s")
                    params.append(data[k])

            if not fields:
                return success(None, '无更新字段')

            params.append(item_id)
            cur.execute(f"UPDATE items SET {', '.join(fields)} WHERE id = %s", params)
        conn.commit()
        return success(None, '修改成功')
    except Exception as e:
        conn.rollback()
        return fail(str(e)), 500
    finally:
        conn.close()


@items_bp.route('/<int:item_id>', methods=['DELETE'])
@jwt_required()
def delete_item(item_id):
    user_id = int(get_jwt_identity())

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT user_id FROM items WHERE id = %s", (item_id,))
            row = cur.fetchone()
            if not row:
                return fail('物品不存在'), 404
            if row['user_id'] != user_id:
                return fail('无权限删除他人发布的物品'), 403

            cur.execute("DELETE FROM item_images WHERE item_id = %s", (item_id,))
            cur.execute("DELETE FROM items WHERE id = %s", (item_id,))
        conn.commit()
        return success(None, '删除成功')
    except Exception as e:
        conn.rollback()
        return fail(str(e)), 500
    finally:
        conn.close()


@items_bp.route('/<int:item_id>/images', methods=['POST'])
@jwt_required()
def upload_image(item_id):
    if 'file' not in request.files:
        return fail('请选择要上传的文件'), 400
    file = request.files['file']
    if not file.filename:
        return fail('文件名不能为空'), 400
    if not allowed_file(file.filename):
        return fail('不支持该文件类型，请上传 png/jpg/jpeg/gif/webp'), 400

    ext = file.filename.rsplit('.', 1)[1].lower()
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    upload_root = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    save_dir = os.path.join(upload_root, 'items')
    os.makedirs(save_dir, exist_ok=True)
    file.save(os.path.join(save_dir, unique_name))

    image_url = f"uploads/items/{unique_name}"

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO item_images (item_id, image_url) VALUES (%s, %s)",
                (item_id, image_url),
            )
        conn.commit()
        return success({'image_url': image_url}, '上传成功')
    except Exception as e:
        conn.rollback()
        return fail(str(e)), 500
    finally:
        conn.close()
