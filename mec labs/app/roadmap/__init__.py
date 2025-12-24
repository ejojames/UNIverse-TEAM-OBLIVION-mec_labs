from flask import Blueprint

roadmap_bp = Blueprint('roadmap', __name__)

from app.roadmap import routes
