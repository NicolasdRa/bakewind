#!/bin/bash

# Development Proxy Startup Script
# This script starts all three apps and the Caddy reverse proxy

set -e

echo "🚀 Starting BakeWind Development Environment with Proxy"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if required ports are available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${YELLOW}⚠️  Port $1 is already in use${NC}"
        echo "   Process: $(lsof -Pi :$1 -sTCP:LISTEN | tail -n 1)"
        return 1
    fi
    return 0
}

echo -e "${BLUE}📋 Checking ports...${NC}"
PORTS_OK=true
check_port 3000 || PORTS_OK=false
check_port 3001 || PORTS_OK=false
check_port 5000 || PORTS_OK=false
check_port 8080 || PORTS_OK=false

if [ "$PORTS_OK" = false ]; then
    echo ""
    echo -e "${YELLOW}Some ports are in use. Kill existing processes? (y/N)${NC}"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "Killing processes..."
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
        lsof -ti:3001 | xargs kill -9 2>/dev/null || true
        lsof -ti:5000 | xargs kill -9 2>/dev/null || true
        lsof -ti:8080 | xargs kill -9 2>/dev/null || true
        sleep 2
    else
        echo "Exiting..."
        exit 1
    fi
fi

echo ""
echo -e "${BLUE}1️⃣  Starting API (localhost:5000)...${NC}"
cd api
npm run start:dev > ../logs/api.log 2>&1 &
API_PID=$!
echo "   PID: $API_PID"

echo ""
echo -e "${BLUE}2️⃣  Starting Website (localhost:3000)...${NC}"
cd ../website
cp .env.proxy .env
npm run dev > ../logs/website.log 2>&1 &
WEBSITE_PID=$!
echo "   PID: $WEBSITE_PID"

echo ""
echo -e "${BLUE}3️⃣  Starting Admin Dashboard (localhost:3001)...${NC}"
cd ../admin
cp .env.proxy .env
npm run dev > ../logs/admin.log 2>&1 &
ADMIN_PID=$!
echo "   PID: $ADMIN_PID"

echo ""
echo -e "${BLUE}⏳ Waiting for services to start (10 seconds)...${NC}"
sleep 10

echo ""
echo -e "${BLUE}4️⃣  Starting Caddy Reverse Proxy (localhost:8080)...${NC}"
cd ..
caddy run --config Caddyfile > logs/caddy.log 2>&1 &
CADDY_PID=$!
echo "   PID: $CADDY_PID"

echo ""
echo -e "${GREEN}✅ All services started!${NC}"
echo ""
echo "=================================================="
echo -e "${GREEN}🌐 Access the application:${NC}"
echo ""
echo "   🔗 Main Application:    http://localhost:8080"
echo "   👤 Customer Login:      http://localhost:8080/login"
echo "   🎛️  Admin Dashboard:     http://localhost:8080/admin"
echo "   📡 API:                 http://localhost:8080/api/v1"
echo "   ❤️  Health Check:        http://localhost:8080/health"
echo ""
echo "=================================================="
echo -e "${BLUE}📊 Service PIDs:${NC}"
echo "   API:     $API_PID"
echo "   Website: $WEBSITE_PID"
echo "   Admin:   $ADMIN_PID"
echo "   Caddy:   $CADDY_PID"
echo ""
echo -e "${YELLOW}To stop all services, run:${NC}"
echo "   kill $API_PID $WEBSITE_PID $ADMIN_PID $CADDY_PID"
echo ""
echo -e "${BLUE}📝 Logs are in ./logs/ directory${NC}"
echo ""

# Create logs directory
mkdir -p logs

# Save PIDs to file for easy cleanup
echo "$API_PID" > logs/pids.txt
echo "$WEBSITE_PID" >> logs/pids.txt
echo "$ADMIN_PID" >> logs/pids.txt
echo "$CADDY_PID" >> logs/pids.txt

# Keep script running and tail logs
echo -e "${BLUE}Following Caddy logs (Ctrl+C to stop)...${NC}"
echo ""
tail -f logs/caddy.log
