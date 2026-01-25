/**
 * MyCryptoSignal Dashboard
 * Displays real-time trading signals with filtering and sorting
 */

let allSignals = [];
let filteredSignals = [];

// DOM Elements
const modal = document.getElementById('apiKeyModal');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
const useDemoBtn = document.getElementById('useDemoBtn');
const signalsContainer = document.getElementById('signalsContainer');
const statsContainer = document.getElementById('statsContainer');
const searchInput = document.getElementById('searchInput');
const actionFilter = document.getElementById('actionFilter');
const sortBy = document.getElementById('sortBy');
const refreshBtn = document.getElementById('refreshBtn');
const rateLimitBar = document.getElementById('rateLimitBar');
const rateLimitText = document.getElementById('rateLimitText');
const lastUpdated = document.getElementById('lastUpdated');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

/**
 * Initialize the application
 */
async function initializeApp() {
    // Check for API key
    if (!api.hasAPIKey()) {
        showAPIKeyModal();
    } else {
        await loadSignals();
    }

    // Setup event listeners
    setupEventListeners();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    saveApiKeyBtn.addEventListener('click', handleSaveAPIKey);
    useDemoBtn.addEventListener('click', handleDemoMode);
    refreshBtn.addEventListener('click', handleRefresh);
    searchInput.addEventListener('input', handleSearch);
    actionFilter.addEventListener('change', handleFilter);
    sortBy.addEventListener('change', handleSort);
}

/**
 * Show API key modal
 */
function showAPIKeyModal() {
    modal.classList.add('active');
    apiKeyInput.focus();
}

/**
 * Hide API key modal
 */
function hideAPIKeyModal() {
    modal.classList.remove('active');
}

/**
 * Handle API key save
 */
async function handleSaveAPIKey() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
        alert('Please enter an API key');
        return;
    }

    if (!apiKey.startsWith('mcs_')) {
        alert('Invalid API key format. Keys should start with "mcs_"');
        return;
    }

    // Set API key and test it
    api.setAPIKey(apiKey);
    
    try {
        await api.health();
        hideAPIKeyModal();
        await loadSignals();
    } catch (error) {
        alert(`Failed to validate API key: ${error.message}`);
        api.setAPIKey(null);
    }
}

/**
 * Handle demo mode (limited data)
 */
function handleDemoMode() {
    alert('Demo mode with sample data will be available in a future update. Please use a valid API key for now.');
}

/**
 * Load signals from API
 */
async function loadSignals() {
    try {
        showLoading();
        
        // Fetch signals
        allSignals = await api.getSignals();
        filteredSignals = [...allSignals];
        
        // Apply current filters and sorting
        applyFiltersAndSort();
        
        // Update UI
        displaySignals(filteredSignals);
        updateStats(allSignals);
        updateRateLimitDisplay();
        updateLastUpdated();
        
    } catch (error) {
        showError(`Failed to load signals: ${error.message}`);
    }
}

/**
 * Display signals in the grid
 */
function displaySignals(signals) {
    if (!signals || signals.length === 0) {
        showEmptyState();
        return;
    }

    const html = signals.map(signal => createSignalCard(signal)).join('');
    signalsContainer.innerHTML = html;
}

/**
 * Create HTML for a signal card
 */
function createSignalCard(signal) {
    const actionClass = signal.action.toLowerCase();
    const confidencePercent = Math.round(signal.confidence);
    
    return `
        <div class="signal-card ${actionClass}">
            <div class="signal-header">
                <div class="coin-info">
                    <h3>${signal.name}</h3>
                    <div class="coin-symbol">${signal.symbol}</div>
                </div>
                <div class="signal-badge ${actionClass}">${signal.action}</div>
            </div>
            
            <div class="confidence-bar">
                <div class="confidence-label">
                    <span>Confidence</span>
                    <span class="confidence-value">${confidencePercent}%</span>
                </div>
                <div class="confidence-track">
                    <div class="confidence-fill" style="width: ${confidencePercent}%"></div>
                </div>
            </div>
            
            <p class="signal-explanation">${signal.explanation}</p>
            
            <div class="signal-footer">
                <div class="signal-timestamp">
                    <img src="assets/icons/signal.svg" style="width:16px;height:16px;vertical-align:text-bottom;margin-right:4px;" alt="Date">
                    <span>${formatDate(signal.signal_date)}</span>
                </div>
                <a href="coin.html?id=${signal.coin_id}" class="view-history">View History →</a>
            </div>
        </div>
    `;
}

/**
 * Update statistics cards
 */
function updateStats(signals) {
    const stats = {
        total: signals.length,
        buy: signals.filter(s => s.action === 'BUY').length,
        hold: signals.filter(s => s.action === 'HOLD').length,
        risk: signals.filter(s => s.action === 'RISK').length
    };

    document.getElementById('totalSignals').textContent = stats.total;
    document.getElementById('buySignals').textContent = stats.buy;
    document.getElementById('holdSignals').textContent = stats.hold;
    document.getElementById('riskSignals').textContent = stats.risk;
}

/**
 * Update rate limit display
 */
function updateRateLimitDisplay() {
    const rateLimitInfo = api.getRateLimitInfo();
    
    if (rateLimitInfo.remaining !== null) {
        rateLimitBar.style.display = 'flex';
        
        const percentRemaining = (rateLimitInfo.remaining / rateLimitInfo.limit) * 100;
        const resetTime = new Date(rateLimitInfo.reset * 1000).toLocaleTimeString();
        
        rateLimitText.textContent = `Rate Limit: ${rateLimitInfo.remaining}/${rateLimitInfo.limit} requests remaining (resets at ${resetTime})`;
        
        // Add warning colors
        if (percentRemaining < 20) {
            rateLimitText.classList.add('rate-limit-critical');
            rateLimitText.classList.remove('rate-limit-warning');
        } else if (percentRemaining < 50) {
            rateLimitText.classList.add('rate-limit-warning');
            rateLimitText.classList.remove('rate-limit-critical');
        } else {
            rateLimitText.classList.remove('rate-limit-warning', 'rate-limit-critical');
        }
    }
}

/**
 * Update last updated timestamp
 */
function updateLastUpdated() {
    const now = new Date();
    lastUpdated.textContent = `Last updated: ${now.toLocaleString()}`;
}

/**
 * Handle search input
 */
function handleSearch() {
    applyFiltersAndSort();
    displaySignals(filteredSignals);
}

/**
 * Handle action filter change
 */
function handleFilter() {
    applyFiltersAndSort();
    displaySignals(filteredSignals);
}

/**
 * Handle sort change
 */
function handleSort() {
    applyFiltersAndSort();
    displaySignals(filteredSignals);
}

/**
 * Apply filters and sorting to signals
 */
function applyFiltersAndSort() {
    const searchTerm = searchInput.value.toLowerCase();
    const actionValue = actionFilter.value;
    const sortValue = sortBy.value;

    // Apply filters
    filteredSignals = allSignals.filter(signal => {
        // Search filter
        const matchesSearch = !searchTerm || 
            signal.name.toLowerCase().includes(searchTerm) ||
            signal.symbol.toLowerCase().includes(searchTerm);
        
        // Action filter
        const matchesAction = actionValue === 'all' || signal.action === actionValue;
        
        return matchesSearch && matchesAction;
    });

    // Apply sorting
    filteredSignals.sort((a, b) => {
        switch (sortValue) {
            case 'confidence':
                return b.confidence - a.confidence;
            case 'confidence-asc':
                return a.confidence - b.confidence;
            case 'name':
                return a.name.localeCompare(b.name);
            case 'name-desc':
                return b.name.localeCompare(a.name);
            default:
                return 0;
        }
    });
}

/**
 * Handle refresh button click
 */
async function handleRefresh() {
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = '<img src="assets/icons/bolt.svg" style="width:16px;height:16px;vertical-align:text-bottom;margin-right:4px;"> Refreshing...';
    
    try {
        // Clear cache and reload
        api.clearCache();
        await loadSignals();
    } finally {
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = '<img src="assets/icons/bolt.svg" style="width:16px;height:16px;vertical-align:text-bottom;margin-right:4px;"> Refresh';
    }
}

/**
 * Show loading state
 */
function showLoading() {
    signalsContainer.innerHTML = '<div class="loading">Loading signals</div>';
}

/**
 * Show error state
 */
function showError(message) {
    signalsContainer.innerHTML = `
        <div class="error">
            <h3>Error Loading Signals</h3>
            <p>${message}</p>
            <button class="btn btn-primary" onclick="location.reload()">Retry</button>
        </div>
    `;
}

/**
 * Show empty state
 */
function showEmptyState() {
    signalsContainer.innerHTML = `
        <div class="empty-state">
            <h3>No Signals Found</h3>
            <p>Try adjusting your filters or check back later.</p>
        </div>
    `;
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
}

/**
 * Auto-refresh every 30 minutes
 */
setInterval(() => {
    if (api.hasAPIKey()) {
        loadSignals();
    }
}, 30 * 60 * 1000); // 30 minutes
