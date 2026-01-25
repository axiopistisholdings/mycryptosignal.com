/**
 * MyCryptoSignal Coin Details Page
 * Displays detailed information and history for a specific coin
 */

let coinId = null;
let coinData = null;
let signalHistory = [];
let confidenceChart = null;

// DOM Elements
const coinHeader = document.getElementById('coinHeader');
const currentSignal = document.getElementById('currentSignal');
const marketData = document.getElementById('marketData');
const historyTable = document.getElementById('historyTable');
const historyDays = document.getElementById('historyDays');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeCoinPage();
});

/**
 * Initialize coin page
 */
async function initializeCoinPage() {
    // Get coin ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    coinId = urlParams.get('id');

    if (!coinId) {
        showError('No coin specified');
        return;
    }

    // Check for API key
    if (!api.hasAPIKey()) {
        const apiKey = prompt('Please enter your API key:');
        if (apiKey) {
            api.setAPIKey(apiKey);
        } else {
            window.location.href = 'dashboard.html';
            return;
        }
    }

    // Load data
    await loadCoinData();

    // Setup event listeners
    historyDays.addEventListener('change', handleHistoryDaysChange);
}

/**
 * Load all coin data
 */
async function loadCoinData() {
    try {
        // Load current data
        coinData = await api.getCoinData(coinId);
        
        // Load history
        const days = parseInt(historyDays.value);
        signalHistory = await api.getSignalHistory(coinId, days);

        // Display data
        displayCoinHeader(coinData);
        displayCurrentSignal(coinData.signal);
        displayMarketData(coinData.market);
        displayHistoryChart(signalHistory);
        displayHistoryTable(signalHistory);

    } catch (error) {
        showError(`Failed to load coin data: ${error.message}`);
    }
}

/**
 * Display coin header
 */
function displayCoinHeader(data) {
    if (!data.signal) {
        coinHeader.innerHTML = '<div class="error">Coin data not found</div>';
        return;
    }

    const { name, symbol, coin_id } = data.signal;
    
    coinHeader.innerHTML = `
        <div class="coin-title">
            <div class="coin-icon"><img src="assets/icons/chain-for-links.svg" style="width:48px;height:48px;" alt="Coin"></div>
            <div class="coin-name-group">
                <h1>${name}</h1>
                <div class="coin-symbol">${symbol}</div>
                ${data.market ? `<div class="coin-chain">Chain: ${coin_id}</div>` : ''}
            </div>
        </div>
    `;
}

/**
 * Display current signal
 */
function displayCurrentSignal(signal) {
    if (!signal) {
        currentSignal.innerHTML = '<div class="empty-state">No signal available</div>';
        return;
    }

    const actionClass = signal.action.toLowerCase();
    const confidencePercent = Math.round(signal.confidence);

    currentSignal.className = `current-signal-card ${actionClass}`;
    currentSignal.innerHTML = `
        <div class="signal-top">
            <div class="signal-action-badge ${actionClass}">${signal.action}</div>
            <div class="confidence-display">
                <div class="confidence-number">${confidencePercent}%</div>
                <div class="confidence-label-text">Confidence</div>
            </div>
        </div>
        
        <p class="signal-explanation-text">${signal.explanation}</p>
        
        <div class="signal-meta">
            <div><img src="assets/icons/signal.svg" style="width:16px;height:16px;vertical-align:text-bottom;margin-right:4px;" alt="Date"> Signal Date: ${formatDate(signal.signal_date)}</div>
            <div><img src="assets/icons/magnifying-glass-data.svg" style="width:16px;height:16px;vertical-align:text-bottom;margin-right:4px;" alt="Time"> Generated: ${new Date(signal.timestamp * 1000).toLocaleString()}</div>
        </div>
    `;
}

/**
 * Display market data
 */
function displayMarketData(market) {
    if (!market) {
        marketData.innerHTML = '<div class="empty-state">Market data not available</div>';
        return;
    }

    marketData.innerHTML = `
        <div class="market-stat">
            <div class="market-stat-label">Current Price</div>
            <div class="market-stat-value">$${formatNumber(market.price)}</div>
            ${market.price_change_24h !== null ? `
                <div class="market-stat-change ${market.price_change_24h >= 0 ? 'positive' : 'negative'}">
                    ${market.price_change_24h >= 0 ? '↑' : '↓'} ${Math.abs(market.price_change_24h).toFixed(2)}% (24h)
                </div>
            ` : ''}
        </div>
        
        <div class="market-stat">
            <div class="market-stat-label">Market Cap</div>
            <div class="market-stat-value">$${formatLargeNumber(market.market_cap)}</div>
        </div>
        
        <div class="market-stat">
            <div class="market-stat-label">24h Volume</div>
            <div class="market-stat-value">$${formatLargeNumber(market.volume_24h)}</div>
        </div>
        
        <div class="market-stat">
            <div class="market-stat-label">7d Change</div>
            <div class="market-stat-value ${market.price_change_7d >= 0 ? 'positive' : 'negative'}">
                ${market.price_change_7d >= 0 ? '+' : ''}${market.price_change_7d?.toFixed(2) || 'N/A'}%
            </div>
        </div>
        
        <div class="market-stat">
            <div class="market-stat-label">30d Change</div>
            <div class="market-stat-value ${market.price_change_30d >= 0 ? 'positive' : 'negative'}">
                ${market.price_change_30d >= 0 ? '+' : ''}${market.price_change_30d?.toFixed(2) || 'N/A'}%
            </div>
        </div>
    `;
}

/**
 * Display history chart
 */
function displayHistoryChart(history) {
    if (!history || history.length === 0) {
        return;
    }

    const ctx = document.getElementById('confidenceChart').getContext('2d');

    // Destroy existing chart
    if (confidenceChart) {
        confidenceChart.destroy();
    }

    // Prepare data
    const sortedHistory = [...history].sort((a, b) => a.timestamp - b.timestamp);
    const labels = sortedHistory.map(h => formatDateShort(h.signal_date));
    const confidenceData = sortedHistory.map(h => h.confidence);
    const actionColors = sortedHistory.map(h => {
        switch (h.action) {
            case 'BUY': return 'rgba(0, 255, 136, 0.5)';
            case 'RISK': return 'rgba(255, 68, 68, 0.5)';
            case 'HOLD': return 'rgba(255, 170, 0, 0.5)';
            default: return 'rgba(255, 255, 255, 0.5)';
        }
    });

    // Create chart
    confidenceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Confidence Score',
                data: confidenceData,
                backgroundColor: actionColors,
                borderColor: actionColors.map(c => c.replace('0.5', '1')),
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const index = context.dataIndex;
                            const action = sortedHistory[index].action;
                            return `${action}: ${context.parsed.y.toFixed(1)}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: '#aaaaaa',
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#aaaaaa'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

/**
 * Display history table
 */
function displayHistoryTable(history) {
    if (!history || history.length === 0) {
        historyTable.innerHTML = '<div class="empty-state">No history available</div>';
        return;
    }

    const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);

    historyTable.innerHTML = `
        <div class="history-table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Action</th>
                        <th>Confidence</th>
                        <th>Explanation</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedHistory.map(h => `
                        <tr>
                            <td>${formatDate(h.signal_date)}</td>
                            <td><span class="action-cell ${h.action.toLowerCase()}">${h.action}</span></td>
                            <td><span class="confidence-cell">${Math.round(h.confidence)}%</span></td>
                            <td>${h.explanation}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

/**
 * Handle history days change
 */
async function handleHistoryDaysChange() {
    try {
        const days = parseInt(historyDays.value);
        signalHistory = await api.getSignalHistory(coinId, days);
        displayHistoryChart(signalHistory);
        displayHistoryTable(signalHistory);
    } catch (error) {
        alert(`Failed to load history: ${error.message}`);
    }
}

/**
 * Show error
 */
function showError(message) {
    coinHeader.innerHTML = `
        <div class="error">
            <h3>Error</h3>
            <p>${message}</p>
            <button class="btn btn-primary" onclick="window.location.href='dashboard.html'">
                Back to Dashboard
            </button>
        </div>
    `;
}

/**
 * Format number with commas
 */
function formatNumber(num) {
    if (num === null || num === undefined) return 'N/A';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Format large numbers (millions, billions)
 */
function formatLargeNumber(num) {
    if (num === null || num === undefined) return 'N/A';
    
    if (num >= 1e12) {
        return (num / 1e12).toFixed(2) + 'T';
    } else if (num >= 1e9) {
        return (num / 1e9).toFixed(2) + 'B';
    } else if (num >= 1e6) {
        return (num / 1e6).toFixed(2) + 'M';
    } else if (num >= 1e3) {
        return (num / 1e3).toFixed(2) + 'K';
    }
    return num.toFixed(2);
}

/**
 * Format date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Format date (short)
 */
function formatDateShort(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
