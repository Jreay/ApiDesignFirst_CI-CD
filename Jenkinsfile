pipeline {
  agent any

  environment {
    K6_VERSION = '0.46.0'
  }

  stages {
    stage('Validar contrato OpenAPI con Spectral') {
      agent {
        docker {
          image 'node:18'
        }
      }
      steps {
        sh '''
          npm install -g @stoplight/spectral-cli
          spectral lint api/openapi.yaml -r api/spectral-rules.yml
        '''
      }
    }

    stage('Ejecutar prueba de carga con K6') {
      steps {
          sh '''
            echo "Verificando disponibilidad del archivo:"
            ls -la tests/
            cat tests/test-k6.js

            echo "Ejecutando prueba de carga..."
            k6 run tests/test-k6.js
          '''
      }
    }

  }

  post {
    always {
      echo 'Pipeline terminado. Verifica resultados de validación y carga.'
    }
  }
}