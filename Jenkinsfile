pipeline {
  agent any

  environment {
    REPORT_DIR = 'reports'
  }

  stages {

    stage('Validar contrato OpenAPI original con Spectral') {
      agent {
        docker {
          image 'stoplight/spectral:6.4.0'
          args '--entrypoint=""'
        }
      }
      steps {
        sh '''
          mkdir -p ${REPORT_DIR}
          spectral lint contracts/openapi.yaml -r validation/rules.yml > ${REPORT_DIR}/resultado_spectral.txt || true
        '''
      }
    }

    stage('Generar PDF con Python') {
      agent {
        docker {
          image 'python:3.10-slim'
        }
      }
      environment {
        TIMESTAMP = ''
      }
      steps {
        script {
          env.TIMESTAMP = sh(script: "date +'%Y%m%d_%H%M'", returnStdout: true).trim()
        }
        sh """
          pip install fpdf
          python3 scripts/generar_reporte.py reports/resultado_spectral.txt reporte_${env.TIMESTAMP}.pdf
          mv reporte_${env.TIMESTAMP}.pdf ${REPORT_DIR}/
          echo "reporte_${env.TIMESTAMP}.pdf" > ${REPORT_DIR}/last_report_name.txt
        """
      }
    }

    stage('Subir reporte al repositorio') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'github-credentials', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_PASS')]) {
          sh '''
            git config user.name "jenkins-bot"
            git config user.email "jenkins@localhost"
            git remote set-url origin https://${GIT_USER}:${GIT_PASS}@github.com/Jreay/ApiDesignFirst_CI-CD.git

            git checkout -B main
            git add reports || true
            git commit -m "📄 Reporte Spectral generado automáticamente: ${TIMESTAMP}" || true
            git push origin main
          '''
        }
      }
    }
  }

  post {
    always {
      echo '✅ Pipeline completado.'
    }
    failure {
      echo '🔴 Algo falló durante el pipeline.'
    }
  }
}
