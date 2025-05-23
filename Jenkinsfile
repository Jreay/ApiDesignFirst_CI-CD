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

    stage('Instalar y ejecutar prueba de carga con K6') {
      agent {
        docker {
          image 'node:18'
        }
      }
      steps {
        sh '''
          wget https://github.com/grafana/k6/releases/download/v$K6_VERSION/k6-v$K6_VERSION-linux-amd64.tar.gz
          tar -xzf k6-v$K6_VERSION-linux-amd64.tar.gz
          mv k6-v$K6_VERSION-linux-amd64/k6 /usr/local/bin/

          echo "Verificando archivos disponibles:"
          ls -R

          echo "Ejecutando prueba de carga con K6..."
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