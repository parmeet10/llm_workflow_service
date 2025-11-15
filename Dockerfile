FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src

# Expose API port
EXPOSE 3000

# Default command (can be overridden in docker-compose)
CMD ["node", "src/index.js"]