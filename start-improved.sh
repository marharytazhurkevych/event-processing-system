#!/bin/bash

# 🚀 Improved Event Processing System Startup Script
# Combines the best features from both implementations

set -e

echo "🚀 Event Processing System - Improved Version"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    print_status "Checking Docker..."
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Check if .env file exists
check_env() {
    print_status "Checking environment configuration..."
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from env.example..."
        cp env.example .env
        print_success ".env file created"
    else
        print_success ".env file found"
    fi
}

# Build and start services
start_services() {
    print_status "Starting Event Processing System..."
    echo ""
    
    # Choose Docker Compose file
    if [ -f "docker-compose.improved.yml" ]; then
        print_status "Using improved Docker Compose configuration..."
        docker-compose -f docker-compose.improved.yml up --build -d
    else
        print_status "Using standard Docker Compose configuration..."
        docker-compose up --build -d
    fi
    
    print_success "Services started successfully!"
}

# Wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    # Wait for NATS
    print_status "Waiting for NATS..."
    timeout 60 bash -c 'until curl -f http://localhost:8222/healthz > /dev/null 2>&1; do sleep 2; done'
    print_success "NATS is ready"
    
    # Wait for Gateway
    print_status "Waiting for Gateway..."
    timeout 60 bash -c 'until curl -f http://localhost:3000/health > /dev/null 2>&1; do sleep 2; done'
    print_success "Gateway is ready"
    
    # Wait for Reporter
    print_status "Waiting for Reporter..."
    timeout 60 bash -c 'until curl -f http://localhost:3003/health > /dev/null 2>&1; do sleep 2; done'
    print_success "Reporter is ready"
    
    # Wait for Grafana
    print_status "Waiting for Grafana..."
    timeout 60 bash -c 'until curl -f http://localhost:3001/api/health > /dev/null 2>&1; do sleep 2; done'
    print_success "Grafana is ready"
}

# Display service URLs
show_urls() {
    echo ""
    print_success "🎉 Event Processing System is ready!"
    echo ""
    echo "📊 Service URLs:"
    echo "  Gateway:        http://localhost:3000"
    echo "  Facebook Collector: http://localhost:3001"
    echo "  TikTok Collector:   http://localhost:3002"
    echo "  Reporter:       http://localhost:3003"
    echo "  Prometheus:     http://localhost:9090"
    echo "  Grafana:        http://localhost:3001 (admin/admin)"
    echo "  NATS Monitoring: http://localhost:8222"
    echo ""
    echo "🧪 Quick Tests:"
    echo "  Health Check:   curl http://localhost:3000/health"
    echo "  Send Event:     curl -X POST http://localhost:3000/webhook/events -H 'Content-Type: application/json' -d '{\"eventId\":\"test\",\"eventType\":\"ad.view\",\"source\":\"facebook\"}'"
    echo "  Get Reports:    curl http://localhost:3003/reports/events"
    echo ""
}

# Main execution
main() {
    check_docker
    check_env
    start_services
    wait_for_services
    show_urls
}

# Run main function
main "$@"
