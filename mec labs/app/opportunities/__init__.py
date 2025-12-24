from flask import Blueprint

opportunities_bp = Blueprint('opportunities', __name__)

from app.opportunities import routes
