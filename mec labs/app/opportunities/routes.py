from flask import request, jsonify
from app.opportunities import opportunities_bp
from app.utils import token_required

MOCK_OPPORTUNITIES = [
    {
        "id": "1",
        "title": "Google Cloud Skills Boost",
        "category": "certification",
        "provider": "Google",
        "type": "online",
        "price": "free",
        "tags": ["cloud", "gcp", "ai"],
        "description": "Free generative AI courses and cloud certifications.",
        "link": "https://www.cloudskillsboost.google/"
    },
    {
        "id": "2",
        "title": "Infosys Springboard",
        "category": "certification",
        "provider": "Infosys",
        "type": "online",
        "price": "free",
        "tags": ["software", "management", "iot"],
        "description": "Corporate-grade learning for students and professionals.",
        "link": "https://infyspringboard.onwingspan.com/"
    },
    {
        "id": "3",
        "title": "FreeCodeCamp Certifications",
        "category": "certification",
        "provider": "FreeCodeCamp",
        "type": "online",
        "price": "free",
        "tags": ["web", "python", "data-science"],
        "description": "Learn to code for free and build projects.",
        "link": "https://www.freecodecamp.org/"
    },
    {
        "id": "4",
        "title": "CS50: Introduction to Computer Science",
        "category": "certification",
        "provider": "Harvard University",
        "type": "online",
        "price": "free",
        "tags": ["cs", "fundamentals", "c", "python"],
        "description": "An introduction to the intellectual enterprises of computer science.",
        "link": "https://pll.harvard.edu/course/cs50-introduction-computer-science"
    },
    {
        "id": "101",
        "title": "Smart India Hackathon 2024",
        "category": "hackathon",
        "mode": "offline",
        "location": "New Delhi",
        "date": "2024-08-15",
        "tags": ["gov", "innovation", "nation-building"],
        "description": "World's biggest open innovation model.",
        "link": "https://www.sih.gov.in/"
    },
    {
        "id": "102",
        "title": "HackMIT 2025",
        "category": "hackathon",
        "mode": "offline",
        "location": "Cambridge, MA",
        "date": "2025-09-14",
        "tags": ["web", "mobile", "ai"],
        "description": "Premier hackathon at MIT.",
        "link": "https://hackmit.org/"
    },
    {
        "id": "103",
        "title": "Global AI Hackathon",
        "category": "hackathon",
        "mode": "online",
        "location": "Global",
        "date": "2025-03-01",
        "tags": ["ai", "ml", "remote"],
        "description": "Build the future of AI from anywhere.",
        "link": "https://devpost.com/"
    },
     {
        "id": "104",
        "title": "Local City Codefest",
        "category": "hackathon",
        "mode": "offline",
        "location": "Mumbai",
        "date": "2025-02-20",
        "tags": ["city", "web3", "fintech"],
        "description": "Mumbai's largest developer gathering.",
        "link": "#"
    }
]

@opportunities_bp.route('/', methods=['GET'])
@token_required
def get_opportunities(current_user):
    category_filter = request.args.get('category')
    mode_filter = request.args.get('mode')
    tag_filter = request.args.get('tag')
    
    filtered_ops = MOCK_OPPORTUNITIES
    
    if category_filter:
        filtered_ops = [op for op in filtered_ops if op.get('category') == category_filter]
    
    if mode_filter and mode_filter != 'all':
        target_mode = mode_filter
        if mode_filter == 'near_me':
            target_mode = 'offline'
            
        filtered_ops = [op for op in filtered_ops if op.get('type') == target_mode or op.get('mode') == target_mode]

    if tag_filter:
        filtered_ops = [op for op in filtered_ops if tag_filter in op['tags']]
        
    return jsonify({'opportunities': filtered_ops}), 200
