# Stage 1: Generación del código
FROM openapitools/openapi-generator-cli AS generator

WORKDIR /usr/src/app
COPY ./api/openapi.yaml .
COPY ./api/spectral-rules.yml .

# Genera el servidor (ajusta el lenguaje según necesites)
RUN openapi-generator-cli generate \
    -i openapi.yaml \
    -g nodejs-express-server \
    -o /usr/src/app/generated

# Stage 2: Construcción del servidor
FROM node:18-alpine

WORKDIR /usr/src/app

# Copia solo lo necesario desde la etapa de generación
COPY --from=generator /usr/src/app/generated/package*.json .
COPY --from=generator /usr/src/app/generated .

# Instala dependencias
RUN npm install --production

# Expone el puerto y ejecuta
EXPOSE 3000
CMD ["npm", "start"]