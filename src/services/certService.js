/**
 * Serviço de Gerenciamento de Certificado Digital ICP-Brasil (A1 .pfx / .p12)
 * e Validação de Procuração Eletrônica / Representação
 * Suporta OpenSSL 3 (suporte a PBES2/AES-256-CBC moderno do Windows 10/11) e node-forge
 * Persiste o certificado carregado em ./data/ para evitar reenvio contínuo
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const forge = require('node-forge');
const os = require('os');
const { translateError } = require('./errorTranslator');

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const BASE_DATA_DIR = path.join(__dirname, '../../data');
const DATA_DIR = isServerless ? path.join(os.tmpdir(), 'emissor_data') : BASE_DATA_DIR;

const CERT_PFX_FILE = path.join(DATA_DIR, 'active_cert.pfx');
const CERT_META_FILE = path.join(DATA_DIR, 'active_cert_meta.json');

// Localização do OpenSSL (Git for Windows, Linux /usr/bin/openssl ou PATH do sistema)
const OPENSSL_CANDIDATES = [
  'C:\\Program Files\\Git\\usr\\bin\\openssl.exe',
  'C:\\Program Files (x86)\\Git\\usr\\bin\\openssl.exe',
  '/usr/bin/openssl',
  'openssl'
];

function getOpenSslPath() {
  for (const p of OPENSSL_CANDIDATES) {
    try {
      if (p.includes('\\') && fs.existsSync(p)) return p;
      if (!p.includes('\\')) {
        execSync('openssl version', { stdio: 'ignore' });
        return 'openssl';
      }
    } catch {}
  }
  return null;
}

class CertService {
  constructor() {
    this.activeCert = null; // Certificado carregado
    this.opensslPath = getOpenSslPath();
    this._loadPersistedCert();
  }

  /**
   * Tenta recarregar o certificado persistido em disco ao iniciar a aplicação
   */
  _loadPersistedCert() {
    try {
      if (fs.existsSync(CERT_PFX_FILE) && fs.existsSync(CERT_META_FILE)) {
        const metaRaw = fs.readFileSync(CERT_META_FILE, 'utf8');
        const meta = JSON.parse(metaRaw);
        const pfxBuffer = fs.readFileSync(CERT_PFX_FILE);

        if (meta && meta.password !== undefined) {
          console.log('Restaurando certificado digital persistido anteriormente...');
          this._parseAndActivate(pfxBuffer, meta.password, false);
        }
      }
    } catch (e) {
      console.warn('Não foi possível restaurar certificado prévio:', e.message);
    }
  }

  /**
   * Carrega e valida um arquivo de certificado digital A1 (.pfx ou .p12)
   */
  loadPfx(pfxBuffer, password, shouldPersist = true) {
    return this._parseAndActivate(pfxBuffer, password, shouldPersist);
  }

  _parseAndActivate(pfxBuffer, password, shouldPersist = true) {
    try {
      if (!pfxBuffer || pfxBuffer.length === 0) {
        throw new Error('Arquivo de certificado digital .pfx vazio ou não informado.');
      }

      let certPem = null;
      let keyPem = null;
      let caPems = [];
      let parseError = null;

      // 1. Tenta extrair usando OpenSSL 3 (suporta todos os algoritmos modernos do Windows: PBES2, AES-256-CBC, PBKDF2)
      if (this.opensslPath) {
        try {
          const extracted = this._extractWithOpenSSL(pfxBuffer, password);
          certPem = extracted.certPem;
          keyPem = extracted.keyPem;
          caPems = extracted.caPems || [];
        } catch (osslErr) {
          parseError = osslErr;
        }
      }

      // 2. Se o OpenSSL não estiver disponível ou falhar, tenta com node-forge
      if (!certPem || !keyPem) {
        try {
          const extractedForge = this._extractWithForge(pfxBuffer, password);
          certPem = extractedForge.certPem;
          keyPem = extractedForge.keyPem;
          caPems = extractedForge.caPems || [];
        } catch (forgeErr) {
          if (!parseError) parseError = forgeErr;
        }
      }

      if (!certPem || !keyPem) {
        throw parseError || new Error('Não foi possível extrair a chave privada ou certificado do arquivo .pfx. Verifique se a senha informada está correta.');
      }

      // 3. Lê os metadados do certificado via Node.js nativo (crypto.X509Certificate)
      const x509 = new crypto.X509Certificate(certPem);
      const certInfo = this._buildCertMetadata(x509, certPem, keyPem, pfxBuffer, password, caPems);

      this.activeCert = certInfo;

      // 4. Persiste o certificado em disco para não precisar reenviar
      if (shouldPersist) {
        try {
          fs.writeFileSync(CERT_PFX_FILE, pfxBuffer);
          fs.writeFileSync(CERT_META_FILE, JSON.stringify({
            subject: certInfo.subject,
            procuradorName: certInfo.procuradorName,
            procuradorDoc: certInfo.procuradorDoc,
            password: password || '',
            validTo: certInfo.validTo
          }, null, 2));
        } catch (persErr) {
          console.warn('Erro ao persistir certificado em disco:', persErr.message);
        }
      }

      return {
        success: true,
        certificate: this.getPublicCertInfo()
      };
    } catch (err) {
      console.error('Falha no carregamento do certificado A1:', err.message);
      return {
        success: false,
        error: translateError(err, { step: 'Carregamento do Certificado A1' })
      };
    }
  }

  /**
   * Extração segura via OpenSSL CLI (100% compatível com PBES2 / AES-256 do Windows 10/11)
   */
  _extractWithOpenSSL(pfxBuffer, password) {
    const tempPfxPath = path.join(DATA_DIR, `temp_${Date.now()}_${Math.random().toString(36).substring(7)}.pfx`);
    try {
      fs.writeFileSync(tempPfxPath, pfxBuffer);
      const safePass = (password || '').replace(/"/g, '\\"');
      let output;
      try {
        const cmd = `"${this.opensslPath}" pkcs12 -in "${tempPfxPath}" -passin pass:"${safePass}" -nodes`;
        output = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
      } catch (err1) {
        // Fallback para OpenSSL 3 no Linux (comum no Render/Ubuntu para cifras legado de certificados A1 ICP-Brasil)
        try {
          const cmdLegacy = `"${this.opensslPath}" pkcs12 -in "${tempPfxPath}" -passin pass:"${safePass}" -nodes -legacy`;
          output = execSync(cmdLegacy, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
        } catch (_) {
          throw err1;
        }
      }

      const keyMatch = output.match(/-----BEGIN (?:RSA |EC )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC )?PRIVATE KEY-----/);
      const allCerts = [...output.matchAll(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g)].map(m => m[0]);

      if (!keyMatch || allCerts.length === 0) {
        throw new Error('Certificado ou chave privada não localizados no arquivo .pfx.');
      }

      // Procura o certificado folha (titular / end-entity), ignorando as Autoridades Certificadoras Raiz/Intermediárias
      let leafCertPem = null;

      // 1ª Tentativa: Seleciona o certificado que NÃO é Autoridade Certificadora (ca === false)
      for (const certPem of allCerts) {
        try {
          const x509 = new crypto.X509Certificate(certPem);
          if (x509.ca === false) {
            leafCertPem = certPem;
            break;
          }
        } catch {}
      }

      // 2ª Tentativa: Procura pelo padrão ICP-Brasil com CN contendo CNPJ/CPF (:00000000000000)
      if (!leafCertPem) {
        for (const certPem of allCerts) {
          try {
            const x509 = new crypto.X509Certificate(certPem);
            if (/CN=.*:\d{11,14}/i.test(x509.subject)) {
              leafCertPem = certPem;
              break;
            }
          } catch {}
        }
      }

      // Fallback
      if (!leafCertPem) {
        leafCertPem = allCerts[0];
      }

      const caPems = allCerts.filter(c => c !== leafCertPem);

      return {
        certPem: leafCertPem,
        keyPem: keyMatch[0],
        caPems
      };
    } finally {
      if (fs.existsSync(tempPfxPath)) {
        try { fs.unlinkSync(tempPfxPath); } catch {}
      }
    }
  }

  /**
   * Extração via node-forge com correspondência exata de localKeyId e seleção do certificado titular (Leaf)
   */
  _extractWithForge(pfxBuffer, password) {
    const p12Asn1 = forge.asn1.fromDer(pfxBuffer.toString('binary'));
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password || '');

    let privateKey = null;
    let keyLocalKeyId = null;
    const certCandidates = [];

    for (const safeContent of p12.safeContents) {
      for (const safeBag of safeContent.safeBags) {
        if (safeBag.key) {
          privateKey = safeBag.key;
          if (safeBag.attributes && safeBag.attributes.localKeyId && safeBag.attributes.localKeyId[0]) {
            keyLocalKeyId = safeBag.attributes.localKeyId[0];
          }
        }
        if (safeBag.cert) {
          const localKeyId = (safeBag.attributes && safeBag.attributes.localKeyId && safeBag.attributes.localKeyId[0])
            ? safeBag.attributes.localKeyId[0]
            : null;
          certCandidates.push({ cert: safeBag.cert, localKeyId });
        }
      }
    }

    if (!privateKey) {
      throw new Error('Chave privada não encontrada no arquivo .pfx. Verifique se a senha informada está correta.');
    }

    if (certCandidates.length === 0) {
      throw new Error('Nenhum certificado localizado no arquivo .pfx.');
    }

    // 1. Prioridade máxima: Certificado cujo localKeyId coincide com o da Chave Privada
    let chosenCert = null;
    if (keyLocalKeyId) {
      const match = certCandidates.find(c => c.localKeyId === keyLocalKeyId);
      if (match) chosenCert = match.cert;
    }

    // 2. Se não houver localKeyId ou correspondência, procura o certificado que NÃO é CA (basicConstraints.cA !== true)
    if (!chosenCert) {
      for (const c of certCandidates) {
        const cert = c.cert;
        const bcExt = cert.getExtension('basicConstraints');
        const isCa = bcExt && (bcExt.cA === true || bcExt.cA === 'true');
        if (!isCa) {
          chosenCert = cert;
          break;
        }
      }
    }

    // 3. Procura pelo padrão ICP-Brasil no Subject (CN contendo CNPJ ou CPF)
    if (!chosenCert) {
      for (const c of certCandidates) {
        const cn = c.cert.subject.getField('CN');
        if (cn && /:\d{11,14}$/.test(cn.value)) {
          chosenCert = c.cert;
          break;
        }
      }
    }

    // 4. Último fallback: Primeiro certificado encontrado
    if (!chosenCert) {
      chosenCert = certCandidates[0].cert;
    }

    const caPems = certCandidates
      .filter(c => c.cert !== chosenCert)
      .map(c => forge.pki.certificateToPem(c.cert));

    return {
      certPem: forge.pki.certificateToPem(chosenCert),
      keyPem: forge.pki.privateKeyToPem(privateKey),
      caPems
    };
  }

  /**
   * Constrói metadados completos a partir do X509Certificate
   */
  _buildCertMetadata(x509, certPem, keyPem, pfxBuffer, password, caPems = []) {
    const subject = x509.subject || '';
    const rawIssuer = x509.issuer || '';

    // Extrai CN do Emissor (Autoridade Certificadora)
    let issuer = 'Autoridade Certificadora ICP-Brasil';
    const issuerMatch = rawIssuer.match(/CN=([^,\n\r]+)/i);
    if (issuerMatch) {
      issuer = issuerMatch[1].trim();
    } else if (rawIssuer) {
      issuer = rawIssuer.replace(/[\n\r]+/g, ', ');
    }

    // Extrai CN (Common Name) do Titular
    let commonName = '';
    const cnMatch = subject.match(/CN=([^,\n\r]+)/i);
    if (cnMatch) {
      commonName = cnMatch[1].trim();
    } else {
      commonName = subject.replace(/[\n\r]+/g, ', ');
    }

    // Extrai CNPJ ou CPF do Common Name (Padrão ICP-Brasil: "RAZAO SOCIAL:12345678000195" ou "NOME:12345678901")
    let docRaw = '';
    let docType = 'DOCUMENTO';
    let procuradorName = commonName;

    const docMatch = commonName.match(/:(\d{11,14})$/);
    if (docMatch) {
      docRaw = docMatch[1];
      procuradorName = commonName.replace(/:\d{11,14}$/, '').trim();
      docType = docRaw.length === 14 ? 'CNPJ' : 'CPF';
    } else {
      const digits = commonName.replace(/\D/g, '');
      if (digits.length >= 14) {
        docRaw = digits.slice(-14);
        docType = 'CNPJ';
      } else if (digits.length >= 11) {
        docRaw = digits.slice(-11);
        docType = 'CPF';
      }
    }

    const validFrom = new Date(x509.validFrom);
    const validTo = new Date(x509.validTo);
    const now = new Date();
    const isValid = now >= validFrom && now <= validTo;
    const daysRemaining = Math.ceil((validTo - now) / (1000 * 60 * 60 * 24));

    // Data de validade formatada em padrão brasileiro (DD/MM/YYYY)
    const validToFormatted = validTo.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    return {
      isTestMock: false,
      subject: commonName,
      procuradorName,
      procuradorDoc: this.formatDoc(docRaw, docType),
      docRaw,
      docType,
      issuer,
      validFrom: validFrom.toISOString(),
      validTo: validTo.toISOString(),
      validToFormatted,
      daysRemaining,
      isValid,
      certPem,
      keyPem,
      caPems,
      pfxBuffer,
      password
    };
  }

  /**
   * Retorna os dados públicos do certificado ativo
   */
  getPublicCertInfo() {
    if (!this.activeCert) return null;
    return {
      isTestMock: false,
      subject: this.activeCert.subject,
      procuradorName: this.activeCert.procuradorName,
      procuradorDoc: this.activeCert.procuradorDoc,
      docRaw: this.activeCert.docRaw,
      docType: this.activeCert.docType,
      issuer: this.activeCert.issuer,
      validFrom: this.activeCert.validFrom,
      validTo: this.activeCert.validTo,
      validToFormatted: this.activeCert.validToFormatted,
      daysRemaining: this.activeCert.daysRemaining,
      isValid: this.activeCert.isValid
    };
  }

  /**
   * Remove e desvincula o certificado ativo
   */
  clearCert() {
    this.activeCert = null;
    try {
      if (fs.existsSync(CERT_PFX_FILE)) fs.unlinkSync(CERT_PFX_FILE);
      if (fs.existsSync(CERT_META_FILE)) fs.unlinkSync(CERT_META_FILE);
    } catch {}
  }

  /**
   * Valida a relação de Procuração Eletrônica entre o titular do certificado e o CNPJ representado
   */
  validateProxy(prestadorCnpj) {
    const cleanPrestador = (prestadorCnpj || '').replace(/\D/g, '');
    const certInfo = this.getPublicCertInfo();

    if (!cleanPrestador || (cleanPrestador.length !== 14 && cleanPrestador.length !== 11)) {
      return {
        valid: false,
        isDirectOwner: false,
        isProxy: false,
        message: 'CPF ou CNPJ que deseja representar incompleto ou inválido.',
        howToFix: ['Informe os 14 dígitos numéricos para CNPJ ou 11 para CPF.']
      };
    }

    if (!certInfo) {
      return {
        valid: false,
        isDirectOwner: false,
        isProxy: false,
        message: 'Nenhum certificado digital A1 (.pfx) carregado no sistema.',
        howToFix: [
          'Faça o upload do seu certificado digital A1 (.pfx) com a respectiva senha.',
          'O certificado é obrigatório para assinar a DPS digitalmente e validar a procuração na base da Receita Federal.'
        ]
      };
    }

    const cleanProcuradorDoc = (certInfo.docRaw || '').replace(/\D/g, '');

    // Se o documento do certificado for exatamente o CNPJ da representada
    if (cleanProcuradorDoc === cleanPrestador) {
      return {
        valid: true,
        isDirectOwner: true,
        isProxy: false,
        mode: 'TITULAR_DIRETO',
        message: 'O certificado digital em uso pertence diretamente ao próprio prestador.',
        procuradorDoc: certInfo.procuradorDoc,
        prestadorCnpj: this.formatDoc(cleanPrestador, cleanPrestador.length === 14 ? 'CNPJ' : 'CPF')
      };
    }

    // Se for diferente, trata-se de REPRESENTAÇÃO POR PROCURAÇÃO ELETRÔNICA RFB
    return {
      valid: true,
      isDirectOwner: false,
      isProxy: true,
      mode: 'REPRESENTACAO_PROCURACAO',
      message: `Emissão via Procuração: Procurador (${certInfo.procuradorDoc} - ${certInfo.procuradorName}) representando ${this.formatDoc(cleanPrestador, cleanPrestador.length === 14 ? 'CNPJ' : 'CPF')}.`,
      procuradorDoc: certInfo.procuradorDoc,
      procuradorName: certInfo.procuradorName,
      prestadorCnpj: this.formatDoc(cleanPrestador, cleanPrestador.length === 14 ? 'CNPJ' : 'CPF'),
      details: 'A autorização da procuração eletrônica é validada diretamente na base da Receita Federal / ADN.'
    };
  }

  formatDoc(doc, type) {
    const clean = (doc || '').replace(/\D/g, '');
    if (clean.length === 14 || type === 'CNPJ') {
      return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    }
    if (clean.length === 11 || type === 'CPF') {
      return clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    }
    return doc;
  }
}

module.exports = new CertService();
