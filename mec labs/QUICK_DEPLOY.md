# Quick Deploy Script for Render

## Prerequisites Checklist
- [ ] MongoDB Atlas cluster created and connection string ready
- [ ] OpenRouter API key obtained
- [ ] GitHub repository created
- [ ] Render account created

## Environment Variables to Set in Render

Copy these and fill in your actual values:

```
SECRET_KEY=<generate-with-python-secrets-token-hex-32>
JWT_SECRET_KEY=<generate-with-python-secrets-token-hex-32>
MONGO_URI=mongodb+srv://username:password@cluster.xxxxx.mongodb.net/universe_db?retryWrites=true&w=majority
OPENROUTER_API_KEY=<your-openrouter-api-key>
FLASK_ENV=production
```

## Generate Secret Keys

Run this in Python:
```python
import secrets
print("SECRET_KEY:", secrets.token_hex(32))
print("JWT_SECRET_KEY:", secrets.token_hex(32))
```

## Git Commands

```bash
# Initialize and commit
git init
git add .
git commit -m "Ready for deployment"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## Render Configuration

- **Runtime**: Docker
- **Build Command**: (automatic from Dockerfile)
- **Start Command**: (automatic from Dockerfile)
- **Instance Type**: Free

## Post-Deployment

After deployment, run in Render Shell:
```bash
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"
```

## Your Live URL

After deployment completes, your app will be available at:
```
https://YOUR-SERVICE-NAME.onrender.com
```

Replace `YOUR-SERVICE-NAME` with the name you chose in Render.
