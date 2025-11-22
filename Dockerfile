# Use official Node.js LTS image
FROM node:25.2.1-trixie-slim

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and yarn.lock
COPY package.json ./ 
COPY yarn.lock ./

# Copy source code and start script
COPY . .

# Install curl
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Add Tailscale's GPG key
RUN mkdir -p --mode=0755 /usr/share/keyrings
RUN curl -fsSL https://pkgs.tailscale.com/stable/debian/trixie.noarmor.gpg | tee /usr/share/keyrings/tailscale-archive-keyring.gpg >/dev/null
# Add the tailscale repository
RUN curl -fsSL https://pkgs.tailscale.com/stable/debian/trixie.tailscale-keyring.list | tee /etc/apt/sources.list.d/tailscale.list >/dev/null
# Install Tailscale
RUN apt-get update && apt-get install -y tailscale; rm -rf /var/lib/apt/lists/*

# Install Yarn and project dependencies
RUN if ! command -v yarn >/dev/null 2>&1; then \
    npm install --global yarn \
    else \
        echo "Yarn is already installed, skipping..."; \
    fi

RUN yarn

# Build project and ensure start.sh is executable
RUN yarn build && chmod +x start.sh

# Expose DICT default port
EXPOSE 2628

# Install bash to support start.sh
RUN apt-get update && apt-get install -y bash && rm -rf /var/lib/apt/lists/*

# Start the server with Bash
CMD ["bash", "-c", "./start.sh"]
