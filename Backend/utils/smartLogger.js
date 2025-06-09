/**
 * Smart Logging System
 * Performans ve log seviyelerini dinamik olarak yönetir
 */

class SmartLogger {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.enableDebug = process.env.ENABLE_DEBUG_LOGS === 'true';
    this.enablePerformanceMonitoring = process.env.ENABLE_PERFORMANCE_MONITORING !== 'false';
    
    // Log statistics
    this.stats = {
      totalLogs: 0,
      errorCount: 0,
      warnCount: 0,
      slowQueries: 0,
      lastReset: Date.now()
    };
  }

  // Conditional logging methods
  debug(message, meta = {}) {
    if (this.enableDebug || !this.isProduction) {
      console.log(`🔍 [DEBUG] ${message}`, meta);
    }
    this.stats.totalLogs++;
  }

  info(message, meta = {}) {
    if (!this.isProduction) {
      console.log(`ℹ️ [INFO] ${message}`, meta);
    }
    this.stats.totalLogs++;
  }

  warn(message, meta = {}) {
    console.warn(`⚠️ [WARN] ${message}`, meta);
    this.stats.warnCount++;
    this.stats.totalLogs++;
  }

  error(message, meta = {}) {
    console.error(`❌ [ERROR] ${message}`, meta);
    this.stats.errorCount++;
    this.stats.totalLogs++;
  }

  // Performance specific logging
  slowQuery(query, duration, threshold = 500) {
    if (duration > threshold) {
      this.stats.slowQueries++;
      
      if (this.enablePerformanceMonitoring) {
        const queryPreview = query.substring(0, 80).replace(/\s+/g, ' ');
        this.warn(`Slow query: ${duration}ms - ${queryPreview}...`);
      }
    }
  }

  // CSRF logging
  csrf(message, details = {}) {
    if (process.env.CSRF_DEBUG === 'true' || this.enableDebug) {
      this.debug(`[CSRF] ${message}`, details);
    }
  }

  // Auth logging  
  auth(message, userId = null, ip = null) {
    const meta = { userId, ip };
    
    if (this.isProduction) {
      // Production'da sadece kritik auth olayları
      if (message.includes('başarısız') || message.includes('failed') || message.includes('attempt')) {
        this.warn(`[AUTH] ${message}`, meta);
      }
    } else {
      this.info(`[AUTH] ${message}`, meta);
    }
  }

  // API request logging
  apiRequest(method, url, duration, status) {
    if (!this.enablePerformanceMonitoring) return;
    
    if (duration > 1000) {
      this.warn(`Slow API: ${method} ${url} - ${duration}ms - Status: ${status}`);
    } else if (duration > 500 && !this.isProduction) {
      this.debug(`API: ${method} ${url} - ${duration}ms`);
    }
  }

  // Get logging statistics
  getStats() {
    const uptime = Date.now() - this.stats.lastReset;
    const avgLogsPerMinute = (this.stats.totalLogs / (uptime / 60000)).toFixed(2);
    
    return {
      ...this.stats,
      uptime: Math.round(uptime / 1000), // seconds
      avgLogsPerMinute: parseFloat(avgLogsPerMinute),
      environment: this.isProduction ? 'production' : 'development',
      debugEnabled: this.enableDebug,
      performanceMonitoringEnabled: this.enablePerformanceMonitoring
    };
  }

  // Reset statistics
  resetStats() {
    this.stats = {
      totalLogs: 0,
      errorCount: 0,
      warnCount: 0,
      slowQueries: 0,
      lastReset: Date.now()
    };
  }
}

// Singleton instance
const smartLogger = new SmartLogger();

module.exports = smartLogger;
