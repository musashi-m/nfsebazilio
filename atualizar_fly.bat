@echo off
chcp 65001 > nul
title Atualizar Fly.io - Volume Persistente
color 0b

echo ===================================================================
echo     ATUALIZAÇÃO DO EMISSOR NO FLY.IO (VOLUME PERSISTENTE)
echo ===================================================================
echo.

:: 1. Verifica autenticação
echo [1/3] Verificando login no Fly.io...
"%~dp0fly.exe" auth whoami > nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ATENÇÃO: Faça login na janela do navegador que vai se abrir agora...
    "%~dp0fly.exe" auth login
)

echo.
echo [2/3] Criando volume de disco seguro (emissor_data)...
"%~dp0fly.exe" volumes create emissor_data --size 1 --region gru -y

echo.
echo [3/3] Enviando atualização do emissor (deploy)...
"%~dp0fly.exe" deploy

echo.
echo ===================================================================
echo  DEPLOY CONCLUÍDO COM SUCESSO!
echo  Acesse seu emissor em: https://nfsebazilio.fly.dev
echo ===================================================================
echo.
pause
