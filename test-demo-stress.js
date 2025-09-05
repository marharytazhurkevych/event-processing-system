#!/usr/bin/env node

/**
 * Demo Stress Test for Event Processing System
 * Tests demo server stability for 5+ minutes without event loss
 */

const http = require('http');
const { randomUUID } = require('crypto');

console.log('🚀 Demo Server Stress Test');
console.log('===========================');
console.log('Testing demo server stability for 5+ minutes without event loss');
console.log('');

// Test configuration
const DEMO_URL = 'http://localhost:3001';
const DURATION_SECONDS = 300; // 5 minutes
const EVENTS_PER_SECOND = 10;
const TOTAL_EVENTS = DURATION_SECONDS * EVENTS_PER_SECOND;

// Statistics
let stats = {
  startTime: null,
  endTime: null,
  sent: 0,
  successful: 0,
  failed: 0,
  errors: [],
  batches: [],
  healthChecks: []
};

// Function to send HTTP request
function sendRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => reject(new Error('Request timeout (30 seconds)')));
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

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
        userId: `user-${Math.floor(Math.random() * 100000)}`,
        name: `User ${Math.floor(Math.random() * 10000)}`,
        age: Math.floor(Math.random() * 50) + 18,
        gender: ['male', 'female', 'non-binary'][Math.floor(Math.random() * 3)],
        location: {
          country: ['US', 'CA', 'UK', 'DE', 'FR', 'AU', 'JP', 'BR'][Math.floor(Math.random() * 8)],
          city: `City ${Math.floor(Math.random() * 1000)}`
        }
      },
      engagement: {
        actionTime: new Date().toISOString(),
        referrer: 'newsfeed',
        videoId: Math.random() > 0.5 ? `video-${Math.floor(Math.random() * 10000)}` : null
      }
    }
  };
}

// Send single event
async function sendSingleEvent() {
  try {
    const event = generateSampleEvent();
    const result = await sendRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/webhook/events',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': randomUUID()
      }
    }, event);
    
    return {
      success: result.status === 200 && result.data.success,
      processed: result.data.processed || 0,
      failed: result.data.failed || 0,
      response: result.data
    };
  } catch (error) {
    return {
      success: false,
      processed: 0,
      failed: 1,
      response: null,
      error: error.message
    };
  }
}

// Check demo server health
async function checkDemoHealth() {
  try {
    const result = await sendRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/health',
      method: 'GET'
    });
    
    return {
      healthy: result.status === 200,
      response: result.data
    };
  } catch (error) {
    return {
      healthy: false,
      response: null,
      error: error.message
    };
  }
}

// Run stress test
async function runStressTest() {
  console.log('🚀 Starting demo server stress test...\n');
  
  // Check initial health
  const initialHealth = await checkDemoHealth();
  if (!initialHealth.healthy) {
    console.log('❌ Demo server is not accessible');
    console.log('   Please run: node demo-server.js');
    return;
  }
  
  console.log('✅ Demo server is healthy');
  console.log(`📊 Test duration: ${DURATION_SECONDS} seconds (${(DURATION_SECONDS / 60).toFixed(1)} minutes)`);
  console.log(`📊 Events per second: ${EVENTS_PER_SECOND}`);
  console.log(`📊 Total events to send: ${TOTAL_EVENTS.toLocaleString()}\n`);
  
  stats.startTime = Date.now();
  
  // Calculate interval between events
  const intervalMs = 1000 / EVENTS_PER_SECOND;
  
  // Send events at regular intervals
  const eventPromises = [];
  let eventCount = 0;
  
  const eventInterval = setInterval(async () => {
    if (eventCount >= TOTAL_EVENTS) {
      clearInterval(eventInterval);
      return;
    }
    
    eventCount++;
    const promise = sendSingleEvent().then(result => {
      stats.sent++;
      if (result.success) {
        stats.successful += result.processed;
      } else {
        stats.failed += result.failed;
        if (result.error) {
          stats.errors.push(result.error);
        }
      }
      return result;
    });
    
    eventPromises.push(promise);
  }, intervalMs);
  
  // Health check every 30 seconds
  const healthInterval = setInterval(async () => {
    const health = await checkDemoHealth();
    stats.healthChecks.push({
      timestamp: Date.now(),
      healthy: health.healthy,
      response: health.response
    });
    
    if (!health.healthy) {
      console.log(`⚠️  Health check failed at ${new Date().toISOString()}`);
    }
  }, 30000);
  
  // Progress updates every minute
  const progressInterval = setInterval(() => {
    const elapsed = (Date.now() - stats.startTime) / 1000;
    const progress = (elapsed / DURATION_SECONDS) * 100;
    const rate = stats.sent / elapsed;
    
    console.log(`📊 Progress: ${progress.toFixed(1)}% (${elapsed.toFixed(1)}s/${DURATION_SECONDS}s)`);
    console.log(`   📤 Events sent: ${stats.sent.toLocaleString()}`);
    console.log(`   ✅ Successful: ${stats.successful.toLocaleString()}`);
    console.log(`   ❌ Failed: ${stats.failed.toLocaleString()}`);
    console.log(`   🚀 Rate: ${rate.toFixed(1)} events/sec`);
    console.log('');
  }, 60000);
  
  // Wait for test completion
  await new Promise(resolve => {
    setTimeout(() => {
      clearInterval(eventInterval);
      clearInterval(healthInterval);
      clearInterval(progressInterval);
      resolve();
    }, DURATION_SECONDS * 1000);
  });
  
  // Wait for all events to complete
  await Promise.allSettled(eventPromises);
  
  stats.endTime = Date.now();
  
  // Generate report
  const duration = stats.endTime - stats.startTime;
  const actualRate = (stats.sent / duration) * 1000;
  const successRate = (stats.successful / stats.sent) * 100;
  const healthCheckFailures = stats.healthChecks.filter(h => !h.healthy).length;
  
  console.log('📊 DEMO STRESS TEST RESULTS');
  console.log('===========================');
  console.log(`⏱️  Duration: ${(duration / 1000).toFixed(1)} seconds`);
  console.log(`📤 Events sent: ${stats.sent.toLocaleString()}`);
  console.log(`✅ Successful: ${stats.successful.toLocaleString()}`);
  console.log(`❌ Failed: ${stats.failed.toLocaleString()}`);
  console.log(`📈 Success rate: ${successRate.toFixed(2)}%`);
  console.log(`🚀 Processing rate: ${actualRate.toFixed(1)} events/sec`);
  console.log(`🏥 Health check failures: ${healthCheckFailures}`);
  
  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Errors encountered: ${stats.errors.length}`);
    console.log('First 5 errors:');
    stats.errors.slice(0, 5).forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }
  
  // Test criteria
  console.log('\n🎯 TEST CRITERIA:');
  console.log(`✅ Ran for 5+ minutes: ${duration >= 300000 ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Success rate > 95%: ${successRate >= 95 ? 'PASS' : 'FAIL'}`);
  console.log(`✅ No system crashes: ${healthCheckFailures === 0 ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Consistent processing: ${actualRate >= EVENTS_PER_SECOND * 0.8 ? 'PASS' : 'FAIL'}`);
  
  const overallPass = duration >= 300000 && successRate >= 95 && healthCheckFailures === 0 && actualRate >= EVENTS_PER_SECOND * 0.8;
  console.log(`\n🏆 OVERALL RESULT: ${overallPass ? 'PASS' : 'FAIL'}`);
  
  if (overallPass) {
    console.log('🎉 Demo server successfully passed 5+ minute stress test!');
  } else {
    console.log('❌ Demo server failed to meet stress test requirements.');
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted by user');
  stats.endTime = Date.now();
  process.exit(0);
});

// Run the test
runStressTest().catch(console.error);
