import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
import requests
import json
import random
from app.roadmap.aptitude_bank import CAREER_QUIZZES

class RoadmapEngine:
    def __init__(self):
        self.quiz_cache = {}
        self.roadmap_cache = {}
        
        self.knowledge_base = {
            "html_css": {
                "title": "HTML & CSS Fundamentals", 
                "description": "Structure and styling for the web. Foundations of frontend development.", 
                "level": 1, 
                "weeks": 1,
                "resources": [
                    {"name": "IBM SkillsBuild: Web Dev Basics", "url": "https://skillsbuild.org/students/course-catalog/ux-design-basics", "platform": "IBM", "rating": 4.7, "rating_count": "12k+", "diff_level": "Beginner"},
                    {"name": "FreeCodeCamp: Responsive Design", "url": "https://www.freecodecamp.org/learn/2022/responsive-web-design/", "platform": "FreeCodeCamp", "rating": 4.9, "rating_count": "150k+", "diff_level": "Beginner"},
                    {"name": "MDN: Getting Started with HTML", "url": "https://developer.mozilla.org/en-US/docs/Learn/HTML/Introduction_to_HTML", "platform": "Mozilla", "rating": 4.8, "rating_count": "5k+", "diff_level": "Beginner"}
                ], 
                "category": "web_dev"
            },
            "javascript": {
                "title": "JavaScript Programming", 
                "description": "Mastering logical flows and DOM interaction.", 
                "level": 2, 
                "weeks": 2,
                "resources": [
                    {"name": "MIT OCW: JavaScript Intro", "url": "https://ocw.mit.edu/courses/6-0001-introduction-to-computer-science-and-programming-using-python-fall-2016/", "platform": "MIT", "rating": 4.9, "rating_count": "85k+", "diff_level": "Intermediate"},
                    {"name": "Cognitive Class: JS for Beginners", "url": "https://cognitiveclass.ai/courses/javascript-basics", "platform": "IBM", "rating": 4.6, "rating_count": "15k+", "diff_level": "Beginner"},
                    {"name": "Javascript.info: Complete Guide", "url": "https://javascript.info/", "platform": "Open Source", "rating": 4.8, "rating_count": "20k+", "diff_level": "Intermediate"}
                ], 
                "category": "web_dev"
            },
            "react": {
                "title": "Modern Frontend Frameworks (React)", 
                "description": "Building component-based high-performance applications.", 
                "level": 3, 
                "weeks": 2,
                "resources": [
                    {"name": "Official React: Learning Path", "url": "https://react.dev/learn", "platform": "Meta", "rating": 4.9, "rating_count": "200k+", "diff_level": "Advanced"},
                    {"name": "Scrimba: Learn React for Free", "url": "https://scrimba.com/learn/learnreact", "platform": "Scrimba", "rating": 4.7, "rating_count": "45k+", "diff_level": "Intermediate"},
                    {"name": "MIT OCW: Software Engineering", "url": "https://ocw.mit.edu/courses/6-031-software-construction-spring-2016/", "platform": "MIT", "rating": 4.9, "rating_count": "30k+", "diff_level": "Advanced"}
                ], 
                "category": "web_dev"
            },
            "node_express": {
                "title": "Server-Side Engineering", 
                "description": "Scalable backend architecture and API design.", 
                "level": 4, 
                "weeks": 3,
                "resources": [
                    {"name": "IBM SkillsBuild: Node.js Dev", "url": "https://skillsbuild.org/students/course-catalog/node-js-development", "platform": "IBM", "rating": 4.6, "rating_count": "10k+", "diff_level": "Intermediate"},
                    {"name": "FreeCodeCamp: Backend Foundations", "url": "https://www.freecodecamp.org/learn/back-end-development-and-apis/", "platform": "FreeCodeCamp", "rating": 4.8, "rating_count": "90k+", "diff_level": "Intermediate"}
                ], 
                "category": "web_dev"
            },
            "mongodb": {
                "title": "Advanced Data Management", 
                "description": "Managing NoSQL horizontal scaling and caching.", 
                "level": 5, 
                "weeks": 2,
                "resources": [
                    {"name": "MongoDB University: M001 Basics", "url": "https://university.mongodb.com/courses/M001/about", "platform": "MongoDB", "rating": 4.7, "rating_count": "120k+", "diff_level": "Beginner"},
                    {"name": "MIT OCW: Database Systems", "url": "https://ocw.mit.edu/courses/6-830-database-systems-fall-2010/", "platform": "MIT", "rating": 4.8, "rating_count": "25k+", "diff_level": "Advanced"}
                ], 
                "category": "web_dev"
            },
            
            "python_basics": {
                "title": "Computational Thinking (Python)", 
                "description": "The foundation for all data science and AI applications.", 
                "level": 1, 
                "weeks": 1,
                "resources": [
                    {"name": "MIT OCW: Intro to Computer Science", "url": "https://ocw.mit.edu/courses/6-0001-introduction-to-computer-science-and-programming-using-python-fall-2016/", "platform": "MIT", "rating": 4.9, "rating_count": "1M+", "diff_level": "Beginner"},
                    {"name": "IBM SkillsBuild: Python for DS", "url": "https://skillsbuild.org/students/course-catalog/python-for-data-science", "platform": "IBM", "rating": 4.7, "rating_count": "30k+", "diff_level": "Beginner"},
                    {"name": "Cognitive Class: Python 101", "url": "https://cognitiveclass.ai/courses/python-for-data-science", "platform": "IBM", "rating": 4.8, "rating_count": "50k+", "diff_level": "Beginner"}
                ], 
                "category": "data_science"
            },
            "pandas_numpy": {
                "title": "Scientific Computing & Analysis", 
                "description": "Manipulating large datasets and numerical computation.", 
                "level": 2, 
                "weeks": 2,
                "resources": [
                    {"name": "Cognitive Class: Data Analysis", "url": "https://cognitiveclass.ai/courses/data-analysis-python", "platform": "IBM", "rating": 4.6, "rating_count": "20k+", "diff_level": "Intermediate"},
                    {"name": "FreeCodeCamp: Data Analysis", "url": "https://www.freecodecamp.org/learn/data-analysis-with-python/", "platform": "FreeCodeCamp", "rating": 4.8, "rating_count": "60k+", "diff_level": "Intermediate"}
                ], 
                "category": "data_science"
            },
            "stats_math": {
                "title": "Foundational Math for AI", 
                "description": "Linear Algebra, Probability, and Statistics for ML models.", 
                "level": 3, 
                "weeks": 3,
                "resources": [
                    {"name": "MIT OCW: Linear Algebra", "url": "https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/", "platform": "MIT", "rating": 4.9, "rating_count": "150k+", "diff_level": "Advanced"},
                    {"name": "Khan Academy: Statistics", "url": "https://www.khanacademy.org/math/statistics-probability", "platform": "Khan Academy", "rating": 4.8, "rating_count": "500k+", "diff_level": "Beginner"}
                ], 
                "category": "data_science"
            },
            "machine_learning": {
                "title": "Machine Learning Algorithms", 
                "description": "Building and evaluating predictive statistical models.", 
                "level": 4, 
                "weeks": 4,
                "resources": [
                    {"name": "MIT OCW: Machine Learning", "url": "https://ocw.mit.edu/courses/6-036-introduction-to-machine-learning-fall-2020/", "platform": "MIT", "rating": 4.9, "rating_count": "80k+", "diff_level": "Advanced"},
                    {"name": "Cognitive Class: ML with Python", "url": "https://cognitiveclass.ai/courses/machine-learning-with-python", "platform": "IBM", "rating": 4.7, "rating_count": "40k+", "diff_level": "Intermediate"}
                ], 
                "category": "data_science"
            },
            "deep_learning": {
                "title": "Neural Networks & Deep Learning", 
                "description": "Architecting advanced AI models for vision and language.", 
                "level": 5, 
                "weeks": 4,
                "resources": [
                    {"name": "MIT OCW: Deep Learning", "url": "http://introtodeeplearning.com/", "platform": "MIT", "rating": 4.9, "rating_count": "100k+", "diff_level": "Advanced"},
                    {"name": "IBM SkillsBuild: AI Startup", "url": "https://skillsbuild.org/students/course-catalog/getting-started-with-ai", "platform": "IBM", "rating": 4.8, "rating_count": "15k+", "diff_level": "Beginner"}
                ], 
                "category": "data_science"
            },

            "cyber_foundations": {
                "title": "Cybersecurity Fundamentals",
                "description": "Key concepts in system security and network defense.",
                "level": 1,
                "weeks": 2,
                "resources": [
                    {"name": "IBM SkillsBuild: Cyber Foundations", "url": "https://skillsbuild.org/students/course-catalog/cybersecurity-fundamentals", "platform": "IBM", "rating": 4.7, "rating_count": "25k+", "diff_level": "Beginner"},
                    {"name": "Cisco: Intro to Cybersecurity", "url": "https://www.netacad.com/courses/cybersecurity/introduction-cybersecurity", "platform": "Cisco", "rating": 4.9, "rating_count": "200k+", "diff_level": "Beginner"}
                ],
                "category": "cyber_sec"
            },
            "systems_security": {
                "title": "Computer Systems Security",
                "description": "System-level security insights and defense mechanisms.",
                "level": 2,
                "weeks": 3,
                "resources": [
                    {"name": "MIT OCW: Systems Security", "url": "https://ocw.mit.edu/courses/6-858-computer-systems-security-fall-2014/", "platform": "MIT", "rating": 4.9, "rating_count": "40k+", "diff_level": "Advanced"},
                    {"name": "Cognitive Class: Cyber ML", "url": "https://cognitiveclass.ai/courses/combining-machine-learning-and-rules-for-cybersecurity", "platform": "IBM", "rating": 4.6, "rating_count": "10k+", "diff_level": "Intermediate"}
                ],
                "category": "cyber_sec"
            }
        }

        self.categories = {
            "web_dev": "web development website frontend backend fullstack react node html css js javascript",
            "data_science": "data science machine learning ai artificial intelligence python pandas statistics analytics neural networks",
            "design": "ui ux design figma product design graphics visual branding web design",
            "cyber_sec": "cybersecurity hacking pentesting security networking ethical hacker"
        }

        self.vectorizer = TfidfVectorizer()
        self.category_names = list(self.categories.keys())
        self.category_corpus = [self.categories[cat] for cat in self.category_names]
        self.vectorizer.fit(self.category_corpus)

    def _normalize_query(self, query):
        return re.sub(r'[^a-zA-Z0-9\s]', '', str(query)).lower().strip()

    def _classify_domain(self, query):
        try:
            from flask import current_app
            api_key = current_app.config.get('OPENROUTER_API_KEY')
            if not api_key: return "TECH"

            prompt = f"""
            Classify the following profession or interest into ONE of these domains: 
            [TECH, SCIENCE, ART, PHILOSOPHY, MANAGEMENT, TRADES, MEDICAL, INVALID]
            
            Profession: "{query}"
            
            Return ONLY the single word for the domain. If it's nonsense, return INVALID.
            """
            response = requests.post(
                url="https://openrouter.ai/api/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                data=json.dumps({
                    "model": "google/gemini-2.0-flash-exp:free",
                    "messages": [{"role": "user", "content": prompt}]
                }),
                timeout=5
            )
            if response.status_code == 200:
                domain = response.json()['choices'][0]['message']['content'].strip().upper()
                if domain in ['TECH', 'SCIENCE', 'ART', 'PHILOSOPHY', 'MANAGEMENT', 'TRADES', 'MEDICAL', 'INVALID']:
                    return domain
        except:
            pass
        return "TECH"

    def generate(self, user_interests, level=None):
        if level:
            return self.generate_custom_roadmap(user_interests, level)

        normalized_query = self._normalize_query(user_interests or "")
        
        tech_keywords = ['web', 'data', 'coding', 'software', 'cloud', 'cyber', 'design', 'python', 'java', 'js', 'html', 'css']
        if any(kw in normalized_query for kw in tech_keywords):
            domain = "TECH"
        else:
            domain = "TECH"

        query_vec = self.vectorizer.transform([normalized_query])
        corpus_vec = self.vectorizer.transform(self.category_corpus)
        similarities = cosine_similarity(query_vec, corpus_vec)[0]
        
        best_match_idx = np.argmax(similarities)
        best_score = similarities[best_match_idx]

        if best_score < 0.1:
            return self.generate_custom_roadmap(user_interests, "Beginner")

        best_category = self.category_names[best_match_idx]
        roadmap_skills = [
            skill for skill in self.knowledge_base.values() 
            if skill.get('category') == best_category
        ]
        roadmap_skills.sort(key=lambda x: x['level'])

        return {
            "career_goal": user_interests,
            "category": best_category.replace('_', ' ').title(),
            "milestones": [
                {
                    "step": i + 1,
                    "topic": skill['title'],
                    "description": skill['description'],
                    "weeks": skill.get('weeks', 1),
                    "resources": skill['resources']
                } for i, skill in enumerate(roadmap_skills)
            ]
        }

    def generate_custom_roadmap(self, topic, level):
        try:
            from flask import current_app
            api_key = current_app.config.get('OPENROUTER_API_KEY')
            if not api_key:
                return self._get_fallback_roadmap(topic)

            if topic in self.roadmap_cache:
                return self.roadmap_cache[topic]

            nptel_instruction = ""
            if any(kw in topic.lower() for kw in ['drone', 'uav', 'robotics', 'engineering', 'india']):
                nptel_instruction = "IMPORTANT: For technical and engineering milestones, prioritize suggesting NPTEL (Swayam) courses. If a specific course is found on NPTEL, use 'NPTEL' as the platform."

            if any(kw in topic.lower() for kw in ['scam', 'illegal', 'hack bank', 'kill', 'nonsense', 'asdfgh']):
                 return {"error": "Roadmap not available for this topic."}

            prompt = f"""
            Generate a detailed professional learning roadmap for: "{topic}" ({level} level).
            This could be in any field: Tech, Science, Art, Philosophy, etc.
            
            The roadmap must have 5 sequential milestones.
            
            {nptel_instruction}
            
            IMPORTANT: Provide ACTUAL SPECIFIC COURSE NAMES and valid URLS from high-authority sources:
            - Tech/Science: MIT OCW, NPTEL, Coursera, edX.
            - Art: Museum sites, Art station Learning, Domestika, YouTube (Proko/Drawabox).
            - Philosophy: Stanford Encyclopedia, Philosophy Now, Open Courses.
            
            If the topic is too obscure or inappropriate, return: {{"error": "Roadmap not available"}} instead.
            
            Return strictly valid JSON:
            {{
                "roadmap": {{
                    "career_goal": "{topic}",
                    "level": "{level}",
                    "milestones": [
                        {{
                            "step": 1,
                            "topic": "Fundamental Concept...",
                            "description": "...",
                            "weeks": 2,
                            "resources": [
                                {{
                                     "name": "Exact Resource Name",
                                     "platform": "Website/Platform",
                                     "url": "https://...",
                                     "type": "video/article/course",
                                     "diff_level": "Beginner",
                                     "rating": 4.8
                                }}
                            ]
                        }}
                    ]
                }}
            }}
            """
            
            response = requests.post(
                url="https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "HTTP-Referer": "http://localhost:5001",
                },
                data=json.dumps({
                    "model": "google/gemini-2.0-flash-exp:free",
                    "messages": [{"role": "user", "content": prompt.replace("{acc_level}", level)}]
                }),
                timeout=15
            )

            if response.status_code == 200:
                content = response.json()['choices'][0]['message']['content']
                content = content.replace('```json', '').replace('```', '').strip()
                result = json.loads(content)
                self.roadmap_cache[topic] = result
                return result
            else:
                return self._get_fallback_roadmap(topic)

        except Exception as e:
            print(f"Custom Roadmap Error: {e}")
            return self._get_fallback_roadmap(topic)

    def _get_fallback_roadmap(self, goal):
        return {
            "career_goal": goal,
            "category": "Custom Discovery",
            "milestones": [
                {
                    "step": 1,
                    "topic": "Programming Fundamentals (Python/Java)",
                    "description": "Master the syntax, data structures, and core logic of programming.",
                    "weeks": 2,
                    "resources": [
                        { "name": "CS50: Introduction to Computer Science (Harvard)", "url": "https://cs50.harvard.edu/x/", "platform": "Harvard/edX", "diff_level": "Beginner", "type": "course" },
                        { "name": "Python for Everybody (Michigan)", "url": "https://www.coursera.org/specializations/python", "platform": "Coursera", "diff_level": "Beginner", "type": "course" }
                    ]
                },
                {
                    "step": 2,
                    "topic": "Data Structures & Algorithms",
                    "description": "Learn lists, trees, graphs, and efficient sorting/searching algorithms.",
                    "weeks": 3,
                    "resources": [
                        { "name": "Introduction to Algorithms (MIT 6.006)", "url": "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/", "platform": "MIT OCW", "diff_level": "Intermediate", "type": "video" }
                    ]
                },
                {
                    "step": 3,
                    "topic": "Database Systems",
                    "description": "Understand SQL, NoSQL, and database design principles.",
                    "weeks": 2,
                    "resources": [
                        { "name": "Database Systems (Carnegie Mellon)", "url": "https://15445.courses.cs.cmu.edu/", "platform": "CMU", "diff_level": "Intermediate", "type": "course" }
                    ]
                },
                {
                    "step": 4,
                    "topic": "Web Development / API Design",
                    "description": "Build backend services and understand HTTP, REST, and JSON.",
                    "weeks": 2,
                    "resources": [
                        { "name": "Full Stack Open (Helsinki)", "url": "https://fullstackopen.com/en/", "platform": "University of Helsinki", "diff_level": "Intermediate", "type": "course" }
                    ]
                },
                {
                    "step": 5,
                    "topic": "System Design & Deployment",
                    "description": "Learn to scale applications, use cloud services, and deploy production code.",
                    "weeks": 2,
                    "resources": [
                        { "name": "Distributed Systems (MIT 6.824)", "url": "https://pdos.csail.mit.edu/6.824/", "platform": "MIT", "diff_level": "Advanced", "type": "course" }
                    ]
                }
            ]
        }

    def chat(self, message, context_category=None):
        msg_normalized = self._normalize_query(message)
        
        try:
            from flask import current_app
            api_key = current_app.config.get('OPENROUTER_API_KEY')
            
            if api_key:
                context_info = ""
                if context_category:
                    context_info = f"The user is currently viewing a {context_category} roadmap."
                
                response = requests.post(
                    url="https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "HTTP-Referer": "http://localhost:5001",
                    },
                    data=json.dumps({
                        "model": "google/gemini-2.0-flash-exp:free",
                        "messages": [
                            {"role": "system", "content": f"You are the UNIverse Roadmap Assistant, a helpful AI mentor. Your goal is to guide students on their career paths. {context_info} If they ask 'why' a beginner course is in an advanced section, explain that foundations are critical for high-level scaling. Be concise, encouraging, and professional. use markdown formatting."},
                            {"role": "user", "content": message}
                        ]
                    }),
                    timeout=10
                )
                
                if response.status_code == 200:
                    return response.json()['choices'][0]['message']['content']
                else:
                    print(f"OpenRouter Error: {response.text}")
        except Exception as e:
            print(f"Chat Exception: {str(e)}")

        msg = msg_normalized
        if "hello" in msg or "hi" in msg:
            return "Hello! I'm your UNIverse Roadmap Assistant. How can I help you on your learning journey today?"
        
        if "how" in msg and "start" in msg:
            return "To start, I recommend looking at Step 1 of your roadmap. It usually covers the foundational concepts you'll need."
        
        if "resource" in msg or "link" in msg:
            return "You can find clickable resource links under each step of your roadmap. Just click on them to start learning!"

        if "next" in msg or "after" in msg:
            return "After you finish your current step, you should move on to the next milestone to build on your knowledge. Consistency is key!"

        query_vec = self.vectorizer.transform([msg])
        corpus_vec = self.vectorizer.transform(self.category_corpus)
        similarities = cosine_similarity(query_vec, corpus_vec)[0]
        best_match_idx = np.argmax(similarities)
        
        if similarities[best_match_idx] > 0.2:
            cat = self.category_names[best_match_idx].replace('_', ' ')
            return f"That sounds like it falls under {cat}. I can generate a roadmap for that if you use the 'Build New Path' button!"

        return "I'm currently operating in offline mode. I can help with general roadmap questions, resources, and starting tips!"

    def _validate_quiz(self, data):
        if not data or not isinstance(data, dict): return False
        questions = data.get('questions', [])
        if len(questions) < 5: return False
        
        for q in questions:
            txt = q.get('text', '')
            if not txt or '...' in txt or len(txt) < 10: return False
            
            opts = q.get('options', [])
            if len(opts) < 4: return False
            for opt in opts:
                if not opt or '...' in opt or opt.strip() == "": return False
            
            ci = q.get('correct_index')
            if ci is None or not (0 <= ci < len(opts)): return False
            
        return True

    def generate_aptitude_quiz(self, topic):
        bank_quiz = self._get_bank_quiz(topic)
        if bank_quiz:
            return bank_quiz

        try:
            from flask import current_app
            api_key = current_app.config.get('OPENROUTER_API_KEY')
            if api_key:
                prompt = f"""
                You are an expert examiner in the domain of "{topic}". 
                Create a 5-question multiple-choice aptitude quiz to assess a beginner's fundamental grasp of "{topic}".
                
                CRITICAL INSTRUCTIONS:
                - Every question must be deeply relevant to "{topic}". 
                - If the topic is ART, ask about theory/techniques. If PHILOSOPHY, ask about core concepts/thinkers.
                - NO placeholders like '...' or generic text.
                - Each question must have 4 distinct, technically descriptive options.
                - Return ONLY strictly valid JSON.
                
                Format:
                {{
                    "questions": [
                        {{
                            "id": 1,
                            "text": "Core technical/conceptual question about {topic}?",
                            "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                            "correct_index": 0
                        }}
                    ]
                }}
                """
                response = requests.post(
                    url="https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "HTTP-Referer": "http://localhost:5001",
                    },
                    data=json.dumps({
                        "model": "google/gemini-2.0-flash-exp:free",
                        "messages": [{"role": "user", "content": prompt}]
                    }),
                    timeout=12
                )
                if response.status_code == 200:
                    content = response.json()['choices'][0]['message']['content']
                    data = json.loads(content.replace('```json', '').replace('```', '').strip())
                    if self._validate_quiz(data):
                        return data
        except Exception as e:
            print(f"Aptitude AI Gen Error: {e}")
            
        return self._get_fallback_quiz(topic)

    def _get_bank_quiz(self, topic):
        t_norm = topic.lower().replace(' ', '_')
        
        best_key = None
        for key in CAREER_QUIZZES.keys():
            if key in t_norm or t_norm in key:
                best_key = key
                break
        
        if best_key and best_key in CAREER_QUIZZES:
            questions = CAREER_QUIZZES[best_key]
            if len(questions) >= 5:
                selected = random.sample(questions, 5)
                for i, q in enumerate(selected):
                    q['id'] = i + 1
                return {"questions": selected}
        
        return None

    def _get_fallback_quiz(self, topic):
        t = self._normalize_query(topic)
        
        if any(x in t for x in ['web', 'frontend', 'fullstack', 'js', 'javascript', 'react']):
            return {
                "questions": [
                    {"id": 1, "text": "Which HTML tag is used to create a hyperlink?", "options": ["<link>", "<a>", "<href>", "<url>"], "correct_index": 1},
                    {"id": 2, "text": "What does CSS stand for?", "options": ["Creative Style Sheets", "Computer Style Sheets", "Cascading Style Sheets", "Colorful Style Sheets"], "correct_index": 2},
                    {"id": 3, "text": "Inside which HTML element do we put the JavaScript?", "options": ["<js>", "<scripting>", "<script>", "<javascript>"], "correct_index": 2},
                    {"id": 4, "text": "Which of these is NOT a valid CSS selector?", "options": [".class", "#id", "$element", "div p"], "correct_index": 2},
                    {"id": 5, "text": "What is the DOM?", "options": ["Data Object Mode", "Document Object Model", "Digital Order Module", "Disk Operating Method"], "correct_index": 1}
                ]
            }

        elif any(x in t for x in ['css', 'style', 'sass', 'tailwind', 'ui', 'design']):
            return {
                "questions": [
                    {"id": 1, "text": "Which property is used to change the text color?", "options": ["text-color", "color", "font-color", "bg-color"], "correct_index": 1},
                    {"id": 2, "text": "What does 'z-index' control?", "options": ["Font size", "Stack order of elements", "Horizontal position", "Transparency"], "correct_index": 1},
                    {"id": 3, "text": "Which unit is relative to the font-size of the root element?", "options": ["em", "px", "rem", "%"], "correct_index": 2},
                    {"id": 4, "text": "Which display property is used for creating a flexible layout?", "options": ["block", "inline", "flex", "static"], "correct_index": 2},
                    {"id": 5, "text": "How do you select an element with id 'header'?", "options": [".header", "header", "#header", "*header"], "correct_index": 2}
                ]
            }

        elif any(x in t for x in ['java', 'backend', 'oop', 'c#', 'c++', 'spring']):
            return {
                "questions": [
                    {"id": 1, "text": "What is the entry point of a Java program?", "options": ["start()", "init()", "main()", "begin()"], "correct_index": 2},
                    {"id": 2, "text": "Which concept allows a class to inherit from another?", "options": ["Polymorphism", "Encapsulation", "Inheritance", "Abstraction"], "correct_index": 2},
                    {"id": 3, "text": "What does JVM stand for?", "options": ["Java Virtual Machine", "Java Vital Model", "Java Variable Manager", "Java Virtual Memory"], "correct_index": 0},
                    {"id": 4, "text": "Which of these is used to handle exceptions?", "options": ["try-catch", "if-else", "do-while", "switch"], "correct_index": 0},
                    {"id": 5, "text": "What is a 'Constructor'?", "options": ["A method that destroys objects", "A method used to initialize objects", "A tool to build UI", "A type of variable"], "correct_index": 1}
                ]
            }
            
        elif any(x in t for x in ['data', 'python', 'ai', 'ml', 'science', 'pandas']):
            return {
                "questions": [
                    {"id": 1, "text": "Which library is primarily used for data manipulation in Python?", "options": ["NumPy", "Pandas", "Matplotlib", "Requests"], "correct_index": 1},
                    {"id": 2, "text": "How do you start a function in Python?", "options": ["func myFunc():", "def myFunc():", "function myFunc():", "define myFunc():"], "correct_index": 1},
                    {"id": 3, "text": "What is 'Supervised Learning'?", "options": ["Learning without data", "Training with labeled data", "Training with unlabeled data", "AI that supervises humans"], "correct_index": 1},
                    {"id": 4, "text": "Which symbol is used for comments in Python?", "options": ["//", "/*", "#", "--"], "correct_index": 2},
                    {"id": 5, "text": "What does 'DataFrame' refer to?", "options": ["A 2D labeled data structure", "A video frame", "A database key", "A Python list"], "correct_index": 0}
                ]
            }
            
        elif any(x in t for x in ['cyber', 'security', 'hack', 'network']):
            return {
                "questions": [
                    {"id": 1, "text": "What does 'Phishing' refer to?", "options": ["Fishing online", "Fraudulent emails to steal info", "Network scanning", "Password cracking"], "correct_index": 1},
                    {"id": 2, "text": "What is a 'Firewall'?", "options": ["A physical wall", "Network security device", "Antivirus software", "A virus"], "correct_index": 1},
                    {"id": 3, "text": "What does VPN stand for?", "options": ["Visual Private Network", "Virtual Private Network", "Vital Public Network", "Virtual Personal Network"], "correct_index": 1},
                    {"id": 4, "text": "Which is a strong password practice?", "options": ["Using '123456'", "Using name", "Mixing chars, numbers & symbols", "Writing it on a note"], "correct_index": 2},
                    {"id": 5, "text": "What is 'SQL Injection'?", "options": ["Improving SQL speed", "Inserting malicious SQL code", "Installing SQL database", "Updating SQL records"], "correct_index": 1}
                ]
            }

        return {
            "questions": [
                {"id": 1, "text": f"What is the core purpose of learning {topic}?", "options": ["To build software/logic", "To repair hardware", "To design logos", "To manage people"], "correct_index": 0},
                {"id": 2, "text": "Which of these is a conditional statement?", "options": ["for", "if-else", "import", "print"], "correct_index": 1},
                {"id": 3, "text": "What is a 'Bug' in programming?", "options": ["An insect", "A feature", "An error/flaw", "A virus"], "correct_index": 2},
                {"id": 4, "text": "What involves storing data in a key-value pair?", "options": ["Array", "Dictionary/Map", "Queue", "Stack"], "correct_index": 1},
                {"id": 5, "text": "Why is 'clean code' important?", "options": ["It looks pretty", "It compiles faster", "Readability and maintenance", "It uses less memory"], "correct_index": 2}
            ]
        }

    def generate_lesson_quiz(self, topic, difficulty="Beginner"):
        cache_key = f"{topic}_{difficulty}"
        if cache_key in self.quiz_cache:
            return self.quiz_cache[cache_key]

        try:
            from flask import current_app
            api_key = current_app.config.get('OPENROUTER_API_KEY')
            if not api_key:
                return self._get_fallback_quiz(topic)

            prompt = f"""
            You are an expert instructor in "{topic}".
            Create a targeted 5-question technical quiz to test a student's knowledge after a lesson on "{topic}".
            Difficulty Level: {difficulty}.
            
            CRITICAL REQUIREMENTS:
            - Each question MUST have 4 unique, technically accurate options.
            - NO placeholders like "..." or "Loading...".
            - NO generic "What is programming?" questions.
            - Focus on specific syntax, industry tools, or methodologies related to {topic}.
            - The response must be valid JSON only.
            
            Return format:
            {{
                "questions": [
                    {{
                        "id": 1,
                        "text": "Exact technical question about {topic}...",
                        "options": ["Correct opt", "Distractor 1", "Distractor 2", "Distractor 3"],
                        "correct_index": 0
                    }}
                ]
            }}
            """
            
            response = requests.post(
                url="https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "HTTP-Referer": "http://localhost:5001",
                },
                data=json.dumps({
                    "model": "google/gemini-2.0-flash-exp:free",
                    "messages": [{"role": "user", "content": prompt}]
                }),
                timeout=12
            )

            if response.status_code == 200:
                content = response.json()['choices'][0]['message']['content']
                data = json.loads(content.replace('```json', '').replace('```', '').strip())
                if self._validate_quiz(data):
                    self.quiz_cache[cache_key] = data
                    return data
            
            return self._get_fallback_quiz(topic)
                
        except Exception as e:
            print(f"Lesson Quiz Gen Error: {e}")
            return self._get_fallback_quiz(topic)

    def determine_level(self, score):
        if score < 3:
            return "Beginner"
        else:
            return "Intermediate"

engine = RoadmapEngine()
