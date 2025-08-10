# Use Node 18 for the builder
FROM scb-quay-quay-enterprise.apps.ocp-hub.scb.local/scbhq/baseimage:node-18 AS builder

# Set the working directory
WORKDIR /app

# Install pnpm from the public npm registry
RUN npm config set registry https://registry.npmjs.org/ && npm install -g pnpm

# Copy dependency files
COPY package.json pnpm-lock.yaml .npmrc ./

# Install pnpm and dependencies
RUN pnpm install --verbose

# Copy the application code
COPY . .

RUN pnpm run setup:config

# Reset the Nx cache and build the application
RUN npx nx reset && npx nx run ebanking-portal:build --verbose

# Step 2: Use an NGINX image to serve the application
FROM scb-quay-quay-enterprise.apps.ocp-hub.scb.local/scbhq/baseimage:nginx-1.25
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy the built application from the previous step
COPY --from=builder /app/dist/apps/ebanking-portal/browser /usr/share/nginx/html

# Create required directories and set permissions
RUN chmod g+rwx /var/cache/nginx /var/run /var/log/nginx /etc/nginx && \
    chgrp -R root /var/cache/nginx /var/run /var/log/nginx /etc/nginx && \
    mkdir -p /tmp/client_temp && \
    chmod 777 /tmp/client_temp

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]

