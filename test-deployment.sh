#!/bin/bash

echo "🚀 Testing Event Processing System Deployment"
echo "============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if required tools are installed
echo "🔍 Checking prerequisites..."

# Check Docker
if command -v docker &> /dev/null; then
    print_status 0 "Docker is installed"
    DOCKER_AVAILABLE=true
else
    print_status 1 "Docker is not installed"
    DOCKER_AVAILABLE=false
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null; then
    print_status 0 "Docker Compose is installed"
    COMPOSE_AVAILABLE=true
else
    print_status 1 "Docker Compose is not installed"
    COMPOSE_AVAILABLE=false
fi

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status 0 "Node.js is installed ($NODE_VERSION)"
    NODE_AVAILABLE=true
else
    print_status 1 "Node.js is not installed"
    NODE_AVAILABLE=false
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_status 0 "npm is installed ($NPM_VERSION)"
    NPM_AVAILABLE=true
else
    print_status 1 "npm is not installed"
    NPM_AVAILABLE=false
fi

echo ""

# Check if required files exist
echo "📁 Checking required files..."

files=(
    "package.json"
    "docker-compose.yml"
    ".env"
    "services/gateway/Dockerfile"
    "services/fb-collector/Dockerfile"
    "services/ttk-collector/Dockerfile"
    "services/reporter/Dockerfile"
    "shared/package.json"
    "prisma/schema.prisma"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        print_status 0 "File exists: $file"
    else
        print_status 1 "File missing: $file"
    fi
done

echo ""

# Test npm install
if [ "$NPM_AVAILABLE" = true ]; then
    echo "📦 Testing npm install..."
    if npm install --legacy-peer-deps &> /dev/null; then
        print_status 0 "npm install successful"
    else
        print_status 1 "npm install failed"
    fi
else
    print_warning "Skipping npm install test (npm not available)"
fi

echo ""

# Test Docker build (if Docker is available)
if [ "$DOCKER_AVAILABLE" = true ] && [ "$COMPOSE_AVAILABLE" = true ]; then
    echo "🐳 Testing Docker build..."
    
    # Test building one service
    if docker-compose build gateway &> /dev/null; then
        print_status 0 "Docker build successful"
    else
        print_status 1 "Docker build failed"
        print_warning "This might be due to missing dependencies or network issues"
    fi
else
    print_warning "Skipping Docker build test (Docker/Docker Compose not available)"
fi

echo ""

# Summary
echo "📊 DEPLOYMENT READINESS SUMMARY"
echo "==============================="

if [ "$DOCKER_AVAILABLE" = true ] && [ "$COMPOSE_AVAILABLE" = true ]; then
    echo -e "${GREEN}✅ Full Docker deployment ready${NC}"
    echo "   Run: docker-compose up --build"
elif [ "$NODE_AVAILABLE" = true ] && [ "$NPM_AVAILABLE" = true ]; then
    echo -e "${YELLOW}⚠️  Node.js deployment ready (Docker not available)${NC}"
    echo "   Run: npm install --legacy-peer-deps"
    echo "   Then start services individually"
else
    echo -e "${RED}❌ Deployment not ready${NC}"
    echo "   Missing required tools"
fi

echo ""
echo "🔗 GitHub Repository: https://github.com/marharytazhurkevych/event-processing-system"
echo "📖 Documentation: See README.md for detailed instructions"
echo ""

# Test API endpoints (if demo server is available)
if [ -f "demo-server.js" ]; then
    echo "🧪 Quick API Test Available:"
    echo "   Run: node demo-server.js"
    echo "   Then visit: http://localhost:3001"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Clone the repository"
echo "2. Copy env.example to .env"
echo "3. Run: npm start (or docker-compose up --build)"
echo "4. Test the API endpoints"
echo ""
