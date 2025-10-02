#!/bin/bash

# Development Proxy Stop Script
# Stops all services started by dev-proxy-start.sh

echo "🛑 Stopping BakeWind Development Environment"
echo "============================================="
echo ""

# Kill processes by port
echo "Killing processes on ports 3000, 3001, 5000, 8080..."

lsof -ti:3000 | xargs kill -9 2>/dev/null && echo "✓ Stopped website (port 3000)" || echo "  No process on port 3000"
lsof -ti:3001 | xargs kill -9 2>/dev/null && echo "✓ Stopped admin (port 3001)" || echo "  No process on port 3001"
lsof -ti:5000 | xargs kill -9 2>/dev/null && echo "✓ Stopped API (port 5000)" || echo "  No process on port 5000"
lsof -ti:8080 | xargs kill -9 2>/dev/null && echo "✓ Stopped Caddy (port 8080)" || echo "  No process on port 8080"

# Also kill by PIDs if file exists
if [ -f "logs/pids.txt" ]; then
    echo ""
    echo "Killing processes from PID file..."
    while read pid; do
        kill -9 "$pid" 2>/dev/null && echo "✓ Killed PID $pid" || true
    done < logs/pids.txt
    rm logs/pids.txt
fi

echo ""
echo "✅ All services stopped"
