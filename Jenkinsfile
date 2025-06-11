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
          echo "📦 Instalando dependencias básicas"
          apk add --no-cache curl unzip nodejs npm

          echo "⬇️ Descargando k6"
          curl -sL https://github.com/grafana/k6/releases/download/v0.46.0/k6-v0.46.0-linux-amd64.tar.gz -o k6.tar.gz
          tar -xzf k6.tar.gz
          mv k6-v0.46.0-linux-amd64/k6 /usr/local/bin/k6

          echo "🔧 Instalando k6-reporter"
          npm install -g k6-reporter

          echo "🚀 Ejecutando pruebas de carga"
          k6 run tests/test-k6.js --out json=resultado.json

          echo "📄 Generando reporte HTML"
          k6-reporter resultado.json > reporte.html
        '''

        stash includes: 'resultado.json,reporte.html', name: 'k6-report'
      }
    }



    stage('Generar y subir reporte') {
      steps {
        unstash 'k6-report'
        sh '''
          mkdir -p ${REPORT_DIR}
          mv resultado.json ${REPORT_DIR}/reporte_${TIMESTAMP}.json
          mv reporte.html ${REPORT_DIR}/reporte_${TIMESTAMP}.html
        '''

        withCredentials([usernamePassword(credentialsId: 'github-credentials', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_PASS')]) {
          sh '''
            git config user.name "jenkins-bot"
            git config user.email "jenkins@localhost"

            git remote set-url origin https://${GIT_USER}:${GIT_PASS}@github.com/Jreay/ApiDesignFirst_CI-CD.git

            git add reports || true
            git commit -m "📊 Reporte generado automáticamente: ${TIMESTAMP}" || true
            git push origin HEAD:main
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
