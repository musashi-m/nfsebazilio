/**
 * Serviço de Persistência Local (Arquivo JSON seguro em ./data/)
 * Mantém o histórico real das notas fiscais do ADN, empresas representadas cadastradas e configurações
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const BASE_DATA_DIR = path.join(__dirname, '../../data');
const DATA_DIR = isServerless ? path.join(os.tmpdir(), 'emissor_data') : BASE_DATA_DIR;

const NFSE_FILE = path.join(DATA_DIR, 'nfse_history.json');
const COMPANIES_FILE = path.join(DATA_DIR, 'companies.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const ADN_SYNC_FILE = path.join(DATA_DIR, 'adn_sync_state.json');
const TEMPLATES_FILE = path.join(DATA_DIR, 'emission_templates.json');

const VENDOR_BLOCKLIST = new Set([
  '13347016000117', // FACEBOOK
  '34052649000178', // CORA
  '39768096000178', // ACESSORIAS
  '06990590000123', // GOOGLE BRASIL
  '25012398000107', // GOOGLE CLOUD
  '13360276000122', // UNIMED
  '03916076000664', // ZUCCHETTI
  '64555626000147', // AO3
  '13673743000255', // BOM NEGOCIO (OLX)
  '13021784000186', // RD GESTAO (RD STATION)
  '01524509000104', // PELLI SISTEMAS
  '21730190000172', // PUGLISI
  '32313639000113', // SUPREMACY DIGITAL
  '04693497000121', // ZIPLINE
  '09199402000131', // GARCIA MORENO
  '45844225000162', // OLIVEIRA RESOLVE
  '44905104000110', // CLIMATIZACAO CENTRAL
  '43017958000106', // LIMP BEM
  '10956453000140', // OURO MODERNO
  '11056004000108', // ULTRA CURSOS
  '45437689000154', // MATE INCENDIO
  '29045626000104', // INFE INFORMACOES TRIBUTARIAS
  '59170974000166', // MATTIAZZO OFFICE FAROLANDIA
  '48888112000157', // MATTIAZZO OFFICE
  '53210705000108', // BELMONT & LUCAS
  '10704608000150', // ACESSE SERVICOS ESCRITORIO
  '32856932000127', // R PEREIRA COMERCIAL
  '51167412000151', // DANILO MELO
  '40634440000115', // ERCIO DE FARIAS
  '11550157000107', // CENTRO MEDICO DA RODOVIARIA
  '33331482000111', // CLEVER ASSESSORIA JURIDICA E COBRANCA
  '13158985000120', // CLIMEDI
  '50048588000121', // IDEEAS INSTITUTO DE ESTAGIO
  '21280462000180', // LICITANET
  '09502582000189', // MARCOS ANTONIO
  '01633121000133', // MOVEEDU
  '12345678000195'  // TEST
]);

class StorageService {
  constructor() {
    this.VENDOR_BLOCKLIST = VENDOR_BLOCKLIST;
    this._cachedHistory = null;
    this._historyMtime = 0;
    this._ensureDir();
    this._initSeedData();
  }

  _ensureDir() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (isServerless && fs.existsSync(BASE_DATA_DIR)) {
        const files = fs.readdirSync(BASE_DATA_DIR);
        for (const file of files) {
          const srcFile = path.join(BASE_DATA_DIR, file);
          const destFile = path.join(DATA_DIR, file);
          if (!fs.existsSync(destFile) && fs.statSync(srcFile).isFile()) {
            try { fs.copyFileSync(srcFile, destFile); } catch (_) {}
          }
        }
      }
    } catch (e) {
      console.warn('Aviso ao inicializar DATA_DIR:', e.message);
    }
  }

  _initSeedData() {
    // 1. Histórico de Notas (Inicia vazio - somente dados reais de emissões e sincronizações ADN)
    if (!fs.existsSync(NFSE_FILE)) {
      this._writeJson(NFSE_FILE, []);
    }

    // 2. Empresas Representadas Cadastradas (Inicia vazio - somente empresas reais cadastradas pelo usuário)
    if (!fs.existsSync(COMPANIES_FILE)) {
      this._writeJson(COMPANIES_FILE, []);
    }

    // 3. Configurações da Aplicação
    if (!fs.existsSync(SETTINGS_FILE)) {
      const initialSettings = {
        activeEnvironment: 'HOMOLOGACAO',
        preferDirectRfb: true, // Conexão direta mTLS com RFB prioritária
        fallbackToSerpro: true,
        serproConsumerKey: '',
        serproConsumerSecret: '',
        activeRepresentedCnpj: ''
      };
      this._writeJson(SETTINGS_FILE, initialSettings);
    }

    // 4. Modelos / Templates de Emissão de NFS-e
    if (!fs.existsSync(TEMPLATES_FILE)) {
      this._writeJson(TEMPLATES_FILE, []);
    }
  }

  _readJson(file, fallback = []) {
    try {
      if (!fs.existsSync(file)) return fallback;
      const data = fs.readFileSync(file, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      console.error(`Erro ao ler ${file}:`, e);
      return fallback;
    }
  }

  _writeJson(file, data) {
    try {
      fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (e) {
      console.error(`Erro ao salvar ${file}:`, e);
      return false;
    }
  }

  _getHistoryRaw() {
    try {
      if (!fs.existsSync(NFSE_FILE)) return [];
      const stat = fs.statSync(NFSE_FILE);
      if (this._cachedHistory && this._historyMtime === stat.mtimeMs) {
        return this._cachedHistory;
      }
      const data = fs.readFileSync(NFSE_FILE, 'utf8');
      this._cachedHistory = JSON.parse(data);
      this._historyMtime = stat.mtimeMs;
      return this._cachedHistory;
    } catch (e) {
      console.error(`Erro ao ler ${NFSE_FILE}:`, e);
      return this._cachedHistory || [];
    }
  }

  _writeHistory(data) {
    try {
      fs.writeFileSync(NFSE_FILE, JSON.stringify(data, null, 2), 'utf8');
      this._cachedHistory = data;
      try {
        const stat = fs.statSync(NFSE_FILE);
        this._historyMtime = stat.mtimeMs;
      } catch (_) {}
      return true;
    } catch (e) {
      console.error(`Erro ao salvar ${NFSE_FILE}:`, e);
      return false;
    }
  }

  // Normaliza retenção de ISS conforme padrão nacional (tpRetISSQN 2 ou 3)
  normalizeNoteRetention(item) {
    if (!item) return item;
    const xml = item.xmlCompleto || item.xmlAssinado || '';
    const tpRetMatch = xml.match(/<tpRetISSQN>([^<]+)<\/tpRetISSQN>/i);
    const tpRet = tpRetMatch ? tpRetMatch[1].trim() : null;
    const vTotRetMatch = xml.match(/<vTotalRet>([^<]+)<\/vTotalRet>/i);
    const vTotRet = vTotRetMatch ? parseFloat(vTotRetMatch[1]) : 0;
    const vIssMatch = xml.match(/<vISSQN>([^<]+)<\/vISSQN>/i);
    const vIss = vIssMatch ? parseFloat(vIssMatch[1]) : 0;

    const isRetido = (tpRet === '2' || tpRet === '3') ||
      (vTotRet > 0 && vIss > 0 && Math.abs(vTotRet - vIss) < 0.05) ||
      Boolean(item.valores?.iss?.retido || item.valores?.issRetido || item.valores?.vISSRet > 0);

    if (isRetido) {
      const vIssVal = item.valores?.iss?.valorIss || vIss || item.valores?.vISSQN || 0;
      const vRetVal = item.valores?.iss?.valorRetido || item.valores?.vISSRet || (vTotRet > 0 && vIssVal > 0 ? Math.min(vTotRet, vIssVal) : (vTotRet || vIssVal));
      return {
        ...item,
        valores: {
          ...(item.valores || {}),
          tpRetIssqn: parseInt(tpRet || '2', 10),
          issRetido: true,
          vISSRet: vRetVal,
          vTotalRet: item.valores?.vTotalRet || vTotRet || vIssVal,
          iss: {
            ...(item.valores?.iss || {}),
            retido: true,
            valorRetido: vRetVal
          }
        }
      };
    }
    return item;
  }

  // --- HISTÓRICO ADN / NFS-E ---
  getHistory(filters = {}) {
    let list = this._getHistoryRaw();

    // Garante consistência de notas com registro de cancelamento e retenção de ISS
    list = list.map(item => {
      let current = item;
      const isCancelled = current.status === 'CANCELADA' || Boolean(current.dataCancelamento) || Boolean(current.motivoCancelamento);
      if (isCancelled && current.status !== 'CANCELADA') {
        current = { ...current, status: 'CANCELADA' };
      }
      return this.normalizeNoteRetention(current);
    });

    // Filtro por CNPJ da empresa representada
    if (filters.prestadorCnpj) {
      const clean = filters.prestadorCnpj.replace(/\D/g, '');
      if (clean) {
        list = list.filter(item => {
          const prestadorCnpj = (item.prestador && item.prestador.cnpjRaw) || '';
          const tomadorDoc = (item.tomador && (item.tomador.docRaw || (item.tomador.doc && item.tomador.doc.replace(/\D/g, '')))) || '';
          
          if (filters.papel === 'EMITIDAS') {
            return prestadorCnpj.includes(clean);
          } else if (filters.papel === 'RECEBIDAS') {
            return tomadorDoc.includes(clean);
          } else {
            // Padrão: inclui tanto emitidas quanto recebidas pelo CNPJ
            return prestadorCnpj.includes(clean) || tomadorDoc.includes(clean);
          }
        });
      }
    }

    // Filtro por Ambiente (tolerante a maiúsculas/minúsculas e registros legados)
    if (filters.ambiente) {
      const ambNorm = String(filters.ambiente).toUpperCase();
      list = list.filter(item => {
        if (!item.ambiente) return true;
        return String(item.ambiente).toUpperCase() === ambNorm;
      });
    }

    // Filtro por Status
    if (filters.status) {
      list = list.filter(item => item.status === filters.status);
    }

    // Filtro por Busca Geral (Chave, Tomador, Número)
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(item => {
        return (
          (item.chaveAcesso && item.chaveAcesso.includes(q)) ||
          (item.numeroNfse && String(item.numeroNfse).includes(q)) ||
          (item.tomador && item.tomador.nome && item.tomador.nome.toLowerCase().includes(q)) ||
          (item.tomador && item.tomador.doc && item.tomador.doc.includes(q)) ||
          (item.prestador && item.prestador.razaoSocial && item.prestador.razaoSocial.toLowerCase().includes(q))
        );
      });
    }

    // Ordena mais recentes primeiro
    return list.sort((a, b) => new Date(b.dataEmissao || b.dataAutorizacao || 0) - new Date(a.dataEmissao || a.dataAutorizacao || 0));
  }

  saveNfse(nfseRecord) {
    const list = this._getHistoryRaw();
    const cleanChave = (nfseRecord.chaveAcesso || '').replace(/\D/g, '');
    const index = list.findIndex(item => {
      const itemClean = (item.chaveAcesso || '').replace(/\D/g, '');
      return (itemClean && itemClean === cleanChave) || item.chaveAcesso === nfseRecord.chaveAcesso;
    });
    if (index >= 0) {
      const existing = list[index];
      const isCancelled = existing.status === 'CANCELADA' || Boolean(existing.dataCancelamento) || Boolean(existing.motivoCancelamento) || nfseRecord.status === 'CANCELADA' || Boolean(nfseRecord.dataCancelamento);
      const finalStatus = isCancelled ? 'CANCELADA' : (nfseRecord.status || existing.status);
      list[index] = {
        ...existing,
        ...nfseRecord,
        status: finalStatus,
        dataCancelamento: existing.dataCancelamento || nfseRecord.dataCancelamento,
        motivoCancelamento: existing.motivoCancelamento || nfseRecord.motivoCancelamento,
        updatedAt: new Date().toISOString()
      };
    } else {
      list.unshift({ ...nfseRecord, createdAt: new Date().toISOString() });
    }
    this._writeHistory(list);
    return nfseRecord;
  }

  saveNfseBatch(records = []) {
    if (!records || records.length === 0) {
      const emptyRes = { addedOrUpdated: 0, novas: 0, atualizadas: 0 };
      emptyRes[Symbol.toPrimitive] = () => 0;
      emptyRes.valueOf = () => 0;
      return emptyRes;
    }
    const list = this._getHistoryRaw();
    const map = new Map();
    for (const item of list) {
      if (item.chaveAcesso) {
        const clean = item.chaveAcesso.replace(/\D/g, '');
        map.set(clean || item.chaveAcesso, item);
      }
    }

    let addedOrUpdated = 0;
    let novas = 0;
    let atualizadas = 0;
    for (const rec of records) {
      if (!rec || !rec.chaveAcesso) continue;
      const cleanKey = rec.chaveAcesso.replace(/\D/g, '') || rec.chaveAcesso;
      const existing = map.get(cleanKey);
      if (existing) {
        const isCancelled = existing.status === 'CANCELADA' || Boolean(existing.dataCancelamento) || Boolean(existing.motivoCancelamento) || rec.status === 'CANCELADA' || Boolean(rec.dataCancelamento);
        const finalStatus = isCancelled ? 'CANCELADA' : (rec.status || existing.status);
        map.set(cleanKey, {
          ...existing,
          ...rec,
          status: finalStatus,
          dataCancelamento: existing.dataCancelamento || rec.dataCancelamento,
          motivoCancelamento: existing.motivoCancelamento || rec.motivoCancelamento,
          updatedAt: new Date().toISOString()
        });
        atualizadas++;
      } else {
        map.set(cleanKey, { ...rec, createdAt: new Date().toISOString() });
        novas++;
      }
      addedOrUpdated++;
    }

    const merged = Array.from(map.values());
    this._writeHistory(merged);
    const result = { addedOrUpdated, novas, atualizadas };
    result[Symbol.toPrimitive] = () => addedOrUpdated;
    result.valueOf = () => addedOrUpdated;
    return result;
  }

  getNsuState(cnpj) {
    const clean = (cnpj || '').replace(/\D/g, '');
    const state = this._readJson(ADN_SYNC_FILE, {});
    return state[clean] || { ultNSU: 0, lastSync: null, totalDocumentos: 0 };
  }

  /**
   * Localiza tomador por documento (CPF ou CNPJ) no histórico, priorizando o prestador atual
   */
  findTomador(prestadorCnpj, doc) {
    const cleanPrest = (prestadorCnpj || '').replace(/\D/g, '');
    const cleanDoc = (doc || '').replace(/\D/g, '');
    if (!cleanDoc) return null;

    const list = this._getHistoryRaw();

    // 1. Tenta encontrar notas emitidas especificamente por este prestador
    let matches = [];
    let isSpecificPrestador = false;

    if (cleanPrest) {
      matches = list.filter(item => {
        const itemPrestCnpj = (item.prestador && (item.prestador.cnpjRaw || (item.prestador.cnpj && item.prestador.cnpj.replace(/\D/g, '')))) || '';
        if (itemPrestCnpj !== cleanPrest && !itemPrestCnpj.includes(cleanPrest)) return false;

        const itemTomadorDoc = (item.tomador && (item.tomador.docRaw || (item.tomador.doc && item.tomador.doc.replace(/\D/g, '')))) || '';
        return itemTomadorDoc === cleanDoc;
      });
      if (matches.length > 0) {
        isSpecificPrestador = true;
      }
    }

    // 2. Se não encontrou notas do prestador específico, busca em qualquer nota do histórico geral
    if (matches.length === 0) {
      matches = list.filter(item => {
        const itemTomadorDoc = (item.tomador && (item.tomador.docRaw || (item.tomador.doc && item.tomador.doc.replace(/\D/g, '')))) || '';
        return itemTomadorDoc === cleanDoc;
      });
    }

    if (matches.length === 0) return null;

    // Ordena decrescente pela mais recente
    matches.sort((a, b) => {
      const timeA = new Date(a.dataEmissao || a.dataAutorizacao || a.createdAt || 0).getTime();
      const timeB = new Date(b.dataEmissao || b.dataAutorizacao || b.createdAt || 0).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return (Number(b.numeroNfse) || 0) - (Number(a.numeroNfse) || 0);
    });

    const mostRecent = matches[0];
    const t = mostRecent.tomador || {};

    const getTag = (x, tag) => {
      const m = (x || '').match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
      return m ? m[1].trim() : '';
    };

    const xml = mostRecent.xmlCompleto || mostRecent.xmlAssinado || '';
    const tomaBlock = getTag(xml, 'toma');
    const endBlock = getTag(tomaBlock, 'end');
    const endNac = getTag(endBlock, 'endNac');

    const cleanCep = (t.cep || getTag(endNac, 'CEP') || getTag(endBlock, 'CEP') || '').replace(/\D/g, '');
    const cepFormatted = cleanCep.length === 8 ? cleanCep.replace(/^(\d{5})(\d{3})$/, '$1-$2') : cleanCep;
    const docFormatted = cleanDoc.length === 11 
      ? cleanDoc.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
      : cleanDoc.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');

    const munIbge = t.municipioIbge || getTag(endNac, 'cMun') || '';
    let uf = t.uf || getTag(endBlock, 'UF') || getTag(tomaBlock, 'UF') || '';
    if (!uf && munIbge && munIbge.length >= 2) {
      const ufCodes = {
        '11':'RO','12':'AC','13':'AM','14':'RR','15':'PA','16':'AP','17':'TO',
        '21':'MA','22':'PI','23':'CE','24':'RN','25':'PB','26':'PE','27':'AL','28':'SE','29':'BA',
        '31':'MG','32':'ES','33':'RJ','35':'SP',
        '41':'PR','42':'SC','43':'RS',
        '50':'MS','51':'MT','52':'GO','53':'DF'
      };
      uf = ufCodes[munIbge.slice(0, 2)] || 'SE';
    }

    return {
      source: isSpecificPrestador ? 'HISTORICO_PRESTADOR' : 'HISTORICO_SISTEMA',
      sourceLabel: isSpecificPrestador ? 'Histórico do Prestador' : 'Histórico do Sistema',
      tomador: {
        doc: docFormatted,
        docRaw: cleanDoc,
        tipoDoc: cleanDoc.length === 11 ? 'CPF' : 'CNPJ',
        nome: t.nome || getTag(tomaBlock, 'xNome') || '',
        im: t.im || getTag(tomaBlock, 'IM') || '',
        email: t.email || getTag(tomaBlock, 'email') || '',
        telefone: t.telefone || getTag(tomaBlock, 'fone') || '',
        cep: cepFormatted,
        logradouro: t.logradouro || getTag(endBlock, 'xLgr') || '',
        numero: t.numero || getTag(endBlock, 'nro') || 'S/N',
        complemento: t.complemento || getTag(endBlock, 'xCpl') || '',
        bairro: t.bairro || getTag(endBlock, 'xBairro') || '',
        municipio: t.municipio || getTag(endBlock, 'xMun') || getTag(tomaBlock, 'xMun') || '',
        municipioIbge: munIbge,
        uf: uf || 'SE'
      },
      sourceNfse: {
        numeroNfse: mostRecent.numeroNfse,
        numeroDps: mostRecent.numeroDps,
        dataEmissao: mostRecent.dataEmissao || mostRecent.dataAutorizacao || mostRecent.createdAt
      }
    };
  }

  saveNsuState(cnpj, data) {
    const clean = (cnpj || '').replace(/\D/g, '');
    const state = this._readJson(ADN_SYNC_FILE, {});
    state[clean] = {
      ...(state[clean] || {}),
      ...data,
      lastSync: new Date().toISOString()
    };
    this._writeJson(ADN_SYNC_FILE, state);
    return state[clean];
  }

  getNfseByChave(chave) {
    if (!chave) return null;
    const cleanChave = chave.replace(/\D/g, '');
    const list = this._getHistoryRaw();
    const found = list.find(item => {
      const itemClean = (item.chaveAcesso || '').replace(/\D/g, '');
      return (itemClean && itemClean === cleanChave) || item.chaveAcesso === chave || item.id === chave;
    });
    return found ? this.normalizeNoteRetention(found) : null;
  }

  updateNfseStatus(chave, status, motivoCancelamento = null) {
    if (!chave) return null;
    const cleanChave = chave.replace(/\D/g, '');
    const list = this._getHistoryRaw();
    const item = list.find(n => {
      const itemClean = (n.chaveAcesso || '').replace(/\D/g, '');
      return (itemClean && itemClean === cleanChave) || n.chaveAcesso === chave || n.id === chave;
    });
    if (item) {
      item.status = status;
      if (motivoCancelamento) {
        item.motivoCancelamento = motivoCancelamento;
        item.dataCancelamento = item.dataCancelamento || new Date().toISOString();
      }
      this._writeHistory(list);
      return item;
    }
    return null;
  }

  // --- EMPRESAS REPRESENTADAS ---
  getCompanies() {
    const list = this._readJson(COMPANIES_FILE, []);
    return list.filter(c => c.cnpjRaw && !this.VENDOR_BLOCKLIST.has(c.cnpjRaw));
  }

  cleanupVendorCompanies() {
    const list = this._readJson(COMPANIES_FILE, []);
    const cleanList = this.getCompanies();
    if (cleanList.length !== list.length) {
      console.log(`[Storage] Limpeza de empresas: removidos ${list.length - cleanList.length} fornecedores de notas tomadas do catalogo.`);
      this._writeJson(COMPANIES_FILE, cleanList);
    }

    // Limpa também do recent_representations.json caso algum fornecedor tenha sido gravado lá
    const RECENT_FILE = path.join(DATA_DIR, 'recent_representations.json');
    const recents = this._readJson(RECENT_FILE, []);
    if (Array.isArray(recents)) {
      const cleanRecents = recents.filter(r => r.cnpjRaw && !this.VENDOR_BLOCKLIST.has(r.cnpjRaw));
      if (cleanRecents.length !== recents.length) {
        console.log(`[Storage] Limpeza de recentes: removidas ${recents.length - cleanRecents.length} empresas nao-clientes.`);
        this._writeJson(RECENT_FILE, cleanRecents);
      }
    }
    return list.length - cleanList.length;
  }

  saveCompany(company) {
    const list = this._readJson(COMPANIES_FILE, []);
    const cleanCnpj = (company.cnpj || '').replace(/\D/g, '');
    const index = list.findIndex(c => c.cnpjRaw === cleanCnpj);

    const formatted = {
      ...company,
      cnpjRaw: cleanCnpj,
      cnpj: cleanCnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
    };

    if (index >= 0) {
      list[index] = formatted;
    } else {
      list.push(formatted);
    }
    this._writeJson(COMPANIES_FILE, list);
    return formatted;
  }

  // --- CONFIGURAÇÕES ---
  getSettings() {
    return this._readJson(SETTINGS_FILE, {});
  }

  updateSettings(newSettings) {
    const current = this.getSettings();
    const updated = { ...current, ...newSettings };
    this._writeJson(SETTINGS_FILE, updated);
    return updated;
  }

  // --- MODELOS / TEMPLATES DE EMISSÃO ---
  getTemplates(prestadorCnpj) {
    const list = this._readJson(TEMPLATES_FILE, []);
    if (!prestadorCnpj) return list;
    const clean = prestadorCnpj.replace(/\D/g, '');
    return list.filter(t => (t.prestadorCnpj || '').replace(/\D/g, '') === clean);
  }

  saveTemplate(template) {
    const list = this._readJson(TEMPLATES_FILE, []);
    const cleanCnpj = (template.prestadorCnpj || '').replace(/\D/g, '');
    if (!cleanCnpj) {
      throw new Error('CNPJ da empresa representada é obrigatório para salvar o modelo.');
    }
    if (!template.nome || !template.nome.trim()) {
      throw new Error('Informe um nome identificador para o modelo de nota fiscal.');
    }

    const id = template.id || `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const formatted = {
      ...template,
      id,
      prestadorCnpj: cleanCnpj,
      updatedAt: new Date().toISOString()
    };

    const index = list.findIndex(t => t.id === id);
    if (index >= 0) {
      list[index] = formatted;
    } else {
      formatted.createdAt = new Date().toISOString();
      list.unshift(formatted);
    }
    this._writeJson(TEMPLATES_FILE, list);
    return formatted;
  }

  deleteTemplate(id, prestadorCnpj) {
    let list = this._readJson(TEMPLATES_FILE, []);
    const cleanCnpj = prestadorCnpj ? prestadorCnpj.replace(/\D/g, '') : null;
    const initialLen = list.length;
    list = list.filter(t => {
      if (t.id !== id) return true;
      if (cleanCnpj && (t.prestadorCnpj || '').replace(/\D/g, '') !== cleanCnpj) return true;
      return false;
    });
    this._writeJson(TEMPLATES_FILE, list);
    return list.length < initialLen;
  }
}

module.exports = new StorageService();
