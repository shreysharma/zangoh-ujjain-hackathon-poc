#!/bin/bash

# Deploy IndiaMART Frontend with Docker Compose
# Usage: ./scripts/deploy.sh [environment]

set -e

ENVIRONMENT=${1:-"production"}

echo "🚀 Deploying IndiaMART Frontend ($ENVIRONMENT environment)"

# Load environment variables if .env file exists
if [ -f ".env.${ENVIRONMENT}" ]; then
  echo "📄 Loading environment from .env.${ENVIRONMENT}"
  export $(cat .env.${ENVIRONMENT} | xargs)
elif [ -f ".env" ]; then
  echo "📄 Loading environment from .env"
  export $(cat .env | xargs)
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down --remove-orphans

# Build and start new containers
echo "🔨 Building and starting containers..."
docker-compose up --build -d

# Wait for health check
echo "⏳ Waiting for health check..."
timeout 60 bash -c 'until curl -f http://localhost:3000/api/health; do sleep 2; done'

if [ $? -eq 0 ]; then
  echo "✅ Deployment successful! Frontend is running at http://localhost:3000"
  echo "🏥 Health check: http://localhost:3000/api/health"
else
  echo "❌ Deployment failed - health check timeout"
  echo "📋 Container logs:"
  docker-compose logs frontend
  exit 1
fi

echo ""
echo "📊 Container status:"
docker-compose ps