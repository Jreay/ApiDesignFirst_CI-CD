# API Design First + CI/CD Pipeline

Este proyecto es parte de mi titulación donde insertamos la validación de contratos API con espectral, como filtro inicial para una mejor entrega del producto final y pruebas de rendimiento K6 dentro del flujo.

## 🔧 Tecnologías utilizadas

- **OpenAPI**: Estandarización de contratos para APIs RESTful.
- **Spectral**: Herramienta de linting para verificar buenas prácticas en contratos OpenAPI.
- **K6**: Framework para pruebas de carga y rendimiento.
- **Jenkins**: Orquestador de integración continua.
- **Docker**: Entorno reproducible para correr Jenkins en contenedor.

## 🚀 Flujo del pipeline

1. **Validación del contrato OpenAPI** con Spectral.
2. **Pruebas calidad de codigo** con Jest y Sonar.
3. **Pruebas de carga automatizadas** con K6.
4. **Simulación de despliegue** con Jenkins.

## 📘 Cómo ejecutar

```bash
docker-compose up -d
