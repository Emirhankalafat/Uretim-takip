/**
 * Performance monitoring utilities
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.isEnabled = process.env.NODE_ENV === 'development';
  }

  // API call performance tracking
  startApiTimer(url) {
    if (!this.isEnabled) return null;
    
    const timerId = `api_${url}_${Date.now()}`;
    this.metrics.set(timerId, {
      type: 'api',
      url,
      startTime: performance.now()
    });
    
    return timerId;
  }

  endApiTimer(timerId, status) {
    if (!this.isEnabled || !timerId) return;
    
    const metric = this.metrics.get(timerId);
    if (metric) {
      const duration = performance.now() - metric.startTime;
      
      if (duration > 1000) { // 1 saniyeden uzun
        console.warn(`🐌 Slow API call: ${metric.url} - ${duration.toFixed(2)}ms - Status: ${status}`);
      } else if (duration > 500) { // 500ms'den uzun
        console.log(`⚠️ Medium API call: ${metric.url} - ${duration.toFixed(2)}ms`);
      }
      
      this.metrics.delete(timerId);
    }
  }

  // Component render performance
  measureComponentRender(componentName, renderFn) {
    if (!this.isEnabled) return renderFn();
    
    const startTime = performance.now();
    const result = renderFn();
    const duration = performance.now() - startTime;
    
    if (duration > 16) { // 60 FPS threshold
      console.warn(`🎭 Slow component render: ${componentName} - ${duration.toFixed(2)}ms`);
    }
    
    return result;
  }

  // Memory usage monitoring
  checkMemoryUsage() {
    if (!this.isEnabled || !performance.memory) return;
    
    const memory = performance.memory;
    const usedMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
    const totalMB = (memory.totalJSHeapSize / 1024 / 1024).toFixed(2);
    const limitMB = (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2);
    
    console.log(`💾 Memory: ${usedMB}MB / ${totalMB}MB (Limit: ${limitMB}MB)`);
    
    // Memory warning
    if (memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.8) {
      console.warn('⚠️ High memory usage detected!');
    }
  }

  // Database query performance (Backend)
  logSlowQuery(query, duration, threshold = 1000) {
    if (duration > threshold) {
      console.warn(`🗄️ Slow database query: ${duration}ms - ${query.substring(0, 100)}...`);
    }
  }

  // Get performance summary
  getSummary() {
    const summary = {
      activeTimers: this.metrics.size,
      timestamp: new Date().toISOString()
    };
    
    if (performance.memory) {
      summary.memory = {
        used: (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + 'MB',
        total: (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2) + 'MB'
      };
    }
    
    return summary;
  }
}

// Backend için server monitoring
const serverMonitor = {
  logMemoryUsage() {
    if (process.env.NODE_ENV === 'development') {
      const usage = process.memoryUsage();
      console.log('🖥️ Server Memory Usage:');
      console.log(`  RSS: ${(usage.rss / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Heap Used: ${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Heap Total: ${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  External: ${(usage.external / 1024 / 1024).toFixed(2)} MB`);
    }
  },

  logDatabaseConnections(activeConnections) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔌 Active DB Connections: ${activeConnections}`);
      if (activeConnections > 20) {
        console.warn('⚠️ High number of database connections!');
      }
    }
  },

  // Admin dashboard için sistem metrikleri
  getSystemMetrics() {
    const usage = process.memoryUsage();
    const uptime = process.uptime();
    
    return {
      server: {
        uptime: {
          seconds: uptime,
          formatted: this.formatUptime(uptime)
        },
        memory: {
          rss: Number((usage.rss / 1024 / 1024).toFixed(2)),
          heapUsed: Number((usage.heapUsed / 1024 / 1024).toFixed(2)),
          heapTotal: Number((usage.heapTotal / 1024 / 1024).toFixed(2)),
          external: Number((usage.external / 1024 / 1024).toFixed(2)),
          usage: Number(((usage.heapUsed / usage.heapTotal) * 100).toFixed(2))
        },
        cpu: {
          usage: process.cpuUsage()
        },
        platform: process.platform,
        nodeVersion: process.version
      },
      timestamp: new Date().toISOString()
    };
  },

  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}g ${hours}s ${minutes}d`;
    } else if (hours > 0) {
      return `${hours}s ${minutes}d`;
    } else {
      return `${minutes}d`;
    }
  }
};

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

module.exports = { performanceMonitor, serverMonitor };
