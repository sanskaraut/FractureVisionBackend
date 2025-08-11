// googleUsername.js
// Handles username prompt after Google OAuth if needed

import { supabase } from './supabaseClient.js';

window.addEventListener('DOMContentLoaded', async () => {
  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  // Check if username exists
  const resp = await fetch('/api/auth/google/callback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, supabase_id: user.id })
  });
  const data = await resp.json();
  if (data.needUsername) {
    document.getElementById('username-modal').style.display = 'block';
  } else {
    window.location.href = 'index.html';
  }
});

// Handle username submission

async function setUsername() {
  const username = document.getElementById('username-input').value.trim();
  const errorMsg = document.getElementById('username-error');
  errorMsg.textContent = '';
  if (!username) {
    errorMsg.textContent = 'Username required.';
    return;
  }
  // Check uniqueness and set username
  const { data: { user } } = await supabase.auth.getUser();
  const resp = await fetch('/api/auth/set-username', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ supabase_id: user.id, username })
  });
  const result = await resp.json();
  if (!resp.ok) {
    errorMsg.textContent = result.error || 'Failed to set username.';
    return;
  }
  window.location.href = 'index.html';
}

document.getElementById('set-username-btn').addEventListener('click', setUsername);
