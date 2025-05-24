pipeline {
  agent none // Cada etapa definirá su propio agente

  environment {
    K6_VERSION = '0.46.0'
    GIT_REPO = 'https://github.com/Jreay/OpenAPI.git'
    GIT_BRANCH = 'main'
  }

  stages {
    stage('Validar contrato OpenAPI con Spectral') {
      agent {
        docker {
          image 'node:18'
          args '-v $WORKSPACE:/workspace' // Monta el workspace completo
        }
      }
      steps {
        sh '''
          npm install -g @stoplight/spectral-cli
          spectral lint /workspace/api/openapi.yaml -r /workspace/api/spectral-rules.yml
        '''
      }
    }

    stage('Generar código a partir de OpenAPI') {
      agent {
        docker {
          image 'openapitools/openapi-generator-cli'
          args '-v $WORKSPACE/generated-api:/output' // Directorio de salida
        }
      }
      steps {
        sh '''
          openapi-generator-cli generate \
            -i /workspace/api/openapi.yaml \
            -g typescript-express-server \
            -o /output
        '''
      }
    }

    stage('Construir y Ejecutar API') {
      agent {
        docker {
          image 'node:18-alpine'
          args '--network host -v $WORKSPACE/generated-api:/app'
        }
      }
      steps {
        sh '''
          cd /app
          npm install
          nohup npm start &  // Ejecuta en background
          sleep 10  // Espera que la API esté lista
        '''
      }
    }

    stage('Ejecutar prueba de carga con K6') {
      agent {
        docker {
          image "grafana/k6:${K6_VERSION}"
          args '--network host -v $WORKSPACE:/workspace'
        }
      }
      steps {
        sh '''
          echo "Ejecutando prueba de carga..."
          k6 run /workspace/test/test-k6.js
        '''
      }
    }

    stage('Generar informes') {
      agent any // Puede ejecutarse en cualquier agente
      steps {
        sh '''
          mkdir -p $WORKSPACE/reports
          spectral lint /workspace/api/openapi.yaml -r /workspace/api/spectral-rules.yml > $WORKSPACE/reports/spectral-report.txt
          k6 run --out json=$WORKSPACE/reports/k6-report.json /workspace/test/test-k6.js
        '''
        archiveArtifacts artifacts: 'reports/**', fingerprint: true
      }
    }

    stage('Desplegar en Repo Destino') {
      agent any
      steps {
        script {
          try {
            // Clonar y copiar archivos
            sh 'git clone $GIT_REPO $WORKSPACE/repo-destino || true'
            sh 'cp -rn $WORKSPACE/generated-api/* $WORKSPACE/repo-destino/'
            
            // Verificar cambios
            def changes = sh(
              script: 'cd $WORKSPACE/repo-destino && git status --porcelain', 
              returnStdout: true
            ).trim()
            
            if (changes) {
              echo "🔄 Cambios detectados: ${changes}"
              sh '''
                cd $WORKSPACE/repo-destino
                git config user.email "ci@jenkins"
                git config user.name "Jenkins CI"
                git add .
                git commit -m "Auto-update: ${BUILD_ID} [skip ci]"
                git push origin $GIT_BRANCH
              '''
            } else {
              echo "🟢 No hay cambios - Pipeline continúa"
            }
          } catch (err) {
            echo "🔴 Error en despliegue: ${err.message}"
            currentBuild.result = 'UNSTABLE'
          }
        }
      }
    }
  }

  post {
    always {
      echo 'Pipeline terminado. Verifica resultados de validación y carga.'
      // Limpieza opcional
      sh 'rm -rf $WORKSPACE/repo-destino || true'
    }
    failure {
      slackSend channel: '#notifications',
                message: "Pipeline fallido: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
    }
  }
}