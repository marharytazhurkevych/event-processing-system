#!/bin/bash

echo "🚀 Starting Event Processing System Locally"
echo "==========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are available"

# Install dependencies for shared package
echo "📦 Installing shared dependencies..."
cd shared && npm install && cd ..

# Install dependencies for gateway
echo "📦 Installing gateway dependencies..."
cd services/gateway && npm install && cd ../..

# Install dependencies for fb-collector
echo "📦 Installing fb-collector dependencies..."
cd services/fb-collector && npm install && cd ../..

# Install dependencies for ttk-collector
echo "📦 Installing ttk-collector dependencies..."
cd services/ttk-collector && npm install && cd ../..

# Install dependencies for reporter
echo "📦 Installing reporter dependencies..."
cd services/reporter && npm install && cd ../..

echo "✅ All dependencies installed"

# Build shared package
echo "🔨 Building shared package..."
cd shared && npm run build && cd ..

# Build all services
echo "🔨 Building all services..."
cd services/gateway && npm run build && cd ../..
cd services/fb-collector && npm run build && cd ../..
cd services/ttk-collector && npm run build && cd ../..
cd services/reporter && npm run build && cd ../..

echo "✅ All services built"

echo "🎉 System is ready to run!"
echo ""
echo "To start individual services:"
echo "  Gateway:     cd services/gateway && npm run start:dev"
echo "  FB Collector: cd services/fb-collector && npm run start:dev"
echo "  TTK Collector: cd services/ttk-collector && npm run start:dev"
echo "  Reporter:    cd services/reporter && npm run start:dev"
echo ""
echo "Note: You'll need to set up PostgreSQL and NATS separately for full functionality."
