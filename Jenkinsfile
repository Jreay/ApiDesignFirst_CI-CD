pipeline {
  agent any

  environment {
    K6_VERSION = '0.46.0'
    GIT_REPO = 'https://github.com/Jreay/OpenAPI.git'
    GIT_BRANCH = 'main'
  }

  stages {
    stage('Checkout SCM') {
      steps {
        checkout scm
        sh '''
          echo "=== Estructura del Directorio ==="
          ls -la api/
          echo "================================"
        '''
      }
    }

    stage('Validar contrato OpenAPI con Spectral') {
      agent {
        docker {
          image 'stoplight/spectral:6.4.0'
          args '--entrypoint=""' 
        }
      }
      steps {
        sh 'spectral lint api/openapi.yaml -r api/spectral-rules.yml'
      }
    }

    stage('Generar código a partir de OpenAPI') {
      agent {
        docker {
          image 'openjdk:11'  // Requiere Java
        }
      }
      steps {
        sh '''
          # Descarga e instala el generador
          wget https://repo1.maven.org/maven2/org/openapitools/openapi-generator-cli/6.0.1/openapi-generator-cli-6.0.1.jar -O openapi-generator-cli.jar
          
          # Ejecuta el generador
          java -jar openapi-generator-cli.jar generate \
            -i api/openapi.yaml \
            -g typescript-express-server \
            -o generated-api
        '''
      }
    }

    stage('Construir y Ejecutar API') {
      agent {
        docker {
          image 'node:18-alpine'
          args '--network host'
        }
      }
      steps {
        sh '''
          cd generated-api
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
          args '--network host'
        }
      }
      steps {
        sh 'k6 run test/test-k6.js'
      }
    }

    stage('Generar informes') {
      steps {
        sh '''
          mkdir -p reports
          spectral lint api/openapi.yaml -r api/spectral-rules.yml > reports/spectral-report.txt
          k6 run --out json=reports/k6-report.json test/test-k6.js
        '''
        archiveArtifacts artifacts: 'reports/**', fingerprint: true
      }
    }

    stage('Desplegar en Repo Destino') {
      steps {
        script {
          try {
            sh 'git clone $GIT_REPO repo-destino || true'
            sh 'cp -rn generated-api/* repo-destino/'
            
            def changes = sh(
              script: 'cd repo-destino && git status --porcelain', 
              returnStdout: true
            ).trim()
            
            if (changes) {
              echo "🔄 Cambios detectados: ${changes}"
              sh '''
                cd repo-destino
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
      sh 'rm -rf repo-destino || true'
    }
    failure {
      slackSend channel: '#notifications',
                message: "Pipeline fallido: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
    }
  }
}