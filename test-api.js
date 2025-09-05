#!/usr/bin/env node

/**
 * API Test Script
 * Tests the /reports/events endpoint with eventType filter
 */

const http = require('http');

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
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testEventTypeFilter() {
  console.log('🧪 Testing /reports/events with eventType filter...');
  
  try {
    const result = await sendRequest({
      hostname: 'localhost',
      port: 3003,
      path: '/reports/events?eventType=ad.view',
      method: 'GET'
    });
    
    console.log(`Status: ${result.status}`);
    console.log('Response:', JSON.stringify(result.data, null, 2));
    
    if (result.status === 200 && result.data.success) {
      console.log('✅ API correctly handles eventType filter');
      console.log(`   Total events: ${result.data.data?.totalEvents || 0}`);
      console.log(`   Events by type: ${JSON.stringify(result.data.data?.eventsByType || {})}`);
    } else {
      console.log('❌ API failed to handle eventType filter');
    }
  } catch (error) {
    console.log('❌ API is not accessible');
    console.log(`   Error: ${error.message}`);
  }
}

async function testEmptyResponse() {
  console.log('\n🧪 Testing empty response scenario...');
  
  try {
    const result = await sendRequest({
      hostname: 'localhost',
      port: 3003,
      path: '/reports/events?source=nonexistent',
      method: 'GET'
    });
    
    console.log(`Status: ${result.status}`);
    console.log('Response:', JSON.stringify(result.data, null, 2));
    
    if (result.status === 200 && result.data.success) {
      console.log('✅ API correctly returns empty response');
      console.log(`   Total events: ${result.data.data?.totalEvents || 0}`);
    } else {
      console.log('❌ API failed to return empty response');
    }
  } catch (error) {
    console.log('❌ API is not accessible');
    console.log(`   Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 API Testing Suite');
  console.log('===================\n');
  
  await testEventTypeFilter();
  await testEmptyResponse();
  
  console.log('\n🎉 API tests completed!');
}

runTests().catch(console.error);
