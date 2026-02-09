#!/bin/sh
# Discarr container entrypoint. Starts Xvfb (virtual X11 display :99) then runs the app.
set -e

# Remove stale lock from previous run (container restart preserves /tmp)
rm -f /tmp/.X99-lock /tmp/.X11-unix/X99 2>/dev/null || true

# Two screens: 0 = Firefox (Discord), 1 = MPV only. Share "Screen 1" for video-only.
Xvfb :99 -screen 0 1280x720x24 -screen 1 1280x720x24 -ac &
XVFB_PID=$!

# MPV runs on screen 1 so Discord can share that screen instead of the whole desktop
export DISPLAY_MPV=:99.1

# Start PulseAudio so MPV audio is available to the browser (e.g. for "share audio")
pulseaudio -D 2>/dev/null || true

# Wait for Xvfb to be ready
sleep 2

# Run the main command
exec "$@"
