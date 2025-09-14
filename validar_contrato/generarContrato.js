const swaggerJsdoc = require('swagger-jsdoc');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Configuración de swagger-jsdoc
const options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'API de Movimientos Bancarios',
      version: '1.0.0',
      description: 'API para consultar movimientos de cuentas y tarjetas',
    },
    servers: [
      {
        url: "http://localhost:3000", 
        description: "Servidor Local",
      },
      {
        url: "https://openapi-09h0.onrender.com", 
        description: "Servidor Desarrollo",
      }
    ],
  },
  apis: [path.resolve(__dirname, '../OpenAPI/src/controllers/**/*.js')], // Apuntando a la carpeta de controllers
};

// Generar el objeto de especificación OpenAPI
const swaggerSpec = swaggerJsdoc(options);

// Convertir el objeto a formato YAML
const yamlSpec = yaml.dump(swaggerSpec);

// Guardar el YAML en un archivo
const filePath = path.join(__dirname, 'openapiGenerado.yaml');
fs.writeFileSync(filePath, yamlSpec, 'utf8');

console.log(`Contrato OpenAPI generado y guardado en: ${filePath}`);