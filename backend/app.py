import os
import traceback
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = "lost-found-system-secret-key-2026-campus"
app.config["UPLOAD_FOLDER"] = "uploads"

CORS(app, resources={r"/api/*": {"origins": "*"}})
jwt = JWTManager(app)

from routes.auth import auth_bp
from routes.items import items_bp
from routes.search import search_bp
from routes.matches import matches_bp
from routes.claims import claims_bp
from routes.notifications import notifications_bp

app.register_blueprint(auth_bp)
app.register_blueprint(items_bp)
app.register_blueprint(search_bp, url_prefix="/api/search")
app.register_blueprint(matches_bp, url_prefix="/api/matches")
app.register_blueprint(claims_bp)
app.register_blueprint(notifications_bp)


@app.errorhandler(Exception)
def handle_exception(e):
    traceback.print_exc()
    response = jsonify({"code": 500, "message": str(e), "data": None})
    response.status_code = 500
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response


@app.errorhandler(404)
def handle_404(e):
    response = jsonify({"code": 404, "message": "接口不存在", "data": None})
    response.status_code = 404
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response


@app.errorhandler(405)
def handle_405(e):
    response = jsonify({"code": 405, "message": "请求方法不允许", "data": None})
    response.status_code = 405
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response


@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


@app.route("/")
def index():
    return jsonify({"code": 200, "message": "Lost and Found backend is running", "data": None})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
