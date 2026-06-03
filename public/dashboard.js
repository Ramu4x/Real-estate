// public/dashboard.js
console.log('Dashboard script loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');
    lucide.createIcons();
    
    const token = localStorage.getItem('authToken');
    let userStr = localStorage.getItem('user');
    
    // Fallback for user key mismatch
    if (!userStr && localStorage.getItem('currentUser')) {
        console.log('Using currentUser fallback for user data');
        userStr = localStorage.getItem('currentUser');
    }

    console.log('Auth Check:', { hasToken: !!token, hasUserString: !!userStr });

    if (!token || !userStr) {
        console.error('No auth token or user data found, redirecting to index.html');
        window.location.href = 'index.html';
        return;
    }

    const user = JSON.parse(userStr);
    console.log('User parsed successfully:', { role: user.role, name: user.name });

    if ((user.role || user.userType || '').toString().toLowerCase() === 'seller') {
        window.location.replace('seller-dashboard.html');
        return;
    }

    // Set UI basic info
    document.getElementById('userNameDisplay').innerText = user.name;
    document.getElementById('userAvatar').src = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1a56db&color=fff`;

    // Show appropriate menu
    if (user.role === 'seller') {
        console.log('Loading Seller Dashboard...');
        document.getElementById('sellerMenu').style.display = 'block';
        loadSellerDashboard();
    } else {
        console.log('Loading Buyer Dashboard...');
        document.getElementById('buyerMenu').style.display = 'block';
        loadBuyerDashboard();
    }

    // Tab Switching
    document.querySelectorAll('.menu-item[data-tab]').forEach(item => {
        item.addEventListener('click', (e) => {
            document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
            e.currentTarget.classList.add('active');

            const tabId = e.currentTarget.getAttribute('data-tab');
            document.querySelectorAll('.tab-pane').forEach(tab => tab.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');

            // Load specific tab data if needed
            if (tabId === 'messages') loadConversations();
            if (tabId === 'tour-requests') loadTours();
            if (tabId === 'my-listings' && user.role === 'seller') loadMyListings();
        });
    });

    // Notifications
    document.getElementById('notifBtn').addEventListener('click', () => {
        document.getElementById('notifDropdown').classList.toggle('show');
    });

    // Close notif dropdown when clicking outside
    window.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-notification')) {
            document.getElementById('notifDropdown').classList.remove('show');
        }
    });

    document.getElementById('markAllRead').addEventListener('click', markAllNotificationsRead);

    // Initial loads
    loadNotifications();
    setInterval(loadNotifications, 30000); // poll every 30s
});

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// ==========================================
// API HELPERS
// ==========================================
const API_BASE = '/api';

async function apiGet(endpoint) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
    });
    return await res.json();
}

async function apiPost(endpoint, data) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(data)
    });
    return await res.json();
}

async function apiPut(endpoint, data = {}) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(data)
    });
    return await res.json();
}

// ==========================================
// DASHBOARD LOADERS
// ==========================================
async function loadSellerDashboard() {
    const { data } = await apiGet('/dashboard/seller');
    if(!data) return;

    // Stat Cards
    document.getElementById('statCards').innerHTML = `
        <div class="stat-card">
            <div class="stat-icon"><i data-lucide="building"></i></div>
            <div class="stat-info"><h4>Total Listings</h4><h2>${data.stats.totalListings}</h2></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon"><i data-lucide="eye"></i></div>
            <div class="stat-info"><h4>Total Views</h4><h2>${data.stats.totalViews}</h2></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon"><i data-lucide="calendar"></i></div>
            <div class="stat-info"><h4>Pending Tours</h4><h2>${data.stats.pendingInquiries}</h2></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon"><i data-lucide="bell"></i></div>
            <div class="stat-info"><h4>Unread Notifs</h4><h2>${data.stats.unreadNotifs}</h2></div>
        </div>
    `;

    // Pending Tours List
    document.getElementById('pendingTasksTitle').innerText = 'Pending Tour Requests';
    const pendingHtml = data.pendingBookings.map(b => `
        <div class="list-item">
            <img src="${b.propertyId?.images?.[0] || 'https://via.placeholder.com/50'}" alt="Prop">
            <div class="list-item-content">
                <div class="list-item-title">${b.propertyId?.title}</div>
                <div class="list-item-subtitle">🗓 ${b.date} at ${b.time} - 👤 ${b.buyerId?.name}</div>
            </div>
            <div class="list-item-actions">
                <button class="btn btn-primary" onclick="updateTourStatus('${b._id}', 'confirmed')">Confirm</button>
                <button class="btn btn-outline" onclick="updateTourStatus('${b._id}', 'cancelled')">Cancel</button>
            </div>
        </div>
    `).join('') || '<div style="color:var(--gray)">No pending tour requests.</div>';
    document.getElementById('pendingTasksList').innerHTML = pendingHtml;

    // Recent Messages
    document.getElementById('recentActivityTitle').innerText = 'Recent Messages';
    const msgHtml = data.recentMessages.map(m => `
        <div class="list-item" onclick="openChat('${m.conversation?._id}')" style="cursor:pointer">
            <img src="${m.sender?.avatar || `https://ui-avatars.com/api/?name=${m.sender?.name}`}" alt="Avatar">
            <div class="list-item-content">
                <div class="list-item-title">${m.sender?.name}</div>
                <div class="list-item-subtitle">💬 "${m.content}"</div>
            </div>
        </div>
    `).join('') || '<div style="color:var(--gray)">No recent messages.</div>';
    document.getElementById('recentActivityList').innerHTML = msgHtml;

    lucide.createIcons();
}

async function loadBuyerDashboard() {
    const { data } = await apiGet('/dashboard/buyer');
    if(!data) return;

    document.getElementById('statCards').innerHTML = `
        <div class="stat-card">
            <div class="stat-icon"><i data-lucide="heart"></i></div>
            <div class="stat-info"><h4>Saved Properties</h4><h2>${data.stats.savedProperties}</h2></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon"><i data-lucide="message-square"></i></div>
            <div class="stat-info"><h4>Unread Messages</h4><h2>${data.stats.unreadMessages}</h2></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon"><i data-lucide="calendar"></i></div>
            <div class="stat-info"><h4>Tour Requests</h4><h2>${data.stats.tourRequests}</h2></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon"><i data-lucide="search"></i></div>
            <div class="stat-info"><h4>Saved Searches</h4><h2>${data.stats.savedSearches}</h2></div>
        </div>
    `;

    document.getElementById('pendingTasksTitle').innerText = 'Upcoming Tours';
    const confirmedHtml = data.confirmedBookings.map(b => `
        <div class="list-item">
            <img src="${b.propertyId?.images?.[0] || 'https://via.placeholder.com/50'}" alt="Prop">
            <div class="list-item-content">
                <div class="list-item-title">${b.propertyId?.title}</div>
                <div class="list-item-subtitle">✅ Confirmed for ${b.date} at ${b.time}</div>
            </div>
            <div class="list-item-actions">
                <button class="btn btn-outline" onclick="window.location.href='property-detail.html?id=${b.propertyId?._id}'">View</button>
            </div>
        </div>
    `).join('') || '<div style="color:var(--gray)">No upcoming confirmed tours.</div>';
    document.getElementById('pendingTasksList').innerHTML = confirmedHtml;

    document.getElementById('recentActivityTitle').innerText = 'Pending Tour Requests';
    const pendingHtml = data.pendingBookings.map(b => `
        <div class="list-item">
            <img src="${b.propertyId?.images?.[0] || 'https://via.placeholder.com/50'}" alt="Prop">
            <div class="list-item-content">
                <div class="list-item-title">${b.propertyId?.title}</div>
                <div class="list-item-subtitle">⏳ Waiting for seller: ${b.date} at ${b.time}</div>
            </div>
        </div>
    `).join('') || '<div style="color:var(--gray)">No pending requests.</div>';
    document.getElementById('recentActivityList').innerHTML = pendingHtml;

    lucide.createIcons();
}

// ==========================================
// NOTIFICATIONS
// ==========================================
async function loadNotifications() {
    const { data, unreadCount } = await apiGet('/notifications');
    if(!data) return;

    const notifCount = document.getElementById('notifCount');
    if(unreadCount > 0) {
        notifCount.style.display = 'block';
        notifCount.innerText = unreadCount;
    } else {
        notifCount.style.display = 'none';
    }

    const listHtml = data.map(n => {
        let icon = '🔔';
        if(n.type === 'message') icon = '💬';
        if(n.type.includes('tour')) icon = '📅';
        if(n.type === 'favorite') icon = '❤️';

        return `
            <div class="notif-item ${!n.read ? 'unread' : ''}" onclick="handleNotifClick('${n._id}', '${n.actionUrl}')">
                <div class="notif-title">${icon} ${n.title}</div>
                <div style="font-size: 0.8rem; color: var(--dark);">${n.message}</div>
                <div class="notif-time">${new Date(n.createdAt).toLocaleString()}</div>
            </div>
        `;
    }).join('') || '<div style="padding:15px; color:var(--gray); text-align:center;">No notifications</div>';
    
    document.getElementById('notifList').innerHTML = listHtml;
}

async function handleNotifClick(id, url) {
    await apiPut(`/notifications/${id}/read`);
    if(url) window.location.href = url;
    else loadNotifications();
}

async function markAllNotificationsRead() {
    await apiPut('/notifications/read-all');
    loadNotifications();
}

// ==========================================
// TOUR REQUESTS
// ==========================================
async function loadTours() {
    const user = JSON.parse(localStorage.getItem('user'));
    const endpoint = user.role === 'seller' ? '/bookings/received' : '/bookings/my';
    const { data } = await apiGet(endpoint);
    
    if(!data) return;

    const html = data.map(b => {
        const statusColors = {
            pending: 'orange',
            confirmed: 'green',
            cancelled: 'red'
        };
        const statusBadge = `<span style="color: ${statusColors[b.status]}; font-weight: bold; text-transform: capitalize;">${b.status}</span>`;
        
        let actions = '';
        if(user.role === 'seller' && b.status === 'pending') {
            actions = `
                <div class="list-item-actions">
                    <button class="btn btn-primary" onclick="updateTourStatus('${b._id}', 'confirmed')">Confirm</button>
                    <button class="btn btn-outline" onclick="updateTourStatus('${b._id}', 'cancelled')">Cancel</button>
                </div>
            `;
        }

        const person = user.role === 'seller' ? b.buyerId : b.sellerId;

        return `
            <div class="list-item">
                <img src="${b.propertyId?.images?.[0] || 'https://via.placeholder.com/80'}" alt="Prop" style="width:80px;height:80px;">
                <div class="list-item-content">
                    <div class="list-item-title">${b.propertyId?.title || 'Property'}</div>
                    <div class="list-item-subtitle" style="margin-bottom: 5px;">
                        🗓 <strong>${b.date}</strong> at <strong>${b.time}</strong>
                    </div>
                    <div style="font-size: 0.85rem; color: var(--dark);">
                        👤 ${person?.name} | 📞 ${b.phone || person?.phone || 'N/A'}
                    </div>
                    <div style="font-size: 0.85rem; margin-top: 5px;">Status: ${statusBadge}</div>
                    ${b.message ? `<div style="font-size: 0.8rem; color: var(--gray); margin-top: 5px; font-style: italic;">"${b.message}"</div>` : ''}
                </div>
                ${actions}
            </div>
        `;
    }).join('') || '<div style="color:var(--gray); padding: 20px;">No tour requests found.</div>';

    document.getElementById('tourList').innerHTML = html;
}

async function updateTourStatus(id, status) {
    await apiPut(`/bookings/${id}/status`, { status });
    loadTours(); // refresh tab
    if(document.getElementById('dashboard-home').classList.contains('active')) {
        loadSellerDashboard(); // refresh home if active
    }
}

// ==========================================
// MY LISTINGS
// ==========================================
async function loadMyListings() {
    const { data } = await apiGet('/properties/my');
    if(!data) return;

    const html = data.map(p => `
        <div class="list-item">
            <img src="${p.images?.[0] || 'https://via.placeholder.com/80'}" alt="Prop" style="width:80px;height:80px;">
            <div class="list-item-content">
                <div class="list-item-title">${p.title}</div>
                <div class="list-item-subtitle">📍 ${p.location || p.address?.city || 'Unknown location'}</div>
                <div style="font-weight: bold; color: var(--primary); margin-top: 5px;">₹${Number(p.price || 0).toLocaleString('en-IN')}</div>
            </div>
            <div class="list-item-actions">
                <a href="property-detail.html?id=${p._id}" class="btn btn-outline">View</a>
            </div>
        </div>
    `).join('') || '<div style="color:var(--gray); padding: 20px;">You have no listings.</div>';

    document.getElementById('myListingsList').innerHTML = html;
}

// ==========================================
// MESSAGES & CONVERSATIONS
// ==========================================
async function loadConversations() {
    const { data } = await apiGet('/conversations');
    if(!data) return;

    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user._id || user.id;

    const html = data.map(c => {
        const otherPerson = c.participants.find(p => p._id?.toString() !== userId) || c.participants[0];
        const unread = c.unreadCount?.[userId] > 0;
        
        return `
            <div class="chat-list-item ${unread ? 'unread' : ''}" onclick="openChat('${c._id}')" id="conv-${c._id}">
                <img src="${otherPerson?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherPerson?.name || 'Unknown')}`}" alt="Avatar">
                <div class="chat-list-content">
                    <div class="chat-list-header">
                        <span class="chat-list-name">${otherPerson?.name || 'Unknown'}</span>
                        <span class="chat-list-time">${new Date(c.lastMessageAt).toLocaleDateString()}</span>
                    </div>
                    <div class="chat-list-msg" style="${unread ? 'font-weight:bold; color:var(--dark);' : ''}">
                        ${c.lastMessage || 'Click to view messages'}
                    </div>
                </div>
                ${unread ? `<div style="width:10px;height:10px;background:var(--danger);border-radius:50%;align-self:center;"></div>` : ''}
            </div>
        `;
    }).join('') || '<div style="padding: 20px; color: var(--gray);">No conversations yet.</div>';

    document.getElementById('conversationList').innerHTML = html;
}

async function openChat(convId) {
    // Switch to messages tab if not already there
    document.querySelector('.menu-item[data-tab="messages"]').click();
    
    // Highlight active in list
    document.querySelectorAll('.chat-list-item').forEach(el => el.classList.remove('active'));
    const listItem = document.getElementById(`conv-${convId}`);
    if(listItem) {
        listItem.classList.add('active');
        const dot = listItem.querySelector('div[style*="background:var(--danger)"]');
        if(dot) dot.remove();
        listItem.querySelector('.chat-list-msg').style.fontWeight = 'normal';
    }

    const { conversation, messages } = await apiGet(`/conversations/${convId}`);
    if(!conversation) return;

    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user._id || user.id;
    const otherPerson = conversation.participants.find(p => p._id?.toString() !== userId) || conversation.participants[0];

    // Setup Header
    document.getElementById('chatHeader').style.display = 'flex';
    document.getElementById('chatAvatar').src = otherPerson?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherPerson?.name || 'Unknown')}`;
    document.getElementById('chatName').innerText = otherPerson?.name;
    document.getElementById('chatProperty').innerHTML = `
        <a href="property-detail.html?id=${conversation.property?._id}" target="_blank" style="color:var(--primary); text-decoration:none;">
            ${conversation.property?.title || 'Unknown Property'}
        </a>
    `;

    // Render Messages
    const msgsHtml = messages.map(m => {
        const isMe = m.sender._id?.toString() === userId;
        return `
            <div class="message-bubble ${isMe ? 'message-sent' : 'message-received'}">
                ${m.content}
                <div style="font-size: 0.65rem; margin-top: 4px; opacity: 0.7; text-align: ${isMe ? 'right' : 'left'};">
                    ${new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
            </div>
        `;
    }).join('');

    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = msgsHtml;
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Show input
    const chatForm = document.getElementById('chatForm');
    chatForm.style.display = 'flex';
    document.getElementById('activeConversationId').value = convId;
    
    // Refresh sidebar to update unread badge
    loadNotifications();
}

document.getElementById('chatForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const convId = document.getElementById('activeConversationId').value;
    const input = document.getElementById('chatInput');
    const content = input.value.trim();
    if(!content) return;

    input.value = ''; // clear input
    
    // Optimistic UI update
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML += `
        <div class="message-bubble message-sent">
            ${content}
            <div style="font-size: 0.65rem; margin-top: 4px; opacity: 0.7; text-align: right;">Sending...</div>
        </div>
    `;
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Send API
    await apiPost(`/conversations/${convId}/message`, { content });
    
    // Reload chat
    openChat(convId);
    loadConversations();
});
