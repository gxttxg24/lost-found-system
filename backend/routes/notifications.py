from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from db import get_db_connection
from utils.response import fail, success

notifications_bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")


def _serialize_datetime(value):
    if value is None:
        return None
    return value.strftime("%Y-%m-%d %H:%M:%S")


def _serialize_notification(row):
    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "title": row["title"],
        "content": row.get("content"),
        "is_read": bool(row["is_read"]),
        "created_at": _serialize_datetime(row.get("created_at")),
    }


def _parse_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


@notifications_bp.get("")
@jwt_required()
def get_notifications():
    current_user_id = int(get_jwt_identity())

    page = max(_parse_int(request.args.get("page")) or 1, 1)
    page_size = min(max((_parse_int(request.args.get("page_size")) or 20), 1), 100)
    offset = (page - 1) * page_size
    unread_only = request.args.get("unread_only") == "1"

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            where = "WHERE user_id = %s"
            params = [current_user_id]
            if unread_only:
                where += " AND is_read = FALSE"

            cursor.execute(
                f"SELECT COUNT(*) AS total FROM notifications {where}", tuple(params)
            )
            total = cursor.fetchone()["total"]

            cursor.execute(
                f"""SELECT id, user_id, title, content, is_read, created_at
                    FROM notifications {where}
                    ORDER BY is_read ASC, created_at DESC, id DESC
                    LIMIT %s OFFSET %s""",
                tuple(params + [page_size, offset]),
            )
            notifications = [_serialize_notification(row) for row in cursor.fetchall()]

        return success({
            "notifications": notifications,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size,
        })
    finally:
        conn.close()


@notifications_bp.get("/unread-count")
@jwt_required()
def get_unread_count():
    current_user_id = int(get_jwt_identity())
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT COUNT(*) AS count FROM notifications WHERE user_id = %s AND is_read = FALSE",
                (current_user_id,),
            )
            count = cursor.fetchone()["count"]
        return success({"unread_count": count})
    finally:
        conn.close()


@notifications_bp.put("/<int:notification_id>/read")
@jwt_required()
def mark_as_read(notification_id):
    current_user_id = int(get_jwt_identity())
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id FROM notifications WHERE id = %s AND user_id = %s",
                (notification_id, current_user_id),
            )
            if not cursor.fetchone():
                return fail("通知不存在"), 404
            cursor.execute(
                "UPDATE notifications SET is_read = TRUE WHERE id = %s", (notification_id,)
            )
            conn.commit()
        return success(message="已标记为已读")
    finally:
        conn.close()


@notifications_bp.put("/read-all")
@jwt_required()
def mark_all_as_read():
    current_user_id = int(get_jwt_identity())
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "UPDATE notifications SET is_read = TRUE WHERE user_id = %s AND is_read = FALSE",
                (current_user_id,),
            )
            affected = cursor.rowcount
            conn.commit()
        return success(message=f"已将 {affected} 条通知标记为已读")
    finally:
        conn.close()


@notifications_bp.delete("/<int:notification_id>")
@jwt_required()
def delete_notification(notification_id):
    current_user_id = int(get_jwt_identity())
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id FROM notifications WHERE id = %s AND user_id = %s",
                (notification_id, current_user_id),
            )
            if not cursor.fetchone():
                return fail("通知不存在"), 404
            cursor.execute(
                "DELETE FROM notifications WHERE id = %s", (notification_id,)
            )
            conn.commit()
        return success(message="通知已删除")
    finally:
        conn.close()


@notifications_bp.delete("/clear")
@jwt_required()
def clear_notifications():
    current_user_id = int(get_jwt_identity())
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "DELETE FROM notifications WHERE user_id = %s", (current_user_id,)
            )
            affected = cursor.rowcount
            conn.commit()
        return success(message=f"已清空 {affected} 条通知")
    finally:
        conn.close()
