#!/bin/bash

echo "🚀 Testing Event Processing System"
echo "=================================="

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Test Gateway health
echo "🔍 Testing Gateway health..."
curl -s http://localhost:3000/health | jq '.' || echo "Gateway health check failed"

# Test Facebook Collector health
echo "🔍 Testing Facebook Collector health..."
curl -s http://localhost:3001/health | jq '.' || echo "Facebook Collector health check failed"

# Test TikTok Collector health
echo "🔍 Testing TikTok Collector health..."
curl -s http://localhost:3002/health | jq '.' || echo "TikTok Collector health check failed"

# Test Reporter health
echo "🔍 Testing Reporter health..."
curl -s http://localhost:3003/health | jq '.' || echo "Reporter health check failed"

# Test webhook endpoint
echo "📡 Testing webhook endpoint..."
curl -X POST http://localhost:3000/webhook/events \
  -H "Content-Type: application/json" \
  -H "x-correlation-id: test-123" \
  -d '{
    "eventId": "test-event-1",
    "timestamp": "2024-01-01T00:00:00Z",
    "source": "facebook",
    "funnelStage": "top",
    "eventType": "ad.view",
    "data": {
      "user": {
        "userId": "user-1",
        "name": "Test User",
        "age": 25,
        "gender": "male",
        "location": {
          "country": "US",
          "city": "New York"
        }
      },
      "engagement": {
        "actionTime": "2024-01-01T00:00:00Z",
        "referrer": "newsfeed",
        "videoId": null
      }
    }
  }' | jq '.' || echo "Webhook test failed"

# Wait for event processing
echo "⏳ Waiting for event processing..."
sleep 10

# Test reports
echo "📊 Testing event reports..."
curl -s "http://localhost:3003/reports/events?source=facebook" | jq '.' || echo "Event reports test failed"

echo "📊 Testing revenue reports..."
curl -s "http://localhost:3003/reports/revenue?source=facebook" | jq '.' || echo "Revenue reports test failed"

echo "📊 Testing demographics reports..."
curl -s "http://localhost:3003/reports/demographics?source=facebook" | jq '.' || echo "Demographics reports test failed"

# Test Prometheus metrics
echo "📈 Testing Prometheus metrics..."
curl -s http://localhost:9090/api/v1/query?query=gateway_events_accepted_total | jq '.' || echo "Prometheus metrics test failed"

echo "✅ System test completed!"
