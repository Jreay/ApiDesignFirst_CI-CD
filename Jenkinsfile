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
            echo "Instalando K6..."
            wget https://github.com/grafana/k6/releases/download/v0.46.0/k6-v0.46.0-linux-amd64.tar.gz
            tar -xzf k6-v0.46.0-linux-amd64.tar.gz
            mv k6-v0.46.0-linux-amd64/k6 /usr/local/bin/
            
            echo "Verificando disponibilidad del archivo:"
            ls -la test/
            cat test/test-k6.js

            echo "Ejecutando prueba de carga..."
            k6 run test/test-k6.js
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