// signup.js
// Handles signup with unique username using Supabase

import { supabase } from './supabaseClient.js';

const signupForm = document.getElementById('signup-form');
const errorMsg = document.getElementById('signup-error');

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorMsg.textContent = '';

  const username = signupForm.username.value.trim();
  const email = signupForm.email.value.trim();
  const password = signupForm.password.value;

    if (!username || !email || !password) {
      errorMsg.textContent = 'All fields are required.';
      return;
    }
  
    // Call backend to handle signup and username uniqueness
    const resp = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const result = await resp.json();
    if (!resp.ok) {
      errorMsg.textContent = result.error || 'Signup failed.';
      return;
    }
    window.location.href = 'index.html';
});
