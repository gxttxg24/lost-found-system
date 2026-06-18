def success(data=None, message="success"):
    return {
        "code": 200,
        "message": message,
        "data": data
    }

def fail(message="error", code=400, data=None):
    return {
        "code": code,
        "message": message,
        "data": data
    }
