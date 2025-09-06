# 🚀 Event Processing System

A scalable, production-ready event processing system that handles webhook events from Facebook and TikTok, processes them through NATS JetStream, and provides comprehensive reporting and monitoring capabilities.

## 🏗️ Architecture

The system consists of the following microservices:

- **Gateway**: Receives webhook events and publishes them to NATS JetStream
- **Facebook Collector**: Processes Facebook events and stores them in the database
- **TikTok Collector**: Processes TikTok events and stores them in the database
- **Reporter**: Provides API endpoints for generating analytics reports
- **NATS Initializer**: Sets up NATS JetStream streams and configurations
- **Monitoring**: Prometheus + Grafana for metrics and dashboards

## 🛠️ Technology Stack

- **Backend**: TypeScript, NestJS
- **Message Queue**: NATS JetStream
- **Database**: PostgreSQL with Prisma ORM
- **Monitoring**: Prometheus + Grafana
- **Containerization**: Docker & Docker Compose
- **Validation**: Zod
- **Testing**: Comprehensive test suite

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)

### Running the System

1. **Clone and setup**:
   ```bash
   git clone https://github.com/marharytazhurkevych/event-processing-system.git
   cd event-processing-system
   cp env.example .env
   ```

2. **Start all services**:
   ```bash
   # With improved Docker Compose (recommended)
   docker-compose -f docker-compose.improved.yml up --build
   
   # Or with standard Docker Compose
   docker-compose up --build
   
   # Or with npm
   npm start
   ```

3. **Access the services**:
   - Gateway: http://localhost:3000
   - Facebook Collector: http://localhost:3001
   - TikTok Collector: http://localhost:3002
   - Reporter: http://localhost:3003
   - Prometheus: http://localhost:9090
   - Grafana: http://localhost:3001 (admin/admin)
   - NATS Monitoring: http://localhost:8222

## 📊 Monitoring & Observability

### Grafana Dashboards

The system includes pre-configured Grafana dashboards with:

- **Gateway Metrics**: Event processing rates, error rates, response times
- **Collector Metrics**: Event processing rates per minute, queue depths
- **Reporter Metrics**: Report generation latency, API response times
- **System Metrics**: CPU, memory, disk usage

### Prometheus Metrics

Each service exposes Prometheus metrics:

- `gateway_events_accepted_total`
- `gateway_events_processed_total`
- `gateway_events_failed_total`
- `fb_collector_events_processed_total`
- `ttk_collector_events_processed_total`
- `reporter_reports_generated_total`
- `reporter_report_generation_duration_seconds`

## 🔧 Development

### Local Development

```bash
# Install dependencies
npm install --legacy-peer-deps

# Build all services
npm run build

# Run tests
npm test

# Run linting
npm run lint

# Format code
npm run format
```

### Project Structure

```
event-processing-system/
├── services/              # Microservices
│   ├── gateway/          # Webhook gateway
│   ├── fb-collector/     # Facebook event collector
│   ├── ttk-collector/    # TikTok event collector
│   └── reporter/         # Analytics reporter
├── lib/                  # Shared utilities (like holyviktor)
├── shared/               # Common types and schemas
├── nats-initializer/     # NATS JetStream setup
├── monitoring/           # Prometheus & Grafana configs
├── prisma/              # Database schema
└── docs/                # Documentation
```

## 🧪 Testing

### Quick Tests

```bash
# Test deployment readiness
./test-deployment.sh

# Quick API demo
node demo-server.js
```

### Comprehensive Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Stress test (5+ minutes)
node stress-test.js

# Bulk processing test (50k events)
node bulk-test.js
```

## 📈 Performance & Scaling

### Bulk Processing

The system supports bulk event processing:

- **Single Request**: Up to 50,000 events
- **Batching**: Automatic event batching
- **Parallel Processing**: Concurrent event processing
- **Bulk Inserts**: Optimized database operations

### Stability Features

- **Connection Pooling**: Database connection management
- **Retry Logic**: Automatic retry for failed operations
- **Graceful Shutdown**: Proper cleanup on service stop
- **Health Checks**: Comprehensive health monitoring
- **Circuit Breakers**: Fault tolerance patterns

## 🔒 Security

- Non-root user execution in containers
- Input validation with Zod schemas
- Health check endpoints for monitoring
- Graceful shutdown handling
- Environment-based configuration

## 📚 Documentation

- [Implementation Summary](IMPLEMENTATION_SUMMARY.md)
- [Build Fixes](BUILD_FIXES.md)
- [Bulk Processing](BULK_PROCESSING.md)
- [Stability Configuration](STABILITY_CONFIGURATION.md)
- [Testing Report](TESTING_REPORT.md)
- [Error Testing Report](ERROR_TESTING_REPORT.md)
- [Verification Report](VERIFICATION_REPORT.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆚 Comparison with Other Implementations

This system combines the best of both worlds:

- **From holyviktor/EventsProcessor**: Clean architecture, dedicated NATS initializer, Grafana provisioning
- **Enhanced Features**: Comprehensive documentation, extensive testing, stability improvements, bulk processing

## 🎯 Key Improvements

- ✅ **Dedicated NATS Initializer**: Automatic stream setup
- ✅ **Enhanced Grafana Config**: Pre-configured dashboards
- ✅ **Improved Docker Structure**: Health checks, dependencies
- ✅ **Comprehensive Testing**: 50k events, stress tests
- ✅ **Production Ready**: Error handling, monitoring, scaling
