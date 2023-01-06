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
curl -sL https://rpm.nodesource.com/setup_10.x | sudo bash -
sudo yum install nodejs -y
echo ""
echo "Patch Brasileiro Instalado."
