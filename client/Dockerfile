# ------------------------------
# Etapa 1: Build de la app React
# ------------------------------
FROM node:18-alpine AS build

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código fuente
COPY . .

# Construir el proyecto para producción
RUN npm run build

# ------------------------------
# Etapa 2: Servir con NGINX
# ------------------------------
FROM nginx:alpine

# Copiar archivos de build al directorio de NGINX
COPY --from=build /app/build /usr/share/nginx/html

# Copiar configuración personalizada de NGINX (asegura rutas de React)
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf

# Exponer puerto para frontend
EXPOSE 80

# Comando por defecto
CMD ["nginx", "-g", "daemon off;"]