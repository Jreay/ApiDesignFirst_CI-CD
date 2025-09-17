FROM jenkins/jenkins:lts-jdk17

USER root

# Instalar dependencias del sistema + Node + npm
RUN apt-get update && apt-get install -y \
    python3 python3-pip \
    curl wget git jq gnupg lsb-release \
    nodejs npm \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Instalar Spectral
RUN npm install -g @stoplight/spectral-cli

# Instalar K6 
RUN apt-get update && \
    apt-get install -y gnupg software-properties-common && \
    curl -fsSL https://dl.k6.io/key.gpg | gpg --dearmor -o /usr/share/keyrings/k6-archive-keyring.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | tee /etc/apt/sources.list.d/k6.list && \
    apt-get update && \
    apt-get install -y k6

# Instalar paquetes Python
COPY ../requirements.txt /tmp/requirements.txt
RUN pip3 install --break-system-packages -r /tmp/requirements.txt

# Docker CLI
RUN curl -fsSL https://get.docker.com | bash

# Agregar permisos al usuario Jenkins
RUN groupadd -g 999 docker || true && usermod -aG docker jenkins

USER jenkins
