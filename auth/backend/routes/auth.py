
from datetime import timedelta

from flask import Blueprint, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from werkzeug.security import check_password_hash, generate_password_hash

from db import execute_update, fetch_one
from utils.response import error_response, success_response

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json()

        if not data or "username" not in data or "password" not in data:
            return error_response(400, "用户名和密码不能为空")

        username = data["username"].strip()
        password = data["password"]
        phone = data.get("phone", "")
        email = data.get("email", "")

        if len(username) < 3 or len(username) > 50:
            return error_response(400, "用户名长度应在3-50个字符之间")

        if len(password) < 6:
            return error_response(400, "密码长度至少为6个字符")

        existing_user = fetch_one("SELECT id FROM users WHERE username = %s", (username,))
        if existing_user:
            return error_response(400, "用户名已存在")

        password_hash = generate_password_hash(password)

        _, user_id = execute_update(
            "INSERT INTO users (username, password_hash, phone, email) VALUES (%s, %s, %s, %s)",
            (username, password_hash, phone, email),
        )

        access_token = create_access_token(
            identity={"user_id": user_id, "username": username},
            expires_delta=timedelta(days=1),
        )

        user = fetch_one("SELECT id, username, phone, email, avatar_url, role, status, created_at FROM users WHERE id = %s", (user_id,))

        return success_response({"token": access_token, "user": user}, "注册成功")
    except Exception as e:
        return error_response(500, f"注册失败: {str(e)}")


@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()

        if not data or "username" not in data or "password" not in data:
            return error_response(400, "用户名和密码不能为空")

        username = data["username"].strip()
        password = data["password"]

        user = fetch_one("SELECT * FROM users WHERE username = %s", (username,))

        if not user:
            return error_response(400, "用户名或密码错误")

        if user["status"] == "banned":
            return error_response(403, "账号已被封禁")

        if not check_password_hash(user["password_hash"], password):
            return error_response(400, "用户名或密码错误")

        access_token = create_access_token(
            identity={"user_id": user["id"], "username": user["username"]},
            expires_delta=timedelta(days=1),
        )

        user_info = {
            "id": user["id"],
            "username": user["username"],
            "phone": user["phone"],
            "email": user["email"],
            "avatar_url": user["avatar_url"],
            "role": user["role"],
            "status": user["status"],
            "created_at": user["created_at"],
        }

        return success_response({"token": access_token, "user": user_info}, "登录成功")
    except Exception as e:
        return error_response(500, f"登录失败: {str(e)}")


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    try:
        identity = get_jwt_identity()
        user_id = identity["user_id"]

        user = fetch_one(
            "SELECT id, username, phone, email, avatar_url, role, status, created_at FROM users WHERE id = %s",
            (user_id,),
        )

        if not user:
            return error_response(404, "用户不存在")

        return success_response(user, "获取成功")
    except Exception as e:
        return error_response(500, f"获取用户信息失败: {str(e)}")


@auth_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    try:
        identity = get_jwt_identity()
        user_id = identity["user_id"]
        data = request.get_json()

        update_fields = []
        update_values = []

        if "phone" in data:
            update_fields.append("phone = %s")
            update_values.append(data["phone"])

        if "email" in data:
            update_fields.append("email = %s")
            update_values.append(data["email"])

        if "avatar_url" in data:
            update_fields.append("avatar_url = %s")
            update_values.append(data["avatar_url"])

        if not update_fields:
            return error_response(400, "没有可更新的字段")

        update_values.append(user_id)

        execute_update(
            f"UPDATE users SET {', '.join(update_fields)} WHERE id = %s",
            tuple(update_values),
        )

        user = fetch_one(
            "SELECT id, username, phone, email, avatar_url, role, status, created_at FROM users WHERE id = %s",
            (user_id,),
        )

        return success_response(user, "更新成功")
    except Exception as e:
        return error_response(500, f"更新失败: {str(e)}")


@auth_bp.route("/password", methods=["PUT"])
@jwt_required()
def change_password():
    try:
        identity = get_jwt_identity()
        user_id = identity["user_id"]
        data = request.get_json()

        if "old_password" not in data or "new_password" not in data:
            return error_response(400, "旧密码和新密码不能为空")

        old_password = data["old_password"]
        new_password = data["new_password"]

        if len(new_password) < 6:
            return error_response(400, "新密码长度至少为6个字符")

        user = fetch_one("SELECT password_hash FROM users WHERE id = %s", (user_id,))

        if not user:
            return error_response(404, "用户不存在")

        if not check_password_hash(user["password_hash"], old_password):
            return error_response(400, "旧密码错误")

        new_password_hash = generate_password_hash(new_password)

        execute_update(
            "UPDATE users SET password_hash = %s WHERE id = %s",
            (new_password_hash, user_id),
        )

        return success_response(None, "密码修改成功")
    except Exception as e:
        return error_response(500, f"密码修改失败: {str(e)}")


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    return success_response(None, "登出成功")
