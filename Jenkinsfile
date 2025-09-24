pipeline {
  agent {
    docker {
      image 'mi-jenkins-personal:lts'
      args '--network apidesignfirst_ci-cd_cicd -v /var/run/docker.sock:/var/run/docker.sock -u root'
    }
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
        ]) {
          sh '''
            cd OpenAPI
            npm i
            
            echo "Ejecutar pruebas jest"
            npm run test

            echo "Escaneando api con Sonar"
            sonar-scanner \
              -Dsonar.host.url=http://sonarqube:9000 \
              -Dsonar.login=${SONAR_TOKEN}

            echo "Guarda el resultado Sonar"
            # Tu comando curl sigue igual aquí...
            curl --location "http://sonarqube:9000/api/measures/component?component=open-api&metricKeys=bugs,vulnerabilities,code_smells,coverage,duplicated_lines_density,ncloc" \
            --header "Authorization: Bearer ${SONAR_TOKEN}" > ../resultados/resultadoSonar.json
          '''
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
          mkdir -p reportes
          ls -l reportes
          python3 ./generador_reporte/main.py
          ls -l reportes
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
              
              # Limpiar workspace
              git reset --hard
              # Cambiar y Sincronizar main
              git checkout main
              git pull --rebase origin main
              # Actualizar solo la carpeta reportes en ApiDesignFirst_CI-CD
              git add reportes
              git commit -m "Reporte generado automáticamente"
              git push origin main
            '''
        }
        dir('OpenAPI') {
          withCredentials([usernamePassword(credentialsId: 'github-credentials', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_PASS')]) {
            sh '''
              git config user.name "jenkins-bot"
              git config user.email "jenkins@localhost"
              git remote set-url origin https://${GIT_USER}:${GIT_PASS}@github.com/Jreay/OpenAPI.git

              # Nos aseguramos estar en la rama "main" y sincronizados con el remoto
              git checkout main
              git pull origin main

              # Reemplazar TODO el contenido actual con el de dev-main
              # Este es el comando clave para "planchar" el contenido sin cambiar de rama
              git checkout origin/dev-main -- .

              # Preparar y hacer el commit de esta nueva versión
              git add .

              # Usamos un mensaje de commit claro que explique la acción
              # Condicional para evitar commit vacío, en caso de no existir cambios
              if ! git diff-index --quiet HEAD --; then
                  git commit -m "Rama Actualizada"
              fi
              # 4. Subir los cambios..
              git push origin main
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
