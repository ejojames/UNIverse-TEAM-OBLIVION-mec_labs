# 🌌 UNIverse: AI-Powered Personalized Learning Platform

**UNIverse** is a state-of-the-art learning companion designed to bridge the gap between curiosity and career excellence. By leveraging modern AI and community interaction, UNIverse provides tailored roadmaps, skill assessments, and a vibrant ecosystem for lifelong learners.

---

## ✨ Key Features

- **🚀 AI Roadmap Generation**: Instantly generate professional learning paths for any topic (Tech, Art, Science, etc.) using the Gemini 2.0 API.
- **🧠 Career Aptitude Tests**: Assess your foundational knowledge with dynamically generated quizzes that adapt to your chosen career path.
- **📱 Social Feed**: Share your learning progress, like, comment, and repost updates within a community of like-minded learners.
- **💬 Real-Time Chat**: Engage in instantaneous discussions with peers focused on similar learning goals.
- **📊 Progress Tracking**: Visualized progress bars and state-based milestones (from Novice to Elite Master).
- **🎨 Premium UI**: A stunning Glassmorphism-based interface with dark mode, starry backgrounds, and high-performance animations.

---

## 🛠️ Technology Stack

### Frontend
- **HTML5 & CSS3**: Custom-built design system with modern effects.
- **JavaScript (ES6+)**: Core logic and dynamic DOM manipulation.
- **Socket.io-client**: Real-time event handling.
- **FontAwesome & Google Fonts**: Premium iconography and "Outfit" typography.

### Backend
- **Python (Flask)**: Lightweight and scalable web server.
- **Flask-SocketIO**: Bidirectional communication for chat and social updates.
- **Gevent**: High-concurrency production WSGI server.
- **Flask-PyMongo**: Seamless MongoDB integration.

### AI & Machine Learning
- **OpenRouter API**: Powered by `google/gemini-2.0-flash-exp:free` for intelligent roadmap and quiz generation.
- **Scikit-Learn**: TF-IDF vectorization and cosine similarity for topic classification.
- **NumPy**: Data processing and numerical calculations.

### Database
- **MongoDB**: Flexible NoSQL storage for users, posts, and learning data.

---

## 🚀 Getting Started

Follow these steps to set up UNIverse on your local machine.

### 1. Prerequisites
- **Python 3.10+**
- **MongoDB** (running locally or a cloud instance)
- **Node.js** (optional, for development tools)

### 2. Installation
Clone the repository and install dependencies:

```bash
# Clone the repository
git clone https://github.com/yourusername/mec-labs.git
cd mec-labs

# Install required Python packages
pip install -r requirements.txt
```

### 3. Environment Configuration
Create a `.env` file in the root directory and add your credentials:

```env
SECRET_KEY=your_secret_key_here
MONGO_URI=mongodb://localhost:27017/universe_db
JWT_SECRET_KEY=your_jwt_secret_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### 4. Running the Application
You can start the server using the provided batch file or via Python:

**Using the batch file:**
Double-click `start_server.bat` in the root folder.

**Using Terminal:**
```bash
python run.py
```

### 5. Access the Project
Once the server is running, open your browser and go to:

👉 **[http://localhost:5001](http://localhost:5001)**

---

## 📂 Project Structure
- `app/`: Core application logic.
  - `auth/`: Authentication routes and logic.
  - `roadmap/`: AI roadmap generation and ML engine.
  - `social/`: Social feed and real-time chat.
  - `opportunities/`: Career opportunities and certifications.
  - `static/`: Frontend assets (CSS, JS, Images).
  - `templates/`: HTML files.
- `run.py`: Entry point for the application.
- `config.py`: Environment and app configuration.

---

## 🏆 MEC LABS | TEAM OBLIVION
Developed as a submission for MEC Labs.
