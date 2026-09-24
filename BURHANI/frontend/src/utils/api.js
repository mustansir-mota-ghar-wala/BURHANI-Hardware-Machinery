/**
 * Central fetch utility for Django API calls.
 * Handles CSRF tokens and credentials automatically.
 */

const BASE_URL = '';  // Empty = same origin (proxied via Vite in dev, same domain in prod)

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

async function ensureCsrf() {
  // Django sets the csrftoken cookie on any GET request
  // We just need to make sure we have it before posting
  const token = getCookie('csrftoken');
  if (!token) {
    await fetch('/api/react/user/', { credentials: 'include' });
  }
  return getCookie('csrftoken');
}

export async function apiGet(path) {
  const res = await fetch(BASE_URL + path, {
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
  });
  return res.json();
}

export async function apiPost(path, data = {}) {
  const csrfToken = await ensureCsrf();
  const res = await fetch(BASE_URL + path, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-CSRFToken': csrfToken || '',
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function apiPostForm(path, formData) {
  const csrfToken = await ensureCsrf();
  const res = await fetch(BASE_URL + path, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'X-CSRFToken': csrfToken || '',
    },
    body: formData,
  });
  return res.json();
}
