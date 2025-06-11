pipeline {
  agent any

  environment {
    K6_VERSION = '0.46.0'
    GIT_BRANCH = 'main'
    REPORT_DIR = 'reports'
    TIMESTAMP = "${new Date().format('yyyyMMdd_HHmm')}"
  }

  stages {

    stage('Clonar repositorio OpenAPI') {
      steps {
        sh '''
          rm -rf openapi-code
          git clone https://github.com/Jreay/OpenAPI.git openapi-code
        '''
      }
    }

    stage('Instalar dependencias') {
      agent {
        docker {
          image 'node:18-alpine'
        }
      }
      steps {
        sh 'npm install'
      }
    }

    stage('Validar contrato OpenAPI original con Spectral') {
      agent {
        docker {
          image 'stoplight/spectral:6.4.0'
          args '--entrypoint=""'
        }
      }
      steps {
        sh 'spectral lint contracts/openapi.yaml -r validation/rules.yml'
      }
    }

    stage('Generar contrato desde código fuente') {
      agent {
        docker {
          image 'node:18-alpine'
        }
      }
      steps {
        sh 'node generateContract.js'
      }
    }

    stage('Validar contrato generado con Spectral') {
      agent {
        docker {
          image 'stoplight/spectral:6.4.0'
          args '--entrypoint=""'
        }
      }
      steps {
        sh 'spectral lint openapi.generated.yaml -r validation/rules.yml'
      }
    }

    stage('Comparar contratos OpenAPI') {
      steps {
        sh '''
          echo "Diferencias entre contratos original y generado:" || true
          diff contracts/openapi.yaml openapi.generated.yaml || true
        '''
      }
    }

    stage('Ejecutar prueba de carga con K6') {
      agent {
        docker {
          image 'node:18-alpine'
          args '--network host'
        }
      }
      steps {
        sh '''
          apk add --no-cache curl unzip
          curl -s https://github.com/grafana/k6/releases/download/v0.46.0/k6-v0.46.0-linux-amd64.tar.gz -L -o k6.tar.gz
          tar -xzf k6.tar.gz
          mv k6-v0.46.0-linux-amd64/k6 /usr/local/bin/k6
          k6 run tests/test-k6.js --out json=resultado.json
        '''
      }
    }


    stage('Generar y subir reporte') {
      steps {
        sh '''
          mkdir -p ${REPORT_DIR}
          mv tests/resultado.json ${REPORT_DIR}/reporte_${TIMESTAMP}.json
        '''

        withCredentials([usernamePassword(credentialsId: 'github-credentials', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_PASS')]) {
          sh '''
            git config user.name "jenkins-bot"
            git config user.email "jenkins@localhost"
            git add ${REPORT_DIR}
            git commit -m "📊 Reporte generado automáticamente: ${TIMESTAMP}" || true
            git push https://${GIT_USER}:${GIT_PASS}@github.com/Jreay/ApiDesignFirst_CI-CD.git HEAD:main
          '''
        }
      }
    }
  }

  post {
    always {
      echo '✅ Pipeline finalizado. Revisa validaciones y pruebas de carga.'
    }
    failure {
      echo '🔴 Error detectado en el pipeline.'
    }
  }
}
