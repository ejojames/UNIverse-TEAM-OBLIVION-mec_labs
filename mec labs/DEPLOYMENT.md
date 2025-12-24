# Deployment Guide - Render Platform

This guide will help you deploy your Flask application to Render and get a live website URL.

## Prerequisites

1. **GitHub Account** - Your code needs to be in a GitHub repository
2. **Render Account** - Sign up at [render.com](https://render.com) (free)
3. **MongoDB Atlas Account** - Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) (free tier available)
4. **OpenRouter API Key** - Get from [openrouter.ai](https://openrouter.ai)

## Step 1: Set Up MongoDB Atlas (Free Tier)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account and log in
3. Click **"Build a Database"**
4. Select **"M0 Free"** tier
5. Choose a cloud provider and region (closest to you)
6. Click **"Create Cluster"**
7. Set up database access:
   - Click **"Database Access"** in left sidebar
   - Click **"Add New Database User"**
   - Create username and password (save these!)
   - Set privileges to **"Read and write to any database"**
8. Set up network access:
   - Click **"Network Access"** in left sidebar
   - Click **"Add IP Address"**
   - Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - Click **"Confirm"**
9. Get connection string:
   - Click **"Database"** in left sidebar
   - Click **"Connect"** on your cluster
   - Choose **"Connect your application"**
   - Copy the connection string (looks like: `mongodb+srv://username:<password>@cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority`)
   - Replace `<password>` with your actual password
   - Add database name: `mongodb+srv://username:password@cluster.xxxxx.mongodb.net/universe_db?retryWrites=true&w=majority`

## Step 2: Push Code to GitHub

1. Initialize git repository (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit - ready for deployment"
   ```

2. Create a new repository on GitHub:
   - Go to [github.com/new](https://github.com/new)
   - Name it (e.g., "mec-labs-app")
   - Don't initialize with README (you already have code)
   - Click **"Create repository"**

3. Push your code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

## Step 3: Deploy to Render

1. Go to [render.com](https://render.com) and sign up/log in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account and select your repository
4. Configure the service:
   - **Name**: `mec-labs-app` (or your preferred name)
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Runtime**: `Docker`
   - **Instance Type**: `Free`

5. Add Environment Variables (click **"Advanced"** → **"Add Environment Variable"**):
   ```
   SECRET_KEY = your-secret-key-here-make-it-random
   JWT_SECRET_KEY = your-jwt-secret-key-here-make-it-random
   MONGO_URI = mongodb+srv://username:password@cluster.xxxxx.mongodb.net/universe_db?retryWrites=true&w=majority
   OPENROUTER_API_KEY = your-openrouter-api-key
   FLASK_ENV = production
   ```

   > **Generate random keys**: You can use Python to generate secure keys:
   > ```python
   > import secrets
   > print(secrets.token_hex(32))
   > ```

6. Click **"Create Web Service"**

7. Wait for deployment (5-10 minutes):
   - Render will build your Docker image
   - You'll see logs in real-time
   - When complete, you'll see **"Your service is live 🎉"**

8. **Your website URL** will be: `https://mec-labs-app.onrender.com` (or whatever name you chose)

## Step 4: Initialize NLTK Data (One-time setup)

After first deployment, you need to download NLTK data:

1. In Render dashboard, go to your service
2. Click **"Shell"** tab
3. Run these commands:
   ```bash
   python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"
   ```

## Step 5: Test Your Deployment

Visit your live URL and test:
- ✅ Homepage loads
- ✅ User registration works
- ✅ User login works
- ✅ Roadmap generation works
- ✅ Chat/WebSocket functionality works

## Troubleshooting

### Application Not Starting
- Check logs in Render dashboard
- Verify all environment variables are set correctly
- Ensure MongoDB connection string is correct

### Database Connection Errors
- Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0
- Check username/password in connection string
- Ensure `dnspython` is in requirements.txt

### WebSocket Not Working
- Render free tier supports WebSockets
- Check browser console for connection errors
- Verify CORS settings in app

### Application Sleeps After Inactivity
- Render free tier spins down after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds
- Upgrade to paid tier ($7/month) for always-on service

## Important Notes

⚠️ **Free Tier Limitations**:
- App spins down after 15 minutes of inactivity
- 750 hours/month of runtime (enough for one service)
- Limited to 512MB RAM

⚠️ **Security**:
- Never commit `.env` file to GitHub
- Use strong, random values for SECRET_KEY and JWT_SECRET_KEY
- Keep your OpenRouter API key secure

## Next Steps

Once deployed, you can:
- Set up a custom domain (Render supports this)
- Monitor application performance in Render dashboard
- View logs for debugging
- Set up automatic deployments (already enabled by default)

---

**Need help?** Check Render documentation: https://render.com/docs
