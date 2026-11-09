/**
 * Serviço de Inteligência Fiscal: Fechamento Fiscal Mensal & RBT12 (Simples Nacional)
 * Bazilio Contabilidade - Emissor Nacional NFS-e ADN
 */

const AdmZip = require('adm-zip');
const storageService = require('./storageService');

// Tabelas Oficiais do Simples Nacional - LC 123/2006 (Serviços: Anexo III, IV e V)
const SIMPLES_FAIXAS = [
  {
    faixa: 1,
    descricao: '1ª Faixa - Até R$ 180.000,00',
    de: 0,
    ate: 180000.00,
    anexo3: { aliqNominal: 0.0600, deducao: 0 },
    anexo4: { aliqNominal: 0.0450, deducao: 0 },
    anexo5: { aliqNominal: 0.1550, deducao: 0 }
  },
  {
    faixa: 2,
    descricao: '2ª Faixa - De R$ 180.000,01 a R$ 360.000,00',
    de: 180000.01,
    ate: 360000.00,
    anexo3: { aliqNominal: 0.1120, deducao: 9360.00 },
    anexo4: { aliqNominal: 0.0900, deducao: 8100.00 },
    anexo5: { aliqNominal: 0.1800, deducao: 4500.00 }
  },
  {
    faixa: 3,
    descricao: '3ª Faixa - De R$ 360.000,01 a R$ 720.000,00',
    de: 360000.01,
    ate: 720000.00,
    anexo3: { aliqNominal: 0.1350, deducao: 17640.00 },
    anexo4: { aliqNominal: 0.1020, deducao: 12420.00 },
    anexo5: { aliqNominal: 0.1950, deducao: 9900.00 }
  },
  {
    faixa: 4,
    descricao: '4ª Faixa - De R$ 720.000,01 a R$ 1.800.000,00',
    de: 720000.01,
    ate: 1800000.00,
    anexo3: { aliqNominal: 0.1600, deducao: 35640.00 },
    anexo4: { aliqNominal: 0.1400, deducao: 39780.00 },
    anexo5: { aliqNominal: 0.2050, deducao: 17100.00 }
  },
  {
    faixa: 5,
    descricao: '5ª Faixa - De R$ 1.800.000,01 a R$ 3.600.000,00',
    de: 1800000.01,
    ate: 3600000.00,
    anexo3: { aliqNominal: 0.2100, deducao: 125640.00 },
    anexo4: { aliqNominal: 0.2200, deducao: 183780.00 },
    anexo5: { aliqNominal: 0.2300, deducao: 62100.00 }
  },
  {
    faixa: 6,
    descricao: '6ª Faixa - De R$ 3.600.000,01 a R$ 4.800.000,00',
    de: 3600000.01,
    ate: 4800000.00,
    anexo3: { aliqNominal: 0.3300, deducao: 648000.00 },
    anexo4: { aliqNominal: 0.3300, deducao: 828000.00 },
    anexo5: { aliqNominal: 0.3050, deducao: 540000.00 }
  }
];

const SUBLIMITE_ESTADUAL = 3600000.00; // R$ 3,6 milhões
const LIMITE_GERAL_SIMPLES = 4800000.00; // R$ 4,8 milhões

class FiscalService {
  /**
   * Extrai o CNPJ limpo e obtém os dados do prestador
   */
  _getPrestadorInfo(cnpjRaw) {
    const clean = (cnpjRaw || '').replace(/\D/g, '');
    const companies = storageService.getCompanies();
    const found = companies.find(c => (c.cnpjRaw || c.cnpj || '').replace(/\D/g, '') === clean);
    
    if (found) {
      return {
        cnpj: found.cnpj || clean,
        cnpjRaw: clean,
        razaoSocial: found.razaoSocial || 'EMPRESA REPRESENTADA',
        nomeFantasia: found.nomeFantasia || '',
        municipio: found.municipioNome || found.municipio || 'Aracaju',
        uf: found.uf || 'SE',
        regimeTributario: found.regimeTributario || 1 // 1 = Simples Nacional
      };
    }

    // Se for o escritório próprio da Bazilio
    if (clean === '12627708000156') {
      return {
        cnpj: '12.627.708/0001-56',
        cnpjRaw: '12627708000156',
        razaoSocial: 'BAZILIO CONTABILIDADE LTDA',
        nomeFantasia: 'BAZILIO CONTABILIDADE',
        municipio: 'Aracaju',
        uf: 'SE',
        regimeTributario: 1
      };
    }

    return {
      cnpj: clean,
      cnpjRaw: clean,
      razaoSocial: 'EMPRESA REPRESENTADA',
      nomeFantasia: '',
      municipio: 'Aracaju',
      uf: 'SE',
      regimeTributario: 1
    };
  }

  /**
   * Obtém a lista normalizada de notas de um prestador
   */
  _getNotesForPrestador(cnpjRaw) {
    const clean = (cnpjRaw || '').replace(/\D/g, '');
    const history = storageService._getHistoryRaw();
    return history.filter(n => {
      const pCnpj = (n.prestador?.cnpjRaw || n.prestador?.cnpj || '').replace(/\D/g, '');
      return pCnpj === clean;
    });
  }

  /**
   * Normaliza os valores de uma nota fiscal para apuração fiscal
   */
  _normalizeNoteValores(note) {
    const v = note.valores || {};
    const valorServico = Number(v.valorServico ?? v.vServ ?? 0);
    const descIncond = Number(v.descontos?.incondicionado ?? v.vDescIncond ?? 0);
    const descCond = Number(v.descontos?.condicionado ?? v.vDescCond ?? 0);
    const deducoes = Number(v.deducoes ?? v.vDed ?? 0);
    const baseCalculo = Number(v.baseCalculo ?? v.vBcIss ?? Math.max(0, valorServico - descIncond - deducoes));

    // ISS
    const issObj = v.iss || {};
    const issRetido = Boolean(v.issRetido || v.tpRetIssqn === 2 || v.tpRetIssqn === 3 || issObj.retido || v.vISSRet > 0);
    const aliqIss = Number(issObj.aliquota ?? v.pAliq ?? 0);
    const valorIss = Number(issObj.valorIss ?? v.vIss ?? (baseCalculo * (aliqIss / 100)));
    const valorIssRetido = issRetido ? Number(issObj.valorRetido ?? v.vISSRet ?? valorIss) : 0;
    const valorIssProprio = issRetido ? 0 : valorIss;

    // Retenções Federais
    const retFed = v.retencoesFederais || {};
    const retIr = Number(retFed.irrf ?? v.retIr ?? v.vIRRF ?? 0);
    const retPis = Number(retFed.pis ?? v.retPis ?? v.vPIS ?? 0);
    const retCofins = Number(retFed.cofins ?? v.retCofins ?? v.vCOFINS ?? 0);
    const retCsll = Number(retFed.csll ?? v.retCsll ?? v.vCSLL ?? 0);
    const retInss = Number(retFed.inss ?? v.retInss ?? v.vINSS ?? 0);
    const retContrSociais = Number(retFed.contrSociais ?? v.retContrSociais ?? (retPis + retCofins + retCsll));
    const totalRetFederais = retIr + retPis + retCofins + retCsll + retInss;

    // Valor Líquido
    const valorLiquido = Number(v.valorLiquido ?? Math.max(0, valorServico - descIncond - valorIssRetido - totalRetFederais));

    // Tributos Aproximados (Lei 12.741/2012)
    const tribAprox = Number(v.tributosAproximados?.total ?? v.vTotTrib ?? 0);

    return {
      valorServico,
      descIncond,
      descCond,
      deducoes,
      baseCalculo,
      aliqIss,
      issRetido,
      valorIss,
      valorIssRetido,
      valorIssProprio,
      retIr,
      retPis,
      retCofins,
      retCsll,
      retContrSociais,
      retInss,
      totalRetFederais,
      valorLiquido,
      tribAprox
    };
  }

  /**
   * Extrai a competência (YYYY-MM) de uma nota fiscal
   */
  _getCompetencia(note) {
    if (note.competencia && typeof note.competencia === 'string' && note.competencia.length >= 7) {
      return note.competencia.substring(0, 7);
    }
    if (note.dataCompetencia && typeof note.dataCompetencia === 'string' && note.dataCompetencia.length >= 7) {
      return note.dataCompetencia.substring(0, 7);
    }
    if (note.dataEmissao && typeof note.dataEmissao === 'string' && note.dataEmissao.length >= 7) {
      return note.dataEmissao.substring(0, 7);
    }
    return new Date().toISOString().substring(0, 7);
  }

  /**
   * Relatório de Fechamento Fiscal Mensal por Prestador e Competência (YYYY-MM)
   */
  getMonthlyClosing(cnpjRaw, targetComp = null) {
    const prestador = this._getPrestadorInfo(cnpjRaw);
    const notes = this._getNotesForPrestador(cnpjRaw);

    // Identifica todos os meses disponíveis com notas para esse prestador
    const availableMonthsSet = new Set();
    notes.forEach(n => {
      const c = this._getCompetencia(n);
      if (c) availableMonthsSet.add(c);
    });

    const mesesDisponiveis = Array.from(availableMonthsSet).sort().reverse();

    // Se não informou competência, usa a mais recente com notas ou o mês atual
    const competencia = targetComp || (mesesDisponiveis.length > 0 ? mesesDisponiveis[0] : new Date().toISOString().substring(0, 7));

    // Filtra notas da competência
    const notesInMonth = notes.filter(n => this._getCompetencia(n) === competencia);

    // Totais acumulados da competência
    let qtdTotal = notesInMonth.length;
    let qtdAutorizadas = 0;
    let qtdCanceladas = 0;

    let totalFaturado = 0;
    let totalDescIncond = 0;
    let totalBaseCalculo = 0;
    let totalIssProprio = 0;
    let totalIssRetido = 0;
    let totalIr = 0;
    let totalPis = 0;
    let totalCofins = 0;
    let totalCsll = 0;
    let totalContrSociais = 0;
    let totalInss = 0;
    let totalRetencoesFederais = 0;
    let totalLiquido = 0;
    let totalTribAprox = 0;

    const detalheNotas = notesInMonth.map(n => {
      const status = n.status || 'AUTORIZADA';
      const isAutorizada = status === 'AUTORIZADA';
      const valores = this._normalizeNoteValores(n);

      if (isAutorizada) {
        qtdAutorizadas++;
        totalFaturado += valores.valorServico;
        totalDescIncond += valores.descIncond;
        totalBaseCalculo += valores.baseCalculo;
        totalIssProprio += valores.valorIssProprio;
        totalIssRetido += valores.valorIssRetido;
        totalIr += valores.retIr;
        totalPis += valores.retPis;
        totalCofins += valores.retCofins;
        totalCsll += valores.retCsll;
        totalContrSociais += valores.retContrSociais;
        totalInss += valores.retInss;
        totalRetencoesFederais += valores.totalRetFederais;
        totalLiquido += valores.valorLiquido;
        totalTribAprox += valores.tribAprox;
      } else {
        qtdCanceladas++;
      }

      const tomadorDoc = n.tomador?.cnpj || n.tomador?.cpf || n.tomador?.doc || n.tomador?.cnpjRaw || 'Não informado';
      const tomadorNome = n.tomador?.razaoSocial || n.tomador?.nome || 'Tomador';

      return {
        id: n.id || n.chaveAcesso,
        chaveAcesso: n.chaveAcesso || '',
        numeroNfse: n.numeroNfse || '-',
        numeroDps: n.numeroDps || '-',
        serie: n.serie || '00001',
        dataEmissao: n.dataEmissao || n.createdAt || '',
        competencia: this._getCompetencia(n),
        status,
        tomador: {
          doc: tomadorDoc,
          nome: tomadorNome,
          municipio: n.tomador?.municipio || '',
          uf: n.tomador?.uf || ''
        },
        servico: {
          descricao: n.servico?.discriminacao || n.servico?.descricao || 'Prestação de Serviços',
          cTribNac: n.servico?.cTribNac || '',
          itemNbs: n.servico?.itemNbs || ''
        },
        valores
      };
    });

    // Ordena do mais recente para o mais antigo por número ou data
    detalheNotas.sort((a, b) => {
      const numA = Number(a.numeroNfse) || 0;
      const numB = Number(b.numeroNfse) || 0;
      return numB - numA;
    });

    // Formata competência amigável (MM/AAAA)
    const [ano, mes] = competencia.split('-');
    const competenciaFormatada = `${mes}/${ano}`;

    return {
      prestador,
      competencia,
      competenciaFormatada,
      mesesDisponiveis,
      totais: {
        qtdTotal,
        qtdAutorizadas,
        qtdCanceladas,
        totalFaturado: Math.round(totalFaturado * 100) / 100,
        totalDescIncond: Math.round(totalDescIncond * 100) / 100,
        totalBaseCalculo: Math.round(totalBaseCalculo * 100) / 100,
        totalIssProprio: Math.round(totalIssProprio * 100) / 100,
        totalIssRetido: Math.round(totalIssRetido * 100) / 100,
        totalIssTotal: Math.round((totalIssProprio + totalIssRetido) * 100) / 100,
        totalIr: Math.round(totalIr * 100) / 100,
        totalPis: Math.round(totalPis * 100) / 100,
        totalCofins: Math.round(totalCofins * 100) / 100,
        totalCsll: Math.round(totalCsll * 100) / 100,
        totalContrSociais: Math.round(totalContrSociais * 100) / 100,
        totalInss: Math.round(totalInss * 100) / 100,
        totalRetencoesFederais: Math.round(totalRetencoesFederais * 100) / 100,
        totalLiquido: Math.round(totalLiquido * 100) / 100,
        totalTribAprox: Math.round(totalTribAprox * 100) / 100
      },
      notas: detalheNotas
    };
  }

  /**
   * Cálculo Inteligente da RBT12 (Simples Nacional - LC 123/2006)
   * Receita Bruta Acumulada nos 12 meses anteriores à competência
   */
  getRbt12(cnpjRaw, targetComp = null) {
    const prestador = this._getPrestadorInfo(cnpjRaw);
    const notes = this._getNotesForPrestador(cnpjRaw).filter(n => (n.status || 'AUTORIZADA') === 'AUTORIZADA');

    // Determina a competência de referência (padrão: mês corrente)
    const refComp = targetComp || new Date().toISOString().substring(0, 7);
    const [refAno, refMes] = refComp.split('-').map(Number);

    // Gera a lista dos 12 meses anteriores estritos (ex: para 11/2026, de 11/2025 a 10/2026)
    const meses12Anteriores = [];
    for (let i = 12; i >= 1; i--) {
      let m = refMes - i;
      let a = refAno;
      while (m <= 0) {
        m += 12;
        a -= 1;
      }
      const compStr = `${a}-${String(m).padStart(2, '0')}`;
      meses12Anteriores.push(compStr);
    }

    // Também prepara a lista dos 12 meses móveis finalizados até a competência de referência (incluindo ela)
    const meses12Moveis = [];
    for (let i = 11; i >= 0; i--) {
      let m = refMes - i;
      let a = refAno;
      while (m <= 0) {
        m += 12;
        a -= 1;
      }
      const compStr = `${a}-${String(m).padStart(2, '0')}`;
      meses12Moveis.push(compStr);
    }

    // Agrupa faturamento e quantidade de notas por mês
    const faturamentoPorMes = {};
    notes.forEach(n => {
      const c = this._getCompetencia(n);
      if (!c) return;
      if (!faturamentoPorMes[c]) {
        faturamentoPorMes[c] = { faturamento: 0, count: 0 };
      }
      const val = Number(n.valores?.valorServico || n.valores?.vServ || 0);
      faturamentoPorMes[c].faturamento += val;
      faturamentoPorMes[c].count += 1;
    });

    // Soma RBT12 oficial (12 meses anteriores)
    let rbt12Oficial = 0;
    const mesesDetalhadosAnteriores = meses12Anteriores.map(mStr => {
      const data = faturamentoPorMes[mStr] || { faturamento: 0, count: 0 };
      const fat = Math.round(data.faturamento * 100) / 100;
      rbt12Oficial += fat;
      const [ano, mes] = mStr.split('-');
      return {
        competencia: mStr,
        competenciaFormatada: `${mes}/${ano}`,
        faturamento: fat,
        qtdNotas: data.count
      };
    });
    rbt12Oficial = Math.round(rbt12Oficial * 100) / 100;

    // Soma RBT12 móvel (incluindo o mês atual)
    let rbt12Movel = 0;
    const mesesDetalhadosMoveis = meses12Moveis.map(mStr => {
      const data = faturamentoPorMes[mStr] || { faturamento: 0, count: 0 };
      const fat = Math.round(data.faturamento * 100) / 100;
      rbt12Movel += fat;
      const [ano, mes] = mStr.split('-');
      return {
        competencia: mStr,
        competenciaFormatada: `${mes}/${ano}`,
        faturamento: fat,
        qtdNotas: data.count,
        percentualRbt12: 0
      };
    });
    rbt12Movel = Math.round(rbt12Movel * 100) / 100;

    // Calcula % de participação de cada mês no RBT12 móvel
    mesesDetalhadosMoveis.forEach(m => {
      m.percentualRbt12 = rbt12Movel > 0 ? Math.round((m.faturamento / rbt12Movel) * 1000) / 10 : 0;
    });

    // Encontra a Faixa correspondente na Tabela da LC 123/2006 (usa rbt12Oficial se > 0, senão rbt12Movel)
    const baseRbt = rbt12Oficial > 0 ? rbt12Oficial : rbt12Movel;
    const faixaObj = SIMPLES_FAIXAS.find(f => baseRbt <= f.ate) || SIMPLES_FAIXAS[SIMPLES_FAIXAS.length - 1];

    // Calcula Alíquota Efetiva do Simples Nacional:
    // Alíquota Efetiva = [(RBT12 * Alíquota Nominal) - Parcela a Deduzir] / RBT12
    const calcAliqEfetiva = (aliqNominal, deducao) => {
      if (baseRbt <= 0) return (aliqNominal * 100).toFixed(2) + '%';
      if (baseRbt <= 180000) return (aliqNominal * 100).toFixed(2) + '%';
      const efetiva = (((baseRbt * aliqNominal) - deducao) / baseRbt) * 100;
      return Math.max(0, efetiva).toFixed(2) + '%';
    };

    const aliqEfetivaAnexo3 = calcAliqEfetiva(faixaObj.anexo3.aliqNominal, faixaObj.anexo3.deducao);
    const aliqEfetivaAnexo4 = calcAliqEfetiva(faixaObj.anexo4.aliqNominal, faixaObj.anexo4.deducao);
    const aliqEfetivaAnexo5 = calcAliqEfetiva(faixaObj.anexo5.aliqNominal, faixaObj.anexo5.deducao);

    // Sublimite Estadual (R$ 3.600.000,00)
    const percSublimite = Math.min(100, Math.round((baseRbt / SUBLIMITE_ESTADUAL) * 1000) / 10);
    const saldoSublimite = Math.max(0, Math.round((SUBLIMITE_ESTADUAL - baseRbt) * 100) / 100);
    let statusSublimite = 'ok';
    if (percSublimite >= 100) statusSublimite = 'estourado';
    else if (percSublimite >= 80) statusSublimite = 'alerta';

    // Limite Geral Simples Nacional (R$ 4.800.000,00)
    const percLimiteGeral = Math.min(100, Math.round((baseRbt / LIMITE_GERAL_SIMPLES) * 1000) / 10);
    const saldoLimiteGeral = Math.max(0, Math.round((LIMITE_GERAL_SIMPLES - baseRbt) * 100) / 100);
    let statusLimiteGeral = 'ok';
    if (percLimiteGeral >= 100) statusLimiteGeral = 'estourado';
    else if (percLimiteGeral >= 80) statusLimiteGeral = 'alerta';

    return {
      prestador,
      competenciaReferencia: refComp,
      rbt12Oficial,
      rbt12Movel,
      faixa: {
        numero: faixaObj.faixa,
        descricao: faixaObj.descricao,
        limiteMin: faixaObj.de,
        limiteMax: faixaObj.ate,
        anexo3: {
          aliqNominal: (faixaObj.anexo3.aliqNominal * 100).toFixed(2) + '%',
          aliqEfetiva: aliqEfetivaAnexo3
        },
        anexo4: {
          aliqNominal: (faixaObj.anexo4.aliqNominal * 100).toFixed(2) + '%',
          aliqEfetiva: aliqEfetivaAnexo4
        },
        anexo5: {
          aliqNominal: (faixaObj.anexo5.aliqNominal * 100).toFixed(2) + '%',
          aliqEfetiva: aliqEfetivaAnexo5
        }
      },
      sublimiteEstadual: {
        limite: SUBLIMITE_ESTADUAL,
        consumido: baseRbt,
        percentual: percSublimite,
        saldoRestante: saldoSublimite,
        status: statusSublimite
      },
      limiteGeral: {
        limite: LIMITE_GERAL_SIMPLES,
        consumido: baseRbt,
        percentual: percLimiteGeral,
        saldoRestante: saldoLimiteGeral,
        status: statusLimiteGeral
      },
      historicoMeses: mesesDetalhadosMoveis
    };
  }

  /**
   * Gera relatório CSV no padrão brasileiro (delimitador ponto e vírgula, vírgula decimal)
   * Compatível diretamente com Excel e sistemas contábeis (Domínio, Questor, Fortes, Alterdata)
   */
  generateClosingCsv(cnpjRaw, competencia) {
    const closing = this.getMonthlyClosing(cnpjRaw, competencia);
    const p = closing.prestador;
    const t = closing.totais;

    const fmtNum = (n) => Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const lines = [];

    // Cabeçalho da Empresa & Competência
    lines.push(`FECHAMENTO FISCAL MENSAL - BAZILIO CONTABILIDADE`);
    lines.push(`EMPRESA;${p.razaoSocial}`);
    lines.push(`CNPJ;${p.cnpj}`);
    lines.push(`MUNICÍPIO / UF;${p.municipio} / ${p.uf}`);
    lines.push(`COMPETÊNCIA;${closing.competenciaFormatada}`);
    lines.push(`DATA DE GERAÇÃO;${new Date().toLocaleString('pt-BR')}`);
    lines.push(``);

    // Resumo Consolidado
    lines.push(`RESUMO FISCAL DA COMPETÊNCIA`);
    lines.push(`Total de Notas Autorizadas;${t.qtdAutorizadas}`);
    lines.push(`Total de Notas Canceladas;${t.qtdCanceladas}`);
    lines.push(`Faturamento Bruto Total (R$);${fmtNum(t.totalFaturado)}`);
    lines.push(`Descontos Incondicionados (R$);${fmtNum(t.totalDescIncond)}`);
    lines.push(`Base de Cálculo Efetiva (R$);${fmtNum(t.totalBaseCalculo)}`);
    lines.push(`ISS Devido Próprio (R$);${fmtNum(t.totalIssProprio)}`);
    lines.push(`ISS Retido na Fonte pelo Tomador (R$);${fmtNum(t.totalIssRetido)}`);
    lines.push(`Total Geral de ISS (R$);${fmtNum(t.totalIssTotal)}`);
    lines.push(`IRRF Retido na Fonte (R$);${fmtNum(t.totalIr)}`);
    lines.push(`CSRF Retido (PIS/COFINS/CSLL) (R$);${fmtNum(t.totalContrSociais)}`);
    lines.push(`INSS Retido na Fonte (R$);${fmtNum(t.totalInss)}`);
    lines.push(`Total de Retenções Federais a Compensar (R$);${fmtNum(t.totalRetencoesFederais)}`);
    lines.push(`Valor Líquido Recebido (R$);${fmtNum(t.totalLiquido)}`);
    lines.push(``);

    // Tabela Detalhada Nota a Nota
    lines.push(`NFS-e;DPS;Série;Emissão;Tomador CNPJ/CPF;Tomador Nome;Serviço;Valor do Serviço;Desconto;Base de Cálculo;Alíq ISS (%);ISS Retido?;ISS Tomador;ISS Próprio;IRRF;CSRF;INSS;Total Ret. Federais;Valor Líquido;Status`);

    closing.notas.forEach(n => {
      const v = n.valores;
      const row = [
        n.numeroNfse,
        n.numeroDps,
        n.serie,
        n.dataEmissao ? n.dataEmissao.substring(0, 10) : '',
        `"${n.tomador.doc}"`,
        `"${n.tomador.nome.replace(/"/g, '""')}"`,
        `"${n.servico.descricao.replace(/[\n\r]+/g, ' ').replace(/"/g, '""').substring(0, 100)}"`,
        fmtNum(v.valorServico),
        fmtNum(v.descIncond),
        fmtNum(v.baseCalculo),
        fmtNum(v.aliqIss),
        v.issRetido ? 'SIM' : 'NÃO',
        fmtNum(v.valorIssRetido),
        fmtNum(v.valorIssProprio),
        fmtNum(v.retIr),
        fmtNum(v.retContrSociais),
        fmtNum(v.retInss),
        fmtNum(v.totalRetFederais),
        fmtNum(v.valorLiquido),
        n.status
      ];
      lines.push(row.join(';'));
    });

    // Retorna string com UTF-8 BOM (\uFEFF) para abrir com acentuação perfeita no Microsoft Excel
    return '\uFEFF' + lines.join('\r\n');
  }

  /**
   * Gera arquivo ZIP contendo:
   * 1. Pasta XMLs com todos os arquivos XML oficiais das NFS-e da competência
   * 2. Planilha CSV de fechamento fiscal
   * 3. Relatório de auditoria em TXT
   */
  generateClosingZip(cnpjRaw, competencia) {
    const closing = this.getMonthlyClosing(cnpjRaw, competencia);
    const p = closing.prestador;
    const t = closing.totais;
    const history = storageService._getHistoryRaw();

    const zip = new AdmZip();

    // 1. Gera e inclui os XMLs individuais
    const cleanPrestCnpj = p.cnpjRaw;
    closing.notas.forEach(n => {
      if (n.status !== 'AUTORIZADA') return;
      
      // Busca o registro completo no histórico para pegar o XML assinado
      const full = history.find(h => h.chaveAcesso === n.chaveAcesso || h.id === n.id);
      const xml = full?.xmlAssinado || full?.xmlCompleto || null;
      if (xml) {
        const fileName = `NFSe_${n.numeroNfse || n.numeroDps}_Chave_${n.chaveAcesso || n.id}.xml`;
        zip.addFile(`XMLs/${fileName}`, Buffer.from(xml, 'utf8'));
      }
    });

    // 2. Inclui o arquivo CSV detalhado de fechamento
    const csvContent = this.generateClosingCsv(cnpjRaw, competencia);
    zip.addFile(`fechamento_fiscal_${p.cnpjRaw}_${closing.competencia}.csv`, Buffer.from(csvContent, 'utf8'));

    // 3. Inclui um resumo executivo em TXT
    const txtResumo = [
      `========================================================================`,
      `              EXTRATO DE FECHAMENTO FISCAL MENSAL                       `,
      `                     BAZILIO CONTABILIDADE                              `,
      `========================================================================`,
      `Prestador: ${p.razaoSocial}`,
      `CNPJ: ${p.cnpj}`,
      `Município / UF: ${p.municipio} / ${p.uf}`,
      `Competência: ${closing.competenciaFormatada}`,
      `Data de Apuração: ${new Date().toLocaleString('pt-BR')}`,
      `------------------------------------------------------------------------`,
      `RESUMO DOS VALORES APURADOS:`,
      `  • Quantidade de NFS-e Autorizadas: ${t.qtdAutorizadas}`,
      `  • Quantidade de NFS-e Canceladas:  ${t.qtdCanceladas}`,
      `  • Faturamento Bruto (Serviços):    R$ ${t.totalFaturado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `  • Descontos Incondicionados:       R$ ${t.totalDescIncond.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `  • Base de Cálculo Efetiva:         R$ ${t.totalBaseCalculo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `  • ISS Próprio a Pagar:             R$ ${t.totalIssProprio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `  • ISS Retido na Fonte:             R$ ${t.totalIssRetido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `  • Retenções Federais a Compensar:  R$ ${t.totalRetencoesFederais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `      - IRRF: R$ ${t.totalIr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `      - CSRF (PIS/COFINS/CSLL): R$ ${t.totalContrSociais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `      - INSS: R$ ${t.totalInss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `  • Valor Líquido Efetivo:           R$ ${t.totalLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `========================================================================`
    ].join('\r\n');

    zip.addFile(`resumo_fechamento_${closing.competencia}.txt`, Buffer.from(txtResumo, 'utf8'));

    return zip.toBuffer();
  }
}

module.exports = new FiscalService();

