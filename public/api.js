// public/api.js
// Central API helper + offline queue

const API_BASE =
  window.API_BASE ||
  `${window.location.origin.replace(/\/$/, "")}/api`;

const AUTH_TOKEN_KEY = "authToken";
const OFFLINE_QUEUE_KEY = "offlineQueue:v1";

function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function saveQueuedRequest(entry) {
  try {
    const existing = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]");
    existing.push(entry);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error("Failed to queue offline request", e);
  }
}

async function flushOfflineQueue() {
  let queue;
  try {
    queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]");
  } catch {
    queue = [];
  }
  if (!queue.length) return;

  const remaining = [];
  for (const item of queue) {
    try {
      await apiCall(item.url, item.options, { allowQueue: false });
    } catch (e) {
      // If still failing (e.g. server down), keep it
      remaining.push(item);
    }
  }
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
}

window.addEventListener("online", () => {
  flushOfflineQueue();
});

async function apiCall(url, options = {}, meta = { allowQueue: true }) {
  const token = getAuthToken();
  const finalOptions = {
    method: options.method || "GET",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  const isRead = finalOptions.method === "GET";

  if (!navigator.onLine && !isRead && meta.allowQueue) {
    saveQueuedRequest({ url, options: finalOptions });
    return { success: true, queued: true };
  }

  let res;
  try {
    res = await fetch(url, finalOptions);
  } catch (e) {
    if (!isRead && meta.allowQueue) {
      saveQueuedRequest({ url, options: finalOptions });
      return { success: true, queued: true };
    }
    throw e;
  }

  if (res.status === 401) {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    // let caller handle redirect; avoid hard‑coded login page
    throw new Error("Unauthorized");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || `Request failed with status ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

// Existing helpers (properties, locations, etc.)
export async function fetchProperties(query = "") {
  return apiCall(`${API_BASE}/properties${query}`);
}
export async function fetchLocations() {
  return apiCall(`${API_BASE}/properties/locations`);
}
export async function fetchPriceRange() {
  return apiCall(`${API_BASE}/properties/price-range`);
}
export async function toggleFavorite(propertyId) {
  return apiCall(`${API_BASE}/properties/${propertyId}/favorite`, {
    method: "POST",
  });
}
export async function fetchFavorites() {
  return apiCall(`${API_BASE}/properties/favorites/my`);
}
export async function fetchPropertyById(id) {
  return apiCall(`${API_BASE}/properties/${id}`);
}
// New: fetch user profile (agent info)
export async function fetchUserProfile(userId) {
  // Assuming backend provides endpoint /api/users/:id
  return apiCall(`${API_BASE}/users/${userId}`);
}
// New: fetch current logged‑in user details
export async function fetchCurrentUser() {
  // Assuming endpoint /api/users/profile returns current user
  return apiCall(`${API_BASE}/users/profile`);
}

// Messages
export async function sendMessageApi({ receiver, property, message }) {
  return apiCall(`${API_BASE}/messages`, {
    method: "POST",
    body: JSON.stringify({ receiver, property, message }),
  });
}

export async function getMyConversationsApi() {
  return apiCall(`${API_BASE}/messages`);
}

export async function getThreadWithUserApi(userId, { property } = {}) {
  const q = property ? `?property=${encodeURIComponent(property)}` : "";
  return apiCall(`${API_BASE}/messages/${userId}${q}`);
}

export async function markMessageReadApi(id) {
  return apiCall(`${API_BASE}/messages/${id}/read`, { method: "PUT" });
}

// Calls
export async function logCallApi({ receiver, property, phoneNumber, status }) {
  return apiCall(`${API_BASE}/calls/log`, {
    method: "POST",
    body: JSON.stringify({ receiver, property, phoneNumber, status }),
  });
}

// Bookings
export async function createBookingApi(payload) {
  return apiCall(`${API_BASE}/bookings`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getMyBookingsApi() {
  return apiCall(`${API_BASE}/bookings/my`);
}

export async function updateBookingStatusApi(id, body) {
  return apiCall(`${API_BASE}/bookings/${id}/status`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

// Search history
export async function saveSearchHistoryApi(payload) {
  return apiCall(`${API_BASE}/users/search-history`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getSearchHistoryApi() {
  return apiCall(`${API_BASE}/users/search-history`);
}
