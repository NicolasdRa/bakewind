#!/bin/bash

# Contract Test Runner for BakeWind API
# This script sets up the test environment and runs contract tests

set -e

echo "🚀 BakeWind API Contract Test Runner"
echo "===================================="

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

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the bakewind-api directory."
    exit 1
fi

# Check if Node.js and npm are available
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed or not in PATH"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed or not in PATH"
    exit 1
fi

# Check if PostgreSQL is running
print_status "Checking PostgreSQL connection..."
if ! pg_isready -h localhost -p 5433 &> /dev/null; then
    print_warning "PostgreSQL is not running on localhost:5433"
    print_status "Starting PostgreSQL with Docker Compose..."

    # Check if docker-compose.yml exists in parent directory
    if [ -f "../docker-compose.yml" ]; then
        cd ..
        docker-compose up -d postgres
        cd bakewind-api

        # Wait for PostgreSQL to be ready
        print_status "Waiting for PostgreSQL to be ready..."
        for i in {1..30}; do
            if pg_isready -h localhost -p 5433 &> /dev/null; then
                print_success "PostgreSQL is ready!"
                break
            fi
            echo -n "."
            sleep 1
        done

        if ! pg_isready -h localhost -p 5433 &> /dev/null; then
            print_error "PostgreSQL failed to start after 30 seconds"
            exit 1
        fi
    else
        print_error "Please ensure PostgreSQL is running on localhost:5433"
        exit 1
    fi
else
    print_success "PostgreSQL is running"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
fi

# Create test environment file
print_status "Setting up test environment..."
cat > .env.test << EOL
# Test Environment Configuration
NODE_ENV=test
DATABASE_URL=postgresql://postgres:bakewind_secure_password_2025@localhost:5433/bakewind_db_test
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_USER=postgres
DATABASE_PASSWORD=bakewind_secure_password_2025
DATABASE_NAME=bakewind_db_test

# JWT Configuration for tests
JWT_SECRET=test-jwt-secret-for-contract-tests
JWT_REFRESH_SECRET=test-refresh-secret-for-contract-tests
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Bcrypt (lower rounds for faster tests)
BCRYPT_ROUNDS=4

# Stripe test configuration
STRIPE_SECRET_KEY=sk_test_contract_test_key
STRIPE_PUBLISHABLE_KEY=pk_test_contract_test_key
STRIPE_WEBHOOK_SECRET=whsec_contract_test_secret

# SaaS Configuration
TRIAL_LENGTH_DAYS=14
DEFAULT_TRIAL_PLAN=starter
FRONTEND_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:3001

# Rate Limiting (higher for tests)
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=1000
EOL

print_success "Test environment configured"

# Run contract test setup
print_status "Setting up contract test database..."
npm run test:contract:setup

# Run linting
print_status "Running code linting..."
npm run lint

# Build the application
print_status "Building application..."
npm run build

# Run contract tests
print_status "Running contract tests..."
echo ""

if npm run test:contract; then
    echo ""
    print_success "✨ All contract tests passed!"
    echo ""

    # Generate coverage report if requested
    if [ "$1" = "--coverage" ]; then
        print_status "Generating coverage report..."
        npm run test:contract -- --coverage
        print_success "Coverage report generated in coverage-contract/"
    fi

    # Clean up test environment
    print_status "Cleaning up test environment..."
    rm -f .env.test

    echo ""
    print_success "🎉 Contract tests completed successfully!"
    print_status "API contracts are validated and working correctly."

else
    echo ""
    print_error "❌ Contract tests failed!"
    print_status "Please check the test output above for details."

    # Clean up test environment
    rm -f .env.test

    exit 1
fi