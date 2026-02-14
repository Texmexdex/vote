import { Client } from "https://cdn.jsdelivr.net/npm/@gradio/client@1.6.0/dist/index.min.js";

const CONFIG = {
    HF_SPACE_URL: "https://texmexdex-vote.hf.space",
    STORAGE_KEY: "design_vote"
};

let gradioClient = null;
let designs = [];

// Initialize the application
async function init() {
    try {
        gradioClient = await Client.connect(CONFIG.HF_SPACE_URL);
        await loadDesigns();
    } catch (error) {
        showError(`Failed to connect to backend: ${error.message}`);
        throw error;
    }
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
    
    gallery.innerHTML = designs.map((design, index) => `
        <div class="gallery-item ${currentVote === design.id ? 'current-vote' : ''}" 
             data-id="${design.id}" 
             style="--item-index: ${index}">
            <div class="image-container" onclick="openModal('${design.id}')">
                <img src="${design.image_url}" alt="${design.name}" loading="lazy">
            </div>
            <div class="vote-bar">
                <span class="design-name">${design.name}</span>
                <span class="vote-count">${design.votes}</span>
            </div>
            <button class="vote-button ${currentVote === design.id ? 'cancel' : ''}" 
                    onclick="handleVote('${design.id}')">
                ${currentVote === design.id ? 'Cancel Vote' : 'Vote'}
            </button>
        </div>
    `).join('');
}

// Open image zoom modal
window.openModal = function(designId) {
    const design = designs.find(d => d.id === designId);
    if (!design) return;
    
    const modal = document.getElementById("imageModal");
    const modalImage = document.getElementById("modalImage");
    const modalDesignName = document.getElementById("modalDesignName");
    const modalVoteCount = document.getElementById("modalVoteCount");
    
    modalImage.src = design.image_url;
    modalImage.alt = design.name;
    modalDesignName.textContent = design.name;
    modalVoteCount.textContent = design.votes;
    
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
}

// Close image zoom modal
window.closeModal = function() {
    const modal = document.getElementById("imageModal");
    modal.classList.remove("active");
    document.body.style.overflow = "auto";
}

// Close modal on background click
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById("imageModal");
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
});

// Handle vote submission
window.handleVote = async function(designId) {
    const currentVote = localStorage.getItem(CONFIG.STORAGE_KEY);
    
    // If clicking on current vote, cancel it
    if (currentVote === designId) {
        try {
            const result = await gradioClient.predict("/submit_vote", {
                design_id: "",
                previous_vote: currentVote
            });
            
            const response = Array.isArray(result.data) ? result.data[0] : result.data;
            
            if (response.success) {
                localStorage.removeItem(CONFIG.STORAGE_KEY);
                designs = response.designs;
                renderGallery();
            } else {
                showError(response.message || "Failed to cancel vote");
            }
        } catch (error) {
            showError(`Failed to cancel vote: ${error.message}`);
            throw error;
        }
        return;
    }
    
    // Otherwise, submit new vote
    try {
        const result = await gradioClient.predict("/submit_vote", {
            design_id: designId,
            previous_vote: currentVote || ""
        });
        
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
