pipeline {
  agent any

  environment {
    K6_VERSION = '0.46.0'
  }

  stages {
    stage('Instalar herramientas') {
      agent {
        docker {
          image 'node:18'
        }
      }
      steps {
        sh '''
          npm install -g @stoplight/spectral-cli
          wget https://github.com/grafana/k6/releases/download/v$K6_VERSION/k6-v$K6_VERSION-linux-amd64.tar.gz
          tar -xzf k6-v$K6_VERSION-linux-amd64.tar.gz
          mv k6-v$K6_VERSION-linux-amd64/k6 /usr/local/bin/
        '''
      }
    }

    stage('Validar contrato OpenAPI') {
      agent {
        docker {
          image 'node:18'
        }
      }
      steps {
        sh 'spectral lint api/openapi.yaml -r api/spectral-rules.yml'
      }
    }

    stage('Ejecutar prueba de carga con K6') {
      steps {
        sh 'k6 run tests/test-k6.js'
      }
    }
  }

  post {
    always {
      echo 'Pipeline terminado. Verifica resultados de Spectral y K6.'
    }
  }
}
