# 🚀 **BULK EVENT PROCESSING - 50,000 EVENTS PER REQUEST**

## ✅ **СИСТЕМА НАЛАШТОВАНА ДЛЯ ОБРОБКИ ДО 50,000 ПОДІЙ В ОДНОМУ ЗАПИТІ**

### **🎯 Ключові можливості:**

#### **Bulk API Endpoint:**
- ✅ **POST /webhook/events/bulk** - обробка до 50,000 подій
- ✅ **Валідація**: Zod schema з лімітом 50,000 подій
- ✅ **Batch Processing**: Обробка по 1,000 подій за раз
- ✅ **Parallel Processing**: Паралельна обробка по джерелах
- ✅ **Error Handling**: Детальна звітність про помилки

#### **Gateway Optimizations:**
- ✅ **Bulk Publishing**: NATS publishing по 100 подій за раз
- ✅ **Source Grouping**: Групування подій по джерелах (Facebook/TikTok)
- ✅ **Retry Logic**: 3 спроби з exponential backoff
- ✅ **Timeout Management**: 10-секундний timeout на публікацію
- ✅ **Progress Tracking**: Детальне логування прогресу

#### **NATS JetStream Optimizations:**
- ✅ **Bulk Publishing**: Публікація по 100 подій за раз
- ✅ **Stream Limits**: 10M повідомлень, 10GB storage
- ✅ **Retention**: 7 днів збереження
- ✅ **Flow Control**: Увімкнено для стабільності
- ✅ **Ack Wait**: 30 секунд на обробку

#### **Database Optimizations:**
- ✅ **Bulk Inserts**: `createMany` з `skipDuplicates`
- ✅ **Parallel Operations**: Паралельне виконання операцій
- ✅ **Index Optimization**: Додаткові індекси для bulk операцій
- ✅ **Connection Pooling**: Оптимізовані налаштування пулу
- ✅ **Batch Size**: Оптимальний розмір batch для PostgreSQL

## 📊 **АРХІТЕКТУРА BULK PROCESSING:**

### **1. Gateway Layer:**
```
POST /webhook/events/bulk
├── Validation (Zod schema, max 50k events)
├── Batch Processing (1000 events per batch)
├── Source Grouping (Facebook/TikTok)
├── Bulk Publishing to NATS (100 events per batch)
└── Response with statistics
```

### **2. NATS Layer:**
```
Bulk Events
├── Stream: FACEBOOK_EVENTS / TIKTOK_EVENTS
├── Batch Publishing (100 events per batch)
├── Flow Control & Heartbeat
└── Consumer Processing
```

### **3. Collector Layer:**
```
Event Processing
├── Batch Database Operations
├── createMany with skipDuplicates
├── Parallel Operations (events, demographics, revenue)
└── Metrics Recording
```

## 🧪 **ТЕСТУВАННЯ BULK PROCESSING:**

### **Bulk Test Script:**
```bash
# Запуск тесту на 50,000 подій
node bulk-test.js
```

#### **Test Parameters:**
- ✅ **Total Events**: 50,000 подій
- ✅ **Batch Size**: 1,000 подій за batch
- ✅ **Expected Batches**: 50 batches
- ✅ **Success Rate Target**: >95%
- ✅ **Processing Rate Target**: >1,000 events/sec
- ✅ **Timeout**: 2 хвилини на запит

#### **Test Features:**
- ✅ **Memory Efficient**: Генерація подій по batch
- ✅ **Progress Tracking**: Детальний прогрес по batch
- ✅ **Error Reporting**: Збір та аналіз помилок
- ✅ **Performance Metrics**: Швидкість обробки
- ✅ **Health Checks**: Перевірка стану сервісів

## 📈 **ПРОДУКТИВНІСТЬ:**

### **Очікувані показники:**
- ✅ **Throughput**: >1,000 events/sec
- ✅ **Latency**: <2 секунди на 1,000 подій
- ✅ **Success Rate**: >95%
- ✅ **Memory Usage**: Оптимізовано для 50k подій
- ✅ **Database Load**: Розподілено по batch операціях

### **Масштабування:**
- ✅ **Horizontal Scaling**: Gateway та Collectors
- ✅ **Load Balancing**: Розподіл навантаження
- ✅ **Resource Management**: Контроль пам'яті та CPU
- ✅ **Monitoring**: Prometheus метрики
- ✅ **Alerting**: Сповіщення про проблеми

## 🔧 **КОНФІГУРАЦІЯ:**

### **Environment Variables:**
```bash
# Gateway
BATCH_SIZE=1000
NATS_BATCH_SIZE=100
PUBLISH_TIMEOUT=10000

# Database
DB_POOL_SIZE=20
DB_CONNECT_TIMEOUT=30000
DB_QUERY_TIMEOUT=60000

# NATS
NATS_MAX_RECONNECT_ATTEMPTS=-1
NATS_RECONNECT_WAIT=2000
NATS_PING_INTERVAL=120000
```

### **Docker Configuration:**
```yaml
# Resource limits for bulk processing
deploy:
  resources:
    limits:
      memory: 2G
      cpus: '1.0'
    reservations:
      memory: 1G
      cpus: '0.5'
```

## 📊 **МОНІТОРИНГ:**

### **Prometheus Metrics:**
- ✅ `gateway_bulk_events_processed_total`
- ✅ `gateway_bulk_processing_duration_seconds`
- ✅ `gateway_bulk_batch_size_histogram`
- ✅ `collector_bulk_operations_total`
- ✅ `database_bulk_insert_duration_seconds`

### **Grafana Dashboards:**
- ✅ **Bulk Processing Rate**: Events per second
- ✅ **Batch Performance**: Time per batch
- ✅ **Error Rates**: Failed events percentage
- ✅ **Resource Usage**: Memory, CPU, Database
- ✅ **Queue Depth**: NATS queue monitoring

## 🎯 **ВИКОРИСТАННЯ:**

### **Single Event (Existing):**
```bash
curl -X POST http://localhost:3000/webhook/events \
  -H "Content-Type: application/json" \
  -H "x-correlation-id: $(uuidgen)" \
  -d '{
    "eventId": "event-123",
    "timestamp": "2024-01-01T00:00:00Z",
    "source": "facebook",
    "funnelStage": "top",
    "eventType": "ad.view",
    "data": { ... }
  }'
```

### **Bulk Events (New):**
```bash
curl -X POST http://localhost:3000/webhook/events/bulk \
  -H "Content-Type: application/json" \
  -H "x-correlation-id: $(uuidgen)" \
  -d '{
    "events": [
      { "eventId": "event-1", ... },
      { "eventId": "event-2", ... },
      // ... up to 50,000 events
    ]
  }'
```

### **Response Format:**
```json
{
  "success": true,
  "message": "Bulk processing completed: 49500 processed, 500 failed",
  "processed": 49500,
  "failed": 500,
  "errors": ["Event event-123: Validation error", ...]
}
```

## 🏆 **РЕЗУЛЬТАТ:**

**Система повністю налаштована для ефективної обробки до 50,000 подій в одному запиті!**

### **Ключові переваги:**
- 🚀 **Висока продуктивність**: >1,000 events/sec
- 💾 **Оптимізована пам'ять**: Batch processing
- 🔄 **Надійність**: Retry logic та error handling
- 📊 **Моніторинг**: Повне відстеження метрик
- 🎯 **Масштабованість**: Горизонтальне масштабування

**Готово до production використання з високим навантаженням!** 🎉
