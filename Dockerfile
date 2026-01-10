
# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for Convex and Vite
ARG CONVEX_DEPLOYMENT
ARG VITE_CONVEX_URL
ARG CONVEX_ACCESS_TOKEN

# Set environment variables from build args
ENV CONVEX_DEPLOYMENT=$CONVEX_DEPLOYMENT
ENV VITE_CONVEX_URL=$VITE_CONVEX_URL
ENV CONVEX_ACCESS_TOKEN=$CONVEX_ACCESS_TOKEN

# Run the build command (includes "npx convex codegen")
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the built assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration for specific SPA routing support
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
