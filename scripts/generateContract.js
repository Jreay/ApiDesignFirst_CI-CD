const swaggerJSDoc = require('swagger-jsdoc');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Movimientos',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'https://openapi-09h0.onrender.com',
        description: 'Servidor de Producción',
      },
    ],
  },
  apis: ['./openapi-code/src/controllers/*.js'], // 👈 ajustado al repo clonado
};

const swaggerSpec = swaggerJSDoc(options);
const yamlSpec = yaml.dump(swaggerSpec);

fs.writeFileSync(path.join(__dirname, 'openapi.generated.yaml'), yamlSpec, 'utf8');
console.log('✅ Contrato generado con éxito');
