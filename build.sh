#!/bin/bash
# Build script for Render deployment

echo "Starting Render build process..."

# Install dependencies
npm ci

# Build the application
npm run build

# Create data directory for database
mkdir -p data

echo "Build completed successfully!"