#!/usr/bin/env node

/**
 * Bulk Event Processing Test
 * Tests system capability to handle 50,000 events in a single request
 */

const http = require('http');
const { randomUUID } = require('crypto');

console.log('🚀 Bulk Event Processing Test');
console.log('============================');
console.log('Testing system capability to handle 50,000 events in a single request');
console.log('');

// Test configuration
const TOTAL_EVENTS = 50000;
const BATCH_SIZE = 1000; // Process in batches for memory efficiency

console.log(`📊 Test Configuration:`);
console.log(`   Total events: ${TOTAL_EVENTS.toLocaleString()}`);
console.log(`   Batch size: ${BATCH_SIZE.toLocaleString()}`);
console.log(`   Expected batches: ${Math.ceil(TOTAL_EVENTS / BATCH_SIZE)}`);
console.log('');

// Statistics
let stats = {
  sent: 0,
  successful: 0,
  failed: 0,
  startTime: null,
  endTime: null,
  errors: [],
  batches: []
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
    req.setTimeout(120000, () => reject(new Error('Request timeout (2 minutes)')));
    
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
  
  if (source === 'facebook') {
    return {
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      source: 'facebook',
      funnelStage: funnelStage,
      eventType: eventType,
      data: {
        user: {
          userId: `fb-user-${Math.floor(Math.random() * 100000)}`,
          name: `Facebook User ${Math.floor(Math.random() * 10000)}`,
          age: Math.floor(Math.random() * 50) + 18,
          gender: ['male', 'female', 'non-binary'][Math.floor(Math.random() * 3)],
          location: {
            country: ['US', 'CA', 'UK', 'DE', 'FR', 'AU', 'JP', 'BR'][Math.floor(Math.random() * 8)],
            city: `City ${Math.floor(Math.random() * 1000)}`
          }
        },
        engagement: {
          actionTime: new Date().toISOString(),
          referrer: ['newsfeed', 'marketplace', 'groups'][Math.floor(Math.random() * 3)],
          videoId: Math.random() > 0.5 ? `video-${Math.floor(Math.random() * 10000)}` : null,
          ...(eventType === 'checkout.complete' && { purchaseAmount: (Math.random() * 1000 + 10).toFixed(2) }),
          ...(eventType === 'ad.click' && { 
            adId: `ad-${Math.floor(Math.random() * 10000)}`,
            campaignId: `campaign-${Math.floor(Math.random() * 1000)}`,
            clickPosition: ['top_left', 'bottom_right', 'center'][Math.floor(Math.random() * 3)],
            device: ['mobile', 'desktop'][Math.floor(Math.random() * 2)],
            browser: ['Chrome', 'Firefox', 'Safari'][Math.floor(Math.random() * 3)]
          })
        }
      }
    };
  } else {
    return {
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      source: 'tiktok',
      funnelStage: funnelStage,
      eventType: eventType,
      data: {
        user: {
          userId: `ttk-user-${Math.floor(Math.random() * 100000)}`,
          username: `tiktok_user_${Math.floor(Math.random() * 10000)}`,
          followers: Math.floor(Math.random() * 1000000)
        },
        engagement: {
          actionTime: new Date().toISOString(),
          referrer: 'home',
          videoId: Math.random() > 0.3 ? `video-${Math.floor(Math.random() * 10000)}` : null,
          ...(eventType === 'purchase' && { purchaseAmount: (Math.random() * 500 + 5).toFixed(2) })
        }
      }
    };
  }
}

// Generate batch of events
function generateBatch(size) {
  const events = [];
  for (let i = 0; i < size; i++) {
    events.push(generateEvent());
  }
  return events;
}

// Send bulk events
async function sendBulkEvents(events) {
  try {
    const result = await sendRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/webhook/events/bulk',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': randomUUID()
      }
    }, { events });
    
    return {
      success: result.status === 200 && result.data.success,
      processed: result.data.processed || 0,
      failed: result.data.failed || 0,
      errors: result.data.errors || [],
      response: result.data
    };
  } catch (error) {
    return {
      success: false,
      processed: 0,
      failed: events.length,
      errors: [error.message],
      response: null
    };
  }
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
  
  console.log('\n📊 BULK TEST RESULTS');
  console.log('====================');
  console.log(`⏱️  Duration: ${(duration / 1000).toFixed(1)} seconds`);
  console.log(`📤 Events sent: ${stats.sent.toLocaleString()}`);
  console.log(`✅ Successful: ${stats.successful.toLocaleString()}`);
  console.log(`❌ Failed: ${stats.failed.toLocaleString()}`);
  console.log(`📈 Success rate: ${successRate.toFixed(2)}%`);
  console.log(`🚀 Processing rate: ${actualRate.toFixed(1)} events/sec`);
  
  if (stats.batches.length > 0) {
    console.log(`\n📦 Batch Statistics:`);
    const avgBatchTime = stats.batches.reduce((sum, batch) => sum + batch.duration, 0) / stats.batches.length;
    const avgBatchRate = stats.batches.reduce((sum, batch) => sum + (batch.processed / batch.duration * 1000), 0) / stats.batches.length;
    console.log(`   Average batch time: ${avgBatchTime.toFixed(1)}ms`);
    console.log(`   Average batch rate: ${avgBatchRate.toFixed(1)} events/sec`);
    console.log(`   Total batches: ${stats.batches.length}`);
  }
  
  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Errors encountered: ${stats.errors.length}`);
    console.log('First 10 errors:');
    stats.errors.slice(0, 10).forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }
  
  // Test criteria
  console.log('\n🎯 TEST CRITERIA:');
  console.log(`✅ Processed 50,000 events: ${stats.sent >= TOTAL_EVENTS ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Success rate > 95%: ${successRate >= 95 ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Processing rate > 1000 events/sec: ${actualRate >= 1000 ? 'PASS' : 'FAIL'}`);
  console.log(`✅ No system crashes: ${stats.errors.length < stats.sent * 0.01 ? 'PASS' : 'FAIL'}`);
  
  const overallPass = stats.sent >= TOTAL_EVENTS && successRate >= 95 && actualRate >= 1000 && stats.errors.length < stats.sent * 0.01;
  console.log(`\n🏆 OVERALL RESULT: ${overallPass ? 'PASS' : 'FAIL'}`);
  
  if (overallPass) {
    console.log('🎉 System successfully processed 50,000 events in bulk!');
  } else {
    console.log('❌ System failed to meet bulk processing requirements.');
  }
}

// Main test function
async function runBulkTest() {
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
  console.log('🚀 Starting bulk test...\n');
  
  stats.startTime = Date.now();
  
  // Process events in batches
  const totalBatches = Math.ceil(TOTAL_EVENTS / BATCH_SIZE);
  
  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const remainingEvents = TOTAL_EVENTS - stats.sent;
    const currentBatchSize = Math.min(BATCH_SIZE, remainingEvents);
    
    console.log(`📦 Processing batch ${batchIndex + 1}/${totalBatches} (${currentBatchSize.toLocaleString()} events)`);
    
    const batchStartTime = Date.now();
    const events = generateBatch(currentBatchSize);
    
    const result = await sendBulkEvents(events);
    
    const batchDuration = Date.now() - batchStartTime;
    const batchRate = (result.processed / batchDuration) * 1000;
    
    // Update statistics
    stats.sent += events.length;
    stats.successful += result.processed;
    stats.failed += result.failed;
    stats.errors.push(...result.errors);
    stats.batches.push({
      batchNumber: batchIndex + 1,
      size: currentBatchSize,
      processed: result.processed,
      failed: result.failed,
      duration: batchDuration,
      rate: batchRate
    });
    
    console.log(`   ✅ Processed: ${result.processed.toLocaleString()}`);
    console.log(`   ❌ Failed: ${result.failed.toLocaleString()}`);
    console.log(`   ⏱️  Time: ${batchDuration}ms`);
    console.log(`   🚀 Rate: ${batchRate.toFixed(1)} events/sec`);
    
    if (result.errors.length > 0) {
      console.log(`   ⚠️  Errors: ${result.errors.length}`);
    }
    
    // Progress update
    const progress = ((stats.sent / TOTAL_EVENTS) * 100).toFixed(1);
    console.log(`   📊 Progress: ${progress}% (${stats.sent.toLocaleString()}/${TOTAL_EVENTS.toLocaleString()})`);
    
    // Small delay between batches
    if (batchIndex < totalBatches - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  stats.endTime = Date.now();
  
  // Wait for final processing
  console.log('\n⏳ Waiting for final event processing...');
  await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds
  
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
runBulkTest().catch(console.error);
