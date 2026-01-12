FROM node:20-alpine AS builder

#  Declare build args FIRST
ARG CONVEX_DEPLOY_KEY
ARG CONVEX_DEPLOYMENT
ARG VITE_CONVEX_URL

ENV CONVEX_DEPLOY_KEY=$CONVEX_DEPLOY_KEY
ENV CONVEX_DEPLOYMENT=$CONVEX_DEPLOYMENT
ENV VITE_CONVEX_URL=$VITE_CONVEX_URL

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the build output from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
