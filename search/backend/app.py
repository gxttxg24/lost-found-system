from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

app = Flask(__name__)

app.config["JWT_SECRET_KEY"] = "lost-found-secret-key"
app.config["UPLOAD_FOLDER"] = "uploads"

CORS(app)
jwt = JWTManager(app)

# ── 搜索与匹配模块 ──────────────────────────────────────────────
from routes.search import search_bp
from routes.matches import matches_bp

app.register_blueprint(search_bp, url_prefix="/api/search")
app.register_blueprint(matches_bp, url_prefix="/api/matches")

# ── 其他模块在此注册（auth、items、claims、notifications）────────
# from routes.auth import auth_bp
# from routes.items import items_bp
# from routes.claims import claims_bp
# from routes.notifications import notifications_bp
# app.register_blueprint(auth_bp,          url_prefix="/api/auth")
# app.register_blueprint(items_bp,         url_prefix="/api/items")
# app.register_blueprint(claims_bp,        url_prefix="/api/claims")
# app.register_blueprint(notifications_bp, url_prefix="/api/notifications")


@app.route("/")
def index():
    return {
        "code": 200,
        "message": "Lost and Found backend is running",
        "data": None
    }


if __name__ == "__main__":
    app.run(debug=True, port=5000)
