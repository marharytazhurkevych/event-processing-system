#!/usr/bin/env node

/**
 * Demo Bulk Test for Event Processing System
 * Tests demo server capability to handle bulk events
 */

const http = require('http');
const { randomUUID } = require('crypto');

console.log('🚀 Demo Bulk Event Processing Test');
console.log('==================================');
console.log('Testing demo server capability to handle bulk events');
console.log('');

// Test configuration
const DEMO_URL = 'http://localhost:3001';
const TEST_SIZES = [10, 100, 1000, 5000, 10000];

// Statistics
let stats = {
  tests: 0,
  passed: 0,
  failed: 0,
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
    req.setTimeout(120000, () => reject(new Error('Request timeout (2 minutes)')));
    
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

// Test bulk processing with different sizes
async function testBulkSize(size) {
  console.log(`🔍 Testing bulk processing with ${size.toLocaleString()} events...`);
  
  try {
    // Generate events
    const events = Array.from({ length: size }, () => generateSampleEvent());
    
    const startTime = Date.now();
    
    // Send bulk request
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
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    const rate = (size / duration) * 1000; // events per second
    
    if (result.status === 200 && result.data.success) {
      console.log(`✅ Success: ${result.data.processed} processed, ${result.data.failed} failed`);
      console.log(`   ⏱️  Time: ${duration}ms`);
      console.log(`   🚀 Rate: ${rate.toFixed(1)} events/sec`);
      
      stats.passed++;
      return { success: true, size, duration, rate, processed: result.data.processed };
    } else {
      console.log(`❌ Failed: ${result.status} - ${JSON.stringify(result.data)}`);
      stats.failed++;
      stats.errors.push(`Bulk test ${size}: ${result.data.message || 'Unknown error'}`);
      return { success: false, size, duration, rate: 0, processed: 0 };
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    stats.failed++;
    stats.errors.push(`Bulk test ${size}: ${error.message}`);
    return { success: false, size, duration: 0, rate: 0, processed: 0 };
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

// Run all tests
async function runTests() {
  console.log('🚀 Starting demo bulk tests...\n');
  
  // Check health
  const isHealthy = await checkDemoHealth();
  if (!isHealthy) {
    console.log('❌ Demo server is not accessible');
    console.log('   Please run: node demo-server.js');
    return;
  }
  
  console.log('✅ Demo server is healthy\n');
  
  const results = [];
  
  // Test different sizes
  for (const size of TEST_SIZES) {
    stats.tests++;
    const result = await testBulkSize(size);
    results.push(result);
    console.log(''); // Empty line for readability
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Generate report
  console.log('📊 DEMO BULK TEST RESULTS');
  console.log('=========================');
  console.log(`Total tests: ${stats.tests}`);
  console.log(`✅ Passed: ${stats.passed}`);
  console.log(`❌ Failed: ${stats.failed}`);
  console.log(`📈 Success rate: ${((stats.passed / stats.tests) * 100).toFixed(1)}%`);
  
  if (results.length > 0) {
    console.log('\n📈 Performance Summary:');
    results.forEach(result => {
      if (result.success) {
        console.log(`   ${result.size.toLocaleString().padStart(6)} events: ${result.duration}ms (${result.rate.toFixed(1)} events/sec)`);
      }
    });
    
    const maxSize = Math.max(...results.filter(r => r.success).map(r => r.size));
    const maxRate = Math.max(...results.filter(r => r.success).map(r => r.rate));
    
    console.log(`\n🏆 Best Performance:`);
    console.log(`   Max events processed: ${maxSize.toLocaleString()}`);
    console.log(`   Max processing rate: ${maxRate.toFixed(1)} events/sec`);
  }
  
  if (stats.errors.length > 0) {
    console.log('\n⚠️  Errors:');
    stats.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }
  
  // Test criteria
  console.log('\n🎯 TEST CRITERIA:');
  const maxProcessed = Math.max(...results.filter(r => r.success).map(r => r.processed));
  const avgRate = results.filter(r => r.success).reduce((sum, r) => sum + r.rate, 0) / results.filter(r => r.success).length;
  
  console.log(`✅ Handles bulk events: ${maxProcessed >= 1000 ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Processing rate > 100 events/sec: ${avgRate >= 100 ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Success rate > 80%: ${((stats.passed / stats.tests) * 100) >= 80 ? 'PASS' : 'FAIL'}`);
  
  const overallPass = maxProcessed >= 1000 && avgRate >= 100 && ((stats.passed / stats.tests) * 100) >= 80;
  console.log(`\n🏆 OVERALL RESULT: ${overallPass ? 'PASS' : 'FAIL'}`);
  
  if (overallPass) {
    console.log('🎉 Demo server successfully handles bulk event processing!');
  } else {
    console.log('❌ Demo server needs optimization for bulk processing.');
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted by user');
  process.exit(0);
});

// Run the tests
runTests().catch(console.error);
