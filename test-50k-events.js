#!/usr/bin/env node

/**
 * 50K Events Test for Demo Server
 * Tests demo server capability to handle 50,000 events
 */

const http = require('http');
const { randomUUID } = require('crypto');

console.log('🚀 50K Events Processing Test');
console.log('=============================');
console.log('Testing demo server capability to handle 50,000 events');
console.log('');

// Test configuration
const DEMO_URL = 'http://localhost:3001';
const TOTAL_EVENTS = 50000;
const BATCH_SIZE = 1000;

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
    req.setTimeout(300000, () => reject(new Error('Request timeout (5 minutes)')));
    
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

// Generate batch of events
function generateBatch(size) {
  const events = [];
  for (let i = 0; i < size; i++) {
    events.push(generateSampleEvent());
  }
  return events;
}

// Send bulk events
async function sendBulkEvents(events) {
  try {
    const result = await sendRequest({
      hostname: 'localhost',
      port: 3001,
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

// Check demo server health
async function checkDemoHealth() {
  try {
    const result = await sendRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/health',
      method: 'GET'
    });
    
    return result.status === 200;
  } catch (error) {
    return false;
  }
}

// Run 50K events test
async function run50KTest() {
  console.log('🚀 Starting 50K events test...\n');
  
  // Check health
  const isHealthy = await checkDemoHealth();
  if (!isHealthy) {
    console.log('❌ Demo server is not accessible');
    console.log('   Please run: node demo-server.js');
    return;
  }
  
  console.log('✅ Demo server is healthy');
  console.log(`📊 Target: ${TOTAL_EVENTS.toLocaleString()} events in batches of ${BATCH_SIZE.toLocaleString()}\n`);
  
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
  
  // Generate report
  const duration = stats.endTime - stats.startTime;
  const actualRate = (stats.sent / duration) * 1000;
  const successRate = (stats.successful / stats.sent) * 100;
  
  console.log('\n📊 50K EVENTS TEST RESULTS');
  console.log('==========================');
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
    console.log('First 5 errors:');
    stats.errors.slice(0, 5).forEach((error, index) => {
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
    console.log('🎉 Demo server successfully processed 50,000 events!');
  } else {
    console.log('❌ Demo server failed to meet 50K events requirements.');
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted by user');
  stats.endTime = Date.now();
  process.exit(0);
});

// Run the test
run50KTest().catch(console.error);
