/**
 * API Request Cache System
 * Performance optimization için GET isteklerini cache'ler
 */

class ApiCache {
  constructor() {
    this.cache = new Map();
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 dakika
    this.MAX_CACHE_SIZE = 100;
  }

  getCacheKey(url, params) {
    return `${url}_${JSON.stringify(params || {})}`;
  }

  isCacheValid(timestamp) {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  get(url, params) {
    const key = this.getCacheKey(url, params);
    const cached = this.cache.get(key);
    
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }
    
    return null;
  }

  set(url, params, data) {
    const key = this.getCacheKey(url, params);
    
    // Cache size kontrolü
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clear() {
    this.cache.clear();
    console.log('[API Cache] Cache temizlendi');
  }

  clearByPattern(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
    console.log(`[API Cache] Pattern "${pattern}" ile eşleşen cache'ler temizlendi`);
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      duration: this.CACHE_DURATION / 1000 / 60, // dakika cinsinden
    };
  }
}

// Singleton instance
const apiCache = new ApiCache();

export default apiCache;
