const ACCESS_PASSWORD = "raffle2024";

// Service Worker Registration and Update Detection
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('ServiceWorker registered:', registration.scope);
                
                // Check for updates every 60 seconds
                setInterval(() => {
                    registration.update();
                }, 60000);
                
                // Listen for new service worker waiting
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New service worker available, prompt user
                            if (confirm('A new version is available! Reload to update?')) {
                                newWorker.postMessage({ type: 'SKIP_WAITING' });
                                window.location.reload();
                            }
                        }
                    });
                });
            })
            .catch((error) => {
                console.log('ServiceWorker registration failed:', error);
            });
        
        // Reload page when new service worker takes control
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
        });
    });
}

// IMMEDIATELY enforce login screen on script load (before DOMContentLoaded)
if (typeof document !== 'undefined') {
    // This runs as soon as the script loads
    const enforceLoginScreen = () => {
        const loginScreen = document.getElementById('login-screen');
        const appContent = document.getElementById('app-content');
        
        if (loginScreen) {
            loginScreen.style.display = 'flex';
            loginScreen.style.visibility = 'visible';
        }
        
        if (appContent) {
            appContent.style.display = 'none';
            appContent.style.visibility = 'hidden';
        }
    };
    
    // Try to enforce immediately if DOM is already loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', enforceLoginScreen);
    } else {
        enforceLoginScreen();
    }
}

function verifyAccess() {
    console.log('verifyAccess called');
    
    const passwordInput = document.getElementById('access-password');
    const password = passwordInput ? passwordInput.value : '';
    const errorDiv = document.getElementById('login-error');
    
    console.log('Password entered:', password);
    console.log('Expected password:', ACCESS_PASSWORD);
    console.log('Match:', password === ACCESS_PASSWORD);
    
    if (password === ACCESS_PASSWORD) {
        console.log('Password correct! Showing main content...');
        
        try {
            // Hide login screen - use setProperty with important to override inline styles
            const loginScreen = document.getElementById('login-screen');
            console.log('Login screen element:', loginScreen);
            if (loginScreen) {
                loginScreen.style.setProperty('display', 'none', 'important');
                loginScreen.style.setProperty('visibility', 'hidden', 'important');
                console.log('Login screen hidden');
            }
            
            // Show main content - use setProperty with important to override inline styles
            const appContent = document.getElementById('app-content');
            console.log('App content element:', appContent);
            if (appContent) {
                appContent.style.setProperty('display', 'block', 'important');
                appContent.style.setProperty('visibility', 'visible', 'important');
                console.log('App content shown');
            }
            
            // Show raffle selector
            const raffleSelector = document.getElementById('raffle-selector');
            console.log('Raffle selector element:', raffleSelector);
            if (raffleSelector) {
                raffleSelector.style.setProperty('display', 'block', 'important');
                console.log('Raffle selector shown');
            }
            
            // Clear password field
            if (passwordInput) {
                passwordInput.value = '';
            }
            
            // Hide error message
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
            
            // Initialize the app
            console.log('Calling loadRaffles...');
            loadRaffles().then(() => {
                console.log('loadRaffles completed successfully');
            }).catch(err => {
                console.error('Error in loadRaffles:', err);
            });
            
        } catch (error) {
            console.error('Error in verifyAccess:', error);
            alert('An error occurred: ' + error.message);
        }
    } else {
        console.log('Password incorrect!');
        if (errorDiv) {
            errorDiv.textContent = 'Invalid password. Please try again.';
            errorDiv.style.display = 'block';
        }
        if (passwordInput) {
            passwordInput.value = '';
            passwordInput.focus();
        }
    }
}

// Remove the CONFIG definition comments and add verification
console.log('Checking CONFIG availability:', typeof CONFIG !== 'undefined' ? 'Available' : 'Not Available');
console.log('CONFIG object:', window.CONFIG || CONFIG);

// Use window.CONFIG as fallback
const APP_CONFIG = window.CONFIG || CONFIG || { baseUrl: window.location.origin };
console.log('Using APP_CONFIG:', APP_CONFIG);

window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Error: ', msg, '\nURL: ', url, '\nLine: ', lineNo, '\nColumn: ', columnNo, '\nError object: ', error);
    return false;
};

function createConfetti() {
    const colors = ['#ffd700', '#ff0000', '#00ff00', '#0099ff', '#ff69b4'];
    const confettiCount = 200;
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '9999';
    document.body.appendChild(container);

    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'absolute';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.top = '-10px';
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        container.appendChild(confetti);

        const animation = confetti.animate([
            { transform: `translate(0, 0) rotate(${Math.random() * 360}deg)` },
            { transform: `translate(${Math.random() * 100 - 50}px, ${window.innerHeight}px) rotate(${Math.random() * 720}deg)` }
        ], {
            duration: Math.random() * 2000 + 2000,
            easing: 'cubic-bezier(.37,0,.63,1)'
        });

        animation.onfinish = () => confetti.remove();
    }

    setTimeout(() => container.remove(), 4000);
}

let currentRaffle = null;

async function loadRaffles() {
    try {
        const res = await fetch(`${APP_CONFIG.baseUrl}/api/raffles`);  // Simplified
        const raffles = await res.json();
        const raffleList = document.getElementById("raffle-list");
        
        if (!Array.isArray(raffles) || raffles.length === 0) {
            raffleList.innerHTML = '<div class="empty-state"><p>📋 No raffles available</p><p class="empty-hint">Create your first raffle to get started</p></div>';
            return;
        }
        
        raffleList.innerHTML = raffles.map(raffle => {
            const drawDate = new Date(raffle.drawDate);
            const today = new Date();
            const daysUntil = Math.ceil((drawDate - today) / (1000 * 60 * 60 * 24));
            const isUpcoming = daysUntil > 0;
            
            return `
            <div class="raffle-card ${!isUpcoming ? 'raffle-expired' : ''}">
                ${raffle.thumbnail || raffle.image ? `
                <div class="raffle-image">
                    <img src="/uploads/${raffle.thumbnail ? 'thumbnails/' + raffle.thumbnail : raffle.image}" 
                         alt="${raffle.name}" 
                         onclick="selectRaffle('${raffle.id}')">
                    ${!isUpcoming ? '<div class="raffle-badge expired-badge">Closed</div>' : 
                      (daysUntil <= 3 ? '<div class="raffle-badge urgent-badge">Ending Soon</div>' : '')}
                </div>` : ''}
                <div class="raffle-card-content">
                    <div class="raffle-card-header" onclick="selectRaffle('${raffle.id}')">
                        <h3 class="raffle-title">${raffle.name}</h3>
                        ${isUpcoming ? `<span class="days-remaining">${daysUntil} day${daysUntil !== 1 ? 's' : ''} left</span>` : '<span class="days-remaining expired">Draw date passed</span>'}
                    </div>
                    <div class="raffle-details" onclick="selectRaffle('${raffle.id}')">
                        <div class="detail-item">
                            <span class="detail-icon">📅</span>
                            <div class="detail-content">
                                <span class="detail-label">Draw Date</span>
                                <span class="detail-value">${drawDate.toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                        </div>
                        <div class="detail-item">
                            <span class="detail-icon">🎁</span>
                            <div class="detail-content">
                                <span class="detail-label">Prize</span>
                                <span class="detail-value">${raffle.prize}</span>
                            </div>
                        </div>
                        <div class="detail-item">
                            <span class="detail-icon">💰</span>
                            <div class="detail-content">
                                <span class="detail-label">Ticket Cost</span>
                                <span class="detail-value">R${raffle.ticketCost.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="raffle-actions">
                        <button class="btn-select" onclick="selectRaffle('${raffle.id}')">Select Raffle</button>
                        <button class="btn-close" onclick="event.stopPropagation(); closeRaffle('${raffle.id}')">Close</button>
                    </div>
                </div>
            </div>
        `}).join("");
    } catch (error) {
        console.error('Error:', error);
        document.getElementById("raffle-list").innerHTML = `
            <div class="error-message">
                ⚠️ Error loading raffles. Please try refreshing the page.
            </div>`;
    }
}

// Add this new function for handling raffle closure
async function closeRaffle(raffleId) {
    if (!confirm('Are you sure you want to close this raffle? This action cannot be undone.')) {
        return;
    }

    try {
        const res = await fetch(`/api/raffles/${raffleId}`, {
            method: 'DELETE'
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to close raffle');
        }

        await loadRaffles();
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to close raffle: ' + error.message);
    }
}

async function deleteRaffle(raffleId) {
    if (!confirm('Are you sure you want to delete this raffle? This action cannot be undone.')) {
        return;
    }

    try {
        const res = await fetch(`/api/raffles/${raffleId}`, {
            method: 'DELETE'
        });

        if (!res.ok) {
            throw new Error('Failed to delete raffle');
        }

        await loadRaffles();
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to delete raffle');
    }
}

function showNewRaffleForm() {
    document.getElementById("raffle-selector").style.display = "none";
    document.getElementById("new-raffle-form").style.display = "block";
    
    // Reset form title and button for creating new raffle
    document.querySelector('#new-raffle-form h2').textContent = 'Create New Raffle';
    const submitButton = document.querySelector('#new-raffle-form .btn-primary');
    submitButton.textContent = 'Create Raffle';
    submitButton.setAttribute('onclick', 'createRaffle()');
    
    // Clear all form fields
    document.getElementById('raffle-name').value = '';
    document.getElementById('draw-date').value = '';
    document.getElementById('prize').value = '';
    document.getElementById('ticket-cost').value = '10';
    document.getElementById('payment-link').value = '';
    document.getElementById('raffle-image').value = '';
    
    // Reset banking details section
    document.getElementById("banking-required").checked = false;
    document.getElementById("banking-details-section").style.display = "none";
    document.getElementById("account-owner").value = "";
    document.getElementById("bank-name").value = "";
    document.getElementById("branch-code").value = "";
    document.getElementById("account-number").value = "";
    document.getElementById("account-type").value = "";
}

function toggleBankingDetails(isRequired) {
    const bankingSection = document.getElementById("banking-details-section");
    if (isRequired) {
        bankingSection.style.display = "block";
    } else {
        bankingSection.style.display = "none";
        // Clear banking fields when hidden
        document.getElementById("account-owner").value = "";
        document.getElementById("bank-name").value = "";
        document.getElementById("branch-code").value = "";
        document.getElementById("account-number").value = "";
        document.getElementById("account-type").value = "";
    }
}

function showRaffleSelector() {
    document.getElementById("raffle-content").style.display = "none";
    document.getElementById("new-raffle-form").style.display = "none";
    document.getElementById("raffle-selector").style.display = "block";
    loadRaffles();
}

async function createRaffle() {
    const name = document.getElementById("raffle-name").value;
    const drawDate = document.getElementById("draw-date").value;
    const prize = document.getElementById("prize").value;
    const ticketCost = parseFloat(document.getElementById("ticket-cost").value);
    const paymentLink = document.getElementById("payment-link").value;
    const bankingRequired = document.getElementById("banking-required").checked;
    const imageFile = document.getElementById("raffle-image").files[0];

    // Validate basic fields
    if (!name || !drawDate || !prize || !ticketCost || !paymentLink) {
        alert("Please fill all required fields");
        return;
    }

    // Build FormData for file upload
    const formData = new FormData();
    formData.append('name', name);
    formData.append('drawDate', drawDate);
    formData.append('prize', prize);
    formData.append('ticketCost', ticketCost);
    formData.append('paymentLink', paymentLink);

    // If banking is required, validate and include banking details
    if (bankingRequired) {
        const accountOwner = document.getElementById("account-owner").value;
        const bankName = document.getElementById("bank-name").value;
        const branchCode = document.getElementById("branch-code").value;
        const accountNumber = document.getElementById("account-number").value;
        const accountType = document.getElementById("account-type").value;

        if (!accountOwner || !bankName || !branchCode || !accountNumber || !accountType) {
            alert("Please fill all banking details fields");
            return;
        }

        formData.append('bankingDetails', JSON.stringify({
            accountOwner,
            bankName,
            branchCode,
            accountNumber,
            accountType
        }));
    }

    // Add image if selected
    if (imageFile) {
        formData.append('image', imageFile);
    }

    try {
        // Use APP_CONFIG instead of CONFIG
        console.log('APP_CONFIG:', APP_CONFIG);
        console.log('Using base URL:', APP_CONFIG.baseUrl);
        
        const url = `${APP_CONFIG.baseUrl}/api/raffles`;
        console.log('Fetching URL:', url);
        
        const res = await fetch(url, {
            method: "POST",
            body: formData  // Send FormData instead of JSON
        });

        console.log('Response status:', res.status);

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Failed to create raffle");
        }
        
        const result = await res.json();
        console.log('Raffle created:', result);
        
        // Clear form
        document.getElementById("raffle-name").value = "";
        document.getElementById("draw-date").value = "";
        document.getElementById("prize").value = "";
        document.getElementById("ticket-cost").value = "";
        document.getElementById("payment-link").value = "";
        document.getElementById("raffle-image").value = "";
        document.getElementById("banking-required").checked = false;
        document.getElementById("banking-details-section").style.display = "none";
        document.getElementById("account-owner").value = "";
        document.getElementById("bank-name").value = "";
        document.getElementById("branch-code").value = "";
        document.getElementById("account-number").value = "";
        document.getElementById("account-type").value = "";
        
        await loadRaffles();
        showRaffleSelector();
    } catch (error) {
        console.error('Error creating raffle:', error);
        alert(`Failed to create raffle: ${error.message}`);
    }
}

async function selectRaffle(raffleId) {
    try {
        const res = await fetch(`/api/raffles/${raffleId}`);
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to fetch raffle');
        }
        
        const raffle = await res.json();
        console.log('Loaded raffle:', raffle); // Debug log
        
        currentRaffle = raffleId;
        
        // Store current raffle data for editing
        window.currentRaffleData = raffle;
        
        // Update header
        document.getElementById("current-raffle-name").textContent = raffle.name;
        document.getElementById("raffle-id-badge").textContent = `ID: ${raffle.id}`;
        document.getElementById("draw-date-display").textContent = new Date(raffle.drawDate).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
        document.getElementById("prize-display").textContent = raffle.prize;
        document.getElementById("ticket-cost-display").textContent = `R${raffle.ticketCost.toFixed(2)}`;
        
        // Display thumbnail/image if available
        const headerImageContainer = document.getElementById('raffle-header-image');
        const headerImg = document.getElementById('raffle-header-img');
        if (raffle.thumbnail || raffle.image) {
            const imagePath = raffle.thumbnail ? `/uploads/thumbnails/${raffle.thumbnail}` : `/uploads/${raffle.image}`;
            headerImg.src = imagePath;
            headerImg.alt = raffle.name;
            headerImageContainer.style.display = 'block';
        } else {
            headerImageContainer.style.display = 'none';
        }
        
        // Display previous winner if exists
        const winnerElement = document.getElementById("winner");
        if (raffle.drawn && raffle.winner) {
            winnerElement.innerHTML = `
                <div class="winner-reveal">
                    <div class="winner-title">🎉 Draw Result 🎉</div>
                    <div class="winner-text">${raffle.winner}</div>
                    <button class="contact-winner-btn" onclick="showWinnerContact('${raffleId}')">
                        Contact Winner
                    </button>
                </div>`;
        } else {
            winnerElement.innerHTML = '';
        }
        
        document.getElementById("raffle-selector").style.display = "none";
        document.getElementById("raffle-content").style.display = "block";
        
        await loadBuyers();
    } catch (error) {
        console.error('Error selecting raffle:', error);
        alert(`Failed to load raffle: ${error.message}`);
    }
}

function editRaffle() {
    if (!window.currentRaffleData) {
        alert('No raffle data available');
        return;
    }
    
    const raffle = window.currentRaffleData;
    
    // Change form title and button text to indicate editing
    document.querySelector('#new-raffle-form h2').textContent = 'Edit Raffle';
    const submitButton = document.querySelector('#new-raffle-form .btn-primary');
    submitButton.textContent = 'Update Raffle';
    submitButton.setAttribute('onclick', 'updateRaffle()');
    
    // Populate the form with current raffle data
    document.getElementById('raffle-name').value = raffle.name;
    document.getElementById('draw-date').value = raffle.drawDate;
    document.getElementById('prize').value = raffle.prize;
    document.getElementById('ticket-cost').value = raffle.ticketCost;
    document.getElementById('payment-link').value = raffle.paymentLink || '';
    
    // Note: Image cannot be repopulated in file input for security reasons
    // User would need to re-upload if they want to change it
    
    // Handle banking details if they exist
    if (raffle.bankingDetails) {
        document.getElementById('banking-required').checked = true;
        toggleBankingDetails(true);
        document.getElementById('account-owner').value = raffle.bankingDetails.accountOwner || '';
        document.getElementById('bank-name').value = raffle.bankingDetails.bankName || '';
        document.getElementById('branch-code').value = raffle.bankingDetails.branchCode || '';
        document.getElementById('account-number').value = raffle.bankingDetails.accountNumber || '';
        document.getElementById('account-type').value = raffle.bankingDetails.accountType || '';
    } else {
        document.getElementById('banking-required').checked = false;
        toggleBankingDetails(false);
    }
    
    // Show the form
    document.getElementById("raffle-selector").style.display = "none";
    document.getElementById("raffle-content").style.display = "none";
    document.getElementById("new-raffle-form").style.display = "block";
}

async function updateRaffle() {
    if (!window.currentRaffleData || !currentRaffle) {
        alert('No raffle data available for update');
        return;
    }
    
    const name = document.getElementById("raffle-name").value;
    const drawDate = document.getElementById("draw-date").value;
    const prize = document.getElementById("prize").value;
    const ticketCost = parseFloat(document.getElementById("ticket-cost").value);
    const paymentLink = document.getElementById("payment-link").value;
    const bankingRequired = document.getElementById("banking-required").checked;
    const imageFile = document.getElementById("raffle-image").files[0];

    // Validate basic fields
    if (!name || !drawDate || !prize || !ticketCost || !paymentLink) {
        alert("Please fill all required fields");
        return;
    }

    // Build FormData for file upload
    const formData = new FormData();
    formData.append('name', name);
    formData.append('drawDate', drawDate);
    formData.append('prize', prize);
    formData.append('ticketCost', ticketCost);
    formData.append('paymentLink', paymentLink);

    // If banking is required, validate and include banking details
    if (bankingRequired) {
        const accountOwner = document.getElementById("account-owner").value;
        const bankName = document.getElementById("bank-name").value;
        const branchCode = document.getElementById("branch-code").value;
        const accountNumber = document.getElementById("account-number").value;
        const accountType = document.getElementById("account-type").value;

        if (!accountOwner || !bankName || !branchCode || !accountNumber || !accountType) {
            alert("Please fill all banking details fields");
            return;
        }

        formData.append('bankingDetails', JSON.stringify({
            accountOwner,
            bankName,
            branchCode,
            accountNumber,
            accountType
        }));
    }

    // Add image if selected (optional on update)
    if (imageFile) {
        formData.append('image', imageFile);
    }

    try {
        const url = `${APP_CONFIG.baseUrl}/api/raffles/${currentRaffle}`;
        console.log('Updating raffle at:', url);
        
        const res = await fetch(url, {
            method: "PUT",
            body: formData
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Failed to update raffle");
        }
        
        const result = await res.json();
        console.log('Raffle updated:', result);
        
        alert('Raffle updated successfully!');
        
        // Hide form and show raffle content
        document.getElementById("new-raffle-form").style.display = "none";
        document.getElementById("raffle-content").style.display = "block";
        
        // Reload the raffle to show updated data
        await selectRaffle(currentRaffle);
        
    } catch (error) {
        console.error('Error updating raffle:', error);
        alert(`Failed to update raffle: ${error.message}`);
    }
}

async function loadBuyers() {
    if (!currentRaffle) return;

    try {
        const res = await fetch(`/api/buyers/${currentRaffle}`);
        const buyers = await res.json();
        const div = document.getElementById("buyers");
        
        if (!Array.isArray(buyers) || buyers.length === 0) {
            div.innerHTML = '<div class="empty-state"><p>📋 No buyers registered yet</p><p class="empty-hint">Add your first buyer to get started</p></div>';
            return;
        }
        
        const totalTickets = buyers.reduce((sum, b) => sum + b.tickets, 0);
        const totalPaid = buyers.filter(b => b.paymentReceived).reduce((sum, b) => sum + b.tickets, 0);
        
        div.innerHTML = `
            <div class="buyer-summary">
                <div class="summary-card">
                    <span class="summary-icon">🎟️</span>
                    <div class="summary-content">
                        <span class="summary-value">${totalTickets}</span>
                        <span class="summary-label">Total Tickets</span>
                    </div>
                </div>
                <div class="summary-card">
                    <span class="summary-icon">👥</span>
                    <div class="summary-content">
                        <span class="summary-value">${buyers.length}</span>
                        <span class="summary-label">Buyers</span>
                    </div>
                </div>
                <div class="summary-card">
                    <span class="summary-icon">✅</span>
                    <div class="summary-content">
                        <span class="summary-value">${totalPaid}/${totalTickets}</span>
                        <span class="summary-label">Paid</span>
                    </div>
                </div>
            </div>
            <div class="buyers-list">
                ${buyers.map(b => {
                    const purchaseDate = new Date(b.purchaseDate);
                    return `
                    <div class="buyer-card ${b.paymentReceived ? 'paid' : 'unpaid'}">
                        <div class="buyer-card-header">
                            <div class="buyer-identity">
                                <div class="buyer-avatar">${b.name.charAt(0)}${b.surname.charAt(0)}</div>
                                <div class="buyer-name-section">
                                    <h4 class="buyer-name">${b.name} ${b.surname}</h4>
                                    <span class="buyer-number">Buyer #${b.buyerNumber}</span>
                                </div>
                            </div>
                            <div class="payment-badge ${b.paymentReceived ? 'paid-badge' : 'pending-badge'}">
                                ${b.paymentReceived ? '✓ Paid' : '⏱ Pending'}
                            </div>
                        </div>
                        
                        <div class="buyer-details-grid">
                            <div class="buyer-detail-item">
                                <span class="buyer-detail-icon">📧</span>
                                <div class="buyer-detail-content">
                                    <span class="buyer-detail-label">Email</span>
                                    <span class="buyer-detail-value">${b.email}</span>
                                </div>
                            </div>
                            ${b.mobile ? `
                            <div class="buyer-detail-item">
                                <span class="buyer-detail-icon">📱</span>
                                <div class="buyer-detail-content">
                                    <span class="buyer-detail-label">Mobile</span>
                                    <span class="buyer-detail-value">${b.mobile}</span>
                                </div>
                            </div>
                            ` : ''}
                            <div class="buyer-detail-item">
                                <span class="buyer-detail-icon">🎟️</span>
                                <div class="buyer-detail-content">
                                    <span class="buyer-detail-label">Tickets</span>
                                    <span class="buyer-detail-value">${b.tickets} ticket${b.tickets !== 1 ? 's' : ''}</span>
                                </div>
                            </div>
                            <div class="buyer-detail-item">
                                <span class="buyer-detail-icon">📅</span>
                                <div class="buyer-detail-content">
                                    <span class="buyer-detail-label">Purchased</span>
                                    <span class="buyer-detail-value">${purchaseDate.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="ticket-numbers-section">
                            <span class="ticket-numbers-label">Ticket Numbers:</span>
                            <div class="ticket-numbers">
                                ${b.ticket_numbers.map(n => `<span class="ticket-number-chip">#${n.toString().padStart(6, '0')}</span>`).join('')}
                            </div>
                        </div>
                        
                        <div class="buyer-actions">
                            <label class="payment-checkbox">
                                <input type="checkbox" 
                                    data-buyer-number="${b.buyerNumber}"
                                    ${b.paymentReceived ? 'checked' : ''} 
                                    onchange="togglePaymentStatus(${b.buyerNumber}, this.checked)">
                                <span>Mark as Paid</span>
                            </label>
                            <div class="buyer-action-buttons">
                                <button class="btn-request" 
                                    onclick="showPaymentOptions(${b.buyerNumber}, ${b.tickets})"
                                    ${b.paymentReceived ? 'disabled' : ''}>
                                    💳 Request Payment
                                </button>
                                <button class="btn-delete" onclick="deleteBuyer(${b.buyerNumber})">
                                    🗑️ Delete
                                </button>
                            </div>
                        </div>
                    </div>
                `}).join('')}
            </div>`;
    } catch (error) {
        console.error('Error:', error);
        document.getElementById("buyers").innerHTML = `
            <div class="error-message">
                ⚠️ Error loading buyers. Please try refreshing the page.
            </div>`;
    }
}

async function requestPayment(buyerNumber, ticketCount) {
    try {
        // Get buyer details
        const buyerRes = await fetch(`/api/buyers/${currentRaffle}/${buyerNumber}`);
        if (!buyerRes.ok) {
            throw new Error('Buyer not found');
        }
        const buyer = await buyerRes.json();
        console.log('Buyer details:', buyer); // Debug log
        
        // Extract initial and surname from buyer name
        const nameParts = buyer.name.trim().split(' ').filter(Boolean);
        const initial = nameParts[0].charAt(0);
        const surname = nameParts[nameParts.length - 1];
        const paymentReference = `${initial}${surname}`.toUpperCase();
        
        console.log('Generated payment reference:', paymentReference); // Debug log

        // Get raffle details
        const raffleRes = await fetch(`/api/raffles`);
        if (!raffleRes.ok) {
            throw new Error('Failed to fetch raffle details');
        }
        const raffles = await raffleRes.json();
        const raffle = raffles.find(r => r.id === currentRaffle);

        if (!raffle) {
            throw new Error('Raffle not found');
        }

        const totalAmount = (ticketCount * raffle.ticketCost).toFixed(2);
        
        // Build banking details section
        let bankingInfo = '';
        if (raffle.bankingDetails) {
            bankingInfo = `\n\nBanking Details:\n- Account Owner: ${raffle.bankingDetails.accountOwner}\n- Bank Name: ${raffle.bankingDetails.bankName}\n- Branch Code: ${raffle.bankingDetails.branchCode}\n- Account Number: ${raffle.bankingDetails.accountNumber}\n- Account Type: ${raffle.bankingDetails.accountType}`;
        }
        else
            { 
                bankingInfo = 'No EFT banking available for this raffle';
            }

        const emailSubject = `${raffle.name} - Payment Request for Raffle Tickets`;
        const emailBody = `Dear ${buyer.name},

Thank you for purchasing tickets for the ${raffle.name} raffle.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RAFFLE PURCHASE DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Number of Tickets: ${ticketCount}
• Cost per Ticket: R${raffle.ticketCost.toFixed(2)}
• Total Amount: R${totalAmount}
• Payment Reference: ${paymentReference}

${bankingInfo}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CAPITEC PAYMENT OPTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If you have a Capitec bank account (and banking app), you can use the following payment link to complete your payment quickly and easily:

Capitec Payment Link: ${raffle.paymentLink}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROOF OF PAYMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please send proof of payment by responding to this email once the payment is made.

If you have any questions or need further assistance, feel free to contact us.

Best regards,
Raffle Team`;

        // Check if mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            // On mobile, use mailto which will open the default email client
            const mailtoUrl = `mailto:${encodeURIComponent(buyer.email)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
            window.location.href = mailtoUrl;
        } else {
            // On desktop, try Gmail web first, fallback to mailto
            const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(buyer.email)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
            
            // Try to open Gmail in new tab
            const gmailWindow = window.open(gmailUrl, '_blank');
            
            // If popup was blocked, fallback to mailto
            if (!gmailWindow || gmailWindow.closed || typeof gmailWindow.closed === 'undefined') {
                const mailtoUrl = `mailto:${encodeURIComponent(buyer.email)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
                window.location.href = mailtoUrl;
            }
        }

    } catch (error) {
        console.error('Error in requestPayment:', error);
        alert('Failed to send payment request: ' + error.message);
    }
}

async function togglePaymentStatus(buyerNumber, paid) {
    try {
        console.log(`Updating payment status for buyer #${buyerNumber} to ${paid}`);
        const res = await fetch(`/api/buyers/${currentRaffle}/${buyerNumber}/payment`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                paymentReceived: paid 
            })
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to update payment status');
        }

        // Reload the buyers list to update UI including summary stats
        await loadBuyers();

    } catch (error) {
        console.error('Error updating payment status:', error);
        alert('Failed to update payment status: ' + error.message);
        // Revert checkbox state on error
        const checkbox = document.querySelector(`input[data-buyer-number="${buyerNumber}"]`);
        if (checkbox) {
            checkbox.checked = !paid;
        }
    }
}

async function deleteBuyer(buyerNumber) {
    if (!currentRaffle) {
        alert("No raffle selected");
        return;
    }

    if (!confirm(`Are you sure you want to delete buyer #${buyerNumber}?`)) {
        return;
    }

    try {
        console.log(`Deleting buyer #${buyerNumber} from raffle ${currentRaffle}`); // Debug log
        const res = await fetch(`/api/buyers/${currentRaffle}/${buyerNumber}`, {
            method: "DELETE"
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to delete buyer');
        }

        // Reload the buyers list to update the display
        await loadBuyers();
    } catch (error) {
        console.error('Error deleting buyer:', error);
        alert('Failed to delete buyer: ' + error.message);
    }
}

async function drawWinner() {
    if (!currentRaffle) {
        alert("Please select a raffle first");
        return;
    }

    try {
        const winnerElement = document.getElementById("winner");
        winnerElement.innerHTML = '<div class="ticket-cycler"><div class="ticket-number"></div></div>';
        const cyclerElement = document.querySelector('.ticket-number');

        // Get all tickets for animation
        const response = await fetch(`/api/buyers/${currentRaffle}`);
        const buyers = await response.json();
        const tickets = buyers.flatMap(buyer => 
            buyer.ticket_numbers.map(number => ({
                number: number.toString().padStart(6, '0'),
                name: `${buyer.name} ${buyer.surname}`
            }))
        );

        if (tickets.length === 0) {
            winnerElement.innerHTML = '<div class="error-message">No tickets available for draw</div>';
            return;
        }

        let speed = 30;
        let cycleInterval;
        
        const cycleTickets = () => {
            const randomTicket = tickets[Math.floor(Math.random() * tickets.length)];
            cyclerElement.textContent = randomTicket.number;
        };

        // Draw winner from server
        const drawRes = await fetch(`/api/draw/${currentRaffle}`, {
            method: "POST"
        });

        if (!drawRes.ok) {
            const errorData = await drawRes.json();
            throw new Error(errorData.error || 'Failed to draw winner');
        }

        const drawData = await drawRes.json();
        
        // Start animation
        cycleInterval = setInterval(cycleTickets, speed);
        
        setTimeout(async () => {
            for (let i = 0; i < 20; i++) {
                await new Promise(resolve => {
                    clearInterval(cycleInterval);
                    speed += 20;
                    cycleInterval = setInterval(cycleTickets, speed);
                    setTimeout(resolve, 200);
                });
            }

            clearInterval(cycleInterval);
            
            // Show winner
            winnerElement.innerHTML = `
                <div class="winner-reveal">
                    <div class="winner-title">🎉 Winner! 🎉</div>
                    <div class="winner-text">${drawData.winner}</div>
                    <button class="contact-winner-btn" onclick="showWinnerContact('${currentRaffle}')">
                        Contact Winner
                    </button>
                </div>`;
            createConfetti();

        }, 2000);

    } catch (error) {
        console.error('Error drawing winner:', error);
        document.getElementById("winner").innerHTML = `
            <div class="error-message">
                Error drawing winner: ${error.message}
            </div>`;
    }
}

async function showWinnerContact(raffleId) {
    try {
        const [winnerRes, raffleRes] = await Promise.all([
            fetch(`/api/winners/${raffleId}`),
            fetch(`/api/raffles/${raffleId}`)
        ]);

        if (!winnerRes.ok || !raffleRes.ok) {
            throw new Error('Failed to fetch winner details');
        }
        
        const winner = await winnerRes.json();
        const raffle = await raffleRes.json();
        
        // Create email content
        const emailSubject = `${raffle.name} - Winner Announcement`;
        const emailBody = `Dear ${winner.name},

Congratulations! You are the winner of our ${raffle.name} raffle with your ticket #${winner.ticket.toString().padStart(6, '0')}.

Your prize is: ${raffle.prize}

Best regards,
Raffle Team`;

        // Create Gmail URL
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(winner.email)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

        // Function to open Chrome with Gmail
        const openChromeWithGmail = async () => {
            try {
                const response = await fetch('/api/open-chrome', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: gmailUrl })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to open Chrome');
                }
            } catch (error) {
                console.error('Error opening Chrome:', error);
                // Fallback to regular window.open
                window.open(gmailUrl, '_blank');
            }
        };

        // Create modal with winner details and email button
        const modal = document.createElement('div');
        modal.className = 'winner-modal';
        modal.innerHTML = `
            <div class="winner-modal-content">
                <h3>Winner Contact Details</h3>
                <div class="winner-details">
                    <p><strong>Name:</strong> ${winner.name} ${winner.surname}</p>
                    <p><strong>Email:</strong> ${winner.email}</p>
                    <p><strong>Mobile:</strong> ${winner.mobile || 'Not provided'}</p>
                    <p><strong>Winning Ticket:</strong> #${winner.ticket.toString().padStart(6, '0')}</p>
                </div>
                <div class="winner-modal-actions">
                    <button class="email-winner-btn" onclick="openChromeWithGmail()">
                        Send Gmail in Chrome
                    </button>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to load winner contact details');
    }
}

async function addBuyer() {
    if (!currentRaffle) {
        alert("Please select a raffle first");
        return;
    }

    // Get form values
    const name = document.getElementById("name").value.trim();
    const surname = document.getElementById("surname").value.trim();
    const mobile = document.getElementById("mobile").value.trim();
    const email = document.getElementById("email").value.trim();
    const tickets = parseInt(document.getElementById("tickets").value);
    const purchaseDate = document.getElementById("purchaseDate").value;

    // Validate required fields
    if (!name || !surname || !email || !tickets || !purchaseDate) {
        alert("Please fill all required fields");
        return;
    }

    // Validate email format
    if (!email.includes('@')) {
        alert("Please enter a valid email address");
        return;
    }

    // Validate tickets number
    if (tickets <= 0) {
        alert("Number of tickets must be greater than 0");
        return;
    }

    try {
        console.log('Adding buyer to raffle:', currentRaffle); // Debug log
        const res = await fetch(`/api/buyers/${currentRaffle}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                surname,
                mobile,
                email,
                tickets,
                purchaseDate,
                paymentReceived: false
            })
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to add buyer');
        }

        // Clear form
        document.getElementById("name").value = "";
        document.getElementById("surname").value = "";
        document.getElementById("mobile").value = "";
        document.getElementById("email").value = "";
        document.getElementById("tickets").value = "";
        
        // Keep today's date
        const today = new Date().toISOString().split('T')[0];
        document.getElementById("purchaseDate").value = today;

        // Refresh buyers list
        await loadBuyers();

    } catch (error) {
        console.error('Error adding buyer:', error);
        alert(error.message || 'Failed to add buyer');
    }
}

async function showPaymentOptions(buyerNumber, tickets) {
    const modal = document.createElement('div');
    modal.className = 'payment-modal';
    modal.innerHTML = `
        <div class="payment-modal-content">
            <div class="modal-header">
                <div class="modal-icon">💳</div>
                <h3>Choose Payment Method</h3>
                <p class="modal-subtitle">Select how you want to request payment</p>
            </div>
            <div class="payment-options">
                <button class="payment-option-btn qr-option" onclick="showQRCode(${buyerNumber}, ${tickets})">
                    <div class="option-icon">📱</div>
                    <div class="option-content">
                        <div class="option-title">QR Code</div>
                        <div class="option-description">Scan to open Capitec payment link</div>
                    </div>
                    <div class="option-arrow">→</div>
                </button>
                <button class="payment-option-btn email-option" onclick="sendEmailPayment(${buyerNumber}, ${tickets})">
                    <div class="option-icon">📧</div>
                    <div class="option-content">
                        <div class="option-title">Email Request</div>
                        <div class="option-description">Send payment details via email</div>
                    </div>
                    <div class="option-arrow">→</div>
                </button>
            </div>
            <button class="modal-cancel-btn" onclick="this.closest('.payment-modal').remove()">Cancel</button>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Add click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Add this new function to handle email payment
async function sendEmailPayment(buyerNumber, tickets) {
    console.log('sendEmailPayment called with:', { buyerNumber, tickets });
    
    // Remove modal first
    const modal = document.querySelector('.payment-modal');
    if (modal) {
        modal.remove();
    }
    
    // Call requestPayment with a slight delay to ensure modal is gone
    setTimeout(() => {
        requestPayment(buyerNumber, tickets);
    }, 100);
}

async function showQRCode(buyerNumber, tickets) {
    try {
        const res = await fetch(`/api/payment-qr/${currentRaffle}/${buyerNumber}`);
        if (!res.ok) {
            throw new Error('Failed to generate QR code');
        }
        
        const data = await res.json();
        
        const qrModal = document.createElement('div');
        qrModal.className = 'qr-modal';
        qrModal.innerHTML = `
            <div class="qr-modal-content">
                <div class="modal-header">
                    <div class="modal-icon qr-icon">📱</div>
                    <h3>Scan QR Code</h3>
                    <p class="modal-subtitle">For Capitec account holders only</p>
                </div>
                <div class="qr-code-container">
                    <img src="data:image/png;base64,${data.qr_code}" alt="Payment QR Code">
                </div>
                <div class="payment-info-card">
                    <div class="info-label">Payment Information</div>
                    <pre>${data.payment_info}</pre>
                </div>
                <div class="modal-actions">
                    <button class="btn-open-link" onclick="window.open('${data.payment_url}', '_blank')">
                        🔗 Open Payment Link
                    </button>
                    <button class="btn-modal-close" onclick="this.closest('.qr-modal').remove()">
                        Close
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(qrModal);
        
        // Remove the payment options modal
        const paymentModal = document.querySelector('.payment-modal');
        if (paymentModal) {
            paymentModal.remove();
        }
        
        // Add click outside to close
        qrModal.addEventListener('click', (e) => {
            if (e.target === qrModal) {
                qrModal.remove();
            }
        });
        
    } catch (error) {
        console.error('Error showing QR code:', error);
        alert('Failed to generate QR code: ' + error.message);
    }
}

// Initialize - Hide main content and show login FIRST
document.addEventListener('DOMContentLoaded', () => {
    // CRITICAL: Force login screen to show and hide main content
    const loginScreen = document.getElementById('login-screen');
    const appContent = document.getElementById('app-content');
    
    if (loginScreen) {
        loginScreen.style.display = 'flex';
        loginScreen.style.visibility = 'visible';
    }
    
    if (appContent) {
        appContent.style.display = 'none';
        appContent.style.visibility = 'hidden';
    }
    
    // Focus the password input
    const passwordInput = document.getElementById('access-password');
    if (passwordInput) {
        setTimeout(() => {
            passwordInput.focus();
        }, 100);
        
        // Add Enter key support
        passwordInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                verifyAccess();
            }
        });
    }

    // Set today's date as default for new buyers
    const today = new Date().toISOString().split('T')[0];
    const purchaseDateInput = document.getElementById('purchaseDate');
    if (purchaseDateInput) {
        purchaseDateInput.value = today;
    }

    // Register Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful:', registration.scope);
            })
            .catch(err => {
                console.error('ServiceWorker registration failed:', err);
            });
    }
});
