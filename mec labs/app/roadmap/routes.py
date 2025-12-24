from flask import request, jsonify
from app.roadmap import roadmap_bp
from app.utils import token_required
from app.roadmap.ml_engine import engine
from app import mongo

@roadmap_bp.route('/progress/update', methods=['POST'])
@token_required
def update_progress(current_user):
    data = request.get_json() or {}
    career_goal = data.get('career_goal')
    step = data.get('step')
    status = data.get('status', 'completed')
    
    if not career_goal or step is None:
        return jsonify({'message': 'Missing data'}), 400
        
    key = f"{career_goal}_{step}"
    
    mongo.db.users.update_one(
        {'_id': current_user['_id']},
        {'$set': {f"progress.{key}": (status == 'completed')}}
    )
    
    return jsonify({'message': 'Progress updated'}), 200

@roadmap_bp.route('/progress', methods=['GET'])
@token_required
def get_progress(current_user):
    user = mongo.db.users.find_one({'_id': current_user['_id']})
    progress = user.get('progress', {})
    return jsonify({'progress': progress}), 200

@roadmap_bp.route('/generate', methods=['POST'])
@token_required
def generate_roadmap(current_user):
    data = request.get_json() or {}
    
    career_goal = data.get('career_goal') 
    level = data.get('level')

    user_id = current_user['_id']
    user = mongo.db.users.find_one({'_id': user_id})

    if not career_goal:
        if user.get('active_roadmap'):
            return jsonify({
                'career_goal': user['active_roadmap'].get('career_goal'),
                'roadmap': user['active_roadmap']
            }), 200
        
        if user.get('career_goal'):
            career_goal = user['career_goal']
        
    if not career_goal:
        return jsonify({'message': 'Please provide a career goal or interest.'}), 400
        
    saved_roadmaps = user.get('saved_roadmaps', [])
    existing_map = next((rm for rm in saved_roadmaps if rm.get('career_goal', '').lower() == career_goal.lower()), None)
    
    if existing_map and not level:
        mongo.db.users.update_one({'_id': user_id}, {'$set': {'active_roadmap': existing_map}})
        return jsonify({
            'career_goal': career_goal,
            'roadmap': existing_map,
            'status': 'retrieved'
        }), 200

    roadmap_data = engine.generate(career_goal, level)
    
    new_saved = [rm for rm in saved_roadmaps if rm.get('career_goal', '').lower() != career_goal.lower()]
    new_saved.append(roadmap_data)

    mongo.db.users.update_one(
        {'_id': user_id},
        {'$set': {
            'active_roadmap': roadmap_data,
            'career_goal': career_goal,
            'saved_roadmaps': new_saved
        }}
    )
    
    return jsonify({
        'career_goal': career_goal,
        'roadmap': roadmap_data,
        'status': 'generated'
    }), 200

@roadmap_bp.route('/list', methods=['GET'])
@token_required
def list_roadmaps(current_user):
    user = mongo.db.users.find_one({'_id': current_user['_id']})
    return jsonify({
        'saved_roadmaps': user.get('saved_roadmaps', []),
        'active_roadmap': user.get('active_roadmap')
    }), 200

@roadmap_bp.route('/reset', methods=['POST'])
@token_required
def reset_roadmap(current_user):
    mongo.db.users.update_one(
        {'_id': current_user['_id']},
        {'$unset': {'active_roadmap': ""}}
    )
    return jsonify({'message': 'Roadmap reset successful'}), 200

@roadmap_bp.route('/aptitude/generate', methods=['POST'])
@token_required
def generate_aptitude(current_user):
    data = request.get_json() or {}
    topic = data.get('career_goal')
    
    if not topic:
        return jsonify({'message': 'Topic is required.'}), 400

    quiz = engine.generate_aptitude_quiz(topic)
    return jsonify({'quiz': quiz}), 200

@roadmap_bp.route('/aptitude/evaluate', methods=['POST'])
@token_required
def evaluate_aptitude(current_user):
    data = request.get_json() or {}
    score = data.get('score')
    
    if score is None:
        return jsonify({'message': 'Score is required.'}), 400
        
    level = engine.determine_level(score)
    return jsonify({'level': level}), 200

@roadmap_bp.route('/quiz/generate', methods=['POST'])
@token_required
def generate_lesson_quiz(current_user):
    data = request.get_json() or {}
    topic = data.get('topic')
    difficulty = data.get('difficulty', 'Beginner')
    
    if not topic:
        return jsonify({'message': 'Topic is required.'}), 400

    quiz = engine.generate_lesson_quiz(topic, difficulty)
    return jsonify({'quiz': quiz}), 200

@roadmap_bp.route('/chat', methods=['POST'])
@token_required
def roadmap_chat(current_user):
    data = request.get_json() or {}
    message = data.get('message')
    
    if not message:
        return jsonify({'message': 'Please provide a message.'}), 400
        
    response = engine.chat(message)
    
    return jsonify({
        'response': response
    }), 200
