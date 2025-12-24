# UNIverse: Personalized Learning Roadmap Platform

UNIverse is a comprehensive learning platform designed to help students and professionals navigate their career paths through AI-curated roadmaps, automated assessments, and social learning features.

## Core Features

- **AI-Powered Roadmaps**: Generate personalized learning paths based on specific career goals using Gemini 2.0 Flash.
- **Automated Assessments**: Validate your knowledge with milestone-based quizzes that unlock the next stages of your journey.
- **Resource Integration**: Direct access to high-quality educational content from MIT OCW, Harvard, IBM SkillsBuild, and more.
- **Social Feed**: Share progress, achievements, and insights with a community of learners.
- **Interactive Assistant**: A dedicated AI mentor to answer questions regarding your roadmap and specific technical topics.

## Technology Stack

- **Backend**: Python (Flask), Flask-SocketIO for real-time updates.
- **Frontend**: Vanilla JavaScript, HTML5, CSS3 (Glassmorphism UI).
- **Database**: MongoDB (Flask-PyMongo).
- **AI/ML**: OpenRouter API (Gemini 2.0 Flash), Scikit-learn (TF-IDF for domain classification).

## Getting Started

### Prerequisites

- Python 3.8 or higher.
- MongoDB (Local or Atlas).
- OpenRouter API Key (for AI features).

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/universe.git
   cd universe
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Configuration:
   - Copy `env.example` to `.env`.
   - Open `.env` and fill in your `SECRET_KEY`, `MONGO_URI`, and `OPENROUTER_API_KEY`.

4. Run the application:
   ```bash
   python run.py
   ```
   The application will be available at `http://localhost:5001`.

## Project Structure

- `app/`: Contains the core Flask application logic, routes, and models.
- `static/`: Frontend assets including CSS, JavaScript, and images.
- `templates/`: HTML templates.
- `tests/`: Automated test suites for feature verification.
- `requirements.txt`: Python dependency list.
- `run.py`: Application entry point.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## MEC LABS | TEAM OBLIVION
Developed as a submission for MEC Labs.
