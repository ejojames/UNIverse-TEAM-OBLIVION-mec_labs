from flask import request, jsonify, current_app
from app.auth import auth_bp
from app import mongo, bcrypt
import jwt
import datetime

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password') or not data.get('name'):
        return jsonify({'message': 'Missing required fields'}), 400

    if mongo.db.users.find_one({'email': data['email']}):
        return jsonify({'message': 'User already exists'}), 400

    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')

    user_id = mongo.db.users.insert_one({
        'name': data['name'],
        'email': data['email'],
        'password': hashed_password,
        'career_goal': data.get('career_goal', ''),
        'interests': data.get('interests', []),
        'skills': data.get('skills', []),
        'created_at': datetime.datetime.utcnow()
    }).inserted_id

    return jsonify({'message': 'User created successfully', 'user_id': str(user_id)}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Missing login details'}), 400

    user = mongo.db.users.find_one({'email': data['email']})

    if not user or not bcrypt.check_password_hash(user['password'], data['password']):
        return jsonify({'message': 'Invalid email or password'}), 401

    token = jwt.encode({
        'user_id': str(user['_id']),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
    }, current_app.config['JWT_SECRET_KEY'], algorithm="HS256")

    return jsonify({'token': token, 'name': user['name']}), 200
