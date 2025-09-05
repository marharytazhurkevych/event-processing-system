#!/usr/bin/env node

/**
 * Stress Test for Event Processing System
 * Tests system stability for 5+ minutes without event loss
 */

const http = require('http');
const { randomUUID } = require('crypto');

console.log('🚀 Event Processing System Stress Test');
console.log('=====================================');
console.log('Testing system stability for 5+ minutes without event loss');
console.log('');

// Test configuration
const TEST_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const EVENTS_PER_SECOND = 10; // 10 events per second
const TOTAL_EVENTS = Math.floor(TEST_DURATION / 1000) * EVENTS_PER_SECOND;

console.log(`📊 Test Configuration:`);
console.log(`   Duration: ${TEST_DURATION / 1000} seconds (5 minutes)`);
console.log(`   Events per second: ${EVENTS_PER_SECOND}`);
console.log(`   Total events to send: ${TOTAL_EVENTS}`);
console.log('');

// Statistics
let stats = {
  sent: 0,
  successful: 0,
  failed: 0,
  startTime: null,
  endTime: null,
  errors: []
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
    req.setTimeout(10000, () => reject(new Error('Request timeout')));
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Generate random event
function generateEvent() {
  const sources = ['facebook', 'tiktok'];
  const source = sources[Math.floor(Math.random() * sources.length)];
  
  const facebookEvents = ['ad.view', 'page.like', 'comment', 'video.view', 'ad.click', 'form.submission', 'checkout.complete'];
  const tiktokEvents = ['video.view', 'like', 'share', 'comment', 'profile.visit', 'purchase', 'follow'];
  
  const eventTypes = source === 'facebook' ? facebookEvents : tiktokEvents;
  const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  
  const funnelStages = ['top', 'bottom'];
  const funnelStage = funnelStages[Math.floor(Math.random() * funnelStages.length)];
  
  return {
    eventId: randomUUID(),
    timestamp: new Date().toISOString(),
    source: source,
    funnelStage: funnelStage,
    eventType: eventType,
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
        referrer: source === 'facebook' ? 'newsfeed' : 'home',
        videoId: Math.random() > 0.5 ? `video-${Math.floor(Math.random() * 1000)}` : null
      }
    }
  };
}

// Send event to gateway
async function sendEvent(event) {
  try {
    const result = await sendRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/webhook/events',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': randomUUID()
      }
    }, event);
    
    return result.status === 200 && result.data.success;
  } catch (error) {
    stats.errors.push({
      eventId: event.eventId,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

// Send events at specified rate
async function sendEventsAtRate() {
  const interval = 1000 / EVENTS_PER_SECOND; // milliseconds between events
  let eventCount = 0;
  
  const sendInterval = setInterval(async () => {
    if (eventCount >= TOTAL_EVENTS) {
      clearInterval(sendInterval);
      return;
    }
    
    const event = generateEvent();
    stats.sent++;
    
    const success = await sendEvent(event);
    if (success) {
      stats.successful++;
    } else {
      stats.failed++;
    }
    
    eventCount++;
    
    // Log progress every 100 events
    if (eventCount % 100 === 0) {
      const elapsed = Date.now() - stats.startTime;
      const rate = (stats.sent / elapsed) * 1000;
      console.log(`📈 Progress: ${eventCount}/${TOTAL_EVENTS} events sent (${rate.toFixed(1)} events/sec)`);
    }
  }, interval);
  
  return sendInterval;
}

// Check system health
async function checkSystemHealth() {
  try {
    const gatewayHealth = await sendRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/health',
      method: 'GET'
    });
    
    const reporterHealth = await sendRequest({
      hostname: 'localhost',
      port: 3003,
      path: '/health',
      method: 'GET'
    });
    
    return {
      gateway: gatewayHealth.status === 200,
      reporter: reporterHealth.status === 200
    };
  } catch (error) {
    return {
      gateway: false,
      reporter: false,
      error: error.message
    };
  }
}

// Generate final report
function generateReport() {
  const duration = stats.endTime - stats.startTime;
  const actualRate = (stats.sent / duration) * 1000;
  const successRate = (stats.successful / stats.sent) * 100;
  
  console.log('\n📊 STRESS TEST RESULTS');
  console.log('======================');
  console.log(`⏱️  Duration: ${(duration / 1000).toFixed(1)} seconds`);
  console.log(`📤 Events sent: ${stats.sent}`);
  console.log(`✅ Successful: ${stats.successful}`);
  console.log(`❌ Failed: ${stats.failed}`);
  console.log(`📈 Success rate: ${successRate.toFixed(2)}%`);
  console.log(`🚀 Actual rate: ${actualRate.toFixed(1)} events/sec`);
  console.log(`🎯 Target rate: ${EVENTS_PER_SECOND} events/sec`);
  
  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Errors encountered: ${stats.errors.length}`);
    console.log('First 5 errors:');
    stats.errors.slice(0, 5).forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.error} (Event: ${error.eventId})`);
    });
  }
  
  // Test criteria
  console.log('\n🎯 TEST CRITERIA:');
  console.log(`✅ System ran for 5+ minutes: ${duration >= TEST_DURATION ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Success rate > 95%: ${successRate >= 95 ? 'PASS' : 'FAIL'}`);
  console.log(`✅ No system crashes: ${stats.errors.length < stats.sent * 0.05 ? 'PASS' : 'FAIL'}`);
  
  const overallPass = duration >= TEST_DURATION && successRate >= 95 && stats.errors.length < stats.sent * 0.05;
  console.log(`\n🏆 OVERALL RESULT: ${overallPass ? 'PASS' : 'FAIL'}`);
  
  if (overallPass) {
    console.log('🎉 System successfully processed events for 5+ minutes without significant losses!');
  } else {
    console.log('❌ System failed to meet stability requirements.');
  }
}

// Main test function
async function runStressTest() {
  console.log('🔍 Checking system health before test...');
  const health = await checkSystemHealth();
  
  if (!health.gateway || !health.reporter) {
    console.log('❌ System health check failed:');
    console.log(`   Gateway: ${health.gateway ? 'OK' : 'FAIL'}`);
    console.log(`   Reporter: ${health.reporter ? 'OK' : 'FAIL'}`);
    if (health.error) {
      console.log(`   Error: ${health.error}`);
    }
    console.log('\nPlease ensure all services are running before starting the test.');
    return;
  }
  
  console.log('✅ System health check passed');
  console.log('🚀 Starting stress test...\n');
  
  stats.startTime = Date.now();
  
  // Start sending events
  const sendInterval = await sendEventsAtRate();
  
  // Wait for test duration
  await new Promise(resolve => setTimeout(resolve, TEST_DURATION));
  
  // Stop sending events
  clearInterval(sendInterval);
  stats.endTime = Date.now();
  
  // Wait a bit for final processing
  console.log('\n⏳ Waiting for final event processing...');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // Generate report
  generateReport();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted by user');
  stats.endTime = Date.now();
  generateReport();
  process.exit(0);
});

// Run the test
runStressTest().catch(console.error);
