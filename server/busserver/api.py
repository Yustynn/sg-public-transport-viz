from flask import Blueprint, request, jsonify

bp = Blueprint('api', __name__, url_prefix='/api')


@bp.route('/buses')
def buses():
    bounds = request.args.get('bounds', '103.61,1.26,104.00,1.46')
    bounds = tuple(float(i) for i in bounds.split(','))

    buses = []

    return jsonify({
        'buses': buses,
        'status': 'ok'
    })