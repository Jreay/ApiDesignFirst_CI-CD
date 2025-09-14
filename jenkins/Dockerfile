FROM jenkins/jenkins:lts-jdk17

USER root

RUN apt-get update && apt-get install -y \
    python3 python3-pip \
    curl wget git jq gnupg lsb-release \
    nodejs npm \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Instalar K6 (recomendado para rendimiento estable en pruebas)
RUN curl -s https://packagecloud.io/install/repositories/loadimpact/k6/script.deb.sh | bash && \
    apt-get install -y k6

# Instalar paquetes Python
COPY ../generador_reporte/requirements.txt /tmp/requirements.txt
RUN pip3 install -r /tmp/requirements.txt

# Docker CLI
RUN curl -fsSL https://get.docker.com | bash

# Agregar permisos al usuario Jenkins
RUN groupadd -g 999 docker || true && usermod -aG docker jenkins

USER jenkins
