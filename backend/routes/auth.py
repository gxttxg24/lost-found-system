from datetime import timedelta

from flask import Blueprint, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from werkzeug.security import check_password_hash, generate_password_hash

from db import execute_update, fetch_one
from utils.response import success, fail

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _serialize_user(user):
    if not user:
        return None
    return {
        "id": user["id"],
        "username": user["username"],
        "phone": user.get("phone") or "",
        "email": user.get("email") or "",
        "avatar_url": user.get("avatar_url"),
        "role": user.get("role", "user"),
        "status": user.get("status", "normal"),
        "created_at": str(user["created_at"]) if user.get("created_at") else None,
    }


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data or "username" not in data or "password" not in data:
        return fail("用户名和密码不能为空"), 400

    username = data["username"].strip()
    password = data["password"]
    phone = data.get("phone", "")
    email = data.get("email", "")

    if len(username) < 3 or len(username) > 50:
        return fail("用户名长度应在3-50个字符之间"), 400
    if len(password) < 6:
        return fail("密码长度至少为6个字符"), 400

    existing = fetch_one("SELECT id FROM users WHERE username = %s", (username,))
    if existing:
        return fail("用户名已存在"), 400

    password_hash = generate_password_hash(password)
    _, user_id = execute_update(
        "INSERT INTO users (username, password_hash, phone, email) VALUES (%s, %s, %s, %s)",
        (username, password_hash, phone, email),
    )

    access_token = create_access_token(
        identity=str(user_id),
        expires_delta=timedelta(days=7),
    )
    user = fetch_one(
        "SELECT id, username, phone, email, avatar_url, role, status, created_at FROM users WHERE id = %s",
        (user_id,),
    )
    return success({"token": access_token, "user": _serialize_user(user)}, "注册成功")


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data or "username" not in data or "password" not in data:
        return fail("用户名和密码不能为空"), 400

    username = data["username"].strip()
    password = data["password"]

    user = fetch_one("SELECT * FROM users WHERE username = %s", (username,))
    if not user:
        return fail("用户名或密码错误"), 400
    if user["status"] == "banned":
        return fail("账号已被封禁"), 403
    if not check_password_hash(user["password_hash"], password):
        return fail("用户名或密码错误"), 400

    access_token = create_access_token(
        identity=str(user["id"]),
        expires_delta=timedelta(days=7),
    )
    return success({"token": access_token, "user": _serialize_user(user)}, "登录成功")


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    user_id = int(get_jwt_identity())
    user = fetch_one(
        "SELECT id, username, phone, email, avatar_url, role, status, created_at FROM users WHERE id = %s",
        (user_id,),
    )
    if not user:
        return fail("用户不存在"), 404
    return success(_serialize_user(user), "获取成功")


@auth_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    update_fields = []
    update_values = []
    for field in ("phone", "email", "avatar_url"):
        if field in data:
            update_fields.append(f"{field} = %s")
            update_values.append(data[field])

    if not update_fields:
        return fail("没有可更新的字段"), 400

    update_values.append(user_id)
    execute_update(
        f"UPDATE users SET {', '.join(update_fields)} WHERE id = %s",
        tuple(update_values),
    )
    user = fetch_one(
        "SELECT id, username, phone, email, avatar_url, role, status, created_at FROM users WHERE id = %s",
        (user_id,),
    )
    return success(_serialize_user(user), "更新成功")


@auth_bp.route("/password", methods=["PUT"])
@jwt_required()
def change_password():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    old_password = data.get("old_password")
    new_password = data.get("new_password")
    if not old_password or not new_password:
        return fail("旧密码和新密码不能为空"), 400
    if len(new_password) < 6:
        return fail("新密码长度至少为6个字符"), 400

    user = fetch_one("SELECT password_hash FROM users WHERE id = %s", (user_id,))
    if not user:
        return fail("用户不存在"), 404
    if not check_password_hash(user["password_hash"], old_password):
        return fail("旧密码错误"), 400

    execute_update(
        "UPDATE users SET password_hash = %s WHERE id = %s",
        (generate_password_hash(new_password), user_id),
    )
    return success(None, "密码修改成功")


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    return success(None, "登出成功")
