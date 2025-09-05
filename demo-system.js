#!/usr/bin/env node

/**
 * Demo script for Event Processing System
 * This script demonstrates the system functionality without requiring full infrastructure
 */

const http = require('http');
const { randomUUID } = require('crypto');

console.log('🚀 Event Processing System Demo');
console.log('================================');
console.log('');

// Sample Facebook event
const facebookEvent = {
  eventId: randomUUID(),
  timestamp: new Date().toISOString(),
  source: 'facebook',
  funnelStage: 'top',
  eventType: 'ad.view',
  data: {
    user: {
      userId: 'user-123',
      name: 'John Doe',
      age: 28,
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

// Sample TikTok event
const tiktokEvent = {
  eventId: randomUUID(),
  timestamp: new Date().toISOString(),
  source: 'tiktok',
  funnelStage: 'bottom',
  eventType: 'purchase',
  data: {
    user: {
      userId: 'user-456',
      username: 'tiktok_user',
      followers: 15000
    },
    engagement: {
      actionTime: new Date().toISOString(),
      profileId: 'profile-789',
      purchasedItem: 'Premium Subscription',
      purchaseAmount: '9.99'
    }
  }
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
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Demo functions
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
      console.log('✅ Gateway is healthy');
      console.log(`   Status: ${result.data.status}`);
      console.log(`   Uptime: ${result.data.uptime}s`);
    } else {
      console.log('❌ Gateway health check failed');
    }
  } catch (error) {
    console.log('❌ Gateway is not running or not accessible');
    console.log(`   Error: ${error.message}`);
  }
  console.log('');
}

async function testWebhookEndpoint() {
  console.log('📡 Testing Webhook Endpoint...');
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
    }, facebookEvent);
    
    if (result.status === 200) {
      console.log('✅ Webhook endpoint is working');
      console.log(`   Response: ${JSON.stringify(result.data, null, 2)}`);
    } else {
      console.log('❌ Webhook endpoint failed');
      console.log(`   Status: ${result.status}`);
    }
  } catch (error) {
    console.log('❌ Webhook endpoint is not accessible');
    console.log(`   Error: ${error.message}`);
  }
  console.log('');
}

async function testReporterEndpoints() {
  console.log('📊 Testing Reporter Endpoints...');
  
  const endpoints = [
    { name: 'Events Report', path: '/reports/events?source=facebook' },
    { name: 'Revenue Report', path: '/reports/revenue?source=facebook' },
    { name: 'Demographics Report', path: '/reports/demographics?source=facebook' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const result = await sendRequest({
        hostname: 'localhost',
        port: 3003,
        path: endpoint.path,
        method: 'GET'
      });
      
      if (result.status === 200) {
        console.log(`✅ ${endpoint.name} is working`);
        if (result.data.success) {
          console.log(`   Data available: ${Object.keys(result.data.data || {}).length} fields`);
        }
      } else {
        console.log(`❌ ${endpoint.name} failed (Status: ${result.status})`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name} is not accessible`);
      console.log(`   Error: ${error.message}`);
    }
  }
  console.log('');
}

async function showSystemArchitecture() {
  console.log('🏗️  System Architecture:');
  console.log('');
  console.log('┌─────────────┐    ┌──────────────┐    ┌─────────────────┐');
  console.log('│  Publisher  │───▶│   Gateway    │───▶│  NATS JetStream │');
  console.log('│ (External)  │    │  (Port 3000) │    │   (Port 4222)   │');
  console.log('└─────────────┘    └──────────────┘    └─────────────────┘');
  console.log('                                              │');
  console.log('                                              ▼');
  console.log('                    ┌─────────────────┐    ┌─────────────────┐');
  console.log('                    │ FB Collector    │    │ TTK Collector   │');
  console.log('                    │  (Port 3001)    │    │  (Port 3002)    │');
  console.log('                    └─────────────────┘    └─────────────────┘');
  console.log('                              │                      │');
  console.log('                              ▼                      ▼');
  console.log('                    ┌─────────────────────────────────────────┐');
  console.log('                    │         PostgreSQL Database            │');
  console.log('                    │         (Port 5432)                    │');
  console.log('                    └─────────────────────────────────────────┘');
  console.log('                                              │');
  console.log('                                              ▼');
  console.log('                    ┌─────────────────────────────────────────┐');
  console.log('                    │         Reporter Service               │');
  console.log('                    │         (Port 3003)                    │');
  console.log('                    └─────────────────────────────────────────┘');
  console.log('');
}

async function showSampleEvents() {
  console.log('📋 Sample Events:');
  console.log('');
  console.log('Facebook Event:');
  console.log(JSON.stringify(facebookEvent, null, 2));
  console.log('');
  console.log('TikTok Event:');
  console.log(JSON.stringify(tiktokEvent, null, 2));
  console.log('');
}

async function showAPIEndpoints() {
  console.log('🔗 API Endpoints:');
  console.log('');
  console.log('Gateway Service (Port 3000):');
  console.log('  POST /webhook/events - Receive webhook events');
  console.log('  GET  /health - Health check');
  console.log('');
  console.log('Reporter Service (Port 3003):');
  console.log('  GET /reports/events - Event statistics');
  console.log('  GET /reports/revenue - Revenue data');
  console.log('  GET /reports/demographics - User demographics');
  console.log('  GET /health - Health check');
  console.log('');
}

// Main demo function
async function runDemo() {
  await showSystemArchitecture();
  await showSampleEvents();
  await showAPIEndpoints();
  
  console.log('🧪 Running System Tests...');
  console.log('');
  
  await testGatewayHealth();
  await testWebhookEndpoint();
  await testReporterEndpoints();
  
  console.log('🎉 Demo completed!');
  console.log('');
  console.log('To start the full system:');
  console.log('  1. Install Docker and Docker Compose');
  console.log('  2. Run: docker-compose up --build');
  console.log('  3. Access services at the URLs shown above');
  console.log('');
  console.log('For local development:');
  console.log('  1. Set up PostgreSQL and NATS');
  console.log('  2. Run individual services with npm run start:dev');
  console.log('');
}

// Run the demo
runDemo().catch(console.error);
