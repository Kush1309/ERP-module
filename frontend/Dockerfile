# Stage 1: Build the Vite application
FROM node:20-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .

# Pass in any VITE env variables you want to hardcode at build time.
# In this case we use /api to let Nginx reverse proxy it.
ENV VITE_API_BASE_URL=/api

RUN npm run build

# Stage 2: Serve the built application with Nginx
FROM nginx:alpine

# Copy the custom nginx configuration file
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built assets to Nginx
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
