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
echo "Instalando GIT e Node..."
echo ""
sudo yum install git -y
curl -sL https://rpm.nodesource.com/setup_14.x | sudo bash -
sudo yum install nodejs -y
clear
echo ""
echo "Atualizando o sistema e instalando pm2..."
sleep 5
echo ""
yum -y update && yum -y upgrade
npm install pm2 -g
echo ""
clear
echo "Criando diretorio e clonando repositorio..."
sleep 5
cd /var/www/html
git clone https://github.com/leandrojds93/installbotpositivo.git
mv installbotpositivo bot
echo ""
