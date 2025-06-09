/**
 * Performance monitoring integration script
 * Production'da performance metrikleri toplar
 */

// Backend server.js'e eklenecek monitoring
const performanceMonitor = require('./utils/performanceMonitor');

// Memory monitoring middleware
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    const timerId = performanceMonitor.startApiTimer(`${req.method} ${req.path}`);
    
    res.on('finish', () => {
      performanceMonitor.endApiTimer(timerId, res.statusCode);
    });
  }
  next();
});

// Memory usage log her 5 dakikada bir
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    performanceMonitor.serverMonitor.logMemoryUsage();
  }, 5 * 60 * 1000);
}

// Database connection monitoring
app.get('/api/health/performance', (req, res) => {
  const stats = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  };
  
  res.json({
    status: 'ok',
    stats
  });
});

module.exports = { performanceMonitor };
