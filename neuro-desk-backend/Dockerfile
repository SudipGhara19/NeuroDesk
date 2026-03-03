# Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy dependency configuration
COPY package.json package-lock.json ./

# Install packages
RUN npm ci

# Copy application source
COPY . .

# Environment
ENV NODE_ENV=production
ENV PORT=5868

# Expose the API Port
EXPOSE 5868

# Start the server using PM2 or Node natively
CMD ["npm", "start"]
