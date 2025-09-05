#!/usr/bin/env node

/**
 * Quick System Test
 * Tests basic functionality without full Docker setup
 */

const http = require('http');
const { randomUUID } = require('crypto');

console.log('🚀 Quick System Test');
console.log('==================');
console.log('Testing basic system functionality');
console.log('');

// Test configuration
const GATEWAY_URL = 'http://localhost:3000';
const REPORTER_URL = 'http://localhost:3003';

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
    req.setTimeout(5000, () => reject(new Error('Request timeout')));
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Generate test event
function generateTestEvent() {
  return {
    eventId: randomUUID(),
    timestamp: new Date().toISOString(),
    source: 'facebook',
    funnelStage: 'top',
    eventType: 'ad.view',
    data: {
      user: {
        userId: 'test-user-123',
        name: 'Test User',
        age: 25,
        gender: 'male',
        location: {
          country: 'US',
          city: 'New York'
        }
      },
      engagement: {
        actionTime: new Date().toISOString(),
        referrer: 'newsfeed',
        videoId: null
      }
    }
  };
}

// Test functions
async function testGatewayHealth() {
  console.log('🔍 Testing Gateway Health...');
  try {
    const result = await sendRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/health',
      method: 'GET'
    });
    
    if (result.status === 200) {
      console.log('✅ Gateway health check passed');
      return true;
    } else {
      console.log(`❌ Gateway health check failed: ${result.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Gateway not accessible: ${error.message}`);
    return false;
  }
}

async function testReporterHealth() {
  console.log('🔍 Testing Reporter Health...');
  try {
    const result = await sendRequest({
      hostname: 'localhost',
      port: 3003,
      path: '/health',
      method: 'GET'
    });
    
    if (result.status === 200) {
      console.log('✅ Reporter health check passed');
      return true;
    } else {
      console.log(`❌ Reporter health check failed: ${result.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Reporter not accessible: ${error.message}`);
    return false;
  }
}

async function testSingleEvent() {
  console.log('🔍 Testing Single Event Processing...');
  try {
    const event = generateTestEvent();
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
    
    if (result.status === 200 && result.data.success) {
      console.log('✅ Single event processing passed');
      return true;
    } else {
      console.log(`❌ Single event processing failed: ${result.status} - ${JSON.stringify(result.data)}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Single event processing error: ${error.message}`);
    return false;
  }
}

async function testBulkEvents() {
  console.log('🔍 Testing Bulk Event Processing...');
  try {
    const events = Array.from({ length: 10 }, () => generateTestEvent());
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
    
    if (result.status === 200 && result.data.success) {
      console.log(`✅ Bulk event processing passed: ${result.data.processed} processed, ${result.data.failed} failed`);
      return true;
    } else {
      console.log(`❌ Bulk event processing failed: ${result.status} - ${JSON.stringify(result.data)}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Bulk event processing error: ${error.message}`);
    return false;
  }
}

async function testReportsAPI() {
  console.log('🔍 Testing Reports API...');
  try {
    const result = await sendRequest({
      hostname: 'localhost',
      port: 3003,
      path: '/reports/events',
      method: 'GET'
    });
    
    if (result.status === 200) {
      console.log('✅ Reports API accessible');
      return true;
    } else {
      console.log(`❌ Reports API failed: ${result.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Reports API error: ${error.message}`);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting system tests...\n');
  
  const tests = [
    { name: 'Gateway Health', fn: testGatewayHealth },
    { name: 'Reporter Health', fn: testReporterHealth },
    { name: 'Single Event', fn: testSingleEvent },
    { name: 'Bulk Events', fn: testBulkEvents },
    { name: 'Reports API', fn: testReportsAPI }
  ];
  
  for (const test of tests) {
    stats.tests++;
    try {
      const result = await test.fn();
      if (result) {
        stats.passed++;
      } else {
        stats.failed++;
        stats.errors.push(`${test.name}: Failed`);
      }
    } catch (error) {
      stats.failed++;
      stats.errors.push(`${test.name}: ${error.message}`);
    }
    console.log(''); // Empty line for readability
  }
  
  // Generate report
  console.log('📊 TEST RESULTS');
  console.log('===============');
  console.log(`Total tests: ${stats.tests}`);
  console.log(`✅ Passed: ${stats.passed}`);
  console.log(`❌ Failed: ${stats.failed}`);
  console.log(`📈 Success rate: ${((stats.passed / stats.tests) * 100).toFixed(1)}%`);
  
  if (stats.errors.length > 0) {
    console.log('\n⚠️  Errors:');
    stats.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }
  
  const overallSuccess = stats.failed === 0;
  console.log(`\n🏆 OVERALL RESULT: ${overallSuccess ? 'PASS' : 'FAIL'}`);
  
  if (overallSuccess) {
    console.log('🎉 All tests passed! System is working correctly.');
  } else {
    console.log('❌ Some tests failed. Check the errors above.');
    console.log('\n💡 To start the system:');
    console.log('   1. Install Docker: https://docs.docker.com/get-docker/');
    console.log('   2. Run: docker-compose up --build');
    console.log('   3. Or start services individually with Node.js');
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted by user');
  process.exit(0);
});

// Run the tests
runTests().catch(console.error);
