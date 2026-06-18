"""认领与审核模块后端接口
- 发起认领 / 查看我的申请（分页）/ 查看待审核（分页）
- 通过 / 驳回 / 取消认领
- 全部通过 JWT 获取当前用户身份，不再通过 URL 参数传 user_id
"""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from db import get_db_connection
from utils.response import fail, success

claims_bp = Blueprint("claims", __name__, url_prefix="/api/claims")


# ============================================================
# 序列化辅助
# ============================================================

def _serialize_datetime(value):
    if value is None:
        return None
    return value.strftime("%Y-%m-%d %H:%M:%S")


def _serialize_user(row):
    return {
        "id": row["id"],
        "username": row["username"],
        "role": row.get("role"),
    }


def _serialize_item(row):
    return {
        "id": row["id"],
        "title": row["title"],
        "type": row["type"],
        "status": row["status"],
        "location": row.get("location"),
        "owner_id": row.get("owner_id"),
        "owner_name": row.get("owner_name"),
        "category_name": row.get("category_name"),
        "created_at": _serialize_datetime(row.get("created_at")),
    }


def _serialize_claim(row):
    return {
        "id": row["id"],
        "item_id": row["item_id"],
        "item_title": row.get("item_title"),
        "item_type": row.get("item_type"),
        "item_status": row.get("item_status"),
        "applicant_id": row["applicant_id"],
        "applicant_name": row.get("applicant_name"),
        "owner_id": row["owner_id"],
        "owner_name": row.get("owner_name"),
        "description": row.get("description"),
        "proof_text": row.get("proof_text"),
        "status": row.get("status"),
        "review_comment": row.get("review_comment"),
        "created_at": _serialize_datetime(row.get("created_at")),
        "updated_at": _serialize_datetime(row.get("updated_at")),
    }


def _parse_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _load_claim(cursor, claim_id):
    cursor.execute(
        """SELECT c.*, i.title AS item_title, i.type AS item_type,
                  i.status AS item_status, a.username AS applicant_name,
                  o.username AS owner_name
           FROM claim_requests c
           LEFT JOIN items i ON c.item_id = i.id
           LEFT JOIN users a ON c.applicant_id = a.id
           LEFT JOIN users o ON c.owner_id = o.id
           WHERE c.id = %s""",
        (claim_id,),
    )
    return cursor.fetchone()


def _notify(cursor, user_id, title, content):
    cursor.execute(
        "INSERT INTO notifications (user_id, title, content) VALUES (%s, %s, %s)",
        (user_id, title, content),
    )


def _paginate(request_obj):
    """从请求参数中解析 page / page_size，返回 (offset, page_size, page)"""
    page = max(_parse_int(request_obj.args.get("page")) or 1, 1)
    page_size = min(max((_parse_int(request_obj.args.get("page_size")) or 10), 1), 100)
    offset = (page - 1) * page_size
    return offset, page_size, page


# ============================================================
# 接口
# ============================================================

# ---------- 表单上下文（无需 JWT） ----------

@claims_bp.get("/context")
def get_context():
    """获取表单下拉数据 —— 全部用户 + 可认领物品"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, username, role FROM users ORDER BY id")
            users = [_serialize_user(r) for r in cursor.fetchall()]

            cursor.execute(
                """SELECT i.id, i.title, i.type, i.status, i.location,
                          i.user_id AS owner_id, u.username AS owner_name,
                          c.name AS category_name, i.created_at
                   FROM items i
                   LEFT JOIN users u ON i.user_id = u.id
                   LEFT JOIN categories c ON i.category_id = c.id
                   WHERE i.status IN ('open','matching')
                   ORDER BY i.created_at DESC, i.id DESC"""
            )
            items = [_serialize_item(r) for r in cursor.fetchall()]

        return success({"users": users, "items": items})
    finally:
        conn.close()


@claims_bp.get("/items")
def get_items():
    """可认领物品列表（支持 status 筛选 + 分页）"""
    status = request.args.get("status")
    offset, page_size, page = _paginate(request)

    where = "WHERE i.status IN ('open','matching')"
    params = []
    if status:
        where = "WHERE i.status = %s"
        params.append(status)

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                f"""SELECT COUNT(*) AS total FROM items i {where}""",
                tuple(params),
            )
            total = cursor.fetchone()["total"]

            cursor.execute(
                f"""SELECT i.id, i.title, i.type, i.status, i.location,
                           i.user_id AS owner_id, u.username AS owner_name,
                           c.name AS category_name, i.created_at
                    FROM items i
                    LEFT JOIN users u ON i.user_id = u.id
                    LEFT JOIN categories c ON i.category_id = c.id
                    {where}
                    ORDER BY i.created_at DESC, i.id DESC
                    LIMIT %s OFFSET %s""",
                tuple(params + [page_size, offset]),
            )
            items = [_serialize_item(r) for r in cursor.fetchall()]

        return success({
            "items": items, "total": total, "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size,
        })
    finally:
        conn.close()


@claims_bp.get("/users")
def get_users():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, username, role FROM users ORDER BY id")
            users = [_serialize_user(r) for r in cursor.fetchall()]
        return success(users)
    finally:
        conn.close()


# ---------- 发起认领 ----------

@claims_bp.post("")
@jwt_required()
def create_claim():
    current_user_id = get_jwt_identity()
    payload = request.get_json(silent=True) or {}

    item_id = _parse_int(payload.get("item_id"))
    description = (payload.get("description") or "").strip()
    proof_text = (payload.get("proof_text") or "").strip()

    if not item_id:
        return fail("item_id is required", 400), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id, user_id, title, status FROM items WHERE id = %s",
                (item_id,),
            )
            item = cursor.fetchone()
            if not item:
                return fail("物品不存在", 404), 404
            if item["status"] == "claimed":
                return fail("该物品已经被认领", 409), 409
            if item["user_id"] == current_user_id:
                return fail("不能认领自己发布的物品", 400), 400

            cursor.execute(
                """SELECT id FROM claim_requests
                   WHERE item_id = %s AND applicant_id = %s AND status = 'pending'
                   LIMIT 1""",
                (item_id, current_user_id),
            )
            if cursor.fetchone():
                return fail("你已经提交过该物品的待审核申请", 409), 409

            cursor.execute(
                """INSERT INTO claim_requests
                   (item_id, applicant_id, owner_id, description, proof_text)
                   VALUES (%s, %s, %s, %s, %s)""",
                (item_id, current_user_id, item["user_id"], description, proof_text),
            )
            claim_id = cursor.lastrowid

            _notify(cursor, item["user_id"], "新的认领申请",
                    f"你的物品《{item['title']}》收到了一条新的认领申请。")

            conn.commit()
            claim = _load_claim(cursor, claim_id)

        return success(_serialize_claim(claim), "认领申请已提交")
    finally:
        conn.close()


# ---------- 我的申请（分页） ----------

@claims_bp.get("/mine")
@jwt_required()
def get_my_claims():
    current_user_id = get_jwt_identity()
    offset, page_size, page = _paginate(request)

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT COUNT(*) AS total FROM claim_requests WHERE applicant_id = %s",
                (current_user_id,),
            )
            total = cursor.fetchone()["total"]

            cursor.execute(
                """SELECT c.*, i.title AS item_title, i.type AS item_type,
                          i.status AS item_status, a.username AS applicant_name,
                          o.username AS owner_name
                   FROM claim_requests c
                   LEFT JOIN items i ON c.item_id = i.id
                   LEFT JOIN users a ON c.applicant_id = a.id
                   LEFT JOIN users o ON c.owner_id = o.id
                   WHERE c.applicant_id = %s
                   ORDER BY c.created_at DESC, c.id DESC
                   LIMIT %s OFFSET %s""",
                (current_user_id, page_size, offset),
            )
            claims = [_serialize_claim(r) for r in cursor.fetchall()]

        return success({
            "claims": claims, "total": total, "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size,
        })
    finally:
        conn.close()


# ---------- 待我审核（分页） ----------

@claims_bp.get("/review")
@jwt_required()
def get_review_claims():
    current_user_id = get_jwt_identity()
    status = request.args.get("status")
    offset, page_size, page = _paginate(request)

    where = "WHERE c.owner_id = %s"
    params = [current_user_id]
    if status:
        where += " AND c.status = %s"
        params.append(status)

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                f"SELECT COUNT(*) AS total FROM claim_requests c {where}",
                tuple(params),
            )
            total = cursor.fetchone()["total"]

            cursor.execute(
                f"""SELECT c.*, i.title AS item_title, i.type AS item_type,
                           i.status AS item_status, a.username AS applicant_name,
                           o.username AS owner_name
                    FROM claim_requests c
                    LEFT JOIN items i ON c.item_id = i.id
                    LEFT JOIN users a ON c.applicant_id = a.id
                    LEFT JOIN users o ON c.owner_id = o.id
                    {where}
                    ORDER BY CASE c.status WHEN 'pending' THEN 0 ELSE 1 END,
                             c.created_at DESC, c.id DESC
                    LIMIT %s OFFSET %s""",
                tuple(params + [page_size, offset]),
            )
            claims = [_serialize_claim(r) for r in cursor.fetchall()]

        return success({
            "claims": claims, "total": total, "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size,
        })
    finally:
        conn.close()


# ---------- 审核 ----------

@claims_bp.post("/<int:claim_id>/review")
@jwt_required()
def review_claim(claim_id):
    current_user_id = get_jwt_identity()
    payload = request.get_json(silent=True) or {}

    action = (payload.get("action") or "").strip().lower()
    review_comment = (payload.get("review_comment") or "").strip()

    if action not in ("approve", "reject"):
        return fail("action 必须是 approve 或 reject", 400), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """SELECT c.*, i.title AS item_title, i.status AS item_status
                   FROM claim_requests c
                   LEFT JOIN items i ON c.item_id = i.id
                   WHERE c.id = %s""",
                (claim_id,),
            )
            claim = cursor.fetchone()
            if not claim:
                return fail("认领申请不存在", 404), 404
            if claim["owner_id"] != current_user_id:
                return fail("你没有权限审核该申请", 403), 403
            if claim["status"] != "pending":
                return fail("该申请已经处理过了", 400), 400

            if action == "approve":
                cursor.execute(
                    "UPDATE claim_requests SET status='approved', review_comment=%s WHERE id=%s",
                    (review_comment or "通过审核", claim_id),
                )
                cursor.execute(
                    "UPDATE items SET status='claimed' WHERE id=%s",
                    (claim["item_id"],),
                )
                cursor.execute(
                    """UPDATE claim_requests
                       SET status='rejected', review_comment=%s
                       WHERE item_id=%s AND id<>%s AND status='pending'""",
                    ("该物品已被其他申请通过", claim["item_id"], claim_id),
                )
            else:
                cursor.execute(
                    "UPDATE claim_requests SET status='rejected', review_comment=%s WHERE id=%s",
                    (review_comment or "未通过审核", claim_id),
                )

            _notify(cursor, claim["applicant_id"], "认领申请结果",
                    f"你提交的《{claim['item_title']}》认领申请已被{'通过' if action == 'approve' else '驳回'}。")

            conn.commit()
            updated = _load_claim(cursor, claim_id)

        return success(_serialize_claim(updated), "审核已完成")
    finally:
        conn.close()


# ---------- 取消申请 ----------

@claims_bp.post("/<int:claim_id>/cancel")
@jwt_required()
def cancel_claim(claim_id):
    current_user_id = get_jwt_identity()

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """SELECT c.*, i.title AS item_title
                   FROM claim_requests c
                   LEFT JOIN items i ON c.item_id = i.id
                   WHERE c.id = %s""",
                (claim_id,),
            )
            claim = cursor.fetchone()
            if not claim:
                return fail("认领申请不存在", 404), 404
            if claim["applicant_id"] != current_user_id:
                return fail("你只能取消自己的申请", 403), 403
            if claim["status"] != "pending":
                return fail("只能取消待审核的申请", 400), 400

            cursor.execute(
                "UPDATE claim_requests SET status='cancelled' WHERE id=%s",
                (claim_id,),
            )

            _notify(cursor, claim["owner_id"], "认领申请已取消",
                    f"关于《{claim['item_title']}》的一条认领申请已被申请人取消。")

            conn.commit()
            updated = _load_claim(cursor, claim_id)

        return success(_serialize_claim(updated), "申请已取消")
    finally:
        conn.close()
