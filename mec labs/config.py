import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-prod'
    MONGO_URI = os.environ.get('MONGO_URI') or 'mongodb://localhost:27017/universe_db'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key-change-in-prod'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=1)
    OPENROUTER_API_KEY = os.environ.get('OPENROUTER_API_KEY')
