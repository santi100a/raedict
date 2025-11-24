# Use official Node.js LTS image
FROM node:25.2.1-trixie-slim

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and yarn.lock
COPY package.json ./ 
COPY yarn.lock ./

# Copy source code and start script
COPY . .

# Install Yarn and project dependencies
RUN if ! command -v yarn >/dev/null 2>&1; then \
    npm install --global yarn \
    else \
        echo "Yarn is already installed, skipping..."; \
    fi

RUN yarn

# Build project
RUN yarn build

# Expose DICT default port
EXPOSE 2628

# Start the server with Bash
CMD ["yarn", "start"]
