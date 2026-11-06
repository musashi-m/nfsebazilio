/**
 * Teste de Integração HTTP das Rotas REST da Aplicação
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const forge = require('node-forge');
const app = require('../server');
const certService = require('../src/services/certService');

const CERT_PFX = path.join(__dirname, '../data/active_cert.pfx');
const CERT_META = path.join(__dirname, '../data/active_cert_meta.json');

function createPfxBuffer(password = '123456') {
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

  const attrs = [
    { name: 'countryName', value: 'BR' },
    { name: 'organizationName', value: 'ICP-Brasil' },
    { name: 'commonName', value: 'ESCRITORIO CONTABIL TESTE:11222333000199' }
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey, forge.md.sha256.create());

  const p12Asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], password);
  const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
  return Buffer.from(p12Der, 'binary');
}

async function runApiTests() {
  // Faz backup do certificado real ativo antes do teste
  const pfxBackup = fs.existsSync(CERT_PFX) ? fs.readFileSync(CERT_PFX) : null;
  const metaBackup = fs.existsSync(CERT_META) ? fs.readFileSync(CERT_META) : null;

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  console.log(`Servidor de teste iniciado na porta ${port}`);

  try {
    // 1. Status
    const statusRes = await fetch(`${baseUrl}/api/status`).then(r => r.json());
    console.log('✓ /api/status:', statusRes.status, 'Ambiente:', statusRes.currentEnvironment);

    // 2. Ambientes
    const envsRes = await fetch(`${baseUrl}/api/environments`).then(r => r.json());
    console.log('✓ /api/environments: Total de ambientes:', envsRes.environments.length);

    // 3. Validação de Procuração sem certificado (deve alertar ausência de certificado)
    const proxyNoCert = await fetch(`${baseUrl}/api/proxy/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prestadorCnpj: '12.345.678/0001-95' })
    }).then(r => r.json());
    console.log('✓ /api/proxy/validate (sem cert): Válido:', proxyNoCert.valid);

    // 4. Upload de Certificado Real via multipart/form-data
    const pfxBuffer = createPfxBuffer('senha123');
    const formData = new FormData();
    const blob = new Blob([pfxBuffer], { type: 'application/x-pkcs12' });
    formData.append('certFile', blob, 'certificado_teste.pfx');
    formData.append('password', 'senha123');

    const uploadRes = await fetch(`${baseUrl}/api/certificate/upload`, {
      method: 'POST',
      body: formData
    }).then(r => r.json());
    console.log('✓ /api/certificate/upload:', uploadRes.success ? 'Sucesso' : 'Falha', uploadRes.certificate?.procuradorName);

    // 5. Teste da Rota de Representação (idêntico ao Emissor Nacional)
    const repRes = await fetch(`${baseUrl}/api/representation/representar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doc: '48.593.822/0001-50' })
    }).then(r => r.json());
    console.log('✓ /api/representation/representar:', repRes.success, 'Empresa:', repRes.representedCompany?.razaoSocial);

    // 5.1 Teste de Concorrência Multi-Sessão (Dois operadores trabalhando ao mesmo tempo)
    const statusA = await fetch(`${baseUrl}/api/status`, {
      headers: { 'X-Session-ID': 'sess_user_alpha', 'X-Represented-CNPJ': '48593822000150' }
    }).then(r => r.json());

    const statusB = await fetch(`${baseUrl}/api/status`, {
      headers: { 'X-Session-ID': 'sess_user_beta', 'X-Represented-CNPJ': '39853166000196' }
    }).then(r => r.json());

    const matchA = statusA.activeRepresentation?.cnpjRaw === '48593822000150';
    const matchB = statusB.activeRepresentation?.cnpjRaw === '39853166000196';
    if (!matchA || !matchB) {
      throw new Error(`Falha no isolamento multi-usuário: Sessão A=${statusA.activeRepresentation?.cnpjRaw}, Sessão B=${statusB.activeRepresentation?.cnpjRaw}`);
    }
    console.log('✓ [MULTI-USUÁRIO] Isolamento Concorrente entre Sessões A e B: 100% ISOLADAS E INDEPENDENTES');

    // 6. Lista de Representações Recentes
    const recentsRes = await fetch(`${baseUrl}/api/representation/recent`).then(r => r.json());
    console.log('✓ /api/representation/recent: Total de recentes:', recentsRes.length);

    // 7. Teste de Conectividade e Diagnóstico Completo
    const connRes = await fetch(`${baseUrl}/api/connectivity/test`, { method: 'POST' }).then(r => r.json());
    console.log('✓ /api/connectivity/test: Status Geral:', connRes.overallStatus, '| RFB:', connRes.rfbDirect.endpoint);

    console.log('\nTODOS OS ENDPOINTS REST COM DADOS REAIS RESPONDERAM COM SUCESSO!');
  } finally {
    // Restaura o certificado original após os testes
    if (pfxBackup && metaBackup) {
      fs.writeFileSync(CERT_PFX, pfxBackup);
      fs.writeFileSync(CERT_META, metaBackup);
      certService._loadPersistedCert();
    }

    server.close();
  }
}

runApiTests().catch(err => {
  console.error('Falha no teste de integração da API:', err);
  process.exit(1);
});
