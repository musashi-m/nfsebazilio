/**
 * Serviço de Construção e Validação da DPS (Declaração de Prestação de Serviço)
 * e Cálculo da Chave de Acesso Nacional da NFS-e (50 dígitos)
 */

const { CODIGOS_TRIBUTACAO_NACIONAL, REGIMES_TRIBUTARIOS } = require('../utils/ibgeTributos');

class DpsService {
  /**
   * Constrói o XML oficial da DPS v1.01 (Padrão Oficial Emissor Nacional / CGNFS-e)
   * Baseado fielmente no schema oficial e no XML emitido pelo portal nacional
   * @param {Object} data - Dados preenchidos no formulário completo da DPS
   * @param {Object} certInfo - Informações do certificado do procurador
   * @param {number} tpAmb - 1=Produção, 2=Homologação, 3=Teste
   */
  buildDps(data, certInfo, tpAmb = 1) {
    const errors = this.validateDpsInput(data);
    if (errors.length > 0) {
      throw new Error(`Erros de validação na DPS: ${errors.join('; ')}`);
    }

    const prestCnpj = (data.prestadorCnpj || '').replace(/\D/g, '');
    const tomaDoc = (data.tomadorDoc || '').replace(/\D/g, '');
    let tomaTipoDoc = 'CNPJ';
    if (data.tomadorTipoDoc === 'NIF') {
      tomaTipoDoc = 'NIF';
    } else if (tomaDoc.length === 11) {
      tomaTipoDoc = 'CPF';
    }

    // Série da DPS (padrão oficial API: faixa 00001 a 49999, default: "00001")
    const serie = String(data.serie || '00001').padStart(5, '0').slice(-5);
    const nDpsNum = parseInt(data.numeroDps || '1', 10);
    const nDps = String(nDpsNum);
    const cLocEmi = String(data.municipioIbge || data.localPrestacaoIbge || '2800308').padStart(7, '0').slice(-7);

    const dhEmi = data.dataEmissao || this.getBrasiliaIsoString();
    const dCompet = data.dataCompetencia || dhEmi.substring(0, 10);

    // ID oficial da DPS: "DPS" + [cLocEmi:7] + [tpInsc:1 (2=CNPJ, 1=CPF)] + [Doc:14] + [serie:5] + [nDPS:15] = 45 caracteres
    const tpInsc = prestCnpj.length === 14 ? '2' : '1';
    const nDpsPadded15 = String(nDpsNum).padStart(15, '0');
    const dpsId = `DPS${cLocEmi}${tpInsc}${prestCnpj}${serie}${nDpsPadded15}`;

    // Valores e Cálculos Fiscais Oficiais
    const vServ = parseFloat(data.valorServico || 0);
    const vDescIncond = parseFloat(data.descontoIncondicionado || 0);
    const vDescCond = parseFloat(data.descontoCondicionado || 0);
    const vDed = parseFloat(data.valorDeducoes || 0);

    // Base de Cálculo do ISS = Valor Serviço - Desconto Incondicionado - Deduções Legais
    const vBcIss = Math.max(0, Math.round((vServ - vDescIncond - vDed) * 100) / 100);

    const pAliq = parseFloat(data.aliquotaIss || 0);
    const tribIssqn = parseInt(data.tribIssqn || 1, 10); // 1 = Operação Tributável
    const tpRetIssqn = parseInt(data.tipoRetencaoIss || (data.issRetido ? 2 : 1), 10);
    const issRetido = tpRetIssqn === 2 || tpRetIssqn === 3;

    // Se a operação for tributável, calcula o ISS; caso contrário (isenção, imunidade, etc.), o ISS é 0.00
    const isTributavel = tribIssqn === 1 || tribIssqn === 6 || tribIssqn === 7;
    const vIss = isTributavel ? Math.round((vBcIss * (pAliq / 100)) * 100) / 100 : 0;
    const vIssRet = issRetido ? vIss : 0;

    // Retenções Federais na Fonte
    const vPis = parseFloat(data.retPis || 0);
    const vCofins = parseFloat(data.retCofins || 0);
    const vInss = parseFloat(data.retInss || 0);
    const vIr = parseFloat(data.retIr || 0);
    const vCsll = parseFloat(data.retCsll || 0);
    const vOutrasRet = parseFloat(data.outrasRetencoes || 0);
    const pTotTribSN = parseFloat(data.aliquotaSimplesNacional || data.pTotTribSN || data.totTributosAprox || 15.50);

    const totalRetencoes = vIssRet + vPis + vCofins + vInss + vIr + vCsll + vOutrasRet;
    const vLiquido = Math.max(0, Math.round((vServ - vDescIncond - totalRetencoes) * 100) / 100);

    // Local da Prestação (conforme XML oficial: <cLocPrestacao>)
    const cLocPrestacao = data.localPrestacaoIbge || cLocEmi;

    // Código de Tributação Nacional limpo (6 dígitos sem pontos, ex: "100901")
    let cTribNacClean = String(data.cTribNac || '100901').replace(/\D/g, '');
    if (cTribNacClean.length > 6) cTribNacClean = cTribNacClean.slice(0, 6);
    else if (cTribNacClean.length < 6) cTribNacClean = cTribNacClean.padStart(6, '0');

    // Regimes Tributários do Prestador (Padrão Oficial RFB: 1 = Não Optante, 2 = MEI, 3 = ME/EPP, 4 = Pendente)
    const opSimpNac = data.opSimpNac !== undefined ? Number(data.opSimpNac) : (data.isMei ? 2 : (data.regimeTributario === 1 || data.regimeTributario === 2 ? 3 : 1));
    const regApTribSN = data.regApTribSN !== undefined ? data.regApTribSN : 1; // 1 = Regime de Caixa, 2 = Regime de Competência
    const regEspTrib = data.regEspTrib !== undefined ? data.regEspTrib : 0;

    // Contato do Prestador / Procurador
    const prestFone = (data.prestadorTelefone || (certInfo && certInfo.fone) || '7932229095').replace(/\D/g, '');
    const prestEmail = data.prestadorEmail || (certInfo && certInfo.email) || 'BAZILIOCONTABILIDADE@GMAIL.COM';

    // Endereço do Tomador (conforme XML oficial: <endNac><cMun> e <CEP>)
    const tomaMun = data.tomadorMunIbge || cLocEmi;
    const tomaCep = (data.tomadorCep || '49000000').replace(/\D/g, '');

    // Gera a Chave de Acesso Nacional de 50 dígitos
    const chaveAcesso = this.generateChaveAcessoNfse({
      cMun: cLocEmi,
      tpAmb,
      prestCnpj,
      serie,
      nDps: nDpsNum
    });

    // Bloco de Retenções Federais (se preenchido)
    let xmlTribFed = '';
    if (vPis > 0 || vCofins > 0 || vInss > 0 || vIr > 0 || vCsll > 0 || vOutrasRet > 0) {
      xmlTribFed = `
        <tribFed>
          ${vPis > 0 ? `<vPIS>${vPis.toFixed(2)}</vPIS>` : ''}
          ${vCofins > 0 ? `<vCOFINS>${vCofins.toFixed(2)}</vCOFINS>` : ''}
          ${vInss > 0 ? `<vINSS>${vInss.toFixed(2)}</vINSS>` : ''}
          ${vIr > 0 ? `<vIR>${vIr.toFixed(2)}</vIR>` : ''}
          ${vCsll > 0 ? `<vCSLL>${vCsll.toFixed(2)}</vCSLL>` : ''}
          ${vOutrasRet > 0 ? `<vOutrasRet>${vOutrasRet.toFixed(2)}</vOutrasRet>` : ''}
        </tribFed>`;
    }

    // Intermediário (se houver)
    let xmlIntermediario = '';
    const intermDocClean = (data.intermDoc || '').replace(/\D/g, '');
    if (data.temIntermediario && intermDocClean) {
      const intermTipo = intermDocClean.length === 11 ? 'CPF' : 'CNPJ';
      xmlIntermediario = `
    <interm>
      <${intermTipo}>${intermDocClean}</${intermTipo}>
      <xNome>${this.escapeXml(data.intermNome || 'INTERMEDIARIO DE SERVICOS')}</xNome>
      ${data.intermIm ? `<IM>${this.escapeXml(data.intermIm)}</IM>` : ''}
    </interm>`;
    }

    // Construção Civil / Obras (se houver)
    let xmlConstrucaoCivil = '';
    if (data.codigoObraCno || data.artRegistro) {
      xmlConstrucaoCivil = `
      ${data.codigoObraCno ? `<cObra>${this.escapeXml(data.codigoObraCno)}</cObra>` : ''}
      ${data.artRegistro ? `<art>${this.escapeXml(data.artRegistro)}</art>` : ''}`;
    }

    // Informações Complementares e Documentos de Referência / ART
    const infCompParts = [];
    if (data.artRrt && data.artRrt.trim()) {
      infCompParts.push(`Doc. Resp. Técnica: ${data.artRrt.trim()}`);
    }
    if (data.docReferencia && data.docReferencia.trim()) {
      infCompParts.push(`Doc. Referência: ${data.docReferencia.trim()}`);
    }
    if (data.informacoesComplementares && data.informacoesComplementares.trim()) {
      infCompParts.push(data.informacoesComplementares.trim());
    }

    let xmlInfComp = '';
    if (infCompParts.length > 0) {
      xmlInfComp = `
      <infComp>${this.escapeXml(infCompParts.join(' | '))}</infComp>`;
    }

    // Conforme regra CNC NFS-e da Receita Federal:
    // Municípios como Aracaju (2800308) não possuem cadastro de IM no CNC nacional
    // e rejeitam a presença de <IM> com o erro [E0120]. O Emissor Nacional oficial omite a tag nesses casos.
    const deveIncluirIm = data.prestadorIm && cLocEmi !== '2800308' && data.forcarEnvioIm === true;

    // Compatibilidade entre Ambientes:
    // No ambiente de Produção (tpAmb == 1), o schema oficial SEFIN ainda não aceita <finNFSe> (espera diretamente cLocEmi).
    // No ambiente de Homologação (tpAmb == 2 / Produção Restrita), a SEFIN já exige <finNFSe>0</finNFSe> (NT 009).
    const xmlFinNfse = (tpAmb == 2) ? `    <finNFSe>0</finNFSe>\n` : '';

    const cNbsClean = (data.itemNbs || '').replace(/\D/g, '');

    // Monta o XML estruturado exatamente idêntico ao emitido pelo Emissor Nacional
    const xml = 
`<?xml version="1.0" encoding="utf-8"?>
<DPS xmlns="http://www.sped.fazenda.gov.br/nfse" versao="1.01">
  <infDPS Id="${dpsId}">
    <tpAmb>${tpAmb}</tpAmb>
    <dhEmi>${dhEmi}</dhEmi>
    <verAplic>EmissorWeb_1.6.0.0</verAplic>
    <serie>${serie}</serie>
    <nDPS>${nDpsNum}</nDPS>
    <dCompet>${dCompet}</dCompet>
    <tpEmit>${data.tpEmit || '1'}</tpEmit>
${xmlFinNfse}    <cLocEmi>${cLocEmi}</cLocEmi>
    <prest>
      <CNPJ>${prestCnpj}</CNPJ>
      ${deveIncluirIm ? `<IM>${this.escapeXml(data.prestadorIm)}</IM>` : ''}
      ${prestFone ? `<fone>${prestFone}</fone>` : ''}
      ${prestEmail ? `<email>${this.escapeXml(prestEmail)}</email>` : ''}
      <regTrib>
        <opSimpNac>${opSimpNac}</opSimpNac>
        <regApTribSN>${regApTribSN}</regApTribSN>
        <regEspTrib>${regEspTrib}</regEspTrib>
      </regTrib>
    </prest>
    <toma>
      <${tomaTipoDoc}>${tomaDoc}</${tomaTipoDoc}>
      <xNome>${this.escapeXml(data.tomadorNome || 'CLIENTE TOMADOR DE SERVICOS')}</xNome>
      <end>
        <endNac>
          <cMun>${tomaMun}</cMun>
          <CEP>${tomaCep}</CEP>
        </endNac>
        <xLgr>${this.escapeXml(data.tomadorLogradouro || 'LOGRADOURO PRINCIPAL')}</xLgr>
        <nro>${this.escapeXml(data.tomadorNumero || 'S/N')}</nro>
        ${data.tomadorComplemento ? `<xCpl>${this.escapeXml(data.tomadorComplemento)}</xCpl>` : ''}
        <xBairro>${this.escapeXml(data.tomadorBairro || 'CENTRO')}</xBairro>
      </end>
    </toma>${xmlIntermediario}
    <serv>
      <locPrest>
        <cLocPrestacao>${cLocPrestacao}</cLocPrestacao>
      </locPrest>
      <cServ>
        <cTribNac>${cTribNacClean}</cTribNac>
        ${data.cTribMun ? `<cTribMun>${this.escapeXml(data.cTribMun)}</cTribMun>` : ''}
        <xDescServ>${this.escapeXml(data.descricaoServico || 'PRESTACAO DE SERVICOS')}</xDescServ>${cNbsClean ? `\n        <cNBS>${cNbsClean}</cNBS>` : ''}
      </cServ>${xmlConstrucaoCivil}${xmlInfComp}
    </serv>
    <valores>
      <vServPrest>
        <vServ>${vServ.toFixed(2)}</vServ>
      </vServPrest>${vDescIncond > 0 ? `\n      <vDescIncond>${vDescIncond.toFixed(2)}</vDescIncond>` : ''}${vDed > 0 ? `\n      <vDed>${vDed.toFixed(2)}</vDed>` : ''}
      <trib>
        <tribMun>
          <tribISSQN>${tribIssqn}</tribISSQN>${(pAliq > 0 && isTributavel && (opSimpNac == 1 || regApTribSN == 2 || issRetido)) ? `\n          <pAliq>${pAliq.toFixed(2)}</pAliq>` : ''}
          <tpRetISSQN>${tpRetIssqn}</tpRetISSQN>
        </tribMun>${xmlTribFed}
        <totTrib>
          <pTotTribSN>${pTotTribSN.toFixed(2)}</pTotTribSN>
        </totTrib>
      </trib>
    </valores>
  </infDPS>
</DPS>`;

    return {
      dpsId,
      xml,
      chaveAcesso,
      valores: {
        vServ,
        vDescIncond,
        vDescCond,
        vDed,
        vBcIss,
        pAliq,
        tribIssqn,
        tpRetIssqn,
        vIss,
        issRetido,
        vIssRet,
        vPis,
        vCofins,
        vInss,
        vIr,
        vCsll,
        vOutrasRet,
        pTotTribSN,
        totalRetencoes,
        vLiquido
      },
      resumo: {
        prestadorCnpj: this.formatDoc(prestCnpj, 'CNPJ'),
        prestadorNome: data.prestadorRazaoSocial,
        tomadorDoc: this.formatDoc(tomaDoc, tomaTipoDoc),
        tomadorNome: data.tomadorNome,
        numeroDps: nDpsNum,
        serie: parseInt(serie, 10),
        cTribNac: cTribNacClean,
        dataCompetencia: dCompet,
        dataEmissao: dhEmi
      }
    };
  }

  /**
   * Validações de regras essenciais
   */
  validateDpsInput(data) {
    const errors = [];
    const prestCnpj = (data.prestadorCnpj || '').replace(/\D/g, '');
    if (!prestCnpj || prestCnpj.length !== 14) {
      errors.push('CNPJ da empresa representada deve ter exatamente 14 dígitos numéricos.');
    }

    const tomaDoc = (data.tomadorDoc || '').replace(/\D/g, '');
    if (!tomaDoc || (tomaDoc.length !== 11 && tomaDoc.length !== 14)) {
      errors.push('Documento do tomador deve ser um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.');
    }

    const vServ = parseFloat(data.valorServico);
    if (isNaN(vServ) || vServ <= 0) {
      errors.push('Valor do serviço prestado deve ser maior que zero (ex: 1500.00).');
    }

    const vDescIncond = parseFloat(data.descontoIncondicionado || 0);
    const vDed = parseFloat(data.valorDeducoes || 0);
    if (vDescIncond + vDed > vServ) {
      errors.push('A soma dos descontos incondicionados e deduções não pode ultrapassar o valor total dos serviços.');
    }

    const pAliq = parseFloat(data.aliquotaIss !== undefined && data.aliquotaIss !== '' ? data.aliquotaIss : 0);
    const issRetido = Boolean(data.issRetido || data.retencaoIss === 'sim' || data.tipoRetencaoIss === 2 || data.tipoRetencaoIss === 3);
    if (issRetido && (isNaN(pAliq) || pAliq < 1.8 || pAliq > 5.0)) {
      errors.push('Quando há retenção do ISSQN na fonte, é obrigatório informar alíquota entre 1,80% e 5,00% (conforme art. 21 da LC 123/2006).');
    } else if (isNaN(pAliq) || pAliq < 0 || pAliq > 5.0) {
      errors.push('Alíquota do ISS deve ser entre 0% e 5,00% conforme a legislação brasileira.');
    }

    if (!data.descricaoServico || data.descricaoServico.trim().length < 5) {
      errors.push('Descrição dos serviços deve conter no mínimo 5 caracteres informando a atividade prestada.');
    }

    return errors;
  }

  /**
   * Gera a Chave de Acesso Nacional de 50 dígitos da NFS-e
   * Formato oficial CGNFS-e / ADN:
   * [cMun:7][tpAmb:1][tpInsc:1][CNPJ:14][AAMM:4][Serie:5][NumeroDPS:10][CodigoAleatorio:7][DV:1] (Total: 50 dígitos)
   */
  generateChaveAcessoNfse({ cMun, tpAmb, prestCnpj, serie, nDps, dataEmissao }) {
    const mun = String(cMun || '3550308').padStart(7, '0').slice(-7);
    const amb = String(tpAmb || '3').slice(-1);
    const tpInsc = '1'; // 1 = CNPJ
    const cnpj = String(prestCnpj || '').replace(/\D/g, '').padStart(14, '0').slice(-14);
    
    // AAMM da competência ou emissão (ex: 2611)
    const d = dataEmissao ? new Date(dataEmissao) : new Date();
    const aamm = `${String(d.getFullYear()).slice(-2)}${String(d.getMonth() + 1).padStart(2, '0')}`;
    
    const ser = String(serie || '1').padStart(5, '0').slice(-5);
    const num = String(nDps || '1').padStart(10, '0').slice(-10);
    const cAleat = String(Math.floor(1000000 + Math.random() * 9000000)).slice(0, 7);

    const base49 = `${mun}${amb}${tpInsc}${cnpj}${aamm}${ser}${num}${cAleat}`;
    const dv = this.calculateModulo11(base49);
    return `${base49}${dv}`;
  }

  /**
   * Cálculo de Dígito Verificador Módulo 11 da Receita Federal
   */
  calculateModulo11(chave49) {
    let soma = 0;
    let peso = 2;
    for (let i = chave49.length - 1; i >= 0; i--) {
      soma += parseInt(chave49[i], 10) * peso;
      peso = peso < 9 ? peso + 1 : 2;
    }
    const resto = soma % 11;
    const dv = 11 - resto;
    return (dv === 0 || dv === 1 || dv > 9) ? 0 : dv;
  }

  escapeXml(unsafe) {
    if (!unsafe) return '';
    return unsafe.toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Retorna a data/hora no fuso horário oficial de Brasília (UTC-3)
   * Aplica margem de segurança de 60 segundos para evitar rejeição E0008 (skew de relógio com a RFB)
   */
  getBrasiliaIsoString(baseDate = new Date()) {
    const pad = n => String(n).padStart(2, '0');
    const d = new Date(baseDate.getTime() - 60000);
    const brTime = new Date(d.getTime() - 3 * 3600000);
    return `${brTime.getUTCFullYear()}-${pad(brTime.getUTCMonth() + 1)}-${pad(brTime.getUTCDate())}T${pad(brTime.getUTCHours())}:${pad(brTime.getUTCMinutes())}:${pad(brTime.getUTCSeconds())}-03:00`;
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

module.exports = new DpsService();
