#!/bin/bash
set -e

# Start tailscaled
tailscaled --state=mem:/tmp/tailscale.state &
sleep 2

# Log into Tailscale
tailscale up --authkey="$TAILSCALE_KEY" --hostname=raedict-docker --accept-dns=false

# Enable Funnel (TCP)
tailscale funnel 2628 &

# Start your DICT server in the background
yarn start 
