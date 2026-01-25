/**
 * MyCryptoSignal API Client
 * Handles all API communication with caching and rate limit management
 */

const API_CONFIG = {
    baseURL: 'https://mycryptosignal.axiopistis-systems.workers.dev',
    apiKey: null,
    
    // Cache TTLs (in milliseconds)
    cacheTTL: {
        coins: 86400000,      // 24 hours
        market: 1800000,      // 30 minutes
        onchain: 1800000,     // 30 minutes
        signals: 82800000     // 23 hours
    }
};

class MyCryptoSignalAPI {
    constructor() {
        this.apiKey = this.getStoredAPIKey();
        this.rateLimitInfo = {};
    }

    /**
     * Set API key and store in session storage
     */
    setAPIKey(key) {
        this.apiKey = key;
        if (key) {
            sessionStorage.setItem('mcs_api_key', key);
        } else {
            sessionStorage.removeItem('mcs_api_key');
        }
    }

    /**
     * Get stored API key from session storage
     */
    getStoredAPIKey() {
        return sessionStorage.getItem('mcs_api_key');
    }

    /**
     * Check if API key is set
     */
    hasAPIKey() {
        return !!this.apiKey;
    }

    /**
     * Generic fetch wrapper with caching and error handling
     */
    async fetch(endpoint, options = {}) {
        const cacheKey = `mcs_cache_${endpoint}`;
        const now = Date.now();

        // Check cache first
        if (!options.skipCache) {
            const cached = this.getFromCache(cacheKey);
            if (cached && (now - cached.timestamp) < this.getCacheTTL(endpoint)) {
                console.log(`[API] Using cached data for ${endpoint}`);
                return cached.data;
            }
        }

        // Prepare request
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.apiKey) {
            headers['X-API-Key'] = this.apiKey;
        }

        const url = `${API_CONFIG.baseURL}${endpoint}`;

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            // Update rate limit info
            this.updateRateLimitInfo(response);

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Invalid API key. Please check your credentials.');
                } else if (response.status === 429) {
                    throw new Error('Rate limit exceeded. Please wait before making more requests.');
                }
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // Cache successful response
            if (!options.skipCache) {
                this.saveToCache(cacheKey, data);
            }

            return data;

        } catch (error) {
            console.error(`[API] Error fetching ${endpoint}:`, error);
            throw error;
        }
    }

    /**
     * Update rate limit information from response headers
     */
    updateRateLimitInfo(response) {
        this.rateLimitInfo = {
            limit: parseInt(response.headers.get('X-RateLimit-Limit')) || null,
            remaining: parseInt(response.headers.get('X-RateLimit-Remaining')) || null,
            reset: parseInt(response.headers.get('X-RateLimit-Reset')) || null,
            quotaLimit: parseInt(response.headers.get('X-Quota-Limit')) || null,
            quotaRemaining: parseInt(response.headers.get('X-Quota-Remaining')) || null,
            quotaReset: parseInt(response.headers.get('X-Quota-Reset')) || null
        };
    }

    /**
     * Get current rate limit information
     */
    getRateLimitInfo() {
        return this.rateLimitInfo;
    }

    /**
     * Determine cache TTL based on endpoint
     */
    getCacheTTL(endpoint) {
        if (endpoint.includes('/coins')) return API_CONFIG.cacheTTL.coins;
        if (endpoint.includes('/market')) return API_CONFIG.cacheTTL.market;
        if (endpoint.includes('/onchain')) return API_CONFIG.cacheTTL.onchain;
        if (endpoint.includes('/signals')) return API_CONFIG.cacheTTL.signals;
        return 300000; // 5 minutes default
    }

    /**
     * Get data from localStorage cache
     */
    getFromCache(key) {
        try {
            const cached = localStorage.getItem(key);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            console.error('[Cache] Error reading from cache:', error);
            return null;
        }
    }

    /**
     * Save data to localStorage cache
     */
    saveToCache(key, data) {
        try {
            const cacheEntry = {
                timestamp: Date.now(),
                data: data
            };
            localStorage.setItem(key, JSON.stringify(cacheEntry));
        } catch (error) {
            console.error('[Cache] Error saving to cache:', error);
            // Clear old cache if storage is full
            if (error.name === 'QuotaExceededError') {
                this.clearOldCache();
            }
        }
    }

    /**
     * Clear old cached entries
     */
    clearOldCache() {
        const now = Date.now();
        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
            if (key.startsWith('mcs_cache_')) {
                try {
                    const cached = JSON.parse(localStorage.getItem(key));
                    if (now - cached.timestamp > 86400000) { // Older than 24 hours
                        localStorage.removeItem(key);
                    }
                } catch (error) {
                    localStorage.removeItem(key);
                }
            }
        });
    }

    /**
     * Clear all cache
     */
    clearCache() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('mcs_cache_')) {
                localStorage.removeItem(key);
            }
        });
        console.log('[Cache] All cache cleared');
    }

    // ==================== API Methods ====================

    /**
     * Health check
     */
    async health() {
        return this.fetch('/api/health', { skipCache: true });
    }

    /**
     * Get all tracked coins
     */
    async getCoins() {
        return this.fetch('/api/coins');
    }

    /**
     * Get latest market data for all coins
     */
    async getMarket() {
        return this.fetch('/api/market');
    }

    /**
     * Get latest on-chain metrics for all coins
     */
    async getOnChain() {
        return this.fetch('/api/onchain');
    }

    /**
     * Get current signals for all coins
     */
    async getSignals() {
        return this.fetch('/api/signals');
    }

    /**
     * Get signal history for a specific coin
     * @param {string} coinId - Coin identifier (e.g., 'bitcoin')
     * @param {number} days - Number of days to fetch (default: 30, max: 365)
     */
    async getSignalHistory(coinId, days = 30) {
        return this.fetch(`/api/signals/history?coin_id=${coinId}&days=${days}`);
    }

    /**
     * Get complete data for a specific coin (market + onchain + signal)
     */
    async getCoinData(coinId) {
        const [market, onchain, signals] = await Promise.all([
            this.getMarket(),
            this.getOnChain(),
            this.getSignals()
        ]);

        return {
            market: market.find(m => m.coin_id === coinId),
            onchain: onchain.find(o => o.coin_id === coinId),
            signal: signals.find(s => s.coin_id === coinId)
        };
    }
}

// Create global API instance
const api = new MyCryptoSignalAPI();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { api, MyCryptoSignalAPI };
}
