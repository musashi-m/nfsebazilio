/**
 * Bateria de Testes Automatizados do Emissor Nacional (NFS-e ADN / RFB)
 * Valida regras de negócio reais, criptografia, assinatura e integração
 */

const assert = require('assert');
const forge = require('node-forge');
const certService = require('../src/services/certService');
const dpsService = require('../src/services/dpsService');
const signatureService = require('../src/services/signatureService');
const storageService = require('../src/services/storageService');
const { translateError } = require('../src/services/errorTranslator');
const { ENVIRONMENTS } = require('../src/config/environments');

let testsPassed = 0;
let testsFailed = 0;

function runTest(testName, fn) {
  try {
    fn();
    console.log(`  ✓ [PASSOU] ${testName}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ✗ [FALHOU] ${testName}:`, err.message);
    testsFailed++;
  }
}

async function runAsyncTest(testName, fn) {
  try {
    await fn();
    console.log(`  ✓ [PASSOU] ${testName}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ✗ [FALHOU] ${testName}:`, err.message);
    testsFailed++;
  }
}

/**
 * Utilitário para gerar um PKCS#12 (.pfx) válido em memória para testar
 * o parser real de certificados loadPfx
 */
function createRealTestPfxBuffer(password = '123456') {
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
    { name: 'commonName', value: 'ESCRITORIO CONTABIL PROCURADOR:11222333000199' }
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey, forge.md.sha256.create());

  const p12Asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], password);
  const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
  return Buffer.from(p12Der, 'binary');
}

async function main() {
  const fs = require('fs');
  const path = require('path');
  const CERT_PFX = path.join(__dirname, '../data/active_cert.pfx');
  const CERT_META = path.join(__dirname, '../data/active_cert_meta.json');
  const pfxBackup = fs.existsSync(CERT_PFX) ? fs.readFileSync(CERT_PFX) : null;
  const metaBackup = fs.existsSync(CERT_META) ? fs.readFileSync(CERT_META) : null;

  try {
  console.log('====================================================');
  console.log('   INICIANDO TESTES DO EMISSOR NACIONAL NFS-e ADN   ');
  console.log('====================================================\n');

  // 1. Ambientes Oficiais
  runTest('Validação dos 3 Ambientes Oficiais (Endpoints Reais RFB / SERPRO)', () => {
    assert(ENVIRONMENTS.TESTE, 'Ambiente de Teste deve existir');
    assert(ENVIRONMENTS.HOMOLOGACAO, 'Ambiente de Homologação deve existir');
    assert(ENVIRONMENTS.PRODUCAO, 'Ambiente de Produção deve existir');
    
    // Todos os endpoints devem apontar para os domínios oficiais da RFB e SERPRO
    assert(ENVIRONMENTS.HOMOLOGACAO.rfbAdnBaseUrl.includes('adn.producaorestrita.nfse.gov.br'));
    assert(ENVIRONMENTS.HOMOLOGACAO.serproAuthUrl.includes('gateway.apihml.serpro.gov.br'));
    assert(ENVIRONMENTS.PRODUCAO.rfbAdnBaseUrl.includes('adn.nfse.gov.br'));
    assert(ENVIRONMENTS.PRODUCAO.serproAuthUrl.includes('gateway.serpro.gov.br'));
  });

  // 2. Comportamento sem certificado (exige upload real)
  runTest('Validação de Bloqueio sem Certificado A1 Carregado', () => {
    certService.clearCert();
    assert.strictEqual(certService.getPublicCertInfo(), null);

    const check = certService.validateProxy('12345678000195');
    assert.strictEqual(check.valid, false);
    assert(check.message.includes('Nenhum certificado'));
  });

  // 3. Processamento Real de arquivo .pfx (PKCS#12)
  runTest('Leitura e Extração Real de Arquivo PKCS#12 (.pfx)', () => {
    const pfxBuffer = createRealTestPfxBuffer('senha123');
    const result = certService.loadPfx(pfxBuffer, 'senha123', false);
    assert(result.success, 'Deve carregar o .pfx com sucesso');
    assert.strictEqual(result.certificate.docRaw, '11222333000199');
    assert.strictEqual(result.certificate.docType, 'CNPJ');

    // Validação de procuração com o certificado carregado
    const proxyCheck = certService.validateProxy('12.345.678/0001-95');
    assert.strictEqual(proxyCheck.valid, true);
    assert.strictEqual(proxyCheck.isProxy, true);
    assert.strictEqual(proxyCheck.mode, 'REPRESENTACAO_PROCURACAO');
  });

  // 4. Chave de Acesso Nacional de 50 dígitos
  runTest('Cálculo da Chave de Acesso Nacional de 50 Dígitos (Módulo 11 RFB)', () => {
    const chave = dpsService.generateChaveAcessoNfse({
      cMun: '3550308',
      tpAmb: 2,
      prestCnpj: '12345678000195',
      serie: '1',
      nDps: '1001',
      dataEmissao: new Date().toISOString()
    });
    assert.strictEqual(chave.length, 50, `Chave de acesso deve ter 50 dígitos, obteve ${chave.length}`);
    assert(chave.startsWith('3550308'), 'Chave deve começar com código IBGE do município');
  });

  // 5. Construção e Assinatura Digital XMLDSig da DPS
  runTest('Construção e Assinatura Digital XMLDSig da DPS (Manual CGNFS-e)', () => {
    const certInfo = certService.activeCert;
    const dps = dpsService.buildDps({
      prestadorCnpj: '12345678000195',
      prestadorRazaoSocial: 'EMPRESA REPRESENTADA REAL LTDA',
      tomadorDoc: '98765432000110',
      tomadorNome: 'CLIENTE TOMADOR S/A',
      descricaoServico: 'Serviço prestado sob representação por procuração eletrônica',
      valorServico: 2500.00,
      aliquotaIss: 2.0,
      cTribNac: '100901'
    }, certInfo, 2);

    assert(dps.xml.includes('xmlns="http://www.sped.fazenda.gov.br/nfse"'), 'Deve conter namespace oficial da NFS-e');
    assert(dps.xml.includes('versao="1.01"'), 'Deve conter versão 1.01 oficial do Emissor Nacional');
    assert(dps.xml.includes('<cTribNac>100901</cTribNac>'), 'Deve conter código de tributação nacional');

    const signed = signatureService.signXml(
      dps.xml,
      'infDPS',
      dps.dpsId,
      certInfo.keyPem,
      certInfo.certPem
    );

    assert(signed.signedXml.includes('<Signature xmlns="http://www.w3.org/2000/09/xmldsig#"'), 'XML deve conter tag <Signature>');
    assert(signed.digest, 'Deve conter digest sha256');
    assert(signed.signatureValue, 'Deve conter SignatureValue em base64');
  });

  // 6. Dicionário de Erros Amigáveis
  runTest('Tradução Amigável de Erros Fiscais da RFB / SERPRO', () => {
    const errProc = translateError('Rejeição [E001]: O CNPJ do transmissor não possui procuração eletrônica ativa.');
    assert.strictEqual(errProc.category, 'Procuração Eletrônica RFB');
    assert(errProc.howToFix.length > 0, 'Deve conter instruções práticas de resolução no e-CAC');

    const errCert = translateError('Error: mac verify failure bad decrypt password');
    assert.strictEqual(errCert.category, 'Certificado Digital');

    const errAliq = translateError('Rejeição [E010]: Alíquota de ISS inválida para a operação.');
    assert.strictEqual(errAliq.category, 'Tributação do ISS');
  });

  // 7. Persistência de Dados Limpa
  runTest('Persistência Real no Banco de Dados JSON Local', () => {
    // Salva uma empresa representada real
    const saved = storageService.saveCompany({
      cnpj: '12345678000195',
      razaoSocial: 'EMPRESA CLIENTE TESTE',
      im: '12345',
      regimeTributario: 1
    });
    assert.strictEqual(saved.cnpjRaw, '12345678000195');

    const list = storageService.getCompanies();
    assert(list.length >= 1, 'Deve listar empresas cadastradas');
  });

  // 8. Construção Civil e Validação Oficial de Obra (<obra>)
  runTest('Geração e Validação do Grupo <obra> para Construção Civil (LC 116 / E0370)', () => {
    const certInfo = certService.activeCert;

    // Caso 1: CTN 070201 sem dados de obra -> deve rejeitar
    assert.throws(() => {
      dpsService.buildDps({
        prestadorCnpj: '12345678000195',
        prestadorRazaoSocial: 'CONSTRUTORA TESTE LTDA',
        tomadorDoc: '98765432000110',
        tomadorNome: 'CLIENTE TOMADOR S/A',
        descricaoServico: 'Execução de obras de alvenaria e reforma estrutural',
        valorServico: 5000.00,
        aliquotaIss: 2.0,
        cTribNac: '070201'
      }, certInfo, 1);
    }, /informações de obra é obrigatório/, 'Deve rejeitar CTN de obra sem dados de obra');

    // Caso 2: Opção Código da Obra (CNO / CEI)
    const dpsObra1 = dpsService.buildDps({
      prestadorCnpj: '12345678000195',
      prestadorRazaoSocial: 'CONSTRUTORA TESTE LTDA',
      tomadorDoc: '98765432000110',
      tomadorNome: 'CLIENTE TOMADOR S/A',
      descricaoServico: 'Execução de obras de alvenaria e reforma estrutural',
      valorServico: 5000.00,
      aliquotaIss: 2.0,
      cTribNac: '070201',
      dadosObra: {
        tipo: 'codigo_obra',
        codigoObra: '900012345678',
        inscImobFisc: 'IPTU-1234'
      }
    }, certInfo, 1);

    assert(dpsObra1.xml.includes('<obra>'), 'Deve conter tag <obra>');
    assert(dpsObra1.xml.includes('<inscImobFisc>IPTU-1234</inscImobFisc>'), 'Deve conter inscrição imobiliária fiscal');
    assert(dpsObra1.xml.includes('<cObra>900012345678</cObra>'), 'Deve conter código da obra CNO/CEI');

    // Caso 3: Opção CIB (Cadastro Imobiliário Brasileiro)
    const dpsObra2 = dpsService.buildDps({
      prestadorCnpj: '12345678000195',
      prestadorRazaoSocial: 'CONSTRUTORA TESTE LTDA',
      tomadorDoc: '98765432000110',
      tomadorNome: 'CLIENTE TOMADOR S/A',
      descricaoServico: 'Execução de fundações e terraplanagem',
      valorServico: 12000.00,
      aliquotaIss: 2.0,
      cTribNac: '070201',
      dadosObra: {
        tipo: 'cib',
        cib: '12345678'
      }
    }, certInfo, 1);

    assert(dpsObra2.xml.includes('<obra>'), 'Deve conter tag <obra>');
    assert(dpsObra2.xml.includes('<cCIB>12345678</cCIB>'), 'Deve conter tag <cCIB> com 8 caracteres');

    // Caso 4: Opção Endereço no Brasil
    const dpsObra3 = dpsService.buildDps({
      prestadorCnpj: '12345678000195',
      prestadorRazaoSocial: 'CONSTRUTORA TESTE LTDA',
      tomadorDoc: '98765432000110',
      tomadorNome: 'CLIENTE TOMADOR S/A',
      descricaoServico: 'Reforma de prédio comercial',
      valorServico: 8000.00,
      aliquotaIss: 2.0,
      cTribNac: '070201',
      dadosObra: {
        tipo: 'endereco_brasil',
        cep: '49000000',
        municipioIbge: '2800308',
        logradouro: 'Av. Beira Mar',
        numero: '1500',
        bairro: '13 de Julho',
        complemento: 'Bloco B'
      }
    }, certInfo, 1);

    assert(dpsObra3.xml.includes('<obra>'), 'Deve conter tag <obra>');
    assert(dpsObra3.xml.includes('<endNac>'), 'Deve conter tag <endNac>');
    assert(dpsObra3.xml.includes('<cMun>2800308</cMun>'), 'Deve conter cMun correto');
    assert(dpsObra3.xml.includes('<CEP>49000000</CEP>'), 'Deve conter CEP');
    assert(dpsObra3.xml.includes('<xLgr>Av. Beira Mar</xLgr>'), 'Deve conter xLgr');
    assert(dpsObra3.xml.includes('<nro>1500</nro>'), 'Deve conter nro');
    assert(dpsObra3.xml.includes('<xCpl>Bloco B</xCpl>'), 'Deve conter xCpl');
    assert(dpsObra3.xml.includes('<xBairro>13 de Julho</xBairro>'), 'Deve conter xBairro');
  });

  // Limpa o certificado de teste após os testes
  certService.clearCert();

  console.log('\n====================================================');
  console.log(`  RESULTADO: ${testsPassed} PASSARAM | ${testsFailed} FALHARAM`);
  console.log('====================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
  } finally {
    if (pfxBackup && metaBackup) {
      fs.writeFileSync(CERT_PFX, pfxBackup);
      fs.writeFileSync(CERT_META, metaBackup);
      certService._loadPersistedCert();
    }
  }
}

main();
