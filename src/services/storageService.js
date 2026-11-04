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

class StorageService {
  constructor() {
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

  // --- HISTÓRICO ADN / NFS-E ---
  getHistory(filters = {}) {
    let list = this._readJson(NFSE_FILE, []);

    // Garante consistência de notas com registro de cancelamento
    list = list.map(item => {
      const isCancelled = item.status === 'CANCELADA' || Boolean(item.dataCancelamento) || Boolean(item.motivoCancelamento);
      if (isCancelled && item.status !== 'CANCELADA') {
        return { ...item, status: 'CANCELADA' };
      }
      return item;
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

    // Filtro por Ambiente
    if (filters.ambiente) {
      list = list.filter(item => item.ambiente === filters.ambiente);
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
    const list = this._readJson(NFSE_FILE, []);
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
    this._writeJson(NFSE_FILE, list);
    return nfseRecord;
  }

  saveNfseBatch(records = []) {
    if (!records || records.length === 0) return 0;
    const list = this._readJson(NFSE_FILE, []);
    const map = new Map();
    for (const item of list) {
      if (item.chaveAcesso) {
        const clean = item.chaveAcesso.replace(/\D/g, '');
        map.set(clean || item.chaveAcesso, item);
      }
    }

    let addedOrUpdated = 0;
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
      } else {
        map.set(cleanKey, { ...rec, createdAt: new Date().toISOString() });
      }
      addedOrUpdated++;
    }

    const merged = Array.from(map.values());
    this._writeJson(NFSE_FILE, merged);
    return addedOrUpdated;
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

    const list = this._readJson(NFSE_FILE, []);

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
    const list = this._readJson(NFSE_FILE, []);
    return list.find(item => {
      const itemClean = (item.chaveAcesso || '').replace(/\D/g, '');
      return (itemClean && itemClean === cleanChave) || item.chaveAcesso === chave || item.id === chave;
    });
  }

  updateNfseStatus(chave, status, motivoCancelamento = null) {
    if (!chave) return null;
    const cleanChave = chave.replace(/\D/g, '');
    const list = this._readJson(NFSE_FILE, []);
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
      this._writeJson(NFSE_FILE, list);
      return item;
    }
    return null;
  }

  // --- EMPRESAS REPRESENTADAS ---
  getCompanies() {
    return this._readJson(COMPANIES_FILE, []);
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
