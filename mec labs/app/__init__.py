from gevent import monkey
monkey.patch_all()

from flask import Flask, render_template
from flask_pymongo import PyMongo
from flask_bcrypt import Bcrypt
from flask_socketio import SocketIO
from flask_cors import CORS
from config import Config

mongo = PyMongo()
bcrypt = Bcrypt()
socketio = SocketIO(cors_allowed_origins="*")

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    mongo.init_app(app)
    bcrypt.init_app(app)
    socketio.init_app(app)
    CORS(app)

    # Register Blueprints
    from app.auth.routes import auth_bp
    from app.social.routes import social_bp
    from app.opportunities.routes import opportunities_bp
    from app.roadmap.routes import roadmap_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(social_bp, url_prefix='/api/social')
    app.register_blueprint(opportunities_bp, url_prefix='/api/opportunities')
    app.register_blueprint(roadmap_bp, url_prefix='/api/roadmap')

    @app.route('/')
    def index():
        return render_template('index.html')

    @app.route('/dashboard')
    def dashboard():
        return render_template('dashboard.html')

    return app
