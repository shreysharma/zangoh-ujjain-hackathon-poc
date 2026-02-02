#!/bin/bash

# Build Docker image for IndiaMART Frontend
# Usage: ./scripts/build-docker.sh [tag]

set -e

# Default tag if not provided
TAG=${1:-"indiamart-frontend:latest"}

echo "🐳 Building Docker image: $TAG"

# Build the Docker image
docker build \
  --build-arg NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE:-https://localhost:8000} \
  --build-arg NEXT_PUBLIC_INDIAMART_DOMAIN=${NEXT_PUBLIC_INDIAMART_DOMAIN:-https://www.indiamart.com} \
  -t $TAG \
  .

echo "✅ Docker image built successfully: $TAG"

# Show image size
echo "📦 Image size:"
docker images $TAG --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

echo ""
echo "🚀 To run the container:"
echo "docker run -p 3000:3000 -e NEXT_PUBLIC_API_BASE=your-api-url $TAG"
echo ""
echo "Or use docker-compose:"
echo "docker-compose up"