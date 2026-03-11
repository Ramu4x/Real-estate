// API Configuration
const API_BASE = 'http://localhost:5003/api';

// Global state
let authToken = localStorage.getItem('authToken') || '';
let currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userMenu = document.getElementById('userMenu');
const userName = document.getElementById('userName');
const addPropertyBtn = document.getElementById('addPropertyBtn');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const propertyModal = document.getElementById('propertyModal');
const addPropertyModal = document.getElementById('addPropertyModal');
const closeButtons = document.querySelectorAll('.close');

// Initialize app
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();

    // Load properties only on properties page
    if (window.location.pathname.includes('properties.html')) {
        loadProperties();
    }

    setupEventListeners();
    setupModalKeyboardShortcuts();
    setupMobileNavigation();
});

// Initialize application
function initializeApp() {
    updateAuthUI();
    setupNavigation();
    initializeTheme();
}

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        updateThemeIcon('dark');
    } else if (savedTheme === 'light') {
        document.documentElement.removeAttribute('data-theme');
        updateThemeIcon('light');
    } else {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
            updateThemeIcon('dark');
        } else {
            updateThemeIcon('light');
        }
    }
}

function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }
}

function toggleTheme() {
    let currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme === 'dark') {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        updateThemeIcon('light');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        updateThemeIcon('dark');
    }
}

// Update authentication UI
function updateAuthUI() {
    if (authToken && currentUser.name) {
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        userMenu.style.display = 'flex';
        userName.textContent = currentUser.name;

        // Show Add Property button only for sellers
        if (currentUser.role === 'seller') {
            addPropertyBtn.style.display = 'block';
        } else {
            addPropertyBtn.style.display = 'none';
        }
    } else {
        loginBtn.style.display = 'block';
        registerBtn.style.display = 'block';
        userMenu.style.display = 'none';
        addPropertyBtn.style.display = 'none';
    }
}

// Setup navigation
function setupNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    hamburger?.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    });
}

// Setup event listeners
function setupEventListeners() {
    // Theme toggle
    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);

    // Modal events
    loginBtn?.addEventListener('click', () => openModal('loginModal'));
    registerBtn?.addEventListener('click', () => openModal('registerModal'));
    logoutBtn?.addEventListener('click', logout);
    addPropertyBtn?.addEventListener('click', () => openModal('addPropertyModal'));

    // Property form events
    document.getElementById('addPropertyForm')?.addEventListener('submit', handleAddProperty);
    document.getElementById('cancelPropertyBtn')?.addEventListener('click', () => closeModal());
    document.getElementById('propertyImages')?.addEventListener('change', handleImagePreview);

    // Close add property modal
    document.querySelector('#addPropertyModal .close')?.addEventListener('click', () => closeModal());

    closeButtons.forEach(button => {
        button.addEventListener('click', closeModal);
    });

    // Form submissions
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    document.getElementById('registerForm')?.addEventListener('submit', handleRegister);

    // Search functionality
    document.getElementById('heroSearchBtn')?.addEventListener('click', handleHeroSearch);
    document.getElementById('applyFilters')?.addEventListener('click', applyFilters);

    // Location autocomplete
    const locationInput = document.getElementById('locationFilter');
    if (locationInput) {
        locationInput.addEventListener('input', handleLocationAutocomplete);
    }

    // AI Tools
    document.getElementById('pricePredictorBtn')?.addEventListener('click', openPricePredictor);
    document.getElementById('recommendationsBtn')?.addEventListener('click', getRecommendations);
    document.getElementById('marketAnalysisBtn')?.addEventListener('click', openMarketAnalysis);

    // AI Tools Form Submissions
    document.getElementById('pricePredictionForm')?.addEventListener('submit', handlePricePredictionForm);
    document.getElementById('recommendationsForm')?.addEventListener('submit', handleRecommendationsForm);

    // AI Assistant Widget
    const aiToggle = document.getElementById('aiToggle');
    const aiChatWindow = document.getElementById('aiChatWindow');
    const aiChatForm = document.getElementById('aiChatForm');

    aiToggle?.addEventListener('click', () => {
        const isVisible = aiChatWindow.style.display === 'flex';
        aiChatWindow.style.display = isVisible ? 'none' : 'flex';
        if (!isVisible) {
            document.getElementById('aiInput').focus();
        }
    });

    aiChatForm?.addEventListener('submit', handleAIChat);

    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            closeModal();
        }
    });
}

// AI Chat function
async function handleAIChat(e) {
    e.preventDefault();
    const input = document.getElementById('aiInput');
    const message = input.value.trim();
    if (!message) return;

    appendMessage('user', message);
    input.value = '';

    const typingMsg = appendMessage('ai', 'Thinking...', true);

    const headers = {
        'Content-Type': 'application/json'
    };
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
        const response = await fetch(`${API_BASE}/ai/tour-assistant`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                question: message,
                // Pass a generic property context if not viewing a specific one
                propertyId: 'general'
            })
        });

        const data = await response.json();
        typingMsg.remove();

        if (response.ok) {
            appendMessage('ai', data.response);
        } else {
            appendMessage('ai', "I'm having trouble connecting right now. Please try again later.");
        }
    } catch (error) {
        typingMsg.remove();
        appendMessage('ai', "Network error. Please check your connection.");
    }
}

function appendMessage(role, text, isTyping = false) {
    const container = document.getElementById('aiMessages');
    const div = document.createElement('div');
    div.className = `message ${role}`;
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
}

// Modal functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'block';

    // Prevent background scrolling
    document.body.style.overflow = 'hidden';

    // Focus the first input field for better UX
    const firstInput = modal.querySelector('input, select, textarea');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
    }
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });

    // Restore background scrolling
    document.body.style.overflow = '';

    // Reset any active form
    resetPropertyForm();
}

// Authentication functions
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;

            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            updateAuthUI();
            closeModal();
            showMessage('Login successful!', 'success');
        } else {
            showMessage(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();

    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const role = document.getElementById('regRole').value;

    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password, role })
        });

        const data = await response.json();

        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;

            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            updateAuthUI();
            closeModal();
            showMessage('Registration successful!', 'success');
        } else {
            showMessage(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'error');
    }
}

function logout() {
    authToken = '';
    currentUser = {};
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    updateAuthUI();
    showMessage('Logged out successfully', 'success');
}

// Property functions
async function loadProperties(filters = {}) {
    const propertiesGrid = document.getElementById('propertiesGrid');
    propertiesGrid.innerHTML = '<div class="loading">Loading properties...</div>';

    try {
        // Check if current user is a seller and wants to see their properties
        let apiUrl = `${API_BASE}/properties`;

        // Check if we're on the user's property page (e.g., if URL contains my-properties or similar)
        if (window.location.search.includes('my=true') ||
            (currentUser.role === 'seller' && document.querySelector('.my-properties-btn'))) {
            apiUrl = `${API_BASE}/properties/my`;
        }

        const params = new URLSearchParams(filters);
        const response = await fetch(`${apiUrl}?${params}`);
        const data = await response.json();

        if (response.ok) {
            displayProperties(data.data || []);
        } else {
            propertiesGrid.innerHTML = '<div class="loading">Failed to load properties</div>';
        }
    } catch (error) {
        propertiesGrid.innerHTML = '<div class="loading">Network error. Please try again.</div>';
    }
}

function displayProperties(properties) {
    const propertiesGrid = document.getElementById('propertiesGrid');

    if (properties.length === 0) {
        propertiesGrid.innerHTML = '<div class="loading">No properties found</div>';
        return;
    }

    propertiesGrid.innerHTML = properties.map(property => {
        // Ensure property has all required fields
        const images = property.images || [];
        const title = property.title || 'Untitled Property';
        const type = property.type || 'N/A';
        const location = property.location || 'Location not specified';
        const price = property.price || 0;
        const bedrooms = property.bedrooms || 0;
        const bathrooms = property.bathrooms || 0;
        const area = property.area || 0;

        return `
        <div class="property-card" onclick="showPropertyDetail('${property._id}')">
            <div class="property-image" style="background-image: url('${images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'}')">
                <div class="property-badge">${type}</div>
            </div>
            <div class="property-content">
                <h3>${title}</h3>
                <div class="property-location">
                    <i class="fas fa-map-marker-alt"></i>
                    ${location}
                </div>
                <div class="property-price">₹${price?.toLocaleString('en-IN')}</div>
                <div class="property-features">
                    <div class="feature">
                        <i class="fas fa-bed"></i>
                        ${bedrooms} beds
                    </div>
                    <div class="feature">
                        <i class="fas fa-bath"></i>
                        ${bathrooms} baths
                    </div>
                    <div class="feature">
                        <i class="fas fa-ruler-combined"></i>
                        ${area} sq ft
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');
}

async function showPropertyDetail(propertyId) {
    try {
        const response = await fetch(`${API_BASE}/properties/${propertyId}`);
        const data = await response.json();

        if (response.ok) {
            displayPropertyDetail(data.data);
            openModal('propertyModal');
        }
    } catch (error) {
        showMessage('Failed to load property details', 'error');
    }
}

function displayPropertyDetail(property) {
    const content = document.getElementById('propertyDetailContent');

    // Ensure property has all required fields
    const images = property.images || [];
    const title = property.title || 'Untitled Property';
    const price = property.price || 0;
    const location = property.location || 'Location not specified';
    const description = property.description || 'No description available';
    const type = property.type || 'N/A';
    const bedrooms = property.bedrooms || 0;
    const bathrooms = property.bathrooms || 0;
    const area = property.area || 0;

    let actionButtons = '';
    if (authToken && currentUser?._id && property.createdBy?._id && currentUser._id === property.createdBy._id) {
        actionButtons = `
            <button class="btn btn-primary" onclick="window.editProperty('${property._id}')" style="margin-left: 10px; background-color: #f39c12;">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-secondary" onclick="window.deleteProperty('${property._id}')" style="margin-left: 10px; background-color: #e74c3c; border-color: #e74c3c;">
                <i class="fas fa-trash"></i> Delete
            </button>
        `;
    }

    content.innerHTML = `
        <div class="property-detail">
            <div class="property-detail-image" style="background-image: url('${images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}')"></div>
            <div class="property-detail-info">
                <h3>${title}</h3>
                <div class="property-detail-price">₹${price?.toLocaleString('en-IN')}</div>
                <p><i class="fas fa-map-marker-alt"></i> ${location}</p>
                <p>${description}</p>
                
                <div class="property-detail-features">
                    <div class="detail-feature">
                        <i class="fas fa-home"></i>
                        <span>Type: ${type}</span>
                    </div>
                    <div class="detail-feature">
                        <i class="fas fa-bed"></i>
                        <span>Bedrooms: ${bedrooms}</span>
                    </div>
                    <div class="detail-feature">
                        <i class="fas fa-bath"></i>
                        <span>Bathrooms: ${bathrooms}</span>
                    </div>
                    <div class="detail-feature">
                        <i class="fas fa-ruler-combined"></i>
                        <span>Area: ${area} sq ft</span>
                    </div>
                </div>
                
                <div class="property-detail-map" style="margin-top: 1.5rem;">
                    <h4 style="margin-bottom: 0.5rem; font-size: 1.1rem; color: var(--primary);">Location Map</h4>
                    <iframe 
                        width="100%" 
                        height="250" 
                        style="border:0; border-radius: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);" 
                        loading="lazy" 
                        src="https://maps.google.com/maps?q=${encodeURIComponent(location)}&t=&z=13&ie=UTF8&iwloc=&output=embed">
                    </iframe>
                </div>
                
                <div style="margin-top: 2rem;">
                    <button class="btn btn-primary" onclick="contactAgent('${property._id}')">
                        <i class="fas fa-envelope"></i> Contact Agent
                    </button>
                    <button class="btn btn-secondary" onclick="getAIAnalysis('${property._id}')" style="margin-left: 10px;">
                        <i class="fas fa-robot"></i> AI Analysis
                    </button>
                    ${actionButtons}
                </div>
            </div>
        </div>
    `;
}

// Location autocomplete function
async function handleLocationAutocomplete(e) {
    const query = e.target.value;
    if (query.length < 2) return;

    try {
        const response = await fetch(`${API_BASE}/location/suggestions?query=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (data.success && data.data.length > 0) {
            showLocationSuggestions(data.data);
        }
    } catch (error) {
        console.log('Location suggestions error:', error);
    }
}

function showLocationSuggestions(suggestions) {
    // Remove existing suggestions
    const existingDropdown = document.getElementById('locationSuggestions');
    if (existingDropdown) {
        existingDropdown.remove();
    }

    if (suggestions.length === 0) return;

    // Create suggestions dropdown
    const dropdown = document.createElement('div');
    dropdown.id = 'locationSuggestions';
    dropdown.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #ddd;
        border-radius: 6px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        z-index: 1000;
        max-height: 200px;
        overflow-y: auto;
    `;

    suggestions.forEach(suggestion => {
        const item = document.createElement('div');
        item.style.cssText = `
            padding: 10px 15px;
            cursor: pointer;
            border-bottom: 1px solid #eee;
        `;
        item.textContent = suggestion.display;
        item.addEventListener('click', () => {
            document.getElementById('locationFilter').value = suggestion.location;
            dropdown.remove();
            applyFilters();
        });
        item.addEventListener('mouseover', () => {
            item.style.backgroundColor = '#f5f5f5';
        });
        item.addEventListener('mouseout', () => {
            item.style.backgroundColor = 'white';
        });
        dropdown.appendChild(item);
    });

    // Position and add to DOM
    const locationInput = document.getElementById('locationFilter');
    locationInput.parentNode.style.position = 'relative';
    locationInput.parentNode.appendChild(dropdown);

    // Remove dropdown when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function removeDropdown(e) {
            if (!dropdown.contains(e.target) && e.target !== locationInput) {
                dropdown.remove();
                document.removeEventListener('click', removeDropdown);
            }
        });
    }, 100);
}

// Search functions
function handleHeroSearch() {
    const query = document.getElementById('heroSearch').value;
    if (query) {
        // Scroll to properties section
        document.getElementById('properties').scrollIntoView({ behavior: 'smooth' });
        // Apply search
        loadProperties({ location: query });
    }
}

function applyFilters() {
    const filters = {
        type: document.getElementById('propertyType')?.value,
        minPrice: document.getElementById('minPrice')?.value,
        maxPrice: document.getElementById('maxPrice')?.value,
        location: document.getElementById('locationFilter')?.value,
        radius: document.getElementById('radiusFilter')?.value || 50
    };

    // Remove empty filters
    Object.keys(filters).forEach(key => {
        if (!filters[key]) delete filters[key];
    });

    loadProperties(filters);
}

// AI Functions
function openPricePredictor() {
    const location = prompt('Enter property location:');
    const area = prompt('Enter property area (sq ft):');
    const bedrooms = prompt('Enter number of bedrooms:');
    const bathrooms = prompt('Enter number of bathrooms:');

    if (location && area && bedrooms && bathrooms) {
        predictPrice({
            location,
            area: parseInt(area),
            bedrooms: parseInt(bedrooms),
            bathrooms: parseInt(bathrooms)
        });
    }
}

async function predictPrice(propertyData) {
    try {
        const response = await fetch(`${API_BASE}/ai/predict-price`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'house',
                ...propertyData
            })
        });

        const data = await response.json();

        if (response.ok) {
            const pred = data.data;
            let msg = `🏠 AI Price Prediction based on ${propertyData.location} (${propertyData.area} sq ft):\n\n`;
            msg += `Price Range: ${pred.priceRange}\n`;
            msg += `Confidence: ${pred.confidence}\n`;
            if (pred.factors) msg += `Key Factors: ${pred.factors.join(', ')}\n`;
            if (pred.recommendations) {
                msg += `\n--- 🤖 AI Recommendations ---\n${pred.recommendations}`;
            }

            // check if there's a result display div (like in ai-tools.html)
            const resultDiv = document.getElementById('predictionResult');
            if (resultDiv && resultDiv.offsetParent !== null) {
                // Formatting for HTML display
                let htmlMsg = `<strong>🏠 AI Price Prediction based on ${propertyData.location} (${propertyData.area} sq ft):</strong><br><br>`;
                htmlMsg += `<strong>Price Range:</strong> ${pred.priceRange}<br>`;
                htmlMsg += `<strong>Confidence:</strong> ${pred.confidence}<br>`;
                if (pred.factors) htmlMsg += `<strong>Key Factors:</strong> ${pred.factors.join(', ')}<br>`;
                if (pred.recommendations) {
                    // basic markdown to html conversion
                    let recsHtml = pred.recommendations.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    htmlMsg += `<br><strong>🤖 AI Recommendations</strong><br>${recsHtml}`;
                }
                resultDiv.innerHTML = htmlMsg;
                resultDiv.style.display = 'block';
            } else {
                alert(msg);
            }
        } else {
            showMessage('Failed to get price prediction', 'error');
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'error');
    }
}

function handlePricePredictionForm(e) {
    e.preventDefault();
    const location = document.getElementById('predictionLocation').value;
    const type = document.getElementById('predictionType').value;
    const area = document.getElementById('predictionArea').value;
    const bedrooms = document.getElementById('predictionBedrooms').value;
    const bathrooms = document.getElementById('predictionBathrooms').value;

    const resultDiv = document.getElementById('predictionResult');
    if (resultDiv) {
        resultDiv.innerHTML = '<div class="loading">Analyzing market data and generating predictions...</div>';
        resultDiv.style.display = 'block';
    }

    if (location && area) {
        predictPrice({
            location,
            type: type || 'house',
            area: parseInt(area),
            bedrooms: bedrooms ? parseInt(bedrooms) : 0,
            bathrooms: bathrooms ? parseInt(bathrooms) : 0
        });
    } else {
        showMessage('Location and area are required.', 'error');
    }
}

async function getRecommendations(filters = {}) {
    if (!authToken) {
        showMessage('Please login to get recommendations', 'error');
        return;
    }

    try {
        const params = new URLSearchParams(filters);
        const response = await fetch(`${API_BASE}/ai/recommendations?${params}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            const resultDiv = document.getElementById('recommendationsResult');
            if (resultDiv && resultDiv.offsetParent !== null) {
                // Formatting for HTML display
                let recsHtml = data.recommendations.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                resultDiv.innerHTML = `<strong>🤖 AI Recommendations</strong><br><br>${recsHtml}`;
                resultDiv.style.display = 'block';
            } else {
                alert(`Property Recommendations:\n\n${data.recommendations}`);
            }
        } else {
            showMessage('Failed to get recommendations', 'error');
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'error');
    }
}

function handleRecommendationsForm(e) {
    e.preventDefault();
    if (!authToken) {
        showMessage('Please login to get recommendations', 'error');
        return;
    }

    const location = document.getElementById('recLocation').value;
    const minPrice = document.getElementById('minBudget').value;
    const maxPrice = document.getElementById('maxBudget').value;
    const type = document.getElementById('recType').value;

    const resultDiv = document.getElementById('recommendationsResult');
    if (resultDiv) {
        resultDiv.innerHTML = '<div class="loading">Finding the best matches for you...</div>';
        resultDiv.style.display = 'block';
    }

    getRecommendations({
        location,
        minPrice,
        maxPrice,
        propertyType: type
    });
}

function openMarketAnalysis() {
    const location = prompt('Enter location for market analysis:');
    if (location) {
        getMarketAnalysis(location);
    }
}

async function getMarketAnalysis(location) {
    try {
        const response = await fetch(`${API_BASE}/ai/market-analysis?location=${encodeURIComponent(location)}`);
        const data = await response.json();

        if (response.ok) {
            alert(`Market Analysis for ${location}:\n\n${data.analysis}`);
        } else {
            showMessage('Failed to get market analysis', 'error');
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'error');
    }
}

async function getAIAnalysis(propertyId) {
    const question = prompt('Ask a question about this property:');
    if (question) {
        try {
            const response = await fetch(`${API_BASE}/ai/tour-assistant`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    propertyId,
                    question
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert(`AI Assistant Response:\n\n${data.response}`);
            } else {
                showMessage('Failed to get AI analysis', 'error');
            }
        } catch (error) {
            showMessage('Network error. Please try again.', 'error');
        }
    }
}

function contactAgent(propertyId) {
    alert('Contact feature would open messaging system with the agent.');
}

// Utility functions
function showMessage(message, type = 'info') {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 3000;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        animation: slideIn 0.3s, fadeOut 0.3s 2.7s;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
    `;

    document.body.appendChild(toast);

    // Remove toast after animation
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
}

// Property Form Functions
let selectedImages = [];
let currentEditPropertyId = null;

window.editProperty = async function (propertyId) {
    try {
        const response = await fetch(`${API_BASE}/properties/${propertyId}`);
        const data = await response.json();
        if (response.ok) {
            const property = data.data;
            document.getElementById('propertyTitle').value = property.title;
            document.getElementById('propertyDescription').value = property.description;
            document.getElementById('propertyPrice').value = property.price;
            document.getElementById('propertyTypeSelect').value = property.type;
            document.getElementById('propertyLocation').value = property.location;
            document.getElementById('propertyBedrooms').value = property.bedrooms || '';
            document.getElementById('propertyBathrooms').value = property.bathrooms || '';
            document.getElementById('propertyArea').value = property.area || '';
            document.getElementById('propertyAmenities').value = property.amenities ? property.amenities.join(', ') : '';

            currentEditPropertyId = propertyId;
            const modalTitle = document.querySelector('#addPropertyModal h2');
            if (modalTitle) modalTitle.textContent = 'Edit Property';
            const submitBtn = document.querySelector('#addPropertyForm button[type="submit"]');
            if (submitBtn) submitBtn.textContent = 'Update Property';

            document.getElementById('propertyModal').style.display = 'none';
            openModal('addPropertyModal');
        }
    } catch (error) {
        showMessage('Failed to load property for editing', 'error');
    }
};

window.deleteProperty = async function (propertyId) {
    if (!confirm('Are you sure you want to delete this property?')) return;
    try {
        const response = await fetch(`${API_BASE}/properties/${propertyId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (response.ok) {
            showMessage('Property deleted successfully', 'success');
            closeModal();
            const myPropertiesBtn = document.getElementById('myPropertiesBtn');
            if (myPropertiesBtn && myPropertiesBtn.textContent === 'All Properties') {
                loadProperties({ 'myProperties': 'true' });
            } else {
                loadProperties();
            }
        } else {
            showMessage('Failed to delete property', 'error');
        }
    } catch (error) {
        showMessage('Network error while deleting', 'error');
    }
};

function handleImagePreview(e) {
    const files = e.target.files;
    const previewContainer = document.getElementById('imagePreview');
    previewContainer.innerHTML = '';

    selectedImages = Array.from(files);

    selectedImages.forEach((file, index) => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';
                previewItem.innerHTML = `
                    <img src="${e.target.result}" alt="Preview ${index + 1}">
                    <button type="button" class="remove-image" onclick="removeImage(${index})">×</button>
                `;
                previewContainer.appendChild(previewItem);
            };
            reader.readAsDataURL(file);
        }
    });
}

function removeImage(index) {
    selectedImages.splice(index, 1);

    // Update file input
    const dataTransfer = new DataTransfer();
    selectedImages.forEach(file => dataTransfer.items.add(file));
    document.getElementById('propertyImages').files = dataTransfer.files;

    // Refresh preview
    handleImagePreview({ target: { files: dataTransfer.files } });
}

async function handleAddProperty(e) {
    e.preventDefault();

    if (!authToken) {
        showMessage('Please login as a seller to add properties', 'error');
        return;
    }

    // Get form data
    const formData = new FormData();
    formData.append('title', document.getElementById('propertyTitle').value);
    formData.append('description', document.getElementById('propertyDescription').value);
    formData.append('price', document.getElementById('propertyPrice').value);
    formData.append('type', document.getElementById('propertyTypeSelect').value);
    formData.append('location', document.getElementById('propertyLocation').value);

    const bedrooms = document.getElementById('propertyBedrooms').value;
    const bathrooms = document.getElementById('propertyBathrooms').value;
    const area = document.getElementById('propertyArea').value;
    const amenities = document.getElementById('propertyAmenities').value;

    if (bedrooms) formData.append('bedrooms', bedrooms);
    if (bathrooms) formData.append('bathrooms', bathrooms);
    if (area) formData.append('area', area);
    if (amenities) {
        // Split amenities by comma and clean whitespace
        const amenityArray = amenities.split(',').map(item => item.trim()).filter(item => item);
        formData.append('amenities', amenityArray);
    }

    // Add images
    const imageFiles = document.getElementById('propertyImages').files;
    for (let i = 0; i < imageFiles.length; i++) {
        formData.append('images', imageFiles[i]);
    }

    try {
        const url = currentEditPropertyId
            ? `${API_BASE}/properties/${currentEditPropertyId}`
            : `${API_BASE}/properties`;
        const method = currentEditPropertyId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('Property added successfully!', 'success');
            closeModal();
            resetPropertyForm();
            // Small delay to ensure property is saved before refreshing
            setTimeout(() => {
                // Check if we're viewing user's properties and refresh accordingly
                const myPropertiesBtn = document.getElementById('myPropertiesBtn');
                if (myPropertiesBtn && myPropertiesBtn.textContent === 'All Properties') {
                    loadProperties({ 'myProperties': 'true' });
                } else {
                    loadProperties(); // Refresh all properties
                }
            }, 500);
        } else {
            showMessage(data.message || 'Failed to add property', 'error');
        }
    } catch (error) {
        console.error('Error adding property:', error);
        showMessage('Network error. Please try again.', 'error');
    }
}

function resetPropertyForm() {
    document.getElementById('addPropertyForm').reset();
    document.getElementById('imagePreview').innerHTML = '';
    selectedImages = [];
    currentEditPropertyId = null;
    const modalTitle = document.querySelector('#addPropertyModal h2');
    if (modalTitle) modalTitle.textContent = 'Add New Property';
    const submitBtn = document.querySelector('#addPropertyForm button[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Add Property';
}

// Mobile navigation
function setupMobileNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function () {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking on links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
}

// Keyboard shortcuts for modals
function setupModalKeyboardShortcuts() {
    document.addEventListener('keydown', function (e) {
        // Close modals with ESC key
        if (e.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal[style*="display: block"]');
            if (openModals.length > 0) {
                closeModal();
            }
        }

        // Submit form with Ctrl+Enter in add property modal
        if (e.ctrlKey && e.key === 'Enter') {
            const addPropertyModal = document.getElementById('addPropertyModal');
            if (addPropertyModal && addPropertyModal.style.display === 'block') {
                document.getElementById('addPropertyForm').dispatchEvent(new Event('submit'));
            }
        }
    });
}

// Add CSS for toast animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);