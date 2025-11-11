#Docker backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
# Exponer puertos dinámicos
EXPOSE 3000 3001 3002 3003 3004
CMD ["node", "server.js"]