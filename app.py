from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from routes.items import bp as items_bp


app = Flask(__name__)

app.config["JWT_SECRET_KEY"] = "lost-found-secret-key"
app.config["UPLOAD_FOLDER"] = "uploads"
app.register_blueprint(items_bp)
CORS(app)
jwt = JWTManager(app)

@app.route("/")
def index():
    return {
        "code": 200,
        "message": "Lost and Found backend is running",
        "data": None
    }

if __name__ == "__main__":
    app.run(debug=True, port=5000)
