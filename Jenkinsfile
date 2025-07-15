pipeline {
  agent any

  environment {
    K6_VERSION = '0.46.0'
    GIT_BRANCH = 'main'
    REPORT_DIR = 'reports'
    TIMESTAMP = "${new Date().format('yyyyMMdd_HHmm')}"
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
      steps {
        script {
          env.TIMESTAMP = sh(script: "date +'%Y%m%d_%H%M'", returnStdout: true).trim()
          def reportName = "reporte_${env.TIMESTAMP}.pdf"
          def reportPath = "reports/${reportName}"

          sh """
            mkdir -p reports
            pip install fpdf
            python3 scripts/generar_reporte.py reports/resultado_spectral.txt ${reportName}
            mv ${reportName} ${reportPath}
            echo "${reportName}" > reports/last_report_name.txt
            ls -lh reports
          """
          stash includes: "${reportPath}", name: 'reporte-pdf'
        }
      }
    }


    stage('Subir reporte al repositorio') {
      steps {
        unstash 'reporte-pdf'

        withCredentials([usernamePassword(credentialsId: 'github-credentials', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_PASS')]) {
            sh """
              git config user.name "jenkins-bot"
              git config user.email "jenkins@localhost"
              git remote set-url origin https://${GIT_USER}:${GIT_PASS}@github.com/Jreay/ApiDesignFirst_CI-CD.git

              git checkout -B main
              git add reports/${reportName} || true
              git commit -m \"📄 Reporte Spectral generado automáticamente: ${reportName}\" || true
              git push origin main
            """
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
