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

        stash includes: 'resultado.json', name: 'k6-json'
      }
    }

    stage('Generar reporte HTML y PDF') {
      agent {
        docker {
          image 'node:18-bullseye'
          args '--network host'
        }
      }
      steps {
        unstash 'k6-json'

        sh '''
          echo "📦 Instalando dependencias del sistema"
          apt-get update
          apt-get install -y wget ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 \
            libcups2 libdbus-1-3 libnss3 libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 xdg-utils libu2f-udev

          echo "⬇️ Instalando herramientas de reporte"
          npm install -g k6-reporter puppeteer

          echo "📄 Generando HTML con k6-reporter"
          k6-reporter resultado.json > reporte.html

          echo "📄 Generando reporte PDF desde HTML"
          cat > generar-pdf.js <<'EOF'
          const puppeteer = require('puppeteer');
          (async () => {
            const browser = await puppeteer.launch({
              headless: true,
              args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();
            await page.goto(`file://${process.cwd()}/reporte.html`, { waitUntil: 'networkidle0' });
            await page.pdf({ path: 'reporte.pdf', format: 'A4' });
            await browser.close();
          })();
          EOF

          node generar-pdf.js
        '''

        stash includes: 'reporte.pdf', name: 'k6-pdf'
      }
    }

    stage('Generar y subir reporte') {
      steps {
        unstash 'k6-pdf'
        sh '''
          mkdir -p ${REPORT_DIR}
          mv reporte.pdf ${REPORT_DIR}/reporte_${TIMESTAMP}.pdf
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
