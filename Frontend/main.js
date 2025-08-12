// main.js
// TODO: Make sure you have your supabaseClient.js and auth.js files in a './js/' folder
import { supabase } from './js/supabaseClient.js';
import { signInWithGoogle, signOut, getSessionToken } from './js/auth.js';

document.addEventListener("DOMContentLoaded", function() {
    
    // --- AUTHENTICATION & UI LOGIC ---
    const authContainer = document.getElementById('auth-container');
    const profileContainer = document.getElementById('profile-container');
    const profileIcon = profileContainer.querySelector('.profile-icon');
    const profileDropdown = profileContainer.querySelector('.profile-dropdown');
    
    supabase.auth.onAuthStateChange((event, session) => {
        const isSignedIn = !!session?.user;
        authContainer.style.display = isSignedIn ? 'none' : 'list-item';
        profileContainer.style.display = isSignedIn ? 'list-item' : 'none';
    });

    authContainer.querySelector('.google-btn').addEventListener('click', signInWithGoogle);
    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        signOut();
    });
    
    profileIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle('show');
    });

    window.addEventListener('click', () => {
        if (profileDropdown.classList.contains('show')) {
            profileDropdown.classList.remove('show');
        }
    });

    // --- FILE UPLOAD AND REDIRECT LOGIC ---
    const uploadButton = document.getElementById('upload-button');
    const xrayUploadInput = document.getElementById('xray-upload');

    uploadButton.addEventListener('click', () => xrayUploadInput.click());

    xrayUploadInput.addEventListener('change', (event) => {
        const file = event.target.files?.[0];
        if (file) handleFileUpload(file);
    });

    const handleFileUpload = async (file) => {
        const token = await getSessionToken();
        if (!token) {
            alert("Please sign in to upload.");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        uploadButton.textContent = 'Uploading...';
        uploadButton.disabled = true;

        try {
            const response = await fetch('http://localhost:5500/api/upload', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token },
                body: formData
            });

            if (!response.ok) throw new Error((await response.json()).error || 'Upload failed.');

            const data = await response.json();
            window.location.href = `output.html?id=${data.upload.id}`;

        } catch (error) {
            alert(`Error: ${error.message}`);
            uploadButton.textContent = 'Upload X-Ray & Get Started';
            uploadButton.disabled = false;
        }
    };
    
    // --- HERO CANVAS ANIMATION ---
    // TODO: Remember to copy your canvas animation code here from your original file.
});