from flask import jsonify

def success_response(data=None, message="success"):
    return jsonify({
        "code": 200,
        "message": message,
        "data": data
    })

def error_response(code=400, message="error", data=None):
    response = jsonify({
        "code": code,
        "message": message,
        "data": data
    })
    # response.status_code = code # 这里先不修改 HTTP 状态码，因为前端拦截器处理 401 逻辑等可能是依赖 JSON 体中的 code。我们保持 HTTP 200 也可以，不过规范一点的话就放开。
    # 之前是返回字典，Flask 默认就是 HTTP 200。为了和之前的行为保持一致，先不设置 HTTP 状态码为 code，除非前端需要。
    return response, 200
