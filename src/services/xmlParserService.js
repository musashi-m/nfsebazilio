/**
 * Serviço de Parsing e Normalização de Documentos XML de NFS-e Nacional
 * Compatível com o padrão Receita Federal / SEFIN Nacional / ADN
 */

const zlib = require('zlib');

class XmlParserService {
  /**
   * Descompacta se for base64 gzip ou retorna a string pura
   */
  decompressIfNeeded(content) {
    if (!content) return '';
    if (typeof content !== 'string') {
      try {
        return zlib.gunzipSync(content).toString('utf-8');
      } catch {
        return content.toString('utf-8');
      }
    }

    const trimmed = content.trim();
    // Se já começa com <?xml ou <, é XML puro
    if (trimmed.startsWith('<')) {
      return trimmed;
    }

    // Tenta decodificar base64 + gzip
    try {
      const buf = Buffer.from(trimmed, 'base64');
      // Gzip magic number: 0x1f 0x8b
      if (buf.length > 2 && buf[0] === 0x1f && buf[1] === 0x8b) {
        return zlib.gunzipSync(buf).toString('utf-8');
      }
      // Se não for gzip, pode ser apenas base64 do XML
      const str = buf.toString('utf-8');
      if (str.includes('<')) {
        return str;
      }
    } catch {
      // Ignora erro de descompressão e retorna original
    }

    return trimmed;
  }

  /**
   * Extrai o conteúdo interno de uma tag XML de forma tolerante a namespaces
   */
  getTag(xml, tagName) {
    if (!xml) return '';
    const regex = new RegExp(`<(?:[a-zA-Z0-9_-]+:)?${tagName}(?:\\s+[^>]*)?>([\\s\\S]*?)<\\/(?:[a-zA-Z0-9_-]+:)?${tagName}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : '';
  }

  /**
   * Formata CNPJ ou CPF com máscara
   */
  formatDoc(doc) {
    if (!doc) return '';
    const clean = doc.replace(/\D/g, '');
    if (clean.length === 14) {
      return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    }
    if (clean.length === 11) {
      return clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    }
    return doc;
  }

  /**
   * Converte string numérica do XML para float seguro
   */
  parseFloatSafe(val, fallback = 0) {
    if (!val) return fallback;
    const clean = String(val).replace(',', '.').replace(/[^0-9.-]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? fallback : num;
  }

  /**
   * Extrai a chave de acesso de 50 dígitos de um conteúdo XML (NFS-e ou Evento)
   */
  extractChaveFromXml(xmlContent) {
    if (!xmlContent) return '';
    try {
      const xml = this.decompressIfNeeded(xmlContent);
      if (!xml || typeof xml !== 'string') return '';
      const matchInfId = xml.match(/<infNFSe[^>]*Id=["'](?:NFS)?([0-9]{50})["']/i);
      if (matchInfId) return matchInfId[1];
      const matchChaveTag = xml.match(/<(?:[a-zA-Z0-9_-]+:)?(?:chNFSe|chaveAcesso)[^>]*>([0-9]{50})<\//i);
      if (matchChaveTag) return matchChaveTag[1];
      const matchAttr = xml.match(/(?:chNFSe|chaveAcesso)=["']([0-9]{50})["']/i);
      if (matchAttr) return matchAttr[1];
      const match50 = xml.match(/\b([0-9]{50})\b/);
      if (match50) return match50[1];
    } catch (_) {}
    return '';
  }

  /**
   * Faz o parse completo de um documento XML de NFS-e da Receita Federal
   */
  parseNfseXml(xmlContent, metadata = {}) {
    const xml = this.decompressIfNeeded(xmlContent);
    if (!xml || !xml.includes('<')) {
      throw new Error('Conteúdo fornecido não é um XML válido.');
    }

    // 1. Chave de Acesso
    let chaveAcesso = metadata.chaveAcesso || '';
    if (!chaveAcesso) {
      chaveAcesso = this.extractChaveFromXml(xml);
    }

    // 2. Número da NFS-e e DPS
    const numeroNfse = this.getTag(xml, 'nNFSe') || this.getTag(xml, 'numero') || metadata.numeroNfse || '';
    const numeroDps = this.getTag(xml, 'nDPS') || metadata.numeroDps || '';
    const serie = this.getTag(xml, 'serie') || metadata.serie || '';
    const dCompet = this.getTag(xml, 'dCompet') || '';

    // 3. Status e Ambiente (Detecção rigorosa de Cancelamento oficial)
    const cStat = this.getTag(xml, 'cStat') || '';
    const sitNFSe = this.getTag(xml, 'sitNFSe') || '';
    const tpEvento = this.getTag(xml, 'tpEvento') || '';
    const descEvento = this.getTag(xml, 'descEvento') || this.getTag(xml, 'xDescEvento') || '';

    let status = metadata.status || 'AUTORIZADA';
    const isCancelledXml = (
      cStat === '101' || cStat === '102' ||
      sitNFSe === '2' || sitNFSe === '3' ||
      tpEvento === '110111' ||
      /cancelamento/i.test(descEvento) ||
      /<(?:[a-zA-Z0-9_-]+:)?(?:e110111|pedCan|infPedCan|retCancelamento)/i.test(xml)
    );
    if (isCancelledXml) {
      status = 'CANCELADA';
    }

    const ambGer = this.getTag(xml, 'ambGer') || '';
    const tpAmbTag = this.getTag(xml, 'tpAmb');
    // tpAmb: 1 = Produção, 2 = Homologação (não confundir com ambGer, que é o ambiente gerador 1=Município, 2=Nacional)
    let ambiente = metadata.ambiente || 'PRODUCAO';
    let tpAmbNum = ambiente === 'HOMOLOGACAO' ? 2 : 1;
    if (tpAmbTag === '1') {
      ambiente = 'PRODUCAO';
      tpAmbNum = 1;
    } else if (tpAmbTag === '2') {
      ambiente = 'HOMOLOGACAO';
      tpAmbNum = 2;
    }

    // 4. Datas
    const dhProc = this.getTag(xml, 'dhProc') || this.getTag(xml, 'dhEmi') || metadata.dataEmissao || new Date().toISOString();

    // 5. Prestador / Emitente
    const emitBlock = this.getTag(xml, 'emit') || this.getTag(xml, 'prest') || '';
    const emitCnpj = this.getTag(emitBlock, 'CNPJ') || this.getTag(xml, 'CNPJ') || '';
    const emitCpf = this.getTag(emitBlock, 'CPF') || '';
    const emitDocRaw = (emitCnpj || emitCpf).replace(/\D/g, '');
    const emitNome = this.getTag(emitBlock, 'xNome') || this.getTag(xml, 'xNome') || '';
    const emitFant = this.getTag(emitBlock, 'xFant') || '';
    const emitIm = this.getTag(emitBlock, 'IM') || '';
    const emitMun = this.getTag(xml, 'xLocEmi') || this.getTag(emitBlock, 'xMun') || '';
    const emitUf = this.getTag(emitBlock, 'UF') || '';

    // 6. Tomador
    const tomaBlock = this.getTag(xml, 'toma') || '';
    const tomaCnpj = this.getTag(tomaBlock, 'CNPJ') || '';
    const tomaCpf = this.getTag(tomaBlock, 'CPF') || '';
    const tomaDocRaw = (tomaCnpj || tomaCpf).replace(/\D/g, '');
    const tomaNome = this.getTag(tomaBlock, 'xNome') || 'Tomador Não Identificado';
    const tomaEmail = this.getTag(tomaBlock, 'email') || '';
    const tomaFone = this.getTag(tomaBlock, 'fone') || '';
    const tomaIm = this.getTag(tomaBlock, 'IM') || this.getTag(tomaBlock, 'im') || '';
    const endBlock = this.getTag(tomaBlock, 'end') || '';
    const endNacBlock = this.getTag(endBlock, 'endNac') || '';
    const tomaMun = this.getTag(tomaBlock, 'xMun') || this.getTag(endBlock, 'xMun') || this.getTag(xml, 'xLocPrestacao') || '';
    const tomaMunIbge = this.getTag(endNacBlock, 'cMun') || '';
    const tomaCep = this.getTag(endNacBlock, 'CEP') || this.getTag(endBlock, 'CEP') || '';
    const tomaLgr = this.getTag(endBlock, 'xLgr') || '';
    const tomaNro = this.getTag(endBlock, 'nro') || '';
    const tomaCpl = this.getTag(endBlock, 'xCpl') || '';
    const tomaBairro = this.getTag(endBlock, 'xBairro') || '';
    const tomaUf = this.getTag(endBlock, 'UF') || this.getTag(tomaBlock, 'UF') || '';

    // 7. Serviço
    const servBlock = this.getTag(xml, 'serv') || '';
    const cTribNac = this.getTag(servBlock, 'cTribNac') || this.getTag(xml, 'cTribNac') || '';
    const descServ = this.getTag(servBlock, 'xDescServ') || this.getTag(xml, 'xTribNac') || this.getTag(xml, 'xTribMun') || 'Prestação de Serviços';
    const cMunIncid = this.getTag(xml, 'cLocIncid') || this.getTag(servBlock, 'cMunIncid') || '';
    const xLocIncid = this.getTag(xml, 'xLocIncid') || this.getTag(xml, 'xLocPrestacao') || '';

    // 8. Valores
    const valBlock = this.getTag(xml, 'valores') || '';
    const vLiq = this.parseFloatSafe(this.getTag(valBlock, 'vLiq') || this.getTag(valBlock, 'vBC') || this.getTag(valBlock, 'vServ'));
    const vServ = this.parseFloatSafe(this.getTag(valBlock, 'vServ') || this.getTag(valBlock, 'vBC') || this.getTag(valBlock, 'vLiq'));
    const vBC = this.parseFloatSafe(this.getTag(valBlock, 'vBC') || vServ);
    const vISSQN = this.parseFloatSafe(this.getTag(valBlock, 'vISSQN'));
    const pAliq = this.parseFloatSafe(this.getTag(valBlock, 'pAliqAplic') || this.getTag(valBlock, 'pAliq'));
    const vISSRet = this.parseFloatSafe(this.getTag(valBlock, 'vISSRet'));

    const retencao = vISSRet > 0 || this.getTag(valBlock, 'tpRetISSQN') === '1' || this.getTag(valBlock, 'tpRetISSQN') === '2';

    return {
      id: 'nfse_' + (chaveAcesso || Date.now()),
      chaveAcesso: chaveAcesso || `CHAVE-${Date.now()}`,
      numeroNfse: numeroNfse || String(metadata.nsu || '1'),
      numeroDps: numeroDps,
      serie: serie,
      competencia: dCompet,
      nsu: metadata.nsu !== undefined ? Number(metadata.nsu) : undefined,
      tipoDocumento: metadata.tipoDocumento || 'NFSE',
      status: status,
      ambiente: ambiente,
      tpAmb: tpAmbNum,
      ambGer: ambGer || undefined,
      dataEmissao: dhProc,
      dataAutorizacao: dhProc,
      protocolo: this.getTag(xml, 'nDFSe') || this.getTag(xml, 'protocolo') || '',
      prestador: {
        cnpj: this.formatDoc(emitDocRaw),
        cnpjRaw: emitDocRaw,
        razaoSocial: emitNome,
        nomeFantasia: emitFant,
        im: emitIm,
        municipio: emitMun,
        uf: emitUf
      },
      tomador: {
        doc: this.formatDoc(tomaDocRaw),
        docRaw: tomaDocRaw,
        tipoDoc: tomaDocRaw.length === 11 ? 'CPF' : 'CNPJ',
        nome: tomaNome,
        im: tomaIm,
        email: tomaEmail,
        telefone: tomaFone,
        cep: tomaCep,
        logradouro: tomaLgr,
        numero: tomaNro,
        complemento: tomaCpl,
        bairro: tomaBairro,
        municipio: tomaMun,
        municipioIbge: tomaMunIbge,
        uf: tomaUf
      },
      servico: {
        cTribNac: cTribNac,
        descricao: descServ,
        cMunIncid: cMunIncid,
        xLocIncid: xLocIncid
      },
      valores: {
        valorServico: vServ || vLiq,
        valorLiquido: vLiq || vServ,
        baseCalculo: vBC,
        iss: {
          valorIss: vISSQN,
          aliquota: pAliq,
          retido: retencao,
          valorRetido: vISSRet
        }
      },
      origem: metadata.origem || 'ADN_RECEITA_FEDERAL',
      xmlAssinado: xml,
      xmlCompleto: xml
    };
  }
}

module.exports = new XmlParserService();

