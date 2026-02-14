import { Client } from "https://cdn.jsdelivr.net/npm/@gradio/client@1.6.0/dist/index.min.js";

const CONFIG = {
    HF_SPACE_URL: "https://texmexdex-vote.hf.space",
    STORAGE_KEY: "design_vote"
};

let gradioClient = null;
let designs = [];

// Initialize the application
async function init() {
    updateStatus("Connecting to backend...", "connecting");
    
    try {
        gradioClient = await Client.connect(CONFIG.HF_SPACE_URL);
        updateStatus("Connected to backend", "connected");
        await loadDesigns();
    } catch (error) {
        updateStatus("Backend connection failed", "error");
        showError(`Failed to connect to backend: ${error.message}`);
        throw error;
    }
}

// Update connection status indicator
function updateStatus(message, state) {
    const statusEl = document.getElementById("status");
    statusEl.textContent = message;
    statusEl.className = `status ${state}`;
}

// Load designs and vote counts from backend
async function loadDesigns() {
    try {
        const result = await gradioClient.predict("/get_designs");
        // Gradio returns data in result.data array, first element is our response
        designs = Array.isArray(result.data) ? result.data[0] : result.data;
        renderGallery();
    } catch (error) {
        showError(`Failed to load designs: ${error.message}`);
        throw error;
    }
}

// Render the gallery
function renderGallery() {
    const gallery = document.getElementById("gallery");
    const currentVote = localStorage.getItem(CONFIG.STORAGE_KEY);
    
    gallery.innerHTML = designs.map(design => `
        <div class="gallery-item ${currentVote ? 'voted' : ''} ${currentVote === design.id ? 'current-vote' : ''}" data-id="${design.id}">
            <div class="image-container">
                <img src="${design.image_url}" alt="${design.name}">
            </div>
            <div class="vote-bar">
                <span class="design-name">${design.name}</span>
                <span class="vote-count">${design.votes}</span>
            </div>
            <button class="vote-button" onclick="handleVote('${design.id}')" ${currentVote && currentVote !== design.id ? 'disabled' : ''}>
                ${currentVote === design.id ? 'Change Vote' : 'Vote'}
            </button>
        </div>
    `).join('');
}

// Handle vote submission
window.handleVote = async function(designId) {
    const currentVote = localStorage.getItem(CONFIG.STORAGE_KEY);
    
    try {
        const result = await gradioClient.predict("/submit_vote", {
            design_id: designId,
            previous_vote: currentVote || ""
        });
        
        // Gradio returns data in result.data array, first element is our response
        const response = Array.isArray(result.data) ? result.data[0] : result.data;
        
        if (response.success) {
            localStorage.setItem(CONFIG.STORAGE_KEY, designId);
            designs = response.designs;
            renderGallery();
        } else {
            showError(response.message || "Vote failed");
        }
    } catch (error) {
        showError(`Failed to submit vote: ${error.message}`);
        throw error;
    }
}

// Display error message
function showError(message) {
    const main = document.querySelector("main");
    const existingError = document.querySelector(".error-message");
    
    if (existingError) {
        existingError.remove();
    }
    
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.textContent = message;
    main.insertBefore(errorDiv, main.firstChild);
}

// Start the application
init();
