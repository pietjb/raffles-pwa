const ACCESS_PASSWORD = "nicolas2025";

// Screen Recording Variables
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;

// Detect if device is mobile
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Check if screen recording is supported
function isScreenRecordingSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
}

// Screen Recording Functions
async function startScreenRecording() {
    try {
        // Check if screen recording is supported
        if (!isScreenRecordingSupported()) {
            // For mobile devices, inform user and provide alternative
            if (isMobileDevice()) {
                alert(
                    '📱 Mobile Device Detected\n\n' +
                    'Screen recording is not supported on mobile devices.\n\n' +
                    '💡 Alternative for Audit:\n' +
                    '• Use another device to video record your screen\n' +
                    '• Take screenshots during the draw process\n' +
                    '• Use a screen recording app before starting\n\n' +
                    'The draw will continue without built-in recording.'
                );
            } else {
                alert(
                    '❌ Screen Recording Not Supported\n\n' +
                    'Your browser does not support screen recording.\n\n' +
                    'Please use a modern browser like:\n' +
                    '• Chrome/Edge (Desktop)\n' +
                    '• Firefox (Desktop)\n' +
                    '• Safari 14.1+ (macOS)\n\n' +
                    'The draw will continue without recording.'
                );
            }
            return false;
        }

        // Request screen capture
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                mediaSource: 'screen',
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                frameRate: { ideal: 30 }
            },
            audio: false
        });

        recordedChunks = [];
        
        // Create MediaRecorder with appropriate codec
        const options = { mimeType: 'video/webm;codecs=vp9' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options.mimeType = 'video/webm;codecs=vp8';
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'video/webm';
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    options.mimeType = 'video/mp4';
                }
            }
        }

        mediaRecorder = new MediaRecorder(displayStream, options);

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const mimeType = mediaRecorder.mimeType || 'video/webm';
            const blob = new Blob(recordedChunks, { type: mimeType });
            const url = URL.createObjectURL(blob);
            
            // Generate filename with raffle name and timestamp
            const raffleName = currentRaffle ? currentRaffle.replace(/[^a-z0-9]/gi, '_') : 'Raffle';
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
            const filename = `${raffleName}_Draw_Recording_${timestamp}.${extension}`;
            
            // Create download link
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
            
            // Stop all tracks
            displayStream.getTracks().forEach(track => track.stop());
            
            isRecording = false;
            updateRecordingUI(false);
        };

        mediaRecorder.start();
        isRecording = true;
        updateRecordingUI(true);
        
        console.log('Screen recording started for raffle draw');
        return true;
    } catch (error) {
        console.error('Failed to start screen recording:', error);
        
        // Provide user-friendly error message
        let errorMsg = 'Screen recording failed: ';
        if (error.name === 'NotAllowedError') {
            errorMsg += 'Permission denied or screen selection cancelled.';
        } else if (error.name === 'NotSupportedError') {
            errorMsg += 'Screen recording not supported on this device/browser.';
        } else {
            errorMsg += error.message;
        }
        errorMsg += '\n\nThe draw will continue without recording.';
        
        alert(errorMsg);
        return false;
    }
}

function stopScreenRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        console.log('Screen recording stopped');
    }
}

function updateRecordingUI(recording) {
    const recordBtn = document.getElementById('record-indicator');
    if (recordBtn) {
        if (recording) {
            recordBtn.innerHTML = '🔴 Recording...';
            recordBtn.classList.add('recording-active');
        } else {
            recordBtn.innerHTML = '';
            recordBtn.classList.remove('recording-active');
        }
    }
}

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
    const passwordInput = document.getElementById('access-password');
    const password = passwordInput ? passwordInput.value : '';
    const errorDiv = document.getElementById('login-error');
    
    if (password === ACCESS_PASSWORD) {
        try {
            // Hide login screen - use setProperty with important to override inline styles
            const loginScreen = document.getElementById('login-screen');
            if (loginScreen) {
                loginScreen.style.setProperty('display', 'none', 'important');
                loginScreen.style.setProperty('visibility', 'hidden', 'important');
            }
            
            // Show main content - use setProperty with important to override inline styles
            const appContent = document.getElementById('app-content');
            if (appContent) {
                appContent.style.setProperty('display', 'block', 'important');
                appContent.style.setProperty('visibility', 'visible', 'important');
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

// Use window.CONFIG as fallback
const APP_CONFIG = window.CONFIG || CONFIG || { baseUrl: window.location.origin };

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
            const isDrawn = raffle.drawn === true;
            
            // Determine status and badge
            let statusBadge = '';
            let statusClass = '';
            let daysDisplay = '';
            
            if (isDrawn) {
                statusBadge = '<div class="raffle-badge drawn-badge">🏆 Prize Drawn</div>';
                statusClass = 'raffle-drawn';
                daysDisplay = '<span class="days-remaining drawn">Prize Drawn</span>';
            } else if (!isUpcoming) {
                statusBadge = '<div class="raffle-badge expired-badge">Closed</div>';
                statusClass = 'raffle-expired';
                daysDisplay = '<span class="days-remaining expired">Draw date passed</span>';
            } else if (daysUntil <= 3) {
                statusBadge = '<div class="raffle-badge urgent-badge">Ending Soon</div>';
                daysDisplay = `<span class="days-remaining urgent">${daysUntil} day${daysUntil !== 1 ? 's' : ''} left</span>`;
            } else {
                daysDisplay = `<span class="days-remaining">${daysUntil} day${daysUntil !== 1 ? 's' : ''} left</span>`;
            }
            
            return `
            <div class="raffle-card ${statusClass}" onclick="selectRaffle('${raffle.id}')">
                <div class="raffle-card-layout">
                    ${raffle.thumbnail || raffle.image ? `
                    <div class="raffle-image">
                        <img src="/uploads/${raffle.thumbnail ? 'thumbnails/' + raffle.thumbnail : raffle.image}" 
                             alt="${raffle.name}">
                        ${statusBadge}
                    </div>` : ''}
                    <div class="raffle-card-content">
                        <div class="raffle-card-header">
                            <h3 class="raffle-title">${raffle.name}</h3>
                            ${daysDisplay}
                        </div>
                        <div class="raffle-details">
                            <div class="detail-row">
                                <span class="detail-icon">📅</span>
                                <span class="detail-label">Draw Date:</span>
                                <span class="detail-value">${drawDate.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-icon">🎁</span>
                                <span class="detail-label">Prize:</span>
                                <span class="detail-value">${raffle.prize}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-icon">💰</span>
                                <span class="detail-label">Ticket Cost:</span>
                                <span class="detail-value">R${raffle.ticketCost.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="raffle-actions">
                    <button class="btn-select" onclick="event.stopPropagation(); selectRaffle('${raffle.id}')">Select Raffle</button>
                    <button class="btn-close" onclick="event.stopPropagation(); closeRaffle('${raffle.id}')">Close</button>
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
    const organizerName = document.getElementById("organizer-name").value;
    const drawDate = document.getElementById("draw-date").value;
    const prize = document.getElementById("prize").value;
    const ticketCost = parseFloat(document.getElementById("ticket-cost").value);
    const paymentLink = document.getElementById("payment-link").value;
    const bankingRequired = document.getElementById("banking-required").checked;
    const imageFile = document.getElementById("raffle-image").files[0];

    // Validate basic fields
    if (!name || !organizerName || !drawDate || !prize || !ticketCost || !paymentLink) {
        alert("Please fill all required fields");
        return;
    }

    // Build FormData for file upload
    const formData = new FormData();
    formData.append('name', name);
    formData.append('organizerName', organizerName);
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
        document.getElementById("organizer-name").value = "";
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
        document.getElementById("organizer-name-display").textContent = raffle.organizerName || 'Not specified';
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
                    <div class="winner-announcement">We have a winner!</div>
                    <div class="winner-ticket-display">
                        <div class="winner-ticket-label">Winning Ticket</div>
                        <div class="winner-text">${raffle.winner}</div>
                    </div>
                    <div class="winner-actions">
                        <button class="contact-winner-btn" onclick="showWinnerDetails('${raffleId}')">
                            👤 Winner Details
                        </button>
                        <button class="notify-all-btn" onclick="notifyAllBuyers('${raffleId}', this)">
                            📧 Notify All Buyers
                        </button>
                        <button class="celebrate-btn" onclick="celebrateAgain()">
                            🎆 Celebrate Again!
                        </button>
                        <button class="redraw-btn" onclick="confirmRedraw()">
                            🔄 Re-Draw Winner
                        </button>
                    </div>
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
    document.getElementById('organizer-name').value = raffle.organizerName || '';
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
    const organizerName = document.getElementById("organizer-name").value;
    const drawDate = document.getElementById("draw-date").value;
    const prize = document.getElementById("prize").value;
    const ticketCost = parseFloat(document.getElementById("ticket-cost").value);
    const paymentLink = document.getElementById("payment-link").value;
    const bankingRequired = document.getElementById("banking-required").checked;
    const imageFile = document.getElementById("raffle-image").files[0];

    // Validate basic fields
    if (!name || !organizerName || !drawDate || !prize || !ticketCost || !paymentLink) {
        alert("Please fill all required fields");
        return;
    }

    // Build FormData for file upload
    const formData = new FormData();
    formData.append('name', name);
    formData.append('organizerName', organizerName);
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
                                <button class="btn-edit" onclick="editBuyer(${b.buyerNumber})">
                                    ✏️ Edit
                                </button>
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
        
        // Extract initial from first name and use surname field
        const initial = buyer.name.charAt(0);
        const surname = buyer.surname;
        const paymentReference = `${initial}${surname}`.toUpperCase();

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
        
        // Get full URL for raffle image/thumbnail if available
        const baseUrl = window.location.origin;
        const imageUrl = raffle.thumbnail ? `${baseUrl}/uploads/thumbnails/${raffle.thumbnail}` : 
                         raffle.image ? `${baseUrl}/uploads/${raffle.image}` : '';
        const imageInfo = imageUrl ? 
            `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🖼️ RAFFLE IMAGE\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nView the raffle image: ${imageUrl}\n` : '';
        
        const emailBody = `Dear ${buyer.name},

Thank you for purchasing tickets for the ${raffle.name} raffle.
${imageInfo}
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
${raffle.organizerName || 'Raffle Team'}`;

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
        
        // Ask user if they want to send confirmation email when marking as paid
        let sendEmail = false;
        if (paid) {
            sendEmail = confirm(
                '✅ Payment marked as received!\n\n' +
                '📧 Would you like to send a payment confirmation email to the buyer?\n\n' +
                'The email will include:\n' +
                '• Thank you message\n' +
                '• Ticket numbers\n' +
                '• Payment amount\n' +
                '• Prize details\n' +
                '• Draw date\n\n' +
                'Send confirmation email now?'
            );
        }
        
        const res = await fetch(`/api/buyers/${currentRaffle}/${buyerNumber}/payment`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                paymentReceived: paid,
                sendEmail: sendEmail
            })
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to update payment status');
        }

        const result = await res.json();
        
        // If user wants to send email and we have the data, open mailto
        if (sendEmail && result.buyer && result.raffle) {
            const buyer = result.buyer;
            const raffle = result.raffle;
            
            // Format ticket numbers
            const ticketList = buyer.ticket_numbers.map(t => `#${t}`).join(', ');
            
            // Format draw date
            const drawDate = new Date(raffle.drawDate);
            const formattedDate = drawDate.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            // Calculate total amount
            const totalAmount = (buyer.tickets * raffle.ticketCost).toFixed(2);
            
            // Get full URL for raffle image/thumbnail if available
            const baseUrl = window.location.origin;
            const imageUrl = raffle.thumbnail ? `${baseUrl}/uploads/thumbnails/${raffle.thumbnail}` : 
                             raffle.image ? `${baseUrl}/uploads/${raffle.image}` : '';
            const imageInfo = imageUrl ? 
                `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🖼️ RAFFLE IMAGE\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nView the raffle image: ${imageUrl}\n` : '';
            
            // Create email subject and body
            const emailSubject = `Payment Confirmed - ${raffle.name}`;
            const emailBody = `Dear ${buyer.name} ${buyer.surname},

🎉 RAFFLE PAYMENT CONFIRMED 🎉

Thank you for your purchase! We're excited to confirm that your payment has been received and processed successfully.
${imageInfo}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎟️ YOUR RAFFLE ENTRY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Raffle: ${raffle.name}
Number of Tickets: ${buyer.tickets}
Total Amount Paid: R${totalAmount}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎫 YOUR TICKET NUMBERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${ticketList}

Keep these numbers safe! You'll need them if you win.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏆 PRIZE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${raffle.prize}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 DRAW DATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${formattedDate}

Mark your calendar! The winner will be announced on this date.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Good luck! We'll notify you if you're the winner.

If you have any questions, please don't hesitate to contact us.

Best regards,
${raffle.organizerName || 'Raffle Team'}`;

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

async function editBuyer(buyerNumber) {
    if (!currentRaffle) {
        alert("No raffle selected");
        return;
    }

    try {
        // Fetch buyer details
        const res = await fetch(`/api/buyers/${currentRaffle}/${buyerNumber}`);
        if (!res.ok) {
            throw new Error('Buyer not found');
        }
        const buyer = await res.json();

        // Populate form with buyer data
        document.getElementById("buyer-name").value = buyer.name;
        document.getElementById("buyer-surname").value = buyer.surname;
        document.getElementById("buyer-email").value = buyer.email;
        document.getElementById("buyer-mobile").value = buyer.mobile || '';
        document.getElementById("buyer-tickets").value = buyer.tickets;

        // Show and update form
        const form = document.getElementById("add-buyer-form");
        const btn = document.getElementById('show-buyer-form-btn');
        
        form.style.display = 'block';
        btn.textContent = '✖️ Cancel';
        btn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        
        // Change form title and button
        document.getElementById("add-buyer-title").textContent = "Edit Buyer";
        const submitBtn = document.getElementById("buyer-submit-btn");
        submitBtn.textContent = "💾 Update Buyer";
        submitBtn.onclick = (e) => {
            e.preventDefault();
            updateBuyer(buyerNumber);
        };

        // Scroll to form
        form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (error) {
        console.error('Error loading buyer for edit:', error);
        alert('Failed to load buyer details: ' + error.message);
    }
}

async function updateBuyer(buyerNumber) {
    if (!currentRaffle) {
        alert("No raffle selected");
        return;
    }

    const name = document.getElementById("buyer-name").value.trim();
    const surname = document.getElementById("buyer-surname").value.trim();
    const email = document.getElementById("buyer-email").value.trim();
    const mobile = document.getElementById("buyer-mobile").value.trim();
    const tickets = parseInt(document.getElementById("buyer-tickets").value);

    if (!name || !surname || !email || !tickets) {
        alert("Please fill in all required fields");
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
        const res = await fetch(`/api/buyers/${currentRaffle}/${buyerNumber}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name,
                surname,
                email,
                mobile,
                tickets
            })
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to update buyer');
        }

        const result = await res.json();
        alert(`✅ ${result.message}`);

        // Hide the form
        hideAddBuyerForm();

        // Reload buyers list
        await loadBuyers();
    } catch (error) {
        console.error('Error updating buyer:', error);
        alert('Failed to update buyer: ' + error.message);
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

    // Scroll draw card into view for full visibility
    const drawCard = document.querySelector('.draw-winner-card');
    if (drawCard) {
        drawCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Wait briefly for scroll to complete
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Ask user if they want to record the draw
    let recordPromptMessage = '📹 Screen Recording for Audit\n\n';
    
    // Check if device supports screen recording
    if (!isScreenRecordingSupported()) {
        if (isMobileDevice()) {
            recordPromptMessage += '📱 NOTE: Screen recording is not supported on mobile devices.\n\n';
            recordPromptMessage += '💡 For audit purposes on mobile:\n';
            recordPromptMessage += '• Use another device to video record your screen\n';
            recordPromptMessage += '• Take screenshots during the draw\n';
            recordPromptMessage += '• Use a third-party screen recorder app\n\n';
            recordPromptMessage += 'Click OK to proceed with the draw (no recording).';
        } else {
            recordPromptMessage += '⚠️ Your browser does not support screen recording.\n\n';
            recordPromptMessage += 'Please use Chrome, Edge, Firefox, or Safari 14.1+\n\n';
            recordPromptMessage += 'Click OK to proceed with the draw (no recording).';
        }
        
        const proceed = confirm(recordPromptMessage);
        if (!proceed) {
            return;
        }
    } else {
        recordPromptMessage += 'Would you like to record this draw for audit purposes?\n\n';
        recordPromptMessage += '• The recording will capture the entire draw process\n';
        recordPromptMessage += '• Video will be automatically saved when draw completes\n';
        recordPromptMessage += '• You\'ll need to select which screen/window to record\n\n';
        recordPromptMessage += 'Click OK to record, or Cancel to proceed without recording.';
    }
    
    const shouldRecord = isScreenRecordingSupported() && confirm(recordPromptMessage);

    try {
        // Start recording if user agreed
        if (shouldRecord) {
            const recordingStarted = await startScreenRecording();
            if (!recordingStarted) {
                // User cancelled screen selection or error occurred
                const continueWithoutRecording = confirm(
                    'Recording was not started.\n\nDo you want to continue the draw without recording?'
                );
                if (!continueWithoutRecording) {
                    return;
                }
            }
        }

        const drawStage = document.getElementById("draw-stage");
        const narrativeElement = document.getElementById("draw-narrative");
        const winnerElement = document.getElementById("winner");
        const startButton = document.getElementById("btn-start-draw");
        const prizeDisplay = document.getElementById("draw-prize-display");
        
        // Clear previous results
        winnerElement.innerHTML = '';
        narrativeElement.innerHTML = '';
        
        // Show and populate prize display
        const raffleData = window.currentRaffleData;
        const prizeName = raffleData ? raffleData.prize : 'Amazing Prize';
        
        prizeDisplay.innerHTML = `
            <div class="prize-label">🎁 TODAY'S PRIZE</div>
            <div class="prize-name">${prizeName}</div>
        `;
        prizeDisplay.style.display = 'block';
        
        // Disable button
        startButton.disabled = true;
        startButton.textContent = 'Drawing...';

        // Get all buyers
        const response = await fetch(`/api/buyers/${currentRaffle}`);
        const allBuyers = await response.json();

        if (!Array.isArray(allBuyers) || allBuyers.length === 0) {
            narrativeElement.innerHTML = '<div class="error-message">⚠️ No buyers registered for this raffle</div>';
            startButton.disabled = false;
            startButton.textContent = '🎯 Start the Draw';
            return;
        }

        // Separate paid and unpaid buyers
        const paidBuyers = allBuyers.filter(buyer => buyer.paymentReceived === true);
        const unpaidBuyers = allBuyers.filter(buyer => !buyer.paymentReceived);

        // Check if there are unpaid buyers
        if (unpaidBuyers.length > 0) {
            const unpaidTickets = unpaidBuyers.reduce((sum, b) => sum + b.tickets, 0);
            const totalTickets = allBuyers.reduce((sum, b) => sum + b.tickets, 0);
            
            const proceedWithDraw = confirm(
                `⚠️ WARNING: Unpaid Tickets Detected!\n\n` +
                `• ${unpaidBuyers.length} buyer(s) have not paid\n` +
                `• ${unpaidTickets} unpaid ticket(s) out of ${totalTickets} total\n\n` +
                `Only PAID tickets will be included in the draw.\n` +
                `Unpaid buyers will be EXCLUDED.\n\n` +
                `Do you want to proceed with the draw?`
            );

            if (!proceedWithDraw) {
                startButton.disabled = false;
                startButton.textContent = '🎯 Start the Draw';
                return;
            }
        }

        // Use only paid buyers for the draw
        const buyers = paidBuyers;

        if (buyers.length === 0) {
            narrativeElement.innerHTML = '<div class="error-message">⚠️ No paid tickets available for draw. Please ensure buyers have paid before drawing.</div>';
            startButton.disabled = false;
            startButton.textContent = '🎯 Start the Draw';
            return;
        }

        // Get tickets only from paid buyers
        const tickets = buyers.flatMap(buyer => 
            buyer.ticket_numbers.map(number => ({
                number: number.toString().padStart(6, '0'),
                name: `${buyer.name} ${buyer.surname}`,
                buyerNumber: buyer.buyerNumber
            }))
        );

        const totalTickets = tickets.length;
        const totalBuyers = buyers.length;
        const excludedBuyers = unpaidBuyers.length;

        // Stage 1: Introduction with payment status (prize now shown separately above)
        const introMessage = excludedBuyers > 0 
            ? `<p>We have <strong>${totalTickets} paid tickets</strong> from <strong>${totalBuyers} paid participants</strong></p>
               <p class="narrative-subtext" style="color: #e53e3e;">⚠️ ${excludedBuyers} unpaid buyer(s) excluded from draw</p>
               <p class="narrative-subtext">Preparing the digital draw drum...</p>`
            : `<p>We have <strong>${totalTickets} tickets</strong> from <strong>${totalBuyers} participants</strong></p>
               <p class="narrative-subtext">All tickets are paid and eligible ✓</p>
               <p class="narrative-subtext">Preparing the digital draw drum...</p>`;

        await showNarrative(narrativeElement, `
            <div class="narrative-stage stage-intro">
                <div class="narrative-icon">🎪</div>
                <h3>Welcome to the Draw!</h3>
                ${introMessage}
            </div>
        `, 2500);

        // Stage 2: Shuffle announcement
        await showNarrative(narrativeElement, `
            <div class="narrative-stage stage-shuffle">
                <div class="narrative-icon">🔀</div>
                <h3>Shuffling All Tickets</h3>
                <p>Ensuring a fair and random selection...</p>
                <div class="shuffle-loader">
                    <div class="shuffle-bar"></div>
                </div>
            </div>
        `, 2000);

        // Stage 3: Countdown
        await countdown(narrativeElement);

        // Draw winner from server
        const drawRes = await fetch(`/api/draw/${currentRaffle}`, {
            method: "POST"
        });

        if (!drawRes.ok) {
            const errorData = await drawRes.json();
            throw new Error(errorData.error || 'Failed to draw winner');
        }

        const drawData = await drawRes.json();
        
        // Stage 4: Ticket cycling animation
        await showNarrative(narrativeElement, `
            <div class="narrative-stage stage-drawing">
                <div class="narrative-icon">🎲</div>
                <h3>Selecting the Winning Ticket...</h3>
                <div class="ticket-drum">
                    <div class="ticket-cycler">
                        <div class="ticket-number" id="cycling-ticket"></div>
                    </div>
                </div>
            </div>
        `, 0);

        // Animate ticket cycling
        await animateTicketCycle(tickets, drawData.winner);

        // Stage 5: Drum roll before reveal
        await showNarrative(narrativeElement, `
            <div class="narrative-stage stage-drumroll">
                <div class="narrative-icon pulse">🥁</div>
                <h3 class="drumroll-text">And the winner is...</h3>
                <div class="dots-loader">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `, 2000);

        // Stage 6: Winner reveal with celebration
        narrativeElement.innerHTML = '';
        
        // Keep prize display visible during celebration
        
        winnerElement.innerHTML = `
            <div class="winner-reveal winner-entrance">
                <div class="celebration-burst">🎊</div>
                <div class="winner-title">🎉 CONGRATULATIONS! 🎉</div>
                <div class="winner-announcement">We have a winner!</div>
                <div class="winner-ticket-display">
                    <div class="winner-ticket-label">Winning Ticket</div>
                    <div class="winner-text">${drawData.winner}</div>
                </div>
                <div class="winner-actions">
                    <button class="contact-winner-btn" onclick="showWinnerDetails('${currentRaffle}')">
                        👤 Winner Details
                    </button>
                    <button class="notify-all-btn" onclick="notifyAllBuyers('${currentRaffle}', this)">
                        📧 Notify All Buyers
                    </button>
                    <button class="celebrate-btn" onclick="celebrateAgain()">
                        🎆 Celebrate Again!
                    </button>
                    <button class="redraw-btn" onclick="confirmRedraw()">
                        🔄 Re-Draw Winner
                    </button>
                </div>
            </div>`;
        
        createConfetti();
        
        // Stop recording after a delay to capture the celebration
        if (isRecording) {
            setTimeout(() => {
                stopScreenRecording();
                alert('✅ Draw recording saved!\n\nThe video file has been downloaded to your device.');
            }, 3000); // Wait 3 seconds to capture celebration
        }
        
        // Re-enable button and update text
        startButton.disabled = false;
        startButton.textContent = '🎯 Draw Again';

    } catch (error) {
        console.error('Error drawing winner:', error);
        
        // Stop recording if there was an error
        if (isRecording) {
            stopScreenRecording();
        }
        
        // Hide prize display on error
        const prizeDisplay = document.getElementById("draw-prize-display");
        if (prizeDisplay) {
            prizeDisplay.style.display = 'none';
        }
        
        const narrativeElement = document.getElementById("draw-narrative");
        const startButton = document.getElementById("btn-start-draw");
        
        narrativeElement.innerHTML = `
            <div class="error-message">
                ❌ Error drawing winner: ${error.message}
            </div>`;
        
        startButton.disabled = false;
        startButton.textContent = '🎯 Start the Draw';
    }
}

function showNarrative(element, html, delay) {
    return new Promise(resolve => {
        element.innerHTML = html;
        if (delay > 0) {
            setTimeout(resolve, delay);
        } else {
            resolve();
        }
    });
}

function countdown(element) {
    return new Promise(async (resolve) => {
        for (let i = 3; i > 0; i--) {
            element.innerHTML = `
                <div class="narrative-stage stage-countdown">
                    <div class="countdown-number">${i}</div>
                    <p>Starting draw in...</p>
                </div>
            `;
            await new Promise(r => setTimeout(r, 1000));
        }
        resolve();
    });
}

function animateTicketCycle(tickets, winnerText) {
    return new Promise((resolve) => {
        const cyclerElement = document.getElementById('cycling-ticket');
        if (!cyclerElement) {
            resolve();
            return;
        }

        let speed = 30;
        let cycleInterval;
        let iterations = 0;
        const maxIterations = 100;
        
        const cycleTickets = () => {
            const randomTicket = tickets[Math.floor(Math.random() * tickets.length)];
            cyclerElement.textContent = randomTicket.number;
            iterations++;
            
            // Gradually slow down
            if (iterations > 60) {
                clearInterval(cycleInterval);
                speed += 15;
                cycleInterval = setInterval(cycleTickets, speed);
            }
            
            if (iterations >= maxIterations) {
                clearInterval(cycleInterval);
                resolve();
            }
        };
        
        cycleInterval = setInterval(cycleTickets, speed);
    });
}

function celebrateAgain() {
    createConfetti();
    // Play celebration sound if available
    const winnerReveal = document.querySelector('.winner-reveal');
    if (winnerReveal) {
        winnerReveal.classList.remove('winner-entrance');
        setTimeout(() => {
            winnerReveal.classList.add('winner-entrance');
        }, 10);
    }
}

function confirmRedraw() {
    const confirmation = confirm(
        '⚠️ Are you sure you want to re-draw the winner?\n\n' +
        'This will select a NEW random winner from all PAID tickets.\n' +
        'The current winner will be replaced.\n' +
        'Unpaid buyers will be excluded from the re-draw.\n\n' +
        'This action cannot be undone.'
    );
    
    if (confirmation) {
        // Scroll draw card into view for full visibility
        const drawCard = document.querySelector('.draw-winner-card');
        if (drawCard) {
            drawCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        // Clear current winner display
        document.getElementById('winner').innerHTML = '';
        document.getElementById('draw-narrative').innerHTML = '';
        
        // Re-enable the draw button
        const startButton = document.getElementById('btn-start-draw');
        startButton.disabled = false;
        startButton.textContent = '🎯 Start the Draw';
        
        // Trigger new draw (which will check for unpaid buyers automatically)
        drawWinner();
    }
}

async function notifyAllBuyers(raffleId, buttonElement) {
    try {
        // Get current raffle details
        const raffleRes = await fetch(`/api/raffles/${raffleId}`);
        if (!raffleRes.ok) {
            throw new Error('Failed to fetch raffle details');
        }
        
        const raffle = await raffleRes.json();
        
        if (!raffle || !raffle.winner) {
            alert('⚠️ No winner has been drawn yet.');
            return;
        }
        
        // Get all buyers for this raffle
        const buyersRes = await fetch(`/api/buyers/${raffleId}`);
        if (!buyersRes.ok) {
            throw new Error('Failed to fetch buyer details');
        }
        
        const allBuyers = await buyersRes.json();
        
        // Extract email addresses from buyers
        const buyerEmails = allBuyers
            .filter(buyer => buyer.email)
            .map(buyer => buyer.email);
        
        if (buyerEmails.length === 0) {
            alert('⚠️ No buyer email addresses found for this raffle.');
            return;
        }
        
        // Create email subject
        const emailSubject = `🎉 ${raffle.name} - Draw Result Announcement`;
        
        // Parse winner details from the winner string (format: "Winner: Ticket #123456 - Name Surname")
        const winnerText = raffle.winner;
        
        // Create a nicely formatted email body
        const emailBody = `Dear Valued Participant,

Thank you for participating in ${raffle.name}!

═══════════════════════════════════════════════════════════════

🎯 DRAW RESULT

${winnerText}

🎁 Prize: ${raffle.prize}
📅 Draw Date: ${raffle.drawDate}

═══════════════════════════════════════════════════════════════

We appreciate your participation in this raffle!

If you have any questions, please feel free to contact us.

Best regards,
${raffle.organizerName}

═══════════════════════════════════════════════════════════════`;
        
        // Confirm before opening Gmail
        const confirmed = confirm(
            '📧 OPEN GMAIL FOR WINNER NOTIFICATION\n\n' +
            `Raffle: ${raffle.name}\n` +
            `Winner: ${winnerText}\n` +
            `Recipients: ${buyerEmails.length} buyer(s)\n\n` +
            'Gmail will open with all ticket buyers pre-populated as recipients.\n' +
            'You can review and send the email from Gmail.\n\n' +
            'Continue?'
        );
        
        if (!confirmed) {
            return;
        }
        
        // Build Gmail URL with all recipients
        const allRecipientsStr = buyerEmails.join(',');
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(allRecipientsStr)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        
        // Try opening Gmail
        const gmailWindow = window.open(gmailUrl, '_blank');
        
        // If popup was blocked, fallback to mailto
        if (!gmailWindow) {
            const mailtoUrl = `mailto:${encodeURIComponent(allRecipientsStr)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
            window.location.href = mailtoUrl;
            alert('ℹ️ Gmail popup was blocked. Your default email client is opening instead.');
        } else {
            alert(`✅ Gmail opened with ${buyerEmails.length} recipient(s)!\n\nPlease review and send the email from Gmail.`);
        }
        
    } catch (error) {
        console.error('Error notifying buyers:', error);
        alert(`❌ Error preparing notifications:\n\n${error.message}`);
    }
}

async function showWinnerDetails(raffleId) {
    try {
        // Get raffle and winner info
        const raffleRes = await fetch(`/api/raffles/${raffleId}`);
        if (!raffleRes.ok) {
            throw new Error('Failed to fetch raffle details');
        }
        
        const raffle = await raffleRes.json();
        
        // Parse winner from raffle.winner string (format: "Winner: Ticket #123456 - Name Surname")
        const winnerMatch = raffle.winner.match(/Ticket #(\d+) - (.+)/);
        if (!winnerMatch) {
            throw new Error('Invalid winner format');
        }
        
        const winningTicket = winnerMatch[1];
        const winnerName = winnerMatch[2];
        
        // Get buyers to find winner's contact details
        const buyersRes = await fetch(`/api/buyers/${raffleId}`);
        const buyers = await buyersRes.json();
        
        // Find the buyer with the winning ticket
        const winner = buyers.find(buyer => 
            buyer.ticket_numbers.includes(parseInt(winningTicket))
        );
        
        if (!winner) {
            throw new Error('Winner contact details not found');
        }
        
        // Get full URL for raffle image/thumbnail if available
        const baseUrl = window.location.origin;
        const imageUrl = raffle.thumbnail ? `${baseUrl}/uploads/thumbnails/${raffle.thumbnail}` : 
                         raffle.image ? `${baseUrl}/uploads/${raffle.image}` : '';
        const imageInfo = imageUrl ? `\n\n🖼️ Raffle Image: ${imageUrl}` : '';
        
        // Create email content
        const emailSubject = `${raffle.name} - Winner Announcement`;
        const emailBody = `Dear ${winner.name} ${winner.surname},\n\nCongratulations! You are the winner of our ${raffle.name} raffle with your ticket #${winningTicket}.\n\nYour prize is: ${raffle.prize}${imageInfo}\n\nBest regards,\n${raffle.organizerName || 'Raffle Team'}`;
        
        // Create mailto link
        const mailtoLink = `mailto:${winner.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        
        // Create modal with winner details
        const modal = document.createElement('div');
        modal.className = 'winner-details-modal';
        modal.innerHTML = `
            <div class="modal-backdrop" onclick="this.parentElement.remove()"></div>
            <div class="winner-details-card">
                <div class="winner-details-header">
                    <div class="winner-details-icon">🏆</div>
                    <h2>Winner Details</h2>
                    <button class="modal-close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">
                        ✕
                    </button>
                </div>
                
                <div class="winner-details-body">
                    <div class="winner-info-section">
                        <div class="info-header">
                            <span class="info-icon">👤</span>
                            <h3>Personal Information</h3>
                        </div>
                        <div class="info-grid">
                            <div class="info-item">
                                <span class="info-label">Full Name</span>
                                <span class="info-value">${winner.name} ${winner.surname}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Email Address</span>
                                <span class="info-value">
                                    <a href="${mailtoLink}" class="email-link">${winner.email}</a>
                                </span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Mobile Number</span>
                                <span class="info-value">
                                    ${winner.mobile ? `<a href="tel:${winner.mobile}" class="phone-link">${winner.mobile}</a>` : '<span class="text-muted">Not provided</span>'}
                                </span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Buyer Number</span>
                                <span class="info-value">#${winner.buyerNumber}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="winner-info-section">
                        <div class="info-header">
                            <span class="info-icon">🎟️</span>
                            <h3>Ticket Information</h3>
                        </div>
                        <div class="info-grid">
                            <div class="info-item">
                                <span class="info-label">Winning Ticket</span>
                                <span class="info-value winning-ticket">#${winningTicket}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Total Tickets Purchased</span>
                                <span class="info-value">${winner.tickets} ticket${winner.tickets > 1 ? 's' : ''}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Purchase Date</span>
                                <span class="info-value">${new Date(winner.purchaseDate).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Payment Status</span>
                                <span class="info-value">
                                    <span class="status-badge ${winner.paymentReceived ? 'status-paid' : 'status-unpaid'}">
                                        ${winner.paymentReceived ? '✓ Paid' : '⚠ Unpaid'}
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="winner-info-section">
                        <div class="info-header">
                            <span class="info-icon">🎁</span>
                            <h3>Prize Information</h3>
                        </div>
                        <div class="prize-display">
                            <div class="prize-label">Winner will receive:</div>
                            <div class="prize-value">${raffle.prize}</div>
                        </div>
                    </div>
                </div>
                
                <div class="winner-details-footer">
                    <a href="${mailtoLink}" class="btn-email-winner">
                        ✉️ Send Email
                    </a>
                    ${winner.mobile ? `<a href="tel:${winner.mobile}" class="btn-call-winner">📞 Call Winner</a>` : ''}
                    <button class="btn-copy-details" onclick="copyWinnerDetails(${JSON.stringify(winner).replace(/"/g, '&quot;')}, '${winningTicket}', '${raffle.prize.replace(/'/g, "\\'")}')">📋 Copy Details</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Animate in
        setTimeout(() => {
            modal.querySelector('.winner-details-card').style.transform = 'translateY(0)';
            modal.querySelector('.winner-details-card').style.opacity = '1';
        }, 10);
        
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to load winner details: ' + error.message);
    }
}

function copyWinnerDetails(winner, winningTicket, prize) {
    const details = `Winner Details\n\nName: ${winner.name} ${winner.surname}\nEmail: ${winner.email}\nMobile: ${winner.mobile || 'Not provided'}\nWinning Ticket: #${winningTicket}\nTotal Tickets: ${winner.tickets}\nPrize: ${prize}`;
    
    navigator.clipboard.writeText(details).then(() => {
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = '✓ Copied!';
        btn.style.background = '#48bb78';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 2000);
    }).catch(err => {
        alert('Failed to copy details');
    });
}

async function exportRaffleData() {
    if (!currentRaffle) {
        alert("Please select a raffle first");
        return;
    }

    // Show export format selection modal
    const modal = document.createElement('div');
    modal.className = 'payment-modal';
    modal.innerHTML = `
        <div class="payment-modal-content" style="max-width: 520px; max-height: 90vh; overflow-y: auto;">
            <div class="modal-header" style="position: sticky; top: 0; background: white; z-index: 10; border-bottom: 1px solid #e2e8f0;">
                <h3 style="margin: 0; font-size: 1.3em; color: #2d3748;">� Export Raffle Data</h3>
                <button class="modal-close-btn" onclick="this.parentElement.parentElement.parentElement.remove()" 
                    style="background: #f7fafc; color: #2d3748; font-size: 1.5em; width: 36px; height: 36px; border-radius: 8px; border: 2px solid #e2e8f0; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; font-weight: 600;"
                    onmouseover="this.style.background='#ef4444'; this.style.color='white'; this.style.borderColor='#ef4444'"
                    onmouseout="this.style.background='#f7fafc'; this.style.color='#2d3748'; this.style.borderColor='#e2e8f0'">✕</button>
            </div>
            <div class="modal-body" style="padding: 32px 28px;">
                <p style="margin: 0 0 28px 0; color: #718096; font-size: 0.95em; line-height: 1.6;">
                    Choose the export format for your raffle data:
                </p>
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    <button class="btn-primary" onclick="exportAsCSV()" 
                        style="padding: 20px; font-size: 1em; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); border: none; border-radius: 10px; color: white; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3); text-align: left;"
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(72, 187, 120, 0.4)'"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(72, 187, 120, 0.3)'">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                            <span style="font-size: 1.8em;">📊</span>
                            <span style="font-size: 1.1em; font-weight: 600;">Export as CSV</span>
                        </div>
                        <div style="font-size: 0.88em; opacity: 0.95; padding-left: 46px; line-height: 1.5;">
                            Spreadsheet format with summary statistics and buyer details
                        </div>
                    </button>
                    <button class="btn-primary" onclick="exportAsJSON()" 
                        style="padding: 20px; font-size: 1em; background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%); border: none; border-radius: 10px; color: white; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3); text-align: left;"
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(66, 153, 225, 0.4)'"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(66, 153, 225, 0.3)'">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                            <span style="font-size: 1.8em;">📄</span>
                            <span style="font-size: 1.1em; font-weight: 600;">Export as JSON</span>
                        </div>
                        <div style="font-size: 0.88em; opacity: 0.95; padding-left: 46px; line-height: 1.5;">
                            Raw data files for backup and import (buyers.json + raffle_data.json)
                        </div>
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function exportAsCSV() {
    // Close modal
    document.querySelector('.payment-modal')?.remove();
    
    if (!currentRaffle) {
        alert("Please select a raffle first");
        return;
    }

    try {
        // Get raffle and buyers data
        const [raffleRes, buyersRes] = await Promise.all([
            fetch(`/api/raffles/${currentRaffle}`),
            fetch(`/api/buyers/${currentRaffle}`)
        ]);

        if (!raffleRes.ok || !buyersRes.ok) {
            throw new Error('Failed to fetch data');
        }

        const raffle = await raffleRes.json();
        const buyers = await buyersRes.json();

        // Create CSV content
        let csv = '';
        
        // Raffle information section
        csv += 'RAFFLE INFORMATION\n';
        csv += `Raffle Name,${escapeCSV(raffle.name)}\n`;
        csv += `Raffle ID,${raffle.id}\n`;
        csv += `Draw Date,${new Date(raffle.drawDate).toLocaleDateString('en-ZA')}\n`;
        csv += `Prize,${escapeCSV(raffle.prize)}\n`;
        csv += `Ticket Cost,R${raffle.ticketCost.toFixed(2)}\n`;
        csv += `Payment Link,${raffle.paymentLink}\n`;
        csv += `Draw Status,${raffle.drawn ? 'Completed' : 'Pending'}\n`;
        if (raffle.winner) {
            csv += `Winner,${escapeCSV(raffle.winner)}\n`;
        }
        csv += '\n';

        // Summary statistics
        const totalBuyers = buyers.length;
        const totalTickets = buyers.reduce((sum, b) => sum + b.tickets, 0);
        const paidBuyers = buyers.filter(b => b.paymentReceived).length;
        const paidTickets = buyers.filter(b => b.paymentReceived).reduce((sum, b) => sum + b.tickets, 0);
        const totalRevenue = buyers.filter(b => b.paymentReceived).reduce((sum, b) => sum + (b.tickets * raffle.ticketCost), 0);
        const pendingRevenue = buyers.filter(b => !b.paymentReceived).reduce((sum, b) => sum + (b.tickets * raffle.ticketCost), 0);

        csv += 'SUMMARY STATISTICS\n';
        csv += `Total Buyers,${totalBuyers}\n`;
        csv += `Total Tickets Sold,${totalTickets}\n`;
        csv += `Paid Buyers,${paidBuyers}\n`;
        csv += `Paid Tickets,${paidTickets}\n`;
        csv += `Unpaid Buyers,${totalBuyers - paidBuyers}\n`;
        csv += `Unpaid Tickets,${totalTickets - paidTickets}\n`;
        csv += `Total Revenue (Paid),R${totalRevenue.toFixed(2)}\n`;
        csv += `Pending Revenue (Unpaid),R${pendingRevenue.toFixed(2)}\n`;
        csv += `Potential Total Revenue,R${(totalRevenue + pendingRevenue).toFixed(2)}\n`;
        csv += '\n\n';

        // Buyers table header
        csv += 'BUYER DETAILS\n';
        csv += 'Buyer #,Name,Surname,Email,Mobile,Tickets,Purchase Date,Payment Status,Ticket Numbers\n';

        // Buyers data
        buyers.forEach(buyer => {
            const ticketNumbers = buyer.ticket_numbers.map(t => t.toString().padStart(6, '0')).join('; ');
            csv += `${buyer.buyerNumber},`;
            csv += `${escapeCSV(buyer.name)},`;
            csv += `${escapeCSV(buyer.surname)},`;
            csv += `${escapeCSV(buyer.email)},`;
            csv += `${buyer.mobile || 'N/A'},`;
            csv += `${buyer.tickets},`;
            csv += `${new Date(buyer.purchaseDate).toLocaleDateString('en-ZA')},`;
            csv += `${buyer.paymentReceived ? 'Paid' : 'Unpaid'},`;
            csv += `"${ticketNumbers}"\n`;
        });

        // Create and download file
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const fileName = `${raffle.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
        
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success message - find the export button
        const exportButtons = document.querySelectorAll('.btn-export');
        exportButtons.forEach(btn => {
            const originalText = btn.textContent;
            const originalBg = btn.style.background;
            btn.textContent = '✓ Exported!';
            btn.style.background = '#48bb78';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = originalBg;
            }, 2000);
        });

    } catch (error) {
        console.error('Error exporting data:', error);
        alert('Failed to export data: ' + error.message);
    }
}

async function exportAsJSON() {
    // Close modal
    document.querySelector('.payment-modal')?.remove();
    
    if (!currentRaffle) {
        alert("Please select a raffle first");
        return;
    }

    try {
        // Get raffle and buyers data
        const [raffleRes, buyersRes] = await Promise.all([
            fetch(`/api/raffles/${currentRaffle}`),
            fetch(`/api/buyers/${currentRaffle}`)
        ]);

        if (!raffleRes.ok || !buyersRes.ok) {
            throw new Error('Failed to fetch data');
        }

        const raffle = await raffleRes.json();
        const buyers = await buyersRes.json();

        // Create raffle_data.json structure
        const raffleData = {
            raffles: [raffle],
            current_raffle: currentRaffle
        };

        // Create buyers.json structure
        const buyersData = {
            [currentRaffle]: buyers
        };

        // Generate timestamp for filenames
        const timestamp = new Date().toISOString().split('T')[0];
        const raffleName = raffle.name.replace(/[^a-z0-9]/gi, '_');

        // Download raffle_data.json
        const raffleBlob = new Blob([JSON.stringify(raffleData, null, 2)], { type: 'application/json' });
        const raffleLink = document.createElement('a');
        raffleLink.href = URL.createObjectURL(raffleBlob);
        raffleLink.download = `${raffleName}_raffle_data_${timestamp}.json`;
        raffleLink.style.display = 'none';
        document.body.appendChild(raffleLink);
        raffleLink.click();
        document.body.removeChild(raffleLink);

        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500));

        // Download buyers.json
        const buyersBlob = new Blob([JSON.stringify(buyersData, null, 2)], { type: 'application/json' });
        const buyersLink = document.createElement('a');
        buyersLink.href = URL.createObjectURL(buyersBlob);
        buyersLink.download = `${raffleName}_buyers_${timestamp}.json`;
        buyersLink.style.display = 'none';
        document.body.appendChild(buyersLink);
        buyersLink.click();
        document.body.removeChild(buyersLink);

        // Show success message
        const exportButtons = document.querySelectorAll('.btn-export');
        exportButtons.forEach(btn => {
            const originalText = btn.textContent;
            const originalBg = btn.style.background;
            btn.textContent = '✓ 2 Files Exported!';
            btn.style.background = '#48bb78';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = originalBg;
            }, 2500);
        });

    } catch (error) {
        console.error('Error exporting JSON:', error);
        alert('Failed to export JSON data: ' + error.message);
    }
}

function escapeCSV(str) {
    if (str === null || str === undefined) return '';
    str = str.toString();
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

function showImportRaffleDialog() {
    const modal = document.createElement('div');
    modal.className = 'payment-modal';
    modal.innerHTML = `
        <div class="payment-modal-content" style="max-width: 580px; max-height: 90vh; overflow-y: auto;">
            <div class="modal-header" style="position: sticky; top: 0; background: white; z-index: 10; border-bottom: 1px solid #e2e8f0;">
                <h3 style="margin: 0; font-size: 1.3em; color: #2d3748;">📥 Import Raffle</h3>
                <button class="modal-close-btn" onclick="this.parentElement.parentElement.parentElement.remove()" 
                    style="background: #f7fafc; color: #2d3748; font-size: 1.5em; width: 36px; height: 36px; border-radius: 8px; border: 2px solid #e2e8f0; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; font-weight: 600;"
                    onmouseover="this.style.background='#ef4444'; this.style.color='white'; this.style.borderColor='#ef4444'"
                    onmouseout="this.style.background='#f7fafc'; this.style.color='#2d3748'; this.style.borderColor='#e2e8f0'">✕</button>
            </div>
            <div class="modal-body" style="padding: 32px 28px;">
                <p style="margin: 0 0 28px 0; color: #718096; font-size: 0.95em; line-height: 1.6;">
                    Select the two JSON files that were exported from a raffle to import them into the system.
                </p>
                
                <div style="display: flex; flex-direction: column; gap: 24px;">
                    <div style="background: #f8fafc; padding: 20px; border-radius: 10px; border: 1px solid #e2e8f0;">
                        <label style="display: flex; align-items: center; gap: 8px; font-weight: 600; margin-bottom: 12px; font-size: 0.95em; color: #2d3748;">
                            <span style="font-size: 1.3em;">📄</span>
                            <span>Raffle Data File</span>
                        </label>
                        <input type="file" id="import-raffle-file" accept=".json" 
                            onchange="validateImportFile(this, 'raffle')"
                            style="width: 100%; padding: 12px 14px; border: 2px solid #cbd5e0; border-radius: 8px; font-size: 0.9em; background: white; cursor: pointer; transition: all 0.2s;"
                            onmouseover="this.style.borderColor='#4299e1'" 
                            onmouseout="this.style.borderColor='#cbd5e0'">
                        <div id="raffle-file-status" style="margin-top: 10px; font-size: 0.88em; min-height: 22px; font-weight: 500;"></div>
                    </div>
                    
                    <div style="background: #f8fafc; padding: 20px; border-radius: 10px; border: 1px solid #e2e8f0;">
                        <label style="display: flex; align-items: center; gap: 8px; font-weight: 600; margin-bottom: 12px; font-size: 0.95em; color: #2d3748;">
                            <span style="font-size: 1.3em;">👥</span>
                            <span>Buyers Data File</span>
                        </label>
                        <input type="file" id="import-buyers-file" accept=".json" 
                            onchange="validateImportFile(this, 'buyers')"
                            style="width: 100%; padding: 12px 14px; border: 2px solid #cbd5e0; border-radius: 8px; font-size: 0.9em; background: white; cursor: pointer; transition: all 0.2s;"
                            onmouseover="this.style.borderColor='#4299e1'" 
                            onmouseout="this.style.borderColor='#cbd5e0'">
                        <div id="buyers-file-status" style="margin-top: 10px; font-size: 0.88em; min-height: 22px; font-weight: 500;"></div>
                    </div>
                </div>
                
                <div style="margin-top: 28px; padding: 16px 18px; background: linear-gradient(135deg, #fff9e6 0%, #fff3cd 100%); border-radius: 10px; border-left: 4px solid #f59e0b; font-size: 0.9em; line-height: 1.6; box-shadow: 0 2px 4px rgba(245, 158, 11, 0.1);">
                    <div style="display: flex; align-items: start; gap: 10px;">
                        <span style="font-size: 1.2em;">⚠️</span>
                        <div>
                            <strong style="color: #92400e;">Important:</strong>
                            <span style="color: #78350f;"> The imported raffle will be assigned a new ID and reset to "not drawn" status.</span>
                        </div>
                    </div>
                </div>
                
                <button onclick="processImportRaffle()" class="btn-primary" 
                    style="width: 100%; margin-top: 28px; padding: 16px; font-size: 1.05em; font-weight: 600; background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%); border: none; border-radius: 10px; color: white; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3);"
                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(66, 153, 225, 0.4)'"
                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(66, 153, 225, 0.3)'">
                    📥 Import Raffle
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function validateImportFile(input, type) {
    const statusDiv = document.getElementById(`${type}-file-status`);
    
    if (!input.files[0]) {
        statusDiv.innerHTML = '';
        return;
    }
    
    try {
        const file = input.files[0];
        const text = await file.text();
        const data = JSON.parse(text);
        
        let validation;
        if (type === 'raffle') {
            validation = validateRaffleStructure(data);
        } else {
            validation = validateBuyersStructure(data);
        }
        
        if (validation.valid) {
            statusDiv.innerHTML = '<span style="color: #10b981;">✅ Valid file structure</span>';
            input.style.borderColor = '#10b981';
        } else {
            statusDiv.innerHTML = `<span style="color: #ef4444;">❌ ${validation.error}</span>`;
            input.style.borderColor = '#ef4444';
        }
    } catch (error) {
        statusDiv.innerHTML = '<span style="color: #ef4444;">❌ Invalid JSON file</span>';
        input.style.borderColor = '#ef4444';
    }
}

function validateRaffleStructure(data) {
    // Check if it's an object with required fields
    if (!data || typeof data !== 'object') {
        return { valid: false, error: 'Raffle data must be an object' };
    }
    
    // Check for raffles array structure (exported format)
    if ('raffles' in data && Array.isArray(data.raffles)) {
        if (data.raffles.length === 0) {
            return { valid: false, error: 'Raffles array is empty' };
        }
        // Validate first raffle in array
        data = data.raffles[0];
    }
    
    // Required fields for a raffle
    const required = ['id', 'name', 'organizerName', 'drawDate', 'prize', 'ticketCost', 'drawn'];
    const missing = required.filter(field => !(field in data));
    
    if (missing.length > 0) {
        return { valid: false, error: `Raffle missing required fields: ${missing.join(', ')}` };
    }
    
    // Validate types
    if (typeof data.name !== 'string' || data.name.trim() === '') {
        return { valid: false, error: 'Raffle name must be a non-empty string' };
    }
    
    if (typeof data.organizerName !== 'string' || data.organizerName.trim() === '') {
        return { valid: false, error: 'Organizer name must be a non-empty string' };
    }
    
    if (typeof data.ticketCost !== 'number' || data.ticketCost <= 0) {
        return { valid: false, error: 'Ticket cost must be a positive number' };
    }
    
    if (typeof data.drawn !== 'boolean') {
        return { valid: false, error: 'Drawn field must be a boolean' };
    }
    
    // Validate banking details if present
    if (data.bankingDetails) {
        const bankingRequired = ['accountOwner', 'bankName', 'accountNumber'];
        const bankingMissing = bankingRequired.filter(field => !(field in data.bankingDetails));
        if (bankingMissing.length > 0) {
            return { valid: false, error: `Banking details missing: ${bankingMissing.join(', ')}` };
        }
    }
    
    return { valid: true };
}

function validateBuyersStructure(data) {
    // Check if it's an object
    if (!data || typeof data !== 'object') {
        return { valid: false, error: 'Buyers data must be an object' };
    }
    
    // Buyers data should be organized by raffle ID (keys are raffle IDs)
    const raffleIds = Object.keys(data);
    
    if (raffleIds.length === 0) {
        return { valid: false, error: 'Buyers data is empty' };
    }
    
    // Validate at least one raffle's buyers
    const firstRaffleId = raffleIds[0];
    const buyers = data[firstRaffleId];
    
    if (!Array.isArray(buyers)) {
        return { valid: false, error: `Buyers for raffle ${firstRaffleId} must be an array` };
    }
    
    if (buyers.length === 0) {
        return { valid: false, error: `No buyers found for raffle ${firstRaffleId}` };
    }
    
    // Validate each buyer in the first raffle
    const requiredFields = ['name', 'surname', 'email', 'mobile', 'tickets', 'buyerNumber', 'ticket_numbers'];
    
    for (let i = 0; i < buyers.length; i++) {
        const buyer = buyers[i];
        const missing = requiredFields.filter(field => !(field in buyer));
        
        if (missing.length > 0) {
            return { 
                valid: false, 
                error: `Buyer #${i + 1} missing required fields: ${missing.join(', ')}` 
            };
        }
        
        // Validate types
        if (typeof buyer.name !== 'string' || buyer.name.trim() === '') {
            return { valid: false, error: `Buyer #${i + 1} name must be a non-empty string` };
        }
        
        if (typeof buyer.surname !== 'string' || buyer.surname.trim() === '') {
            return { valid: false, error: `Buyer #${i + 1} surname must be a non-empty string` };
        }
        
        if (typeof buyer.tickets !== 'number' || buyer.tickets <= 0) {
            return { valid: false, error: `Buyer #${i + 1} tickets must be a positive number` };
        }
        
        if (!Array.isArray(buyer.ticket_numbers) || buyer.ticket_numbers.length !== buyer.tickets) {
            return { valid: false, error: `Buyer #${i + 1} ticket_numbers array length must match tickets count` };
        }
    }
    
    return { valid: true };
}

async function processImportRaffle() {
    const raffleFileInput = document.getElementById('import-raffle-file');
    const buyersFileInput = document.getElementById('import-buyers-file');
    
    if (!raffleFileInput.files[0] || !buyersFileInput.files[0]) {
        alert('Please select both files');
        return;
    }
    
    try {
        // Read raffle data file
        const raffleFile = raffleFileInput.files[0];
        const raffleText = await raffleFile.text();
        const raffleData = JSON.parse(raffleText);
        
        // Validate raffle structure
        const raffleValidation = validateRaffleStructure(raffleData);
        if (!raffleValidation.valid) {
            alert('❌ Invalid Raffle File\n\n' + raffleValidation.error);
            return;
        }
        
        // Read buyers data file
        const buyersFile = buyersFileInput.files[0];
        const buyersText = await buyersFile.text();
        const buyersData = JSON.parse(buyersText);
        
        // Validate buyers structure
        const buyersValidation = validateBuyersStructure(buyersData);
        if (!buyersValidation.valid) {
            alert('❌ Invalid Buyers File\n\n' + buyersValidation.error);
            return;
        }
        
        // Send to backend
        const res = await fetch('/api/raffles/import', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                raffleData: raffleData,
                buyersData: buyersData
            })
        });
        
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to import raffle');
        }
        
        const result = await res.json();
        
        // Close modal
        document.querySelector('.payment-modal')?.remove();
        
        // Show success message
        alert(`✅ ${result.message}\n\nRaffle "${result.raffle.name}" has been imported with ID: ${result.raffleId}`);
        
        // Reload raffles list
        await loadRaffles();
        
    } catch (error) {
        console.error('Error importing raffle:', error);
        alert('Failed to import raffle: ' + error.message);
    }
}

async function addBuyer() {
    if (!currentRaffle) {
        alert("Please select a raffle first");
        return;
    }

    // Get form values
    const name = document.getElementById("buyer-name").value.trim();
    const surname = document.getElementById("buyer-surname").value.trim();
    const mobile = document.getElementById("buyer-mobile").value.trim();
    const email = document.getElementById("buyer-email").value.trim();
    const tickets = parseInt(document.getElementById("buyer-tickets").value);
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
        document.getElementById("buyer-name").value = "";
        document.getElementById("buyer-surname").value = "";
        document.getElementById("buyer-mobile").value = "";
        document.getElementById("buyer-email").value = "";
        document.getElementById("buyer-tickets").value = "1";
        
        // Keep today's date
        const today = new Date().toISOString().split('T')[0];
        document.getElementById("purchaseDate").value = today;

        alert("✅ Buyer added successfully!");

        // Hide the form
        hideAddBuyerForm();

        // Refresh buyers list
        await loadBuyers();

    } catch (error) {
        console.error('Error adding buyer:', error);
        alert(error.message || 'Failed to add buyer');
    }
}

function toggleAddBuyerForm() {
    const form = document.getElementById('add-buyer-form');
    const btn = document.getElementById('show-buyer-form-btn');
    
    if (form.style.display === 'none') {
        // Show form for adding
        form.style.display = 'block';
        btn.textContent = '✖️ Cancel';
        btn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        
        // Reset to Add mode
        document.getElementById('add-buyer-title').textContent = 'Add New Buyer';
        document.getElementById('buyer-submit-btn').textContent = '➕ Add Buyer';
        document.getElementById('buyer-submit-btn').onclick = addBuyer;
        
        // Scroll to form
        form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
        // Hide form
        hideAddBuyerForm();
    }
}

function hideAddBuyerForm() {
    const form = document.getElementById('add-buyer-form');
    const btn = document.getElementById('show-buyer-form-btn');
    
    form.style.display = 'none';
    btn.textContent = '➕ Add New Buyer';
    btn.style.background = 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)';
    
    // Clear form
    document.getElementById("buyer-name").value = "";
    document.getElementById("buyer-surname").value = "";
    document.getElementById("buyer-mobile").value = "";
    document.getElementById("buyer-email").value = "";
    document.getElementById("buyer-tickets").value = "1";
    
    // Reset to today's date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById("purchaseDate").value = today;
}

function toggleDrawCard() {
    const card = document.getElementById('draw-winner-card');
    const btn = document.getElementById('show-draw-card-btn');
    
    if (card.style.display === 'none') {
        // Show draw card
        card.style.display = 'block';
        btn.textContent = '✖️ Close Draw';
        btn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        
        // Scroll to card
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
        // Hide draw card
        card.style.display = 'none';
        btn.textContent = '🎲 Draw Winner';
        btn.style.background = 'linear-gradient(135deg, #f6ad55 0%, #ed8936 100%)';
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
