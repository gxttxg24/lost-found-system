from flask import Blueprint, request, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
import os
from werkzeug.utils import secure_filename
from db import get_db_connection
from utils.response import success, fail

bp = Blueprint('items', __name__, url_prefix='/api/items')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@bp.route('', methods=['POST'])
@jwt_required()
def create_item():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    required = ['type', 'title']
    for r in required:
        if r not in data:
            return fail(f'missing {r}', 400)

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            sql = """
            INSERT INTO items (user_id, category_id, type, title, description, location, event_time, contact_info)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
            """
            cur.execute(sql, (
                user_id,
                data.get('category_id'),
                data.get('type'),
                data.get('title'),
                data.get('description'),
                data.get('location'),
                data.get('event_time'),
                data.get('contact_info'),
            ))
            item_id = cur.lastrowid
        conn.commit()
        return success({'item_id': item_id}, '发布成功')
    except Exception as e:
        conn.rollback()
        return fail(str(e), 500)
    finally:
        conn.close()


@bp.route('', methods=['GET'])
def list_items():
    page = int(request.args.get('page', 1))
    page_size = int(request.args.get('page_size', 10))
    _type = request.args.get('type')
    category_id = request.args.get('category_id')
    status = request.args.get('status')

    where = []
    params = []
    if _type:
        where.append('type=%s')
        params.append(_type)
    if category_id:
        where.append('category_id=%s')
        params.append(category_id)
    if status:
        where.append('status=%s')
        params.append(status)

    where_sql = (' WHERE ' + ' AND '.join(where)) if where else ''
    offset = (page - 1) * page_size

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            total_sql = f"SELECT COUNT(*) as cnt FROM items {where_sql}"
            cur.execute(total_sql, params)
            total = cur.fetchone()['cnt']

            list_sql = f"SELECT id, type, title, location, status, created_at FROM items {where_sql} ORDER BY created_at DESC LIMIT %s OFFSET %s"
            cur.execute(list_sql, params + [page_size, offset])
            items = cur.fetchall()

        return success({
            'total': total,
            'page': page,
            'page_size': page_size,
            'list': items
        })
    except Exception as e:
        return fail(str(e), 500)
    finally:
        conn.close()


@bp.route('/<int:item_id>', methods=['GET'])
def get_item(item_id):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM items WHERE id=%s", (item_id,))
            item = cur.fetchone()
            if not item:
                return fail('数据不存在', 404)

            cur.execute("SELECT image_url FROM item_images WHERE item_id=%s ORDER BY id", (item_id,))
            images = [r['image_url'] for r in cur.fetchall()]
            item['images'] = images

        return success(item)
    except Exception as e:
        return fail(str(e), 500)
    finally:
        conn.close()


@bp.route('/<int:item_id>', methods=['PUT'])
@jwt_required()
def update_item(item_id):
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # check owner
            cur.execute("SELECT user_id FROM items WHERE id=%s", (item_id,))
            row = cur.fetchone()
            if not row:
                return fail('数据不存在', 404)
            if row['user_id'] != user_id:
                return fail('无权限', 403)

            fields = []
            params = []
            for k in ['category_id', 'title', 'description', 'location', 'event_time', 'contact_info', 'status']:
                if k in data:
                    fields.append(f"{k}=%s")
                    params.append(data[k])
            if not fields:
                return success(None, '无更新')

            params.append(item_id)
            sql = f"UPDATE items SET {', '.join(fields)} WHERE id=%s"
            cur.execute(sql, params)
        conn.commit()
        return success(None, '修改成功')
    except Exception as e:
        conn.rollback()
        return fail(str(e), 500)
    finally:
        conn.close()


@bp.route('/<int:item_id>', methods=['DELETE'])
@jwt_required()
def delete_item(item_id):
    user_id = get_jwt_identity()
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT user_id FROM items WHERE id=%s", (item_id,))
            row = cur.fetchone()
            if not row:
                return fail('数据不存在', 404)
            if row['user_id'] != user_id:
                return fail('无权限', 403)

            cur.execute("DELETE FROM items WHERE id=%s", (item_id,))
        conn.commit()
        return success(None, '删除成功')
    except Exception as e:
        conn.rollback()
        return fail(str(e), 500)
    finally:
        conn.close()


@bp.route('/<int:item_id>/images', methods=['POST'])
@jwt_required()
def upload_image(item_id):
    if 'file' not in request.files:
        return fail('no file', 400)
    file = request.files['file']
    if file.filename == '':
        return fail('empty filename', 400)
    if not allowed_file(file.filename):
        return fail('file type not allowed', 400)

    filename = secure_filename(file.filename)
    upload_root = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    save_dir = os.path.join(upload_root, 'items')
    os.makedirs(save_dir, exist_ok=True)
    save_path = os.path.join(save_dir, filename)
    file.save(save_path)

    web_path = f"/{save_path.replace('\\', '/')}"

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("INSERT INTO item_images (item_id, image_url) VALUES (%s,%s)", (item_id, web_path))
        conn.commit()
        return success({'image_url': web_path}, '上传成功')
    except Exception as e:
        conn.rollback()
        return fail(str(e), 500)
    finally:
        conn.close()


@bp.route('/uploads/items/<path:filename>', methods=['GET'])
def serve_image(filename):
    upload_root = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    return send_from_directory(os.path.join(upload_root, 'items'), filename)
