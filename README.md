# Emissor Nacional de Notas Fiscais (NFS-e Padrão Nacional / ADN / RFB)

Sistema oficial para emissão, consulta e gerenciamento de Notas Fiscais de Serviços Eletrônicas (NFS-e) de Padrão Nacional, com tecnologia **ADN (Ambiente de Dados Nacional)**, autenticação com **SERPRO** e **conexão direta mTLS com a Receita Federal do Brasil (RFB)**.

> **100% Dados Reais:** O sistema opera exclusivamente com certificados digitais ICP-Brasil reais (.pfx/.p12), conexão direta aos servidores governamentais e banco de dados limpo para armazenamento dos seus documentos fiscais reais.

---

## 🌟 Principais Recursos

1. **Emissão por Procuração Eletrônica RFB (Representação)**:
   - Permite que contadores, escritórios ou advogados utilizem o seu próprio certificado digital A1 ICP-Brasil (e-CNPJ ou e-CPF) para emitir notas em nome das empresas clientes representadas.
   - Basta informar o **CNPJ da empresa representada** no campo correspondente: o sistema vincula o transmissor (procurador) e o prestador (cliente), e o ADN valida a procuração cadastrada no portal e-CAC da Receita Federal.
   - Seletor rápido de clientes representados no topo para alternar de empresa com 1 clique.

2. **Tecnologia ADN (Ambiente de Dados Nacional)**:
   - Sincronização em tempo real com o repositório central nacional da Receita Federal.
   - Histórico de notas fiscais emitidas pela empresa representada.
   - Consulta e visualização do **DANFSE Nacional Oficial** (com QR Code, chave de 50 dígitos e layout padrão CGNFS-e pronto para impressão e PDF).
   - Download do XML oficial assinado com validação ICP-Brasil.
   - Registro de eventos de cancelamento de notas com justificativa no ADN.

3. **3 Ambientes Oficiais Disponíveis**:
   - **Ambiente de Teste (Sandbox Oficial RFB / SERPRO)**: Testes de integração nos servidores oficiais de validação.
   - **Homologação (Produção Restrita Oficial RFB)**: Conexão direta com os servidores oficiais de homologação da RFB (`adn.producaorestrita.nfse.gov.br`) e SERPRO Homologação (`gateway.apihml.serpro.gov.br`).
   - **Produção Nacional**: Conexão com o ambiente oficial da RFB (`adn.nfse.gov.br`) e SERPRO Produção (`gateway.serpro.gov.br`) com validade jurídica e tributária plena.

4. **Autenticação SERPRO e Conexão Direta mTLS com a RFB**:
   - **Conexão Direta RFB ADN**: Canal prioritário via Mutual TLS (mTLS) utilizando o certificado digital A1 do procurador, sem intermediários, eliminando pontos de falha e latência.
   - **Gateway SERPRO (OAuth2)**: Autenticação via Client Credentials e fallback automático em caso de instabilidade na rota direta.
   - Monitor de conectividade em tempo real para verificar a saúde dos servidores da RFB e SERPRO.

5. **Dicionário Amigável de Erros Fiscais**:
   - Traduz automaticamente todas as mensagens e códigos de rejeição da RFB e SERPRO (ex: `E001`, `E010`, `E025`, `bad decrypt`, `ETIMEDOUT`, `Certificado revogado`) em linguagem simples, didática e acolhedora.
   - Guia passo-a-passo no modal: **"O que aconteceu?"** e **"Como resolver de forma simples"**.

---

## 🚀 Como Executar o Sistema

### Pré-requisitos
- Node.js (versão 18 ou superior)

### Inicialização

1. Abra o terminal na pasta do projeto:
   ```bash
   cd "c:\Users\Setor Fiscal\Downloads\Emissor"
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie o sistema:
   ```bash
   npm start
   # ou dê um duplo clique no arquivo: iniciar_emissor.bat
   ```

4. Acesse no seu navegador:
   ```
   http://localhost:3000
   ```

---

## 🧪 Testes Automatizados

Para executar os testes de validação das regras fiscais e rotas reais:
```bash
npm test
```
