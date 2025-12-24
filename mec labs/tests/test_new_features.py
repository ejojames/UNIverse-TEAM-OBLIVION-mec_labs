import unittest
import json
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import create_app, mongo

class TestNewFeatures(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['MONGO_URI'] = 'mongodb://localhost:27017/uni_test_db'
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()
        
        # Setup Test User
        mongo.db.users.delete_many({})
        mongo.db.posts.delete_many({})
        
        self.user_data = {
            "name": "Test User",
            "email": "test@example.com",
            "password": "password123",
            "career_goal": "AI Engineer"
        }
        self.client.post('/api/auth/register', json=self.user_data)
        login_res = self.client.post('/api/auth/login', json={
            "email": "test@example.com", 
            "password": "password123"
        })
        self.token = login_res.json['token']
        self.headers = {'Authorization': f'Bearer {self.token}'}

    def tearDown(self):
        mongo.db.users.delete_many({})
        mongo.db.posts.delete_many({})
        self.ctx.pop()

    def test_opportunities_filtering(self):
        # Test Default
        res = self.client.get('/api/opportunities/', headers=self.headers)
        self.assertEqual(res.status_code, 200)
        
        # Test Certification
        res = self.client.get('/api/opportunities/?category=certification', headers=self.headers)
        data = res.json
        self.assertTrue(all(op['category'] == 'certification' for op in data['opportunities']))
        
        # Test Hackathon
        res = self.client.get('/api/opportunities/?category=hackathon', headers=self.headers)
        data = res.json
        self.assertTrue(all(op['category'] == 'hackathon' for op in data['opportunities']))

    def test_social_features(self):
        # Create Post
        res = self.client.post('/api/social/posts', headers=self.headers, json={'content': 'Hello World'})
        self.assertEqual(res.status_code, 201)
        post_id = res.json['post_id']
        
        # Like Post
        res = self.client.post(f'/api/social/posts/{post_id}/like', headers=self.headers)
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json['liked'])
        self.assertEqual(res.json['likes_count'], 1)
        
        # Repost
        res = self.client.post(f'/api/social/posts/{post_id}/repost', headers=self.headers)
        self.assertEqual(res.status_code, 201)
        
        # Verify Feed
        res = self.client.get('/api/social/feed', headers=self.headers)
        feed = res.json['feed']
        self.assertEqual(len(feed), 2) # Original + Repost
        self.assertTrue(feed[0]['is_repost']) # Most recent should be repost

if __name__ == '__main__':
    unittest.main()
