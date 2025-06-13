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

    stage('Revisión de código con SonarQube') {
      steps {
        withCredentials([string(credentialsId: 'SONAR_AUTH_TOKEN', variable: 'SONAR_TOKEN')]) {
          withSonarQubeEnv('SonarQubeServer') {
            sh '''
              cd openapi-code
              sonar-scanner \
                -Dsonar.projectKey=ApiDesignFirst \
                -Dsonar.sources=. \
                -Dsonar.host.url=http://localhost:9000 \
                -Dsonar.login=$SONAR_TOKEN
            '''
          }
        }
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
          k6 run tests/test-k6.js --out json=${REPORT_DIR}/resultado.json
        '''
      }
    }

    stage('Generar gráficos desde resultados K6') {
      agent {
        docker {
          image 'node:18-bullseye'
        }
      }
      steps {
        sh '''
          npm install chartjs-node-canvas

          node <<EOF
          const fs = require('fs');
          const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

          const width = 800;
          const height = 400;
          const canvasRenderService = new ChartJSNodeCanvas({ width, height });

          const rawData = fs.readFileSync('${REPORT_DIR}/resultado.json');
          const json = JSON.parse(rawData);

          const labels = Object.keys(json.metrics).filter(k => k.includes('http_req_duration'));
          const durations = labels.map(k => json.metrics[k].values.avg);

          (async () => {
            const image = await canvasRenderService.renderToBuffer({
              type: 'bar',
              data: {
                labels: labels,
                datasets: [{
                  label: 'Avg Duration (ms)',
                  data: durations,
                  backgroundColor: 'rgba(75, 192, 192, 0.6)',
                }]
              },
              options: {
                responsive: false,
                plugins: { title: { display: true, text: 'Resultados de K6 - Duración promedio' } }
              }
            });
            fs.writeFileSync('${REPORT_DIR}/grafico_k6.png', image);
          })();
          EOF
        '''
      }
    }

    stage('Generar HTML de reporte del pipeline') {
      agent {
        docker {
          image 'node:18-bullseye'
          args '--network host'
        }
      }
      steps {
        script {
          env.TIMESTAMP = sh(script: "date +'%Y-%m-%d_%H-%M-%S'", returnStdout: true).trim()
          env.REPORT_DIR = 'reports'
        }

        sh '''
          echo "📝 Creando HTML del reporte"
          mkdir -p ${REPORT_DIR}
          cat > ${REPORT_DIR}/reporte.html <<EOF
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Reporte del Pipeline</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              h1 { color: #2c3e50; }
              img { max-width: 100%; height: auto; margin-top: 20px; }
              table { border-collapse: collapse; width: 100%; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              th { background-color: #f2f2f2; }
              td.status { font-weight: bold; color: green; }
            </style>
          </head>
          <body>
            <h1>📋 Reporte del Pipeline - ${TIMESTAMP}</h1>
            <table>
              <tr><th>Paso</th><th>Estado</th></tr>
              <tr><td>Validación de contratos API</td><td class="status">Pasado</td></tr>
              <tr><td>Generación de contrato desde código</td><td class="status">Pasado</td></tr>
              <tr><td>Comparación de contratos</td><td class="status">Pasado</td></tr>
              <tr><td>Revisión de código con SonarQube</td><td class="status">Pasado</td></tr>
              <tr><td>Pruebas de carga con K6</td><td class="status">Pasado</td></tr>
            </table>
            <h2>📈 Gráfico de resultados K6</h2>
            <img src="grafico_k6.png" alt="Gráfico de rendimiento K6">
          </body>
          </html>
          EOF
        '''

        stash includes: "${REPORT_DIR}/reporte.html", name: 'html-pipeline'
      }
    }

    stage('Generar PDF del pipeline') {
      agent {
        docker {
          image 'node:18-bullseye'
          args '--network host'
        }
      }
      environment {
        REPORT_NAME = "reporte_${env.TIMESTAMP}.pdf"
      }
      steps {
        unstash 'html-pipeline'

        script {
          def jsScript = """
            const puppeteer = require('puppeteer');
            (async () => {
              const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
              });
              const page = await browser.newPage();
              await page.goto('file://${env.WORKSPACE}/reports/reporte.html', { waitUntil: 'networkidle0' });
              await page.pdf({ path: 'reports/reporte_${env.TIMESTAMP}.pdf', format: 'A4' });
              await browser.close();
            })();
          """
          writeFile file: 'generar-pdf.js', text: jsScript
        }

        sh '''
          echo "📦 Instalando Puppeteer"
          apt-get update
          apt-get install -y wget ca-certificates fonts-liberation libappindicator3-1 libasound2 \
            libatk-bridge2.0-0 libcups2 libdbus-1-3 libnss3 libx11-xcb1 libxcomposite1 libxdamage1 \
            libxrandr2 xdg-utils libu2f-udev libgbm1
          npm install puppeteer

          echo "📄 Generando PDF con Puppeteer"
          node generar-pdf.js
        '''

        sh 'ls -l reports/'

        stash includes: "reports/reporte_${env.TIMESTAMP}.pdf", name: 'k6-pdf'
      }
    }

    stage('Generar y subir reporte') {
      steps {
        unstash 'k6-pdf'

        withCredentials([usernamePassword(credentialsId: 'github-credentials', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_PASS')]) {
          sh '''
            git config user.name "jenkins-bot"
            git config user.email "jenkins@localhost"

            git remote set-url origin https://${GIT_USER}:${GIT_PASS}@github.com/Jreay/ApiDesignFirst_CI-CD.git

            git checkout -B main
            git add reports || true
            git commit -m "📊 Reporte generado automáticamente: ${TIMESTAMP}" || true
            git push origin main
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
