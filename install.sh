#!/bin/bash
versao="2.0.0"
clear
echo "======================================================="
echo "Whatsapp API - Positivo Promotora"
echo "Autor Leandro Junio - Empresa Positivo Promotora"
echo "email: contato@positivopromotora.com.br"
echo "======================================================="
sleep 20
echo ""
echo "INICIANDO O PROCESSO..."
echo ""
echo "Instalando Chrome, GIT e Node..."
echo ""
sudo yum install git -y
curl -sL https://rpm.nodesource.com/setup_14.x | sudo bash -
sudo yum install nodejs -y
wget https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm
sudo yum install google-chrome-stable_current_x86_64.rpm -y
clear
echo ""
echo "Atualizando o sistema e instalando pm2..."
echo ""
sleep 5
echo ""
yum -y update && yum -y upgrade
npm install pm2 -g
echo ""
clear
echo "Criando diretorio e clonando repositorio..."
echo ""
sleep 5
cd /var/www/html
git clone https://github.com/leandrojds93/installbotpositivo.git
mv installbotpositivo bot
echo ""
clear
echo "Instalando bot..."
echo ""
sleep 5
cd bot
npm install
clear
echo ""
echo "Iniciando bot..."
pm2 start "node botpositivo.js" --name botpositivo
pm2 save
pm2 startup
sleep 5
clear
echo ""
echo "Instalação finalizada!!!"
echo "Aplicação rodando em http://localhost:8000/"
sleep 10
echo ""
