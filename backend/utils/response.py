from flask import jsonify


def success(data=None, message="success"):
    """Return a 200 JSON response."""
    return jsonify({"code": 200, "message": message, "data": data})


def fail(message="error", code=400):
    """Return an error JSON response (caller must append HTTP status: return fail(...), 404)."""
    return jsonify({"code": code, "message": message, "data": None})
