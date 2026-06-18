from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from routes.claims import claims_bp
from routes.notifications import notifications_bp

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = "lost-found-secret-key"
app.config["UPLOAD_FOLDER"] = "uploads"

CORS(app)
jwt = JWTManager(app)
app.register_blueprint(claims_bp)
app.register_blueprint(notifications_bp)

@app.route("/")
def index():
    return {
        "code": 200,
        "message": "Lost and Found backend is running",
        "data": None
    }


if __name__ == "__main__":
    app.run(debug=True, port=5000)
