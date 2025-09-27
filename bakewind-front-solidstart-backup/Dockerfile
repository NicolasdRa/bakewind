# Use Node.js 22 Alpine for smaller image size
FROM node:22-alpine

# Install Python and build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++ py3-pip

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev) for the build step
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create data directory for SQLite database (this will be overridden by Railway's volume)
RUN mkdir -p /app/data

# Remove dev dependencies after build
RUN npm prune --omit=dev

# Expose the port Railway will use
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]