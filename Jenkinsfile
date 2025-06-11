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
        sh 'spectral lint openapi.generated.yaml'
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
          image "grafana/k6:${K6_VERSION}"
          args '--network host'
        }
      }
      steps {
        sh 'k6 run test/test-k6.js --out json=resultado.json'
      }
    }

    stage('Generar y subir reporte') {
      steps {
        sh '''
          mkdir -p ${REPORT_DIR}
          mv resultado.json ${REPORT_DIR}/reporte_${TIMESTAMP}.json
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
