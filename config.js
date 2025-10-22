// Define CONFIG as a global variable
window.CONFIG = {
    baseUrl: window.location.origin  // This will work for both local and production
};

console.log('CONFIG initialized in config.js:', window.CONFIG);
console.log('Base URL set to:', window.CONFIG.baseUrl);