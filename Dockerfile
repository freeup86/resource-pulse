FROM node:18-alpine

WORKDIR /app

# Copy package.json files for both frontend and backend
COPY package*.json ./
COPY resource-pulse-backend/package*.json ./resource-pulse-backend/

# Install dependencies for both projects
RUN npm install
WORKDIR /app/resource-pulse-backend
RUN npm install
WORKDIR /app

# Copy the rest of the application code
COPY . .

# Build the frontend
RUN npm run build

# Configure Nginx to serve frontend and proxy backend requests
RUN apk add --no-cache nginx
COPY nginx.conf /etc/nginx/http.d/default.conf

# Create startup script
RUN echo "#!/bin/sh\n\
cd /app/resource-pulse-backend && node server.js &\n\
nginx -g 'daemon off;'" > /start.sh && chmod +x /start.sh

EXPOSE 80

CMD ["/start.sh"]