#!/bin/bash
# Docker entrypoint script to start both frontend and backend services

echo "Starting Railway QR Generator..."

# Initialize database if it doesn't exist
if [ ! -f "/app/data/qr_records.db" ]; then
    echo "Initializing database..."
    python db_manager.py init
fi

# Start Flask backend in the background
echo "Starting Flask backend on port 5000..."
python app.py &
BACKEND_PID=$!

# Wait for backend to be ready
sleep 5

# Start Node.js frontend
echo "Starting Next.js frontend on port 3000..."
cd frontend && node server.js &
FRONTEND_PID=$!

# Function to handle shutdown
shutdown() {
    echo "Shutting down services..."
    kill $BACKEND_PID $FRONTEND_PID
    wait $BACKEND_PID $FRONTEND_PID
    exit 0
}

# Handle shutdown signals
trap shutdown SIGTERM SIGINT

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID