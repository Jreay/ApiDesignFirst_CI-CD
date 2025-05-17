# API Design First + CI/CD Pipeline

Este proyecto es parte de una estrategia de titulación para demostrar la automatización del proceso de validación de contratos API y pruebas de rendimiento dentro de un flujo de integración continua (CI/CD), usando Jenkins, Spectral y K6.

## 🔧 Tecnologías utilizadas

- **OpenAPI 3.1.0**: Estandarización de contratos para APIs RESTful.
- **Spectral**: Herramienta de linting para verificar buenas prácticas en contratos OpenAPI.
- **K6**: Framework para pruebas de carga y rendimiento.
- **Jenkins**: Orquestador de integración continua.
- **Docker**: Entorno reproducible para correr Jenkins en contenedor.

## 🚀 Flujo del pipeline

1. **Validación del contrato OpenAPI** con Spectral.
2. **Pruebas de carga automatizadas** con K6.
3. (Opcional) Simulación de despliegue.

## 📘 Cómo ejecutar

```bash
docker-compose up -d
