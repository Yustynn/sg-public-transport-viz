from flask import Blueprint, request, jsonify
from os import listdir
from . import buslogic

bp = Blueprint('api', __name__, url_prefix='/api')

@bp.route('/buses')
def buses():
    bounds = request.args.get('bounds', '103.61,1.26,104.00,1.46')
    bounds = tuple(float(i) for i in bounds.split(','))

    buses = buslogic.get_buses(bounds)

    return jsonify({
        'buses': buses,
        'status': 'ok'
    })
