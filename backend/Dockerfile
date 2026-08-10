FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --only=production || npm install

COPY . .

# Expose port and start application
EXPOSE 5000
CMD [ "npm", "start" ]
