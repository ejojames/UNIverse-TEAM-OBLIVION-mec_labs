from flask import Blueprint

social_bp = Blueprint('social', __name__)

from app.social import routes
