function updateActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href') || '';
    link.classList.toggle('active', href === path || (path === 'property-detail.html' && href === 'properties.html'));
  });
}

function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
}

window.addEventListener('DOMContentLoaded', () => {
  updateActiveNav();
});
