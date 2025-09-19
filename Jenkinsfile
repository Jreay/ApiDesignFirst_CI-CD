pipeline {
  agent {
    docker {
      image 'mi-jenkins-personal:lts'
      args '-v /var/run/docker.sock:/var/run/docker.sock -u root'
    }
  }

  environment {
    TIMESTAMP = "${new Date().format('yyyyMMdd_HHmm')}"
  }

  stages {

    stage('Validar contrato') {
      steps {
        sh '''
          echo "Validar contrato original con espectral"
          mkdir -p ./resultados
          spectral lint ./contrato/openapi.yaml -r ./validar_contrato/reglas.yml --format json > ./resultados/resultadoEspectral.json
          
          echo "Generar contrato basado en el codigo"
          rm -rf OpenAPI
          git clone --branch dev-main https://github.com/Jreay/OpenAPI.git OpenAPI
          npm i
          npm run generarContrato

          echo "Compara contratos (Original vs Generado)"
          npm run validarContrato
        '''
      }
    }

    stage('Validación de código') {
      steps {
      withCredentials([
        string(credentialsId: 'SONAR_TOKEN', variable: 'SONAR_TOKEN')
        ]) 
        {
          withEnv(['SONAR_HOST_URL=http://sonarqube:9000']) {
            sh '''
              cd OpenAPI
              npm i
              
              echo "Ejecutar pruebas jest"
              npm run test

              echo "Escaneando api con Sonar"
              docker run --rm \
                --network apidesignfirst_ci-cd_cicd \
                -e SONAR_HOST_URL="$SONAR_HOST_URL" \
                -e SONAR_TOKEN="$SONAR_TOKEN" \
                -v "$(pwd)":/usrsrc \
                -w /usr/src \
                sonarsource/sonar-scanner-cli

              echo "Guarda el resultado Sonar"
              curl --location "$SONAR_HOST_URL/api/measures/component?component=open-api&metricKeys=bugs,vulnerabilities,code_smells,coverage,duplicated_lines_density,ncloc" \
              --header "Authorization: Bearer $SONAR_TOKEN" > ./resultados/resultadoSonar.json
            '''
          }
        }
      }
    }

    stage('Pruebas rendimiento') {
      steps {
        sh '''
          echo "Ejecutar pruebas de K6"
          npm run pruebaK6
        '''
      }
    }

    stage('Generar reporte PDF') {
      steps {
        sh '''
          pip install -r requirements.txt || true
          python3 ./generador_reporte/main.py
        '''
      }
    }

    stage('Generar y subir reporte') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'github-credentials', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_PASS')]) {
            sh '''
              git config user.name "jenkins-bot"
              git config user.email "jenkins@localhost"

              git remote set-url origin https://${GIT_USER}:${GIT_PASS}@github.com/Jreay/ApiDesignFirst_CI-CD.git

              git pull --rebase || true

              git add reportes || true
              git commit -m "Reporte generado automáticamente: ${TIMESTAMP}" || true
              git push origin main
            '''
        }
        dir('OpenAPI') {
          withCredentials([usernamePassword(credentialsId: 'github-credentials', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_PASS')]) {
            sh '''
              git config user.name "jenkins-bot"
              git config user.email "jenkins@localhost"

              git remote set-url origin https://${GIT_USER}:${GIT_PASS}@github.com/Jreay/OpenAPI.git

              git pull --rebase || true

              git add . || true
              git commit -m "Auto commit del pipeline: ${TIMESTAMP}" || true
              
              #Push de dev-main a main
              git push origin dev-main:main
            '''
          }
        }
      }
    } 
  }
  post {
    always {
      echo 'Pipeline finalizado.'
    }
    failure {
      echo 'Error detectado en el pipeline.'
    }
  }
}
