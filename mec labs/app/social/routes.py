from flask import request, jsonify
from app.social import social_bp
from app import mongo, socketio
from app.utils import token_required
from bson import ObjectId
import datetime

@social_bp.route('/posts', methods=['POST'])
@token_required
def create_post(current_user):
    data = request.get_json()
    
    if not data or not data.get('content'):
        return jsonify({'message': 'Content is required'}), 400

    if len(data['content']) > 500:
         return jsonify({'message': 'Post too long (max 500 chars)'}), 400

    post_id = mongo.db.posts.insert_one({
        'user_id': current_user['_id'],
        'author_name': current_user['name'],
        'content': data['content'],
        'created_at': datetime.datetime.utcnow(),
        'comments': [],
        'likes': [],
        'reposts': 0,
        'is_repost': False
    }).inserted_id
    
    socketio.emit('new_post', {
        'content': data['content'], 
        'author': current_user['name'],
        'id': str(post_id),
        'likes_count': 0,
        'comments_count': 0
    })

    return jsonify({'message': 'Post created', 'post_id': str(post_id)}), 201

@social_bp.route('/posts/<post_id>/like', methods=['POST'])
@token_required
def like_post(current_user, post_id):
    user_id = current_user['_id']
    
    post = mongo.db.posts.find_one({'_id': ObjectId(post_id)})
    if not post:
        return jsonify({'message': 'Post not found'}), 404
        
    if user_id in post.get('likes', []):
        mongo.db.posts.update_one({'_id': ObjectId(post_id)}, {'$pull': {'likes': user_id}})
        liked = False
    else:
        mongo.db.posts.update_one({'_id': ObjectId(post_id)}, {'$addToSet': {'likes': user_id}})
        liked = True
        
    updated_post = mongo.db.posts.find_one({'_id': ObjectId(post_id)})
    likes_count = len(updated_post.get('likes', []))
    
    return jsonify({'message': 'Success', 'liked': liked, 'likes_count': likes_count}), 200

@social_bp.route('/posts/<post_id>/repost', methods=['POST'])
@token_required
def repost(current_user, post_id):
    original_post = mongo.db.posts.find_one({'_id': ObjectId(post_id)})
    if not original_post:
        return jsonify({'message': 'Original post not found'}), 404

    new_post_id = mongo.db.posts.insert_one({
        'user_id': current_user['_id'],
        'author_name': current_user['name'],
        'content': original_post['content'],
        'original_author': original_post['author_name'],
        'original_post_id': ObjectId(post_id),
        'created_at': datetime.datetime.utcnow(),
        'comments': [],
        'likes': [],
        'reposts': 0,
        'is_repost': True
    }).inserted_id

    mongo.db.posts.update_one({'_id': ObjectId(post_id)}, {'$inc': {'reposts': 1}})

    return jsonify({'message': 'Reposted successfully', 'post_id': str(new_post_id)}), 201

@social_bp.route('/feed', methods=['GET'])
@token_required
def get_feed(current_user):
    posts = mongo.db.posts.find().sort('created_at', -1).limit(20)
    output = []
    
    for post in posts:
        post_data = {
            'id': str(post['_id']),
            'author': post['author_name'],
            'content': post['content'],
            'created_at': post['created_at'].isoformat(),
            'comments': post.get('comments', []),
            'likes_count': len(post.get('likes', [])),
            'has_liked': current_user['_id'] in post.get('likes', []),
            'reposts_count': post.get('reposts', 0),
            'is_repost': post.get('is_repost', False),
            'original_author': post.get('original_author')
        }
        output.append(post_data)
        
    return jsonify({'feed': output}), 200

@social_bp.route('/posts/<post_id>/comment', methods=['POST'])
@token_required
def add_comment(current_user, post_id):
    data = request.get_json()
    
    if not data or not data.get('text'):
        return jsonify({'message': 'Comment text is required'}), 400
        
    comment = {
        'user_id': str(current_user['_id']),
        'author_name': current_user['name'],
        'text': data['text'],
        'created_at': datetime.datetime.utcnow().isoformat()
    }
    
    result = mongo.db.posts.update_one(
        {'_id': ObjectId(post_id)},
        {'$push': {'comments': comment}}
    )
    
    if result.modified_count == 0:
        return jsonify({'message': 'Post not found'}), 404
        
    socketio.emit('new_comment', {'post_id': post_id, 'comment': comment})

    return jsonify({'message': 'Comment added'}), 201

@social_bp.route('/chat', methods=['GET'])
@token_required
def get_chat_messages(current_user):
    room = current_user.get('career_goal', 'General')
    if not room:
        room = 'General'
        
    messages = mongo.db.chat_messages.find({'room': room}).sort('created_at', 1).limit(50)
    output = []
    
    for msg in messages:
        output.append({
            'id': str(msg['_id']),
            'author': msg['author_name'],
            'user_id': str(msg['user_id']),
            'content': msg['content'],
            'created_at': msg['created_at'].isoformat(),
            'is_me': str(msg['user_id']) == str(current_user['_id'])
        })
        
    return jsonify({'room': room, 'messages': output}), 200

@social_bp.route('/chat', methods=['POST'])
@token_required
def send_chat_message(current_user):
    data = request.get_json()
    if not data or not data.get('content'):
        return jsonify({'message': 'Content required'}), 400
        
    room = current_user.get('career_goal', 'General')
    if not room:
        room = 'General'
        
    message = {
        'room': room,
        'user_id': current_user['_id'],
        'author_name': current_user['name'],
        'content': data['content'],
        'created_at': datetime.datetime.utcnow()
    }
    
    mongo.db.chat_messages.insert_one(message)
    
    return jsonify({'message': 'Sent'}), 201
