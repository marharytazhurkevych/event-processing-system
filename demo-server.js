#!/usr/bin/env node

/**
 * Demo Server for Event Processing System
 * Simple HTTP server to demonstrate the system functionality
 */

const http = require('http');
const { randomUUID } = require('crypto');

console.log('🚀 Event Processing System Demo Server');
console.log('=====================================');
console.log('');

// Statistics
let stats = {
  eventsReceived: 0,
  bulkRequestsReceived: 0,
  startTime: new Date()
};

// Generate sample event
function generateSampleEvent() {
  return {
    eventId: randomUUID(),
    timestamp: new Date().toISOString(),
    source: Math.random() > 0.5 ? 'facebook' : 'tiktok',
    funnelStage: Math.random() > 0.5 ? 'top' : 'bottom',
    eventType: 'ad.view',
    data: {
      user: {
        userId: `user-${Math.floor(Math.random() * 10000)}`,
        name: `User ${Math.floor(Math.random() * 1000)}`,
        age: Math.floor(Math.random() * 50) + 18,
        gender: ['male', 'female', 'non-binary'][Math.floor(Math.random() * 3)],
        location: {
          country: ['US', 'CA', 'UK', 'DE', 'FR'][Math.floor(Math.random() * 5)],
          city: `City ${Math.floor(Math.random() * 100)}`
        }
      },
      engagement: {
        actionTime: new Date().toISOString(),
        referrer: 'newsfeed',
        videoId: Math.random() > 0.5 ? `video-${Math.floor(Math.random() * 1000)}` : null
      }
    }
  };
}

// Request handler
function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const method = req.method;
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-correlation-id');
  
  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Health check
  if (method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      stats: {
        eventsReceived: stats.eventsReceived,
        bulkRequestsReceived: stats.bulkRequestsReceived,
        uptime: Math.floor((Date.now() - stats.startTime.getTime()) / 1000)
      }
    }));
    return;
  }
  
  // Single event endpoint
  if (method === 'POST' && url.pathname === '/webhook/events') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const event = JSON.parse(body);
        stats.eventsReceived++;
        
        console.log(`📥 Received event: ${event.eventId} (${event.source})`);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Event processed successfully',
          eventId: event.eventId,
          processedAt: new Date().toISOString()
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'Invalid event format',
          error: error.message
        }));
      }
    });
    return;
  }
  
  // Bulk events endpoint
  if (method === 'POST' && url.pathname === '/webhook/events/bulk') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const bulkData = JSON.parse(body);
        const events = bulkData.events || [];
        
        stats.bulkRequestsReceived++;
        stats.eventsReceived += events.length;
        
        console.log(`📦 Received bulk request: ${events.length} events`);
        
        // Simulate processing time
        const processingTime = Math.min(events.length * 2, 1000); // Max 1 second
        
        setTimeout(() => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            message: `Bulk processing completed: ${events.length} processed, 0 failed`,
            processed: events.length,
            failed: 0,
            processingTime: processingTime
          }));
        }, processingTime);
        
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'Invalid bulk event format',
          error: error.message
        }));
      }
    });
    return;
  }
  
  // Reports endpoint
  if (method === 'GET' && url.pathname === '/reports/events') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      totalEvents: stats.eventsReceived,
      eventsBySource: [
        { source: 'facebook', count: Math.floor(stats.eventsReceived * 0.6) },
        { source: 'tiktok', count: Math.floor(stats.eventsReceived * 0.4) }
      ],
      eventsByFunnelStage: [
        { funnelStage: 'top', count: Math.floor(stats.eventsReceived * 0.7) },
        { funnelStage: 'bottom', count: Math.floor(stats.eventsReceived * 0.3) }
      ],
      eventsByType: [
        { eventType: 'ad.view', count: Math.floor(stats.eventsReceived * 0.4) },
        { eventType: 'page.like', count: Math.floor(stats.eventsReceived * 0.3) },
        { eventType: 'comment', count: Math.floor(stats.eventsReceived * 0.3) }
      ]
    }));
    return;
  }
  
  // Demo data endpoint
  if (method === 'GET' && url.pathname === '/demo/events') {
    const count = parseInt(url.searchParams.get('count')) || 10;
    const events = Array.from({ length: count }, () => generateSampleEvent());
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ events }));
    return;
  }
  
  // Root endpoint
  if (method === 'GET' && url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
<!DOCTYPE html>
<html>
<head>
    <title>Event Processing System Demo</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .method { color: #007bff; font-weight: bold; }
        .url { color: #28a745; font-family: monospace; }
        button { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px; }
        button:hover { background: #0056b3; }
        .stats { background: #e9ecef; padding: 20px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>🚀 Event Processing System Demo</h1>
    
    <div class="stats">
        <h3>📊 System Statistics</h3>
        <p><strong>Events Received:</strong> ${stats.eventsReceived}</p>
        <p><strong>Bulk Requests:</strong> ${stats.bulkRequestsReceived}</p>
        <p><strong>Uptime:</strong> ${Math.floor((Date.now() - stats.startTime.getTime()) / 1000)} seconds</p>
    </div>
    
    <h3>🔗 Available Endpoints</h3>
    
    <div class="endpoint">
        <span class="method">GET</span> <span class="url">/health</span> - Health check
    </div>
    
    <div class="endpoint">
        <span class="method">POST</span> <span class="url">/webhook/events</span> - Single event processing
    </div>
    
    <div class="endpoint">
        <span class="method">POST</span> <span class="url">/webhook/events/bulk</span> - Bulk event processing (up to 50k events)
    </div>
    
    <div class="endpoint">
        <span class="method">GET</span> <span class="url">/reports/events</span> - Event reports
    </div>
    
    <div class="endpoint">
        <span class="method">GET</span> <span class="url">/demo/events?count=10</span> - Generate sample events
    </div>
    
    <h3>🧪 Quick Tests</h3>
    <button onclick="testSingleEvent()">Test Single Event</button>
    <button onclick="testBulkEvents()">Test Bulk Events (10)</button>
    <button onclick="testBulkEvents(100)">Test Bulk Events (100)</button>
    <button onclick="testReports()">Test Reports</button>
    <button onclick="location.reload()">Refresh Stats</button>
    
    <div id="results" style="margin-top: 20px;"></div>
    
    <script>
        async function testSingleEvent() {
            const event = {
                eventId: 'test-' + Date.now(),
                timestamp: new Date().toISOString(),
                source: 'facebook',
                funnelStage: 'top',
                eventType: 'ad.view',
                data: {
                    user: { userId: 'test-user', name: 'Test User', age: 25, gender: 'male', location: { country: 'US', city: 'NYC' } },
                    engagement: { actionTime: new Date().toISOString(), referrer: 'newsfeed' }
                }
            };
            
            try {
                const response = await fetch('/webhook/events', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(event)
                });
                const result = await response.json();
                document.getElementById('results').innerHTML = '<pre>' + JSON.stringify(result, null, 2) + '</pre>';
            } catch (error) {
                document.getElementById('results').innerHTML = '<p style="color: red;">Error: ' + error.message + '</p>';
            }
        }
        
        async function testBulkEvents(count = 10) {
            try {
                const response = await fetch('/demo/events?count=' + count);
                const data = await response.json();
                
                const bulkResponse = await fetch('/webhook/events/bulk', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await bulkResponse.json();
                document.getElementById('results').innerHTML = '<pre>' + JSON.stringify(result, null, 2) + '</pre>';
            } catch (error) {
                document.getElementById('results').innerHTML = '<p style="color: red;">Error: ' + error.message + '</p>';
            }
        }
        
        async function testReports() {
            try {
                const response = await fetch('/reports/events');
                const result = await response.json();
                document.getElementById('results').innerHTML = '<pre>' + JSON.stringify(result, null, 2) + '</pre>';
            } catch (error) {
                document.getElementById('results').innerHTML = '<p style="color: red;">Error: ' + error.message + '</p>';
            }
        }
    </script>
</body>
</html>
    `);
    return;
  }
  
  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: 'Not Found',
    message: `Cannot ${method} ${url.pathname}`,
    availableEndpoints: [
      'GET /health',
      'POST /webhook/events',
      'POST /webhook/events/bulk',
      'GET /reports/events',
      'GET /demo/events?count=10'
    ]
  }));
}

// Create server
const server = http.createServer(handleRequest);

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Demo server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Web interface: http://localhost:${PORT}/`);
  console.log('');
  console.log('🔗 Available endpoints:');
  console.log(`   GET  /health - Health check`);
  console.log(`   POST /webhook/events - Single event processing`);
  console.log(`   POST /webhook/events/bulk - Bulk event processing`);
  console.log(`   GET  /reports/events - Event reports`);
  console.log(`   GET  /demo/events?count=10 - Generate sample events`);
  console.log('');
  console.log('Press Ctrl+C to stop the server');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down demo server...');
  server.close(() => {
    console.log('✅ Demo server stopped');
    process.exit(0);
  });
});
