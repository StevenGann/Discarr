#!/bin/sh
# Discarr container entrypoint. Starts Xvfb (virtual X11 display :99) then runs the app.
set -e

# Start Xvfb in background - required for Firefox and MPV in headless mode
Xvfb :99 -screen 0 1280x720x24 -ac &
XVFB_PID=$!

# Wait for Xvfb to be ready
sleep 2

# Run the main command
exec "$@"
