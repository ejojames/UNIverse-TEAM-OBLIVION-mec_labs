const API_URL = '/api';
const viewCache = {};
let isFetching = { feed: false, opportunities: false, roadmap: false };

const themeToggleBtn = document.getElementById('theme-toggle-btn');
const storedTheme = localStorage.getItem('theme');

if (storedTheme === 'dark') {
    document.body.setAttribute('data-theme', 'dark');
    if (themeToggleBtn) themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
    initStarryBackground();
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
        btn.innerHTML = newTheme === 'dark'
            ? '<i class="fas fa-sun"></i>'
            : '<i class="fas fa-moon"></i>';
    }

    if (newTheme === 'dark') initStarryBackground();
    else removeStarryBackground();
}

function initStarryBackground() {
    const landing = document.querySelector('.landing-page');
    if (!landing) return;

    if (landing.querySelector('.stars')) return;

    const starsContainer = document.createElement('div');
    starsContainer.className = 'stars';

    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.setProperty('--duration', `${2 + Math.random() * 3}s`);
        star.style.setProperty('--opacity', `${0.4 + Math.random() * 0.6}`);
        star.style.animationDelay = `${Math.random() * 3}s`;

        starsContainer.appendChild(star);
    }

    const shootingStar = document.createElement('div');
    shootingStar.className = 'shooting-star';
    shootingStar.style.top = `${Math.random() * 50}%`;
    shootingStar.style.left = `${Math.random() * 100}%`;
    starsContainer.appendChild(shootingStar);

    landing.appendChild(starsContainer);
}

function removeStarryBackground() {
    const stars = document.querySelector('.stars');
    if (stars) stars.remove();
}

let currentRoadmapMode = 'guided';
let activeRoadmapData = null;
let savedRoadmaps = [];
let completedMilestones = JSON.parse(localStorage.getItem('completedMilestones') || '{}');
let lastFetchTime = { roadmaps: 0, progress: 0 };
const CACHE_TTL = 60000;

function toggleAuth(mode) {
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.querySelectorAll('.auth-toggle button').forEach(b => b.classList.remove('active'));

    document.getElementById(`${mode}-form`).classList.add('active');
    document.getElementById(`btn-${mode}`).classList.add('active');
}

async function handleLogin(e) {
    e.preventDefault();
    clearUserCache();
    const email = document.getElementById('login-email').value;
    const passwordInput = document.getElementById('login-password');

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: passwordInput.value })
        });

        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', data.name);
            window.location.href = '/dashboard';
        } else {
            alert(data.message);
        }
    } catch (err) {
        console.error(err);
        alert('Login failed');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const goal = document.getElementById('reg-goal').value;

    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, career_goal: goal })
        });

        const data = await res.json();
        if (res.ok) {
            alert('Registration successful! Please login.');
            toggleAuth('login');
        } else {
            alert(data.message);
        }
    } catch (err) {
        console.error(err);
        alert('Registration failed');
    }
}

const token = localStorage.getItem('token');
const user = localStorage.getItem('user');

let chatPollInterval = null;

function startChatPolling() {
    if (chatPollInterval) clearInterval(chatPollInterval);
    loadChat(true);
    chatPollInterval = setInterval(() => loadChat(true), 5000);
}

function stopChatPolling() {
    if (chatPollInterval) clearInterval(chatPollInterval);
    chatPollInterval = null;
}

async function switchView(view) {
    document.querySelectorAll('.nav-links button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.sidebar-links a').forEach(a => a.classList.remove('active'));
    const navBtn = document.getElementById(`nav-${view}`);
    if (navBtn) {
        navBtn.classList.add('active');
        navBtn.classList.add('is-loading');
        setTimeout(() => navBtn.classList.remove('is-loading'), 600);
    }

    const content = document.getElementById('dynamic-content');

    if (view !== 'chat') stopChatPolling();

    if (viewCache[view] && view !== 'chat') {
        content.innerHTML = viewCache[view];
        if (view === 'feed') loadFeed(false);
        if (view === 'opportunities') loadOpportunities(false);
        if (view === 'roadmaps') loadRoadmap(false);
    } else {
        content.innerHTML = getSkeletonUI(view);
        if (view === 'feed') await loadFeed(true);
        if (view === 'opportunities') await loadOpportunities(true);
        if (view === 'roadmaps') await loadRoadmap(true);
        if (view === 'chat') {
            content.innerHTML = '<div class="glass-card" style="text-align:center; padding:20px;">Connecting to Community...</div>';
            startChatPolling();
        }
    }
}

function getSkeletonUI(view) {
    let html = '<div class="feed-container">';
    if (view === 'feed') {
        for (let i = 0; i < 3; i++) {
            html += `
                <div class="glass-card skeleton-card">
                    <div class="skeleton skeleton-title" style="width: 40%;"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text" style="width: 80%;"></div>
                </div>
            `;
        }
    } else if (view === 'opportunities') {
        html = '<div class="opportunities-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap:20px;">';
        for (let i = 0; i < 6; i++) {
            html += `
                <div class="glass-card skeleton-card" style="height: 250px;">
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text" style="height: 60px;"></div>
                </div>
            `;
        }
    } else if (view === 'roadmap' || view === 'roadmaps') {
        html = `
            <div class="skeleton skeleton-title" style="height: 40px; width: 300px;"></div>
            <div class="skeleton skeleton-card" style="height: 100px;"></div>
            <div class="roadmap-container">
                <div class="skeleton skeleton-card" style="height: 200px; margin-left: 70px;"></div>
                <div class="skeleton skeleton-card" style="height: 200px; margin-left: 70px;"></div>
            </div>
        `;
    }
    html += '</div>';
    return html;
}

async function loadChat(fromPoll = false) {
    // Only update if chat is active
    if (!document.getElementById('nav-chat').classList.contains('active')) return;

    try {
        const res = await fetch(`${API_URL}/social/chat`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401) {
            alert("Session expired. Please login again.");
            handleLogout();
            return;
        }

        if (!res.ok) throw new Error(`Server Error: ${res.statusText}`);

        // SECONDARY GUARD: Check if still on chat view after fetch completes
        if (!document.getElementById('nav-chat').classList.contains('active')) return;

        const data = await res.json();
        const room = data.room;
        const messages = data.messages;

        let html = `
            <div class="glass-card" style="height: calc(100vh - 140px); display:flex; flex-direction:column; padding:0; overflow:hidden;">
                <div style="padding:15px; border-bottom:1px solid var(--input-border); background:rgba(0,0,0,0.2);">
                    <h3 style="margin:0; color:var(--primary-color); font-size:1.2rem;"><i class="fas fa-users"></i> ${room} Community</h3>
                    <span style="font-size:0.8rem; color:var(--text-muted);">Connected • ${messages.length} messages</span>
                </div>
                
                <div id="community-messages" style="flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; gap:10px;">
                    ${messages.length === 0 ? '<div style="text-align:center; color:#ccc; margin-top:20px;">No messages yet. Be the first to say hello!</div>' : ''}
                    ${messages.map(msg => `
                        <div style="align-self: ${msg.is_me ? 'flex-end' : 'flex-start'}; max-width:75%; margin-bottom:5px; animation: fadeIn 0.3s ease;">
                             <div style="font-size:0.75rem; margin-bottom:4px; color:var(--text-muted); text-align:${msg.is_me ? 'right' : 'left'};">
                                ${msg.is_me ? 'You' : msg.author}
                             </div>
                             <div style="
                                padding:10px 15px; 
                                border-radius:12px; 
                                background: ${msg.is_me ? 'var(--primary-color)' : 'var(--input-bg)'}; 
                                color: ${msg.is_me ? 'white' : 'var(--text-color)'};
                                border-bottom-${msg.is_me ? 'right' : 'left'}-radius: 2px;
                                border: 1px solid ${msg.is_me ? 'transparent' : 'var(--input-border)'};
                                box-shadow: 0 2px 5px rgba(0,0,0,0.05);
                             ">
                                ${msg.content}
                             </div>
                        </div>
                    `).join('')}
                </div>

                <div style="padding:15px; background:rgba(0,0,0,0.1); border-top:1px solid var(--input-border); display:flex; gap:10px;">
                    <input type="text" id="community-input" placeholder="Message your fellow ${room}s..." 
                        style="flex:1; padding:12px 15px; border-radius:25px; border:1px solid var(--input-border); background:var(--bg-color); color:var(--text-color); outline:none;"
                        autocomplete="off"
                        onkeypress="if(event.key === 'Enter') sendCommunityMessage()">
                    <button onclick="sendCommunityMessage()" class="btn-primary" style="border-radius:50%; width:45px; height:45px; padding:0; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;

        const content = document.getElementById('dynamic-content');
        const msgContainer = document.getElementById('community-messages');

        // Logic to update DOM
        if (fromPoll && msgContainer) {
            // If messages changed significantly, one could compare. 
            // For now, simpler approach: Update innerHTML only if length changed or last message different?
            // Since we polling, we don't want to kill input focus.
            // We'll rebuild just the message list part.

            // Extract message list HTML construction to match
            const msgsHtml = messages.length === 0 ? '<div style="text-align:center; color:#ccc; margin-top:20px;">No messages yet. Be the first to say hello!</div>' :
                messages.map(msg => `
                <div style="align-self: ${msg.is_me ? 'flex-end' : 'flex-start'}; max-width:75%; margin-bottom:5px; animation: fadeIn 0.3s ease;">
                     <div style="font-size:0.75rem; margin-bottom:4px; color:var(--text-muted); text-align:${msg.is_me ? 'right' : 'left'};">
                        ${msg.is_me ? 'You' : msg.author}
                     </div>
                     <div style="
                        padding:10px 15px; 
                        border-radius:12px; 
                        background: ${msg.is_me ? 'var(--primary-color)' : 'var(--input-bg)'}; 
                        color: ${msg.is_me ? 'white' : 'var(--text-color)'};
                        border-bottom-${msg.is_me ? 'right' : 'left'}-radius: 2px;
                        border: 1px solid ${msg.is_me ? 'transparent' : 'var(--input-border)'};
                        box-shadow: 0 2px 5px rgba(0,0,0,0.05);
                     ">
                        ${msg.content}
                     </div>
                </div>
            `).join('');

            // Only update if content length is different (simple heuristic to avoid input lag on identical pol)
            // Ideally use message IDs.
            if (msgContainer.innerHTML.length !== msgsHtml.length) {
                const wasAtBottom = msgContainer.scrollHeight - msgContainer.scrollTop === msgContainer.clientHeight;

                msgContainer.innerHTML = msgsHtml;

                if (wasAtBottom) msgContainer.scrollTop = msgContainer.scrollHeight;
            }
        } else {
            // First load or hard refresh
            content.innerHTML = html;
            const newMsgContainer = document.getElementById('community-messages');
            if (newMsgContainer) newMsgContainer.scrollTop = newMsgContainer.scrollHeight;
        }

    } catch (err) {
        console.error(err);
        // Only show error on DOM if it's the initial load (prevent polling errors from wiping the screen)
        if (!fromPoll || document.getElementById('dynamic-content').innerText.includes('Connecting')) {
            document.getElementById('dynamic-content').innerHTML = `
                <div class="glass-card" style="text-align:center; padding:30px; border-color:var(--secondary-color);">
                    <i class="fas fa-exclamation-circle" style="font-size:3rem; color:var(--secondary-color); margin-bottom:15px;"></i>
                    <h3>Connection Failed</h3>
                    <p style="color:#cecece;">Could not load the chat room.</p>
                    <p style="font-size:0.8rem; color:#aaa; margin-bottom:20px;">${err.message}</p>
                    <button onclick="loadChat()" class="btn-primary">Retry</button>
                </div>
            `;
            stopChatPolling();
        }
    }
}

async function sendCommunityMessage() {
    const input = document.getElementById('community-input');
    const content = input.value.trim();
    if (!content) return;

    // Optimistic UI update (optional, but good)
    input.value = ''; // Clear immediately

    try {
        await fetch(`${API_URL}/social/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content })
        });
        loadChat(true); // Refresh immediate
    } catch (err) {
        console.error(err);
        alert('Failed to send');
    }
}

// State for Opportunities
let currentOppCategory = 'certification'; // 'certification' or 'hackathon'
let currentOppMode = 'all'; // 'all', 'online', 'offline'

function clearUserCache() {
    localStorage.removeItem('activeRoadmapData');
    localStorage.removeItem('completedMilestones');
    localStorage.removeItem('savedFullRoadmaps');
    localStorage.removeItem('viewCache');
}

function handleLogout() {
    clearUserCache();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
}

function checkLogin() {
    if (window.location.pathname === '/dashboard') {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        if (!token) {
            window.location.href = '/';
        } else {
            const nameDisplay = document.getElementById('user-name-display');
            if (nameDisplay) nameDisplay.innerText = user || 'Guest';
            switchView('feed');
        }
    }
}

checkLogin();

// Data Loading
async function loadFeed(updateDOM = true) {
    if (isFetching.feed) return;
    isFetching.feed = true;

    const content = document.getElementById('dynamic-content');

    // 1. Show cached view immediately
    if (updateDOM && viewCache.feed && document.getElementById('nav-feed').classList.contains('active')) {
        content.innerHTML = viewCache.feed;
    }

    try {
        const res = await fetch(`${API_URL}/social/feed`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Feed fetch failed");
        const data = await res.json();

        let html = `
            <div class="glass-card" style="padding:15px; margin-bottom:20px;">
                <input type="text" id="new-post-content" placeholder="What's on your mind?" style="width:100%; padding:15px; background:rgba(0,0,0,0.2); border:1px solid #ffffff20; color:white; margin-bottom:10px; border-radius:8px; font-size:1rem;">
                <div style="text-align:right;">
                    <button class="btn-primary" onclick="createPost()">Post</button>
                </div>
            </div>
            <div class="feed-container">
        `;

        if (data.feed.length === 0) {
            html += '<div style="text-align:center; padding:20px; color:#ccc;">Be the first to post!</div>';
        }

        // --- Active Roadmap Overview Block ---
        if (activeRoadmapData) {
            const progress = calculateProgressState(activeRoadmapData.career_goal);
            html = `
                <div class="glass-card" style="padding:20px; margin-bottom:20px; display:flex; gap:20px; align-items:center; border-left:4px solid var(--primary-color);">
                    <div style="font-size:2.5rem; color:var(--primary-color);">
                        <i class="fas fa-route"></i>
                    </div>
                    <div style="flex:1;">
                        <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:5px;">Continue Your Journey</div>
                        <h3 style="margin:0; font-size:1.2rem;">${activeRoadmapData.career_goal}</h3>
                        <div style="display:flex; align-items:center; gap:10px; margin-top:10px;">
                            <div style="flex:1; height:6px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden;">
                                <div style="width:${progress.percent}%; height:100%; background:var(--primary-color);"></div>
                            </div>
                            <span style="font-size:0.8rem; color:var(--text-muted);">${Math.round(progress.percent)}%</span>
                        </div>
                    </div>
                    <button class="btn-primary" onclick="switchView('roadmap')" style="padding:10px 20px;">Resume</button>
                </div>
            ` + html;
        }

        data.feed.forEach(post => {
            html += renderSocialPost(post);
        });

        html += '</div>';

        if (viewCache.feed === html) return;

        viewCache.feed = html;
        if (updateDOM && document.getElementById('nav-feed').classList.contains('active')) {
            content.innerHTML = html;
        }

    } catch (err) { console.error(err); } finally {
        isFetching.feed = false;
    }
}

function renderSocialPost(post) {
    return `
        <div class="social-post-card" id="post-${post.id}">
            <div class="post-meta">
                <span class="post-author">${post.author}</span>
                <span>•</span>
                <span>${new Date(post.created_at).toLocaleDateString()}</span>
                ${post.is_repost ? `<span style="color:#00d2ff; margin-left:5px;"><i class="fas fa-retweet"></i> Reposted</span>` : ''}
            </div>
            
            ${post.is_repost ? `
                <div class="repost-frame">
                    <div style="font-size:0.8rem; color:#aaa; margin-bottom:5px;">Original by ${post.original_author}</div>
                    <div class="post-content">${post.content}</div>
                </div>
            ` : `<div class="post-content">${post.content}</div>`}
            
            <div class="post-actions-bar">
                <button class="action-btn ${post.has_liked ? 'liked' : ''}" onclick="toggleLike('${post.id}')">
                    <i class="${post.has_liked ? 'fas' : 'far'} fa-heart"></i> ${post.likes_count}
                </button>
                <button class="action-btn" onclick="toggleComments('${post.id}')">
                    <i class="far fa-comment"></i> ${post.comments.length}
                </button>
                <button class="action-btn" onclick="repost('${post.id}')">
                    <i class="fas fa-retweet"></i> ${post.reposts_count}
                </button>
            </div>

            <!-- Comments Section (Hidden by default) -->
            <div id="comments-${post.id}" style="display:none; margin-top:15px; border-top:1px solid rgba(255,255,255,0.1); padding-top:10px;">
                ${post.comments.map(c => `
                    <div style="margin-bottom:8px; font-size:0.9rem;">
                        <span style="color:var(--primary-color); font-weight:bold;">${c.author_name}</span>: ${c.text}
                    </div>
                `).join('')}
                <div style="display:flex; margin-top:10px; gap:10px;">
                    <input type="text" id="comment-input-${post.id}" placeholder="Write a comment..." style="flex:1; padding:8px; border-radius:4px; border:1px solid #ffffff20; background:rgba(0,0,0,0.3); color:white;">
                    <button class="btn-primary" style="padding:5px 15px; font-size:0.8rem;" onclick="addComment('${post.id}')">Reply</button>
                </div>
            </div>
        </div>
    `;
}

function renderOpportunities(opportunities) {
    let html = `
        <div class="opp-tabs">
            <button class="tab-btn ${currentOppCategory === 'certification' ? 'active' : ''}" onclick="switchOppTab('certification')">
                <i class="fas fa-certificate"></i> Certifications
            </button>
            <button class="tab-btn ${currentOppCategory === 'hackathon' ? 'active' : ''}" onclick="switchOppTab('hackathon')">
                <i class="fas fa-code"></i> Hackathons
            </button>
        </div>
    `;

    if (currentOppCategory === 'hackathon') {
        html += `
            <div class="filters-bar">
                <div class="filter-chip ${currentOppMode === 'all' ? 'active' : ''}" onclick="applyOppFilter('all')">All</div>
                <div class="filter-chip ${currentOppMode === 'online' ? 'active' : ''}" onclick="applyOppFilter('online')">Online</div>
                <div class="filter-chip ${currentOppMode === 'offline' ? 'active' : ''}" onclick="applyOppFilter('offline')">Offline</div>
                <div class="filter-chip ${currentOppMode === 'near_me' ? 'active' : ''}" onclick="applyOppFilter('near_me')"><i class="fas fa-map-marker-alt"></i> Near Me</div>
            </div>
        `;
    }

    html += '<div class="opportunities-grid">';
    if (opportunities.length === 0) {
        html += '<div style="text-align:center; grid-column:1/-1; padding:20px; color:#ccc;">No opportunities found in this category.</div>';
    } else {
        opportunities.forEach(op => {
            html += renderOpportunityCard(op);
        });
    }
    html += '</div>';
    return html;
}

async function loadOpportunities(updateDOM = true) {
    if (isFetching.opportunities) return;
    isFetching.opportunities = true;

    const token = localStorage.getItem('token');
    const content = document.getElementById('dynamic-content');

    if (updateDOM && viewCache.opportunities && document.getElementById('nav-opportunities').classList.contains('active')) {
        content.innerHTML = viewCache.opportunities;
    } else if (updateDOM && document.getElementById('nav-opportunities').classList.contains('active')) {
        content.innerHTML = `<div class="glass-card" style="text-align:center; padding:20px;">Fetching Opportunities...</div>`;
    }

    try {
        const res = await fetch(`${API_URL}/opportunities/?category=${currentOppCategory}&mode=${currentOppMode}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Failed to load opportunities");

        const data = await res.json();
        const html = renderOpportunities(data.opportunities);
        viewCache.opportunities = html;

        if (updateDOM && document.getElementById('nav-opportunities').classList.contains('active')) {
            content.innerHTML = html;
        }
    } catch (err) {
        console.error(err);
        if (updateDOM && document.getElementById('nav-opportunities').classList.contains('active')) {
            content.innerHTML = `<div class="glass-card" style="color:red; padding:20px;">Error loading opportunities.</div>`;
        }
    } finally {
        isFetching.opportunities = false;
    }
}

async function toggleLike(postId) {
    try {
        const res = await fetch(`${API_URL}/social/posts/${postId}/like`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            loadFeed(true); // Reload to update UI state
        }
    } catch (err) { console.error(err); }
}

async function repost(postId) {
    if (!confirm("Repost this to your feed?")) return;
    try {
        const res = await fetch(`${API_URL}/social/posts/${postId}/repost`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            loadFeed(true);
        }
    } catch (err) { console.error(err); }
}

function toggleComments(postId) {
    const el = document.getElementById(`comments-${postId}`);
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

async function addComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const text = input.value.trim();
    if (!text) return;

    try {
        await fetch(`${API_URL}/social/posts/${postId}/comment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ text })
        });
        input.value = '';
        loadFeed(true);
    } catch (err) { console.error(err); }
}

async function createPost() {
    const content = document.getElementById('new-post-content').value;
    if (!content) return;

    await fetch(`${API_URL}/social/posts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content })
    });
    loadFeed();
}

// Redundant code removed

function renderOpportunityCard(op) {
    const isHackathon = op.category === 'hackathon';
    return `
        <div class="opp-card">
            <span style="background:${isHackathon ? '#9d50bb' : '#00d2ff'}; padding:4px 8px; border-radius:4px; font-size:0.8rem; position:absolute; top:15px; right:15px;">
                ${op.category ? op.category.toUpperCase() : op.type.toUpperCase()}
            </span>
            <h3 style="margin-bottom:10px; padding-right:80px;">${op.title}</h3>
            ${isHackathon ?
            `<p style="color:#aaa; font-size:0.9rem; margin-bottom:10px;"><i class="fas fa-map-marker-alt"></i> ${op.location} | <i class="far fa-calendar"></i> ${op.date || 'TBA'}</p>`
            :
            `<p style="color:#aaa; font-size:0.9rem; margin-bottom:10px;"><i class="fas fa-building"></i> ${op.provider}</p>`
        }
            
            <p style="margin-bottom:15px; font-size:0.9rem; line-height:1.4;">${op.description}</p>
            
            <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:15px;">
                ${op.tags.map(t => `<span style="background:rgba(255,255,255,0.1); padding:2px 8px; border-radius:10px; font-size:0.8rem;">#${t}</span>`).join('')}
            </div>
            <a href="${op.link}" target="_blank" class="btn-primary" style="text-decoration:none; font-size:0.9rem; display:inline-block;">
                ${isHackathon ? 'Register Now' : 'Start Learning'}
            </a>
        </div>
    `;
}

function switchOppTab(category) {
    currentOppCategory = category;
    currentOppMode = 'all'; // Reset filter on tab switch
    loadOpportunities(true);
}

function applyOppFilter(mode) {
    if (mode === 'near_me') {
        const btn = document.querySelector('.filter-chip:last-child');
        if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Locating...';

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    // Success: In a real app, send position.coords.latitude/longitude to backend
                    // Here we simulate by showing 'offline' (physical) events sorted by "distance"
                    currentOppMode = 'near_me';
                    loadOpportunities(true);
                },
                (error) => {
                    console.warn("Location failed:", error);
                    // Fallback gracefully
                    currentOppMode = 'near_me';
                    loadOpportunities(true);
                },
                { timeout: 5000, maximumAge: 60000 }
            );
        } else {
            alert("Geolocation is not supported by this browser.");
            currentOppMode = 'near_me';
            loadOpportunities(true);
        }
        return; // Wait for callback
    } else {
        currentOppMode = mode;
    }
    loadOpportunities(true);
}

// 1. Fetch Progress on Load
async function fetchProgress() {
    try {
        const res = await fetch(`${API_URL}/roadmap/generate`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify({})
        });
        const data = await res.json();
        if (data.roadmap) {
            activeRoadmapData = data.roadmap;
            localStorage.setItem('activeRoadmapData', JSON.stringify(activeRoadmapData));
        }
    } catch (err) { console.error(err); }
}

async function loadRoadmap(updateDOM = true, customInterest = null) {
    if (isFetching.roadmap && !customInterest) return;

    const content = document.getElementById('dynamic-content');
    const token = localStorage.getItem('token');

    // 1. Instant Cache Render
    if (updateDOM && !customInterest) {
        const cachedRoadmapData = localStorage.getItem('activeRoadmapData');
        if (cachedRoadmapData) {
            try {
                activeRoadmapData = JSON.parse(cachedRoadmapData);
                content.innerHTML = getRoadmapHTML(activeRoadmapData);
                requestAnimationFrame(() => lazyRevealMilestones());
            } catch (e) { }
        } else {
            content.innerHTML = getInitialRoadmapScreen();
        }
    }

    isFetching.roadmap = true;
    try {
        const now = Date.now();
        const needsListSync = now - lastFetchTime.roadmaps > CACHE_TTL || customInterest;
        const needsProgressSync = now - lastFetchTime.progress > CACHE_TTL;

        if (customInterest) {
            const res = await fetch(`${API_URL}/roadmap/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ career_goal: customInterest })
            });
            const data = await res.json();
            if (data.roadmap) {
                activeRoadmapData = data.roadmap;
                localStorage.setItem('activeRoadmapData', JSON.stringify(activeRoadmapData));
            }
        }

        if (needsListSync || needsProgressSync) {
            const fetches = [];
            if (needsListSync) fetches.push(fetch(`${API_URL}/roadmap/list`, { headers: { 'Authorization': `Bearer ${token}` } }));
            if (needsProgressSync) fetches.push(fetch(`${API_URL}/roadmap/progress`, { headers: { 'Authorization': `Bearer ${token}` } }));

            const responses = await Promise.all(fetches);
            const data = await Promise.all(responses.map(r => r.json()));

            let idx = 0;
            if (needsListSync) {
                const listData = data[idx++];
                savedRoadmaps = listData.saved_roadmaps || [];
                if (!customInterest) activeRoadmapData = listData.active_roadmap;
                lastFetchTime.roadmaps = now;
            }
            if (needsProgressSync) {
                const progressData = data[idx++];
                if (progressData.progress) {
                    completedMilestones = progressData.progress;
                    localStorage.setItem('completedMilestones', JSON.stringify(completedMilestones));
                }
                lastFetchTime.progress = now;
            }

            // Silently update if data changed
            if (updateDOM && document.getElementById('nav-roadmaps').classList.contains('active')) {
                let html = "";
                if (savedRoadmaps.length > 0 && !customInterest && !activeRoadmapData) {
                    html = getRoadmapsGalleryHTML(savedRoadmaps);
                } else if (activeRoadmapData) {
                    html = getRoadmapHTML(activeRoadmapData);
                } else if (!activeRoadmapData) {
                    html = getInitialRoadmapScreen();
                }

                if (html && content.innerHTML !== html) {
                    content.innerHTML = html;
                    if (activeRoadmapData) requestAnimationFrame(() => lazyRevealMilestones());
                    else if (html.includes('initial-roadmap-interest')) {
                        // No additional initialization needed for initial screen
                    }
                }
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        isFetching.roadmap = false;
    }
}

function getRoadmapsGalleryHTML(roadmaps) {
    return `
        <div class="header">
            <div>
                <h2 style="font-size: 2.2rem; margin-bottom: 5px; font-weight:800; letter-spacing:-1px;">Your Roadmap Gallery</h2>
                <p style="color: var(--primary-color); font-weight: bold;">Select a path to continue your journey.</p>
            </div>
            <button onclick="document.getElementById('gallery-input-section').scrollIntoView({behavior:'smooth'})" class="btn-primary">
                <i class="fas fa-plus"></i> New Roadmap
            </button>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap:25px; margin-bottom:50px;">
            ${roadmaps.map(rm => {
        const progress = calculateProgressState(rm.career_goal);
        return `
                <div class="glass-card roadmap-gallery-card" onclick="loadRoadmap(true, '${rm.career_goal}')" 
                     style="padding:25px; cursor:pointer; position:relative; overflow:hidden; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border:1px solid var(--glass-border);">
                    <div style="position:absolute; top:0; right:0; padding:10px; opacity:0.1; font-size:4rem;">
                        <i class="fas fa-route"></i>
                    </div>
                    <h3 style="margin-bottom:15px; font-size:1.4rem; color:var(--primary-color); position:relative; z-index:1;">${rm.career_goal}</h3>
                    <div style="margin-bottom:20px;">
                        <div style="display:flex; justify-content:space-between; font-size:0.9rem; margin-bottom:8px;">
                            <span style="color:var(--text-muted);">Progress</span>
                            <span style="font-weight:bold; color:var(--primary-color);">${Math.round(progress.percent)}%</span>
                        </div>
                        <div style="background:rgba(0,0,0,0.1); height:6px; border-radius:3px; overflow:hidden;">
                            <div style="width:${progress.percent}%; height:100%; background:var(--primary-color);"></div>
                        </div>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem; color:var(--text-muted);">
                        <span><i class="fas fa-tasks"></i> ${rm.milestones ? rm.milestones.length : 0} Steps</span>
                        <div class="btn-text" style="color:var(--primary-color); font-weight:bold;">Resume <i class="fas fa-arrow-right"></i></div>
                    </div>
                </div>
                `;
    }).join('')}
        </div>

        <div id="gallery-input-section" class="roadmap-input-section" style="background:var(--glass-bg); padding:40px; border-radius:24px; border:1px solid var(--glass-border); text-align:center;">
            <i class="fas fa-rocket" style="font-size:3rem; color:var(--primary-color); margin-bottom:20px; opacity:0.8;"></i>
            <h3 style="margin-bottom:15px; font-size:1.6rem;">Explore a New Horizon</h3>
            <p style="color:var(--text-muted); margin-bottom:30px; max-width:500px; margin-left:auto; margin-right:auto;">
                Enter a new career interest. If you've already generated it, we'll open it instantly.
            </p>
            <div style="display:flex; gap:10px; max-width:600px; margin:0 auto;">
                <input type="text" id="roadmap-interest" placeholder="e.g. Quantum Computing, VFX Artist..." style="flex:1; margin-bottom:0;">
                <button onclick="generateCustomRoadmap()" class="btn-primary" style="white-space:nowrap;">Generate</button>
            </div>
        </div>
    `;
}

function lazyRevealMilestones() {
    const cards = document.querySelectorAll('.milestone-card');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '50px'
    });

    cards.forEach(card => observer.observe(card));
}

function generateCustomRoadmap() {
    const interest = document.getElementById('roadmap-interest').value;
    if (!interest) {
        alert('Please enter a career goal or interest');
        return;
    }

    const existing = savedRoadmaps.find(rm => rm.career_goal.toLowerCase() === interest.toLowerCase());
    if (existing) {
        loadRoadmap(true, interest);
        return;
    }

    generateAptitudeQuiz(interest);
}

function generateInitialRoadmap() {
    const interest = document.getElementById('initial-roadmap-interest').value;
    if (!interest) {
        alert('Please enter a career goal or interest');
        return;
    }

    const existing = savedRoadmaps.find(rm => rm.career_goal.toLowerCase() === interest.toLowerCase());
    if (existing) {
        loadRoadmap(true, interest);
        return;
    }

    generateAptitudeQuiz(interest);
}

let currentQuizData = null;
let currentAptitudeTopic = null;
let userAnswers = {};

async function generateAptitudeQuiz(topic) {
    currentAptitudeTopic = topic;
    userAnswers = {};

    const content = document.getElementById('dynamic-content');
    content.innerHTML = `
        <div class="glass-card" style="text-align:center; padding:50px;">
            <div class="loader" style="margin:0 auto 20px;"></div>
            <h3>Analyzing Knowledge Base...</h3>
            <p>Generating a custom aptitude test for <strong>${topic}</strong>.</p>
        </div>
    `;

    try {
        const res = await fetch(`${API_URL}/roadmap/aptitude/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ career_goal: topic })
        });

        if (!res.ok) throw new Error("Failed to generate quiz");

        const data = await res.json();
        currentQuizData = data.quiz;
        renderAptitudeQuiz();

    } catch (err) {
        console.error(err);
        content.innerHTML = `
            <div class="glass-card" style="text-align:center; padding:40px;">
                <i class="fas fa-exclamation-triangle" style="font-size:3rem; color:var(--primary-color); margin-bottom:15px;"></i>
                <h3>Quiz Generation Issue</h3>
                <p>We're having trouble creating a custom test for this specific topic.</p>
                <div style="margin-top:20px;">
                    <button onclick="generateAptitudeQuiz('${topic}')" class="btn-primary">Try Again</button>
                    <button onclick="loadRoadmap(true, '${topic}')" class="btn-text" style="margin-left:15px;">Skip to Standard Roadmap</button>
                </div>
            </div>
        `;
    }
}

function renderAptitudeQuiz() {
    const content = document.getElementById('dynamic-content');
    if (!currentQuizData || !currentQuizData.questions) return;

    let html = `
        <div class="glass-card" style="max-width:800px; margin:0 auto; padding:30px;">
            <div style="text-align:center; margin-bottom:30px;">
                <h2 style="color:var(--primary-color); margin-bottom:10px;">Skill Assessment: ${currentAptitudeTopic}</h2>
                <p style="color:var(--text-color);">Answer these 5 questions to help us verify your level.</p>
            </div>
            
            <div id="quiz-questions">
                ${currentQuizData.questions.map((q, idx) => `
                    <div class="quiz-question" style="margin-bottom:30px;">
                        <p style="font-weight:bold; font-size:1.1rem; margin-bottom:15px; color:var(--text-color);">${idx + 1}. ${q.text}</p>
                        <div class="options-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                            ${q.options.map((opt, optIdx) => `
                                <button onclick="selectOption(${q.id}, ${optIdx})" 
                                    id="btn-${q.id}-${optIdx}"
                                    class="option-btn" 
                                >
                                    ${opt}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div style="text-align:center; margin-top:30px; display:flex; justify-content:center; gap:20px;">
                <button onclick="submitAptitudeTest()" class="btn-primary" style="padding:12px 30px; font-size:1.1rem;">Submit & Generate Roadmap</button>
                <button onclick="loadRoadmap()" class="btn-text" style="color:#aaa;">Cancel</button>
            </div>
        </div>
    `;

    content.innerHTML = html;
}

function selectOption(qId, optIdx) {
    userAnswers[qId] = optIdx;

    const quiz = (currentQuizData && currentQuizData.questions && currentQuizData.questions.some(q => q.id === qId))
        ? currentQuizData
        : activeLessonQuiz;

    if (!quiz || !quiz.questions) return;

    const options = quiz.questions.find(q => q.id === qId).options;
    options.forEach((_, idx) => {
        const btn = document.getElementById(`btn-${qId}-${idx}`);
        if (btn) btn.classList.remove('selected');
    });

    const selectedBtn = document.getElementById(`btn-${qId}-${optIdx}`);
    if (selectedBtn) selectedBtn.classList.add('selected');
}

async function submitAptitudeTest() {
    const questions = currentQuizData.questions;
    let correctCount = 0;
    let allAnswered = true;

    questions.forEach(q => {
        if (userAnswers[q.id] === undefined) allAnswered = false;
        if (userAnswers[q.id] === q.correct_index) correctCount++;
    });

    if (!allAnswered) {
        alert("Please answer all questions before submitting.");
        return;
    }

    const content = document.getElementById('dynamic-content');
    content.innerHTML = `
        <div class="glass-card" style="text-align:center; padding:40px;">
            <div class="loader" style="margin:0 auto 20px;"></div> 
            <h3>Evaluating your performance...</h3>
        </div>
    `;

    try {
        const res = await fetch(`${API_URL}/roadmap/aptitude/evaluate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ score: correctCount })
        });
        const evalData = await res.json();
        const level = evalData.level;

        content.innerHTML = `
            <div class="glass-card assessment-result" style="text-align:center; padding:40px; max-width:600px; margin:0 auto;">
                <i class="fas fa-certificate" style="font-size:4rem; color:var(--primary-color); margin-bottom:20px;"></i>
                <h2 style="margin-bottom:10px; color:var(--text-color);">Assessment Complete!</h2>
                <div style="background:rgba(0,0,0,0.05); padding:20px; border-radius:12px; margin:20px 0; border:1px solid var(--input-border);">
                    <p style="font-size:1.2rem; color:var(--text-muted);">Your Score</p>
                    <h1 class="score-display" style="font-size:3.5rem; color:var(--primary-color); margin:10px 0; font-weight:800;">${correctCount} / 5</h1>
                    <p style="font-size:1.2rem; color:var(--secondary-color);">Proficiency: <strong>${level}</strong></p>
                </div>
                <p style="margin-bottom:30px; color:var(--text-color);">Based on your score, we will build a <strong>${level}</strong> roadmap for you.</p>
                <button onclick="startRoadmapGeneration('${level}')" class="btn-primary" style="padding:15px 40px; font-size:1.1rem;">Build My Custom Roadmap</button>
            </div>
        `;

    } catch (err) {
        console.error("Evaluation failed", err);
        alert("Evaluation failed. Generating standard roadmap.");
        loadRoadmap(true, currentAptitudeTopic);
    }
}

async function startRoadmapGeneration(level) {
    const content = document.getElementById('dynamic-content');
    content.innerHTML = `
        <div class="glass-card" style="text-align:center; padding:40px;">
            <div class="loader" style="margin:0 auto 20px;"></div> 
            <h3>Building your custom ${level} roadmap...</h3>
            <p>Curating the best free resources for ${currentAptitudeTopic}</p>
        </div>
    `;

    try {
        const newBody = { career_goal: currentAptitudeTopic, level: level };
        const mapRes = await fetch(`${API_URL}/roadmap/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(newBody)
        });

        const mapData = await mapRes.json();

        if (mapData.error || (mapData.roadmap && mapData.roadmap.error)) {
            const errorMsg = mapData.error || mapData.roadmap.error;
            content.innerHTML = `
                <div class="glass-card" style="text-align:center; padding:40px;">
                    <i class="fas fa-exclamation-triangle" style="font-size:3rem; color:var(--secondary-color); margin-bottom:20px;"></i>
                    <h3>Roadmap Not Available</h3>
                    <p style="margin:10px 0; color:#ccc;">${errorMsg}</p>
                    <button onclick="loadRoadmap()" class="btn-primary" style="margin-top:20px;">Back to Gallery</button>
                </div>
            `;
            return;
        }

        activeRoadmapData = mapData.roadmap;

        const html = getRoadmapHTML(mapData.roadmap);
        viewCache.roadmap = html;
        content.innerHTML = html;
        requestAnimationFrame(() => lazyRevealMilestones());

    } catch (err) {
        console.error(err);
        loadRoadmap(true, currentAptitudeTopic);
    }
}

function switchRoadmapMode(mode) {
    if (currentRoadmapMode === mode) return;
    currentRoadmapMode = mode;

    if (activeRoadmapData && document.getElementById('nav-roadmaps').classList.contains('active')) {
        const html = getRoadmapHTML(activeRoadmapData);
        viewCache.roadmaps = html;
        document.getElementById('dynamic-content').innerHTML = html;
        requestAnimationFrame(() => lazyRevealMilestones());
    }
}

function getRoadmapHTML(roadmap) {
    if (!roadmap || roadmap.error) {
        return `
            <div class="glass-card" style="padding:40px; text-align:center;">
                <i class="fas fa-search" style="font-size:3rem; color:var(--primary-color); margin-bottom:20px;"></i>
                <h3>Topic Not Found</h3>
                <p style="margin:10px 0; color:#ccc;">${roadmap ? roadmap.error : "We couldn't find a roadmap for this specific profession yet."}</p>
                <button onclick="loadRoadmap()" class="btn-primary" style="margin-top:20px;">Browse Others</button>
            </div>
        `;
    }
    const progressInfo = calculateProgressState(roadmap.career_goal);
    const progressState = progressInfo.state;
    const isRoadmapCompleted = progressInfo.roadmapCompleted;
    const percentComplete = progressInfo.percent || 0;

    const milestoneCards = [];
    let currentDueDate = new Date();
    let isPreviousCompleted = true;

    roadmap.milestones.forEach((step, index) => {
        let dueDateHtml = '';
        if (currentRoadmapMode === 'guided') {
            const weeks = step.weeks || 1;
            currentDueDate.setDate(currentDueDate.getDate() + (weeks * 7));
            const dateStr = currentDueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            dueDateHtml = `<span class="due-badge"><i class="far fa-calendar-alt"></i> Due: ${dateStr}</span>`;
        }

        const milestoneKey = `${roadmap.career_goal}_${step.step}`;
        const isCompleted = completedMilestones[milestoneKey];

        let isLocked = false;
        if (currentRoadmapMode === 'guided') {
            if (!isPreviousCompleted) {
                isLocked = true;
            }
        }

        const resourceCards = step.resources.map(r => `
            <a href="${isLocked ? '#' : r.url}" target="_blank" class="course-card ${isLocked ? 'locked' : ''}" ${isLocked ? '' : 'onmousemove="updateMousePos(event, this)"'}>
                <span class="platform-badge">${r.platform || 'Elite'}</span>
                <span class="level-badge level-${(r.diff_level || 'Beginner').toLowerCase()}">${r.diff_level || 'Beginner'}</span>
                <h4>${r.name}</h4>
                <div class="course-info">
                   ${isLocked ? '<i class="fas fa-lock" style="margin-right:5px;"></i> Locked' :
                `<div class="rating-ring-container">${r.rating || 4.5}</div>
                    <div class="rating-stars">${renderStars(r.rating || 4.5)}</div>
                    <span class="rating-text">(${r.rating_count || '1k+'})</span>`
            }
                </div>
                ${!isLocked ? '<div class="btn-link">Start Course <i class="fas fa-chevron-right"></i></div>' : ''}
            </a>
        `).join('');

        milestoneCards.push(`
            <div class="milestone-card glass-card ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked-milestone' : ''}" data-step="${step.step}" style="transition-delay: ${index * 0.05}s; opacity: ${isLocked ? 0.7 : 1};">
                <div style="display:flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                    <div>
                        <h3 style="color:${isLocked ? '#888' : 'var(--primary-color)'}; margin-bottom: 5px;">
                            ${isLocked ? '<i class="fas fa-lock"></i> ' : ''} ${step.topic}
                        </h3>
                        ${dueDateHtml}
                    </div>
                    ${!isLocked ? `
                    <button onclick="toggleMilestone('${roadmap.career_goal}', ${step.step})" class="complete-btn ${isCompleted ? 'active' : ''}">
                        ${isCompleted ? '<i class="fas fa-check"></i> Completed' : 'Mark Complete'}
                    </button>` : ''}
                </div>
                <p style="color: #ccc; margin-bottom: 15px; line-height: 1.5;">${step.description || ''}</p>
                <div style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 12px;">
                    <p style="font-weight:bold; margin-bottom:12px; font-size: 0.95rem;">Elite Learning Resources:</p>
                    <div class="course-cards-grid">${resourceCards}</div>
                </div>
            </div>
        `);

        if (!isCompleted) isPreviousCompleted = false;
    });

    const savedRoadmapsHtml = savedRoadmaps.length > 0 ? `
        <div style="margin-bottom:40px;">
            <h3 style="margin-bottom:20px; font-size:1.4rem;"><i class="fas fa-history"></i> Previously Continued Roadmaps</h3>
            <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:20px;">
                ${savedRoadmaps.map(rm => `
                    <div class="glass-card saved-roadmap-card ${roadmap.career_goal === rm.career_goal ? 'active' : ''}" 
                         onclick="this.classList.add('is-loading'); loadRoadmap(true, '${rm.career_goal}')"
                         style="padding:20px; cursor:pointer; border:1px solid ${roadmap.career_goal === rm.career_goal ? 'var(--primary-color)' : 'var(--glass-border)'}; transition: transform 0.2s;">
                        <h4 style="margin-bottom:10px; color: ${roadmap.career_goal === rm.career_goal ? 'var(--primary-color)' : 'var(--text-color)'};">${rm.career_goal}</h4>
                        <div style="font-size:0.85rem; color:var(--text-muted); display:flex; justify-content:space-between;">
                            <span>${rm.milestones ? rm.milestones.length : 0} Milestones</span>
                            <span>${Math.round(calculateProgressState(rm.career_goal).percent)}% Done</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    ` : '';

    return `
        <div class="header">
            <div>
                <h2 style="font-size: 2.2rem; margin-bottom: 5px; font-weight:800; letter-spacing:-1px;">My Roadmaps</h2>
                <p style="color: var(--primary-color); font-weight: bold;">Experience personalized excellence.</p>
            </div>
            <div class="mode-toggle-group">
                <button onclick="switchRoadmapMode('self-pace')" class="mode-btn ${currentRoadmapMode === 'self-pace' ? 'active' : ''}">Self-Pace</button>
                <button onclick="switchRoadmapMode('guided')" class="mode-btn ${currentRoadmapMode === 'guided' ? 'active' : ''}">Guided</button>
            </div>
        </div>

        ${savedRoadmapsHtml}

        <div class="roadmap-input-section" style="margin-bottom:50px; background:var(--glass-bg); padding:30px; border-radius:20px; border:1px solid var(--glass-border);">
            <h3 style="margin-bottom:20px; font-size:1.4rem;"><i class="fas fa-plus-circle"></i> Generate New Roadmap</h3>
            <div style="display:flex; gap:10px; width:100%;">
                <input type="text" id="roadmap-interest" placeholder="What else do you want to learn? (e.g. AI, Cyber Security)" style="flex:1; margin-bottom:0;">
                <button onclick="generateCustomRoadmap()" class="btn-primary" style="white-space:nowrap;">Build New Path</button>
            </div>
            <p style="margin-top:15px; font-size:0.85rem; color:var(--text-muted);"><i class="fas fa-info-circle"></i> This will create a fresh learning path with a new assessment.</p>
        </div>

        <div class="active-roadmap-session">
            <div style="margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
                <h3 style="font-size:1.4rem;"><i class="fas fa-bullseye"></i> Active Path: ${roadmap.career_goal}</h3>
                <div style="display:flex; gap:10px;">
                    <button onclick="localStorage.removeItem('activeRoadmapData'); loadRoadmap();" class="btn-text" style="font-size:0.9rem; padding:8px 15px; background:rgba(255,255,255,0.05); border-radius:10px;"><i class="fas fa-th-large"></i> Back to Gallery</button>
                    <button onclick="resetRoadmap()" class="btn-text" style="color:var(--secondary-color); font-size:0.9rem; padding:8px 15px; background:rgba(255,0,0,0.05); border-radius:10px;"><i class="fas fa-trash"></i> Reset Path</button>
                </div>
            </div>

            <div class="roadmap-container">
                <div style="background:rgba(0,0,0,0.1); height:8px; border-radius:4px; margin-bottom:20px; overflow:hidden; border:1px solid var(--glass-border);">
                    <div style="width:${Math.round(percentComplete)}%; height:100%; background:var(--primary-color); box-shadow:0 0 10px var(--primary-color); transition:width 0.5s ease;"></div>
                </div>

                <div id="user-progress-panel" style="margin-bottom: 25px; padding: 15px; background: rgba(var(--primary-rgb), 0.05); border: 1px solid rgba(var(--primary-rgb), 0.2); border-radius: 12px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <span style="color: var(--text-muted); font-size: 0.9rem;">Your Progress State:</span>
                        <span id="progress-state-text" style="color: var(--primary-color); font-weight: 800; font-size: 1.1rem; margin-left: 10px; text-transform: uppercase;">${progressState}</span>
                        ${isRoadmapCompleted && progressState !== 'Elite Master' ? `<span style="margin-left: 15px; background: rgba(var(--success-rgb), 0.2); color: var(--success-color); padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600;"><i class="fas fa-trophy"></i> Roadmap Complete!</span>` : ''}
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-muted);">${Math.round(percentComplete)}% Complete</div>
                </div>
                ${milestoneCards.join('')}
            </div>
        </div>
        ${getChatbotHTML()}
    `;
}

function getInitialRoadmapScreen() {
    return `
        <div class="header">
            <div>
                <h2 style="font-size: 2.2rem; margin-bottom: 5px; font-weight:800; letter-spacing:-1px;">My Roadmaps</h2>
                <p style="color: var(--primary-color); font-weight: bold;">Start your journey to excellence.</p>
            </div>
        </div>
        <div class="glass-card" style="padding:50px; text-align:center; max-width: 700px; margin: 50px auto; border: 2px dashed var(--primary-color);">
            <i class="fas fa-route" style="font-size: 5rem; color: var(--primary-color); margin-bottom: 30px; opacity:0.5;"></i>
            <h2 style="margin-bottom: 15px;">Build Your First Learning Path</h2>
            <p style="margin:15px 0 40px; color:var(--text-muted); font-size: 1.15rem;">Enter a career goal or interest, and our AI will curate a personalized milestone-based roadmap with elite resources from MIT, Harvard, IBM, and NPTEL.</p>
            <div style="display: flex; gap:10px; flex-direction:column; align-items:center;">
                <input type="text" id="initial-roadmap-interest" placeholder="e.g., Drone Engineer, Full Stack Developer, AI Scientist" style="width:100%; max-width:500px; padding:18px 25px; background:var(--bg-color); border:2px solid var(--input-border); color:var(--text-color); margin-bottom:20px; border-radius:30px; font-size: 1.1rem; outline:none; text-align:center;">
                <button onclick="generateInitialRoadmap()" class="btn-primary" style="padding:15px 50px; font-size: 1.1rem; border-radius:40px;">Generate My Roadmap</button>
            </div>
        </div>
    `;
}


function updateMousePos(e, card) {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / card.clientWidth) * 100;
    const y = ((e.clientY - rect.top) / card.clientHeight) * 100;
    card.style.setProperty('--mouse-x', `${x}%`);
    card.style.setProperty('--mouse-y', `${y}%`);
}

async function toggleMilestone(goal, step, skipQuiz = false) {
    const key = `${goal}_${step}`;
    const wasCompleted = !!completedMilestones[key];

    if (currentRoadmapMode === 'guided' && !wasCompleted && !skipQuiz) {
        if (activeRoadmapData && activeRoadmapData.milestones) {
            const milestone = activeRoadmapData.milestones.find(m => m.step === step);
            if (milestone) {
                startLessonQuiz(milestone.topic, step, goal);
                return;
            }
        } else {
            console.warn("Roadmap data not ready for quiz, skipping.");
        }
    }

    if (wasCompleted) delete completedMilestones[key];
    else completedMilestones[key] = true;
    localStorage.setItem('completedMilestones', JSON.stringify(completedMilestones));

    if (activeRoadmapData && document.getElementById('nav-roadmaps').classList.contains('active')) {
        const html = getRoadmapHTML(activeRoadmapData);
        viewCache.roadmaps = html;
        document.getElementById('dynamic-content').innerHTML = html;
        document.querySelectorAll('.milestone-card').forEach(card => card.classList.add('reveal'));
    }

    try {
        await fetch(`${API_URL}/roadmap/progress/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ career_goal: goal, step: step, status: wasCompleted ? 'incomplete' : 'completed' })
        });

        if (!wasCompleted) {
            if (currentRoadmapMode === 'guided') {
                const progress = calculateProgressState(goal);
                if (progress.roadmapCompleted && progress.state !== 'Elite Master') {
                    setTimeout(() => alert("🎉 Milestone Complete! Keep going!"), 500);
                }
            }
        }

    } catch (err) {
        console.error("Sync failed", err);
        if (wasCompleted) completedMilestones[key] = true;
        else delete completedMilestones[key];

        if (activeRoadmapData) {
            const html = getRoadmapHTML(activeRoadmapData);
            document.getElementById('dynamic-content').innerHTML = html;
            document.querySelectorAll('.milestone-card').forEach(card => card.classList.add('reveal'));
        }
        alert("Sync failed. Check connection.");
    }
}

let activeLessonQuiz = null;
let currentLessonStep = null;
let currentLessonGoal = null;

async function startLessonQuiz(topic, step, goal) {
    currentLessonStep = step;
    currentLessonGoal = goal;
    const content = document.getElementById('dynamic-content');

    content.innerHTML = `
        <div class="glass-card" style="text-align:center; padding:40px;">
            <div class="loader" style="margin:0 auto 20px;"></div>
            <h3>Generating Quiz for "${topic}"...</h3>
            <p>Prove your mastery to unlock the next step!</p>
        </div>
    `;

    try {
        const res = await fetch(`${API_URL}/roadmap/quiz/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ topic: topic })
        });
        const data = await res.json();
        activeLessonQuiz = data.quiz;
        renderLessonQuiz(topic);
    } catch (err) {
        console.error(err);
        alert("Could not generate quiz. Skipping verification for now.");
        toggleMilestone(goal, step, true);
    }
}

function renderLessonQuiz(topic) {
    const content = document.getElementById('dynamic-content');
    if (!activeLessonQuiz || !activeLessonQuiz.questions) return;

    let html = `
        <div class="glass-card" style="max-width:800px; margin:0 auto; padding:30px;">
            <div style="text-align:center; margin-bottom:30px;">
                <h2 style="color:var(--primary-color); margin-bottom:10px;">Checkpoint: ${topic}</h2>
                <p>Pass this quiz to complete the milestone.</p>
            </div>
            <div id="quiz-questions">
                ${activeLessonQuiz.questions.map((q, idx) => `
                    <div class="quiz-question" style="margin-bottom:30px;">
                        <p style="font-weight:bold; font-size:1.1rem; margin-bottom:15px;">${idx + 1}. ${q.text}</p>
                        <div class="options-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                            ${q.options.map((opt, optIdx) => `
                                <button onclick="selectOption(${q.id}, ${optIdx})" 
                                    id="btn-${q.id}-${optIdx}"
                                    class="option-btn" 
                                >
                                    ${opt}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
            <div style="text-align:center; margin-top:30px;">
                <button onclick="submitLessonQuiz()" class="btn-primary" style="padding:12px 30px; font-size:1.1rem;">Submit Answers</button>
                 <button onclick="loadRoadmap()" class="btn-text" style="color:#aaa; margin-left:15px;">Cancel</button>
            </div>
        </div>
    `;
    content.innerHTML = html;
    userAnswers = {}; // Reset answers
}

function submitLessonQuiz() {
    let correctCount = 0;
    let allAnswered = true;
    activeLessonQuiz.questions.forEach(q => {
        if (userAnswers[q.id] === undefined) allAnswered = false;
        if (userAnswers[q.id] === q.correct_index) correctCount++;
    });

    if (!allAnswered) {
        alert("Please answer all questions.");
        return;
    }

    const total = activeLessonQuiz.questions.length;
    const passed = correctCount >= Math.ceil(total * 0.6); // 60% pass rate

    const content = document.getElementById('dynamic-content');
    if (passed) {
        content.innerHTML = `
             <div class="glass-card" style="text-align:center; padding:50px;">
                <i class="fas fa-check-circle" style="font-size:4rem; color:var(--success-color); margin-bottom:20px;"></i>
                <h2 style="color:var(--success-color);">Quiz Passed!</h2>
                <p style="font-size:1.2rem; margin-bottom:30px;">You scored ${correctCount}/${total}. Milestone unlocked!</p>
                <div style="display:flex; justify-content:center; gap:15px;">
                    <button onclick="completeLessonQuiz(true)" class="btn-primary">Unlock Next & Continue</button>
                    ${!passed ? '' : '<button onclick="shareSuccess()" class="btn-secondary" style="border:1px solid var(--primary-color);">Share Success</button>'} 
                </div> 
            </div>
        `;
    } else {
        content.innerHTML = `
             <div class="glass-card" style="text-align:center; padding:50px;">
                <i class="fas fa-times-circle" style="font-size:4rem; color:#ff4444; margin-bottom:20px;"></i>
                <h2 style="color:#ff4444;">Review Needed</h2>
                <p style="font-size:1.2rem; margin-bottom:30px;">You scored ${correctCount}/${total}. Review the materials and try again.</p>
                <button onclick="loadRoadmap()" class="btn-primary">Back to Study</button>
            </div>
        `;
    }
}

function completeLessonQuiz(success) {
    if (success) {
        toggleMilestone(currentLessonGoal, currentLessonStep, true);
    }
}

function shareSuccess() {
    loadRoadmap(true, currentLessonGoal);
    alert("Social Sharing coming soon!");
}

function calculateProgressState(roadmapGoal = null) {
    const completedCount = Object.keys(completedMilestones).length;

    let roadmapCompleted = false;
    if (roadmapGoal && activeRoadmapData) {
        const totalMilestones = activeRoadmapData.milestones.length;
        const completedForThisRoadmap = activeRoadmapData.milestones.filter(m => {
            const key = `${roadmapGoal}_${m.step}`;
            return completedMilestones[key];
        }).length;
        roadmapCompleted = completedForThisRoadmap === totalMilestones && totalMilestones > 0;
    }

    let state = 'Novice';
    if (completedCount === 0) state = 'Novice';
    else if (completedCount < 3) state = 'Beginner';
    else if (completedCount < 7) state = 'Intermediate';
    else if (completedCount < 12) state = 'Advanced';
    else state = 'Elite Master';

    let percent = 0;
    if (activeRoadmapData && activeRoadmapData.milestones.length > 0) {
        const total = activeRoadmapData.milestones.length;
        let c = 0;
        activeRoadmapData.milestones.forEach(m => {
            if (completedMilestones[`${activeRoadmapData.career_goal}_${m.step}`]) c++;
        });
        percent = (c / total) * 100;
        roadmapCompleted = c === total;
    }

    return { state, roadmapCompleted, percent };
}

function renderStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating)) {
            stars += '<i class="fas fa-star"></i>';
        } else if (i - 0.5 <= rating) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

function toggleChat() {
    const chat = document.getElementById('roadmap-chat');
    chat.classList.toggle('active');
}

async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message) return;

    appendMessage('user', message);
    input.value = '';

    try {
        const res = await fetch(`${API_URL}/roadmap/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ message })
        });
        const data = await res.json();
        appendMessage('bot', data.response);
    } catch (err) {
        console.error(err);
        appendMessage('bot', "Sorry, I'm having trouble connecting right now.");
    }
}

function appendMessage(type, text) {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = `chat-message ${type}`;
    div.innerText = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function getChatbotHTML() {
    return `
        <div id="chat-toggle" class="chat-toggle-btn" onclick="toggleChat()">
            <i class="fas fa-robot"></i>
        </div>
        <div id="roadmap-chat" class="roadmap-chat-container glass-card">
            <div class="chat-header">
                <span>UNIverse Assistant</span>
                <i class="fas fa-times" onclick="toggleChat()" style="cursor:pointer;"></i>
            </div>
            <div id="chat-messages" class="chat-body">
                <div class="chat-message bot">
                    Hello! I'm your learning assistant. Ask me anything about your roadmap!
                </div>
            </div>
            <div class="chat-input-area">
                <input type="text" id="chat-input" placeholder="Ask a question..." onkeypress="if(event.key==='Enter') sendChatMessage()">
                <button onclick="sendChatMessage()"><i class="fas fa-paper-plane"></i></button>
            </div>
        </div>
    `;
}

async function resetRoadmap() {
    if (!confirm("Are you sure you want to reset your current roadmap? Your progress for these specific milestones will stay saved, but you'll need to generate a new path.")) return;

    try {
        await fetch(`${API_URL}/roadmap/reset`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        activeRoadmapData = null;
        localStorage.removeItem('activeRoadmapData');
        viewCache.roadmap = null;
        viewCache.feed = null;
        loadRoadmap(true);
    } catch (err) {
        console.error(err);
        alert("Failed to reset roadmap.");
    }
}
