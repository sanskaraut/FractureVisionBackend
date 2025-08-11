import { supabase } from './supabaseClient.js';

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/index.html' }
  });
  if (error) alert(error.message);
}

export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = '/index.html';
}

export async function getSessionToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

export async function requireUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) window.location.href = '/index.html';
  return user;
}
