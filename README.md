# Event Processing System

A scalable event processing system that handles webhook events from Facebook and TikTok, processes them through NATS JetStream, and provides comprehensive reporting and monitoring capabilities.

## Architecture

The system consists of the following microservices:

- **Gateway**: Receives webhook events and publishes them to NATS JetStream
- **Facebook Collector**: Processes Facebook events and stores them in the database
- **TikTok Collector**: Processes TikTok events and stores them in the database
- **Reporter**: Provides API endpoints for generating analytics reports
- **Publisher**: External service that sends webhook events (andriiuni/events)

## Technology Stack

- **Backend**: TypeScript, NestJS
- **Message Queue**: NATS JetStream
- **Database**: PostgreSQL with Prisma ORM
- **Monitoring**: Prometheus + Grafana
- **Containerization**: Docker & Docker Compose
- **Validation**: Zod

## Quick Start

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
   # With Docker (recommended)
   npm start
   # or
   docker-compose up --build
   
   # Without Docker (Node.js only)
   npm install --legacy-peer-deps
   node demo-server.js  # Quick demo server
   ```

3. **Access the services**:
   - Gateway: http://localhost:3000
   - Facebook Collector: http://localhost:3001
   - TikTok Collector: http://localhost:3002
   - Reporter: http://localhost:3003
   - Prometheus: http://localhost:9090
   - Grafana: http://localhost:3001 (admin/admin)
   - Demo Server: http://localhost:3001 (if using demo-server.js)

### Development Mode

```bash
npm run dev
# or
docker-compose -f docker-compose.dev.yml up --build
```

## API Endpoints

### Reporter Service

#### GET /reports/events
Returns aggregated event statistics with optional filters.

**Query Parameters:**
- `from` (optional): Start time (ISO 8601)
- `to` (optional): End time (ISO 8601)
- `source` (optional): "facebook" or "tiktok"
- `funnelStage` (optional): "top" or "bottom"
- `eventType` (optional): Specific event type

**Example:**
```bash
curl "http://localhost:3003/reports/events?source=facebook&funnelStage=top"
```

#### GET /reports/revenue
Returns aggregated revenue data from transactional events.

**Query Parameters:**
- `from` (optional): Start time (ISO 8601)
- `to` (optional): End time (ISO 8601)
- `source` (optional): "facebook" or "tiktok"
- `campaignId` (optional): Campaign ID

**Example:**
```bash
curl "http://localhost:3003/reports/revenue?source=facebook&from=2024-01-01T00:00:00Z"
```

#### GET /reports/demographics
Returns user demographic data.

**Query Parameters:**
- `from` (optional): Start time (ISO 8601)
- `to` (optional): End time (ISO 8601)
- `source` (optional): "facebook" or "tiktok"

**Example:**
```bash
curl "http://localhost:3003/reports/demographics?source=facebook"
```

### Health Checks

All services expose health check endpoints:

- **Liveness**: `/health/liveness`
- **Readiness**: `/health/readiness`
- **General Health**: `/health`

## Event Types

### Facebook Events
- **Top Funnel**: `ad.view`, `page.like`, `comment`, `video.view`
- **Bottom Funnel**: `ad.click`, `form.submission`, `checkout.complete`

### TikTok Events
- **Top Funnel**: `video.view`, `like`, `share`, `comment`
- **Bottom Funnel**: `profile.visit`, `purchase`, `follow`

## Monitoring

### Grafana Dashboards

The system includes pre-configured Grafana dashboards with:

- **Gateway Metrics**: Accepted, processed, and failed events
- **Collector Metrics**: Event processing rates per minute
- **Reporter Metrics**: Report generation latency

### Prometheus Metrics

Each service exposes Prometheus metrics:

- `gateway_events_accepted_total`
- `gateway_events_processed_total`
- `gateway_events_failed_total`
- `fb_collector_events_processed_total`
- `ttk_collector_events_processed_total`
- `reporter_reports_generated_total`
- `reporter_report_generation_duration_seconds`

## Database Schema

The system uses PostgreSQL with the following main tables:

- `processed_events`: Raw event data
- `user_demographics`: User demographic information
- `revenue_transactions`: Revenue data from purchase events
- `event_metrics`: Service metrics for monitoring

## Configuration

### Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `NATS_URL`: NATS JetStream connection string
- `PORT`: Service port (defaults vary by service)
- `NODE_ENV`: Environment (development/production)

### Multi-Environment Support

The system supports multiple environments:

- **Development**: `docker-compose.dev.yml`
- **Production**: `docker-compose.yml`

## Scaling

The architecture supports horizontal scaling:

- **Gateway**: Can be scaled to handle more webhook traffic
- **Collectors**: Can be scaled independently for Facebook and TikTok events
- **Reporter**: Can be scaled for higher report generation throughput

## Testing

### Quick Test
```bash
# Test deployment readiness
./test-deployment.sh

# Quick API demo
node demo-server.js
# Then visit: http://localhost:3001
```

### Full Testing
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests for specific service
npm run test --workspace=services/gateway

# Stress test (5+ minutes)
node stress-test.js

# Bulk processing test (50k events)
node bulk-test.js
```

## Logging

The system implements structured logging with correlation IDs to trace events across services. All logs include:

- Timestamp
- Service name
- Correlation ID
- Log level
- Message

## Data Persistence

- **PostgreSQL**: Persistent data storage
- **NATS JetStream**: Message persistence and replay capability
- **Docker Volumes**: Data persistence across container restarts

## Security

- Non-root user execution in containers
- Input validation with Zod schemas
- Health check endpoints for monitoring
- Graceful shutdown handling

## Troubleshooting

### Common Issues

1. **Services not starting**: Check Docker logs and health check endpoints
2. **Database connection issues**: Verify PostgreSQL is running and accessible
3. **NATS connection issues**: Check NATS JetStream configuration
4. **Missing metrics**: Ensure Prometheus can scrape service endpoints

### Logs

```bash
# View logs for specific service
docker-compose logs gateway
docker-compose logs fb-collector
docker-compose logs ttk-collector
docker-compose logs reporter
```

### Health Checks

```bash
# Check service health
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.
