// API Configuration — only declare if not already defined by an inline script
if (typeof API_BASE === 'undefined') {
    var API_BASE = (() => {
        const host = window.location.hostname;
        const port = window.location.port;
        if ((host === 'localhost' || host === '127.0.0.1') && port !== '5003') {
            return 'http://localhost:5003/api';
        }
        return '/api';
    })();
}

// Global state — only declare if not already defined
if (typeof authToken === 'undefined') {
    var authToken = localStorage.getItem('authToken') || '';
}
if (typeof currentUser === 'undefined') {
    var currentUser = {};
    try {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser && savedUser !== 'undefined') {
            currentUser = JSON.parse(savedUser);
        }
    } catch (e) {
        console.error("Error parsing currentUser from localStorage:", e);
        currentUser = {};
    }
}

// DOM Elements (safe — getElementById returns null if missing)
const _loginBtn = document.getElementById('loginBtn');
const _registerBtn = document.getElementById('registerBtn');
const _logoutBtn = document.getElementById('logoutBtn');
const _userMenu = document.getElementById('userMenu');
const _userName = document.getElementById('userName');
const _addPropertyBtn = document.getElementById('addPropertyBtn');
const _loginModal = document.getElementById('loginModal');
const _registerModal = document.getElementById('registerModal');
const _propertyModal = document.getElementById('propertyModal');
const _addPropertyModal = document.getElementById('addPropertyModal');
const _closeButtons = document.querySelectorAll('.close');

/**
 * Custom Alert Modal Implementation
 */
function showAlertModal(title, message, isLogin = false, onConfirm = null) {
    let modal = document.getElementById('customAlertModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'customAlertModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width:400px;text-align:center;">
                <h2 id="alertModalTitle" style="margin-bottom:8px;"></h2>
                <p id="alertModalMessage" style="color:#64748b;margin-bottom:20px;"></p>
                <button id="alertModalOk" style="padding:10px 32px;background:#1a56db;color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;">OK</button>
            </div>`;
        document.body.appendChild(modal);
    }
    document.getElementById('alertModalTitle').textContent = title;
    document.getElementById('alertModalMessage').textContent = message;
    modal.classList.add('active');
    document.getElementById('alertModalOk').onclick = () => {
        modal.classList.remove('active');
        if (onConfirm) onConfirm();
    };
}