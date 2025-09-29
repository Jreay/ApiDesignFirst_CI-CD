# API Design First + CI/CD Pipeline

Este proyecto es parte de mi titulación donde insertamos la validación de contratos API con espectral, como filtro inicial para una mejor entrega del producto final y pruebas de rendimiento K6 dentro del flujo.


## 🔧 Tecnologías utilizadas

- **OpenAPI**: Estandarización de contratos para APIs RESTful.
- **Spectral**: Herramienta de linting para verificar buenas prácticas en contratos OpenAPI.
- **Jest**: Framework de pruebas para cobertura de código.
- **SonarQube**: Herramienta de análisis estático de calidad de código.
- **K6**: Framework para pruebas de carga y rendimiento.
- **Python**: Utilizado para la generación del reporte final.
- **Jenkins**: Orquestador de integración continua.
- **Docker**: Entorno reproducible para correr Jenkins en contenedor.


## 🚀 Flujo del pipeline

1. **Validación de contrato** con Spectral.
2. **Validación de código** con Jest y Sonar.
3. **Validación de rendimiento** con K6.
4. **Generación de reporte** con Python.
5. **Simulación de despliegue** con Jenkins.


## 📘 Cómo ejecutar

```bash
docker-compose up -d
