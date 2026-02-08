#!/bin/sh
set -e

# Start Xvfb in background
Xvfb :99 -screen 0 1280x720x24 -ac &
XVFB_PID=$!

# Wait for Xvfb to be ready
sleep 2

# Run the main command
exec "$@"
