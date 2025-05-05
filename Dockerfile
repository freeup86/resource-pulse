FROM nginx:alpine

# Copy the built app to Nginx's serve directory
COPY build/ /usr/share/nginx/html/

# Copy custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]