@echo off
chcp 65001 > nul
title Emissor Nacional de Notas Fiscais (NFS-e ADN / RFB)
echo ===================================================================
echo     EMISSOR NACIONAL DE NOTAS FISCAIS (PADRÃO NACIONAL ADN / RFB)
echo ===================================================================
echo.
echo Iniciando o servidor em http://localhost:3000 ...
echo Pressione Ctrl+C para encerrar o sistema.
echo.

node --watch server.js
pause
