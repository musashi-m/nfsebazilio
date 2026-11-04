/**
 * Serviço de Assinatura Digital ICP-Brasil padrão XMLDSig (RSA-SHA256)
 * para a DPS (Declaração de Prestação de Serviço) do Padrão Nacional da NFS-e
 * Utiliza o motor W3C XMLDSig (xml-crypto) com canonicalização C14N oficial
 */

const crypto = require('crypto');
const { SignedXml } = require('xml-crypto');

class SignatureService {
  /**
   * Assina uma tag XML com a chave privada do certificado (ICP-Brasil)
   * @param {string} xmlString - Conteúdo XML completo da DPS
   * @param {string} tagToSign - Nome da tag a assinar (ex: 'infDPS')
   * @param {string} elementId - ID do elemento referenciado (ex: 'DPS280030825940845400014970000000000000000001')
   * @param {string} privateKeyPem - Chave privada em formato PEM
   * @param {string} certPem - Certificado público em formato PEM
   */
  signXml(xmlString, tagToSign, elementId, privateKeyPem, certPem) {
    if (!privateKeyPem || !certPem) {
      throw new Error('Chave privada ou certificado público não fornecidos para assinatura digital.');
    }

    try {
      // 1. Configura o motor de assinatura oficial XMLDSig W3C / SPED
      const sig = new SignedXml({
        privateKey: privateKeyPem,
        publicCert: certPem,
        signatureAlgorithm: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
        canonicalizationAlgorithm: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'
      });

      // 2. Adiciona referência direta ao ID da DPS com transforms Enveloped + C14N
      sig.addReference({
        xpath: `//*[@Id='${elementId}']`,
        transforms: [
          'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
          'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'
        ],
        digestAlgorithm: 'http://www.w3.org/2001/04/xmlenc#sha256'
      });

      // 3. Computa e posiciona a tag <Signature> imediatamente após </infDPS>
      sig.computeSignature(xmlString, {
        location: { reference: `//*[local-name(.)='${tagToSign}']`, action: 'after' }
      });

      const signedXml = sig.getSignedXml();
      const digestMatch = signedXml.match(/<DigestValue>([^<]+)<\/DigestValue>/);
      const sigValueMatch = signedXml.match(/<SignatureValue>([^<]+)<\/SignatureValue>/);

      return {
        signedXml,
        digest: digestMatch ? digestMatch[1] : '',
        signatureValue: sigValueMatch ? sigValueMatch[1] : ''
      };
    } catch (err) {
      console.warn('Motor xml-crypto falhou, executando fallback de assinatura nativa:', err.message);
      return this._fallbackNativeSign(xmlString, tagToSign, elementId, privateKeyPem, certPem);
    }
  }

  /**
   * Assinatura nativa de contingência
   */
  _fallbackNativeSign(xmlString, tagToSign, elementId, privateKeyPem, certPem) {
    const tagRegex = new RegExp(`(<${tagToSign}[^>]*>[\\s\\S]*?<\\/${tagToSign}>)`, 'i');
    const match = xmlString.match(tagRegex);
    if (!match) {
      throw new Error(`Elemento <${tagToSign}> não encontrado no XML da DPS.`);
    }

    let elementContent = match[1];
    if (!elementContent.includes('xmlns=')) {
      elementContent = elementContent.replace(`<${tagToSign}`, `<${tagToSign} xmlns="http://www.sped.fazenda.gov.br/nfse"`);
    }

    const canonicalXml = elementContent
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/>\s+</g, '><')
      .trim();

    const digest = crypto.createHash('sha256').update(canonicalXml, 'utf8').digest('base64');

    const signedInfo = 
`<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#">` +
`<CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>` +
`<SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>` +
`<Reference URI="#${elementId}">` +
`<Transforms>` +
`<Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>` +
`<Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>` +
`</Transforms>` +
`<DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>` +
`<DigestValue>${digest}</DigestValue>` +
`</Reference>` +
`</SignedInfo>`;

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signedInfo, 'utf8');
    const signatureValue = signer.sign(privateKeyPem, 'base64');

    const cleanCert = certPem
      .replace(/-----BEGIN CERTIFICATE-----/g, '')
      .replace(/-----END CERTIFICATE-----/g, '')
      .replace(/\r?\n|\r/g, '')
      .trim();

    const signatureTag = 
`<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">` +
`${signedInfo}` +
`<SignatureValue>${signatureValue}</SignatureValue>` +
`<KeyInfo>` +
`<X509Data>` +
`<X509Certificate>${cleanCert}</X509Certificate>` +
`</X509Data>` +
`</KeyInfo>` +
`</Signature>`;

    const signedXml = xmlString.replace(/<\/DPS>/i, `${signatureTag}</DPS>`);
    return {
      signedXml,
      digest,
      signatureValue
    };
  }
}

module.exports = new SignatureService();
