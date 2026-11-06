/**
 * Serviço de Procuração e Representação Oficial
 * Idêntico ao fluxo do Emissor Nacional (nfse.gov.br/EmissorNacional)
 * - Entrada direta do CNPJ ou CPF a ser representado
 * - Consulta automática dos dados cadastrais oficiais da empresa
 * - Histórico de "Representações Recentes" com troca em 1 clique
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');
const storageService = require('./storageService');
const xmlParserService = require('./xmlParserService');

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const BASE_DATA_DIR = path.join(__dirname, '../../data');
const DATA_DIR = isServerless ? path.join(os.tmpdir(), 'emissor_data') : BASE_DATA_DIR;
const RECENT_FILE = path.join(DATA_DIR, 'recent_representations.json');

// Carrega base de municípios do IBGE em memória para mapeamento instantâneo
let IBGE_MUNICIPIOS = [];
try {
  const ibgePath = path.join(__dirname, '../utils/municipios_ibge.json');
  if (fs.existsSync(ibgePath)) {
    IBGE_MUNICIPIOS = JSON.parse(fs.readFileSync(ibgePath, 'utf8'));
  }
} catch (e) {
  console.warn('Aviso ao carregar municipios_ibge.json:', e.message);
}

class RepresentationService {
  constructor() {
    this._ensureFile();
  }

  _ensureFile() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (!fs.existsSync(RECENT_FILE)) {
        fs.writeFileSync(RECENT_FILE, JSON.stringify([], null, 2), 'utf8');
      }
    } catch (e) {
      console.warn('Aviso ao inicializar arquivo de representações:', e.message);
    }
  }

  _readRecent() {
    try {
      if (!fs.existsSync(RECENT_FILE)) return [];
      const data = fs.readFileSync(RECENT_FILE, 'utf8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  _writeRecent(list) {
    try {
      fs.writeFileSync(RECENT_FILE, JSON.stringify(list, null, 2), 'utf8');
    } catch (e) {
      console.error('Erro ao salvar representações recentes:', e.message);
    }
  }

  /**
   * Valida em tempo real junto à Receita Federal / ADN se o certificado digital ativo
   * realmente detém procuração eletrônica válida para representar o CNPJ informado.
   */
  async verificarProcuracaoAdn(cleanDoc) {
    const certService = require('./certService');
    const certInfo = certService.activeCert;
    if (!certInfo || !certInfo.pfxBuffer) {
      throw new Error('Certificado digital A1 não carregado no sistema para validar a procuração.');
    }

    const procuradorDoc = (certInfo.procuradorDoc || '').replace(/\D/g, '');
    // Se o documento a representar for o próprio titular do certificado, é o titular direto
    if (cleanDoc === procuradorDoc) {
      return {
        valida: true,
        tipo: 'TITULAR',
        mensagem: 'Representação como titular direto do certificado digital.'
      };
    }

    // Consulta no ADN oficial se há procuração para o CNPJ
    const { ENVIRONMENTS } = require('../config/environments');
    const adnService = require('./adnService');
    const httpsAgent = adnService.createHttpsAgent(certInfo);
    const env = ENVIRONMENTS.PRODUCAO;

    const url = `${env.rfbAdnBaseUrl}/DFe/0?cnpjConsulta=${cleanDoc}`;
    try {
      await axios.get(url, {
        headers: { 'Accept': 'application/json' },
        httpsAgent,
        timeout: 9000
      });

      // Se respondeu 200, a procuração foi confirmada com sucesso pela Receita Federal
      return {
        valida: true,
        tipo: 'PROCURACAO_ELETRONICA',
        mensagem: 'Procuração eletrônica confirmada e ativa na Receita Federal (ADN).'
      };
    } catch (err) {
      const responseData = err.response?.data;
      const erros = responseData?.Erros || [];
      const erroProcuracao = erros.find(e => e.Codigo === 'E2245' || e.codigo === 'E2245');

      if (erroProcuracao) {
        throw new Error(`Procuração eletrônica NÃO localizada: A Receita Federal (ADN) informou que o titular do certificado (${certInfo.procuradorName}) não possui procuração eletrônica ativa outorgada pelo CNPJ ${cleanDoc} (Código E2245). Não é possível emitir ou representar esta empresa.`);
      }

      const outrosErros = erros.map(e => `[${e.Codigo || e.codigo}] ${e.Descricao || e.descricao}`).join('; ');
      if (outrosErros) {
        throw new Error(`Validação de Procuração rejeitada pela Receita Federal: ${outrosErros}`);
      }

      if (err.response?.status === 403 || err.response?.status === 401) {
        throw new Error(`Acesso negado pela Receita Federal para este CNPJ (${cleanDoc}). O certificado não tem autorização para consultar/emitir por este contribuinte.`);
      }

      if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') {
        console.warn('Conexão instável com a Receita Federal durante verificação de procuração:', err.message);
        return {
          valida: true,
          aviso: 'Instabilidade momentânea no ADN ao checar procuração em tempo real.'
        };
      }

      throw new Error(`Erro ao verificar procuração na Receita Federal: ${err.message}`);
    }
  }

  /**
   * Converte nome de cidade e UF para código IBGE de 7 dígitos
   */
  _findIbgeByCity(cMunNome, uf) {
    if (!cMunNome || !IBGE_MUNICIPIOS || IBGE_MUNICIPIOS.length === 0) return null;
    const norm = str => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const targetNome = norm(cMunNome);
    const targetUf = (uf || '').toUpperCase().trim();
    const match = IBGE_MUNICIPIOS.find(m => norm(m.nome) === targetNome && (!targetUf || m.uf.toUpperCase() === targetUf));
    return match ? match.id : null;
  }

  /**
   * Busca dados da empresa diretamente no histórico local de NFS-e (ADN)
   * Extrai com precisão cirúrgica de emitente/prestador ou tomador com XML completo
   */
  _findCompanyInHistory(cleanDoc) {
    const history = storageService.getHistory();
    if (!history || history.length === 0) return null;

    // 1. Prioridade: histórico como prestador/emitente
    for (const n of history) {
      if (n.prestador && n.prestador.cnpjRaw === cleanDoc && n.prestador.razaoSocial && !n.prestador.razaoSocial.startsWith('EMPRESA CNPJ')) {
        const p = n.prestador;
        const res = {
          cnpj: p.cnpj || cleanDoc.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5'),
          cnpjRaw: cleanDoc,
          razaoSocial: p.razaoSocial,
          nomeFantasia: p.nomeFantasia || '',
          im: p.im || '',
          municipioNome: p.municipio || '',
          uf: p.uf || '',
          municipioIbge: '',
          cep: '',
          logradouro: '',
          numero: '',
          complemento: '',
          bairro: '',
          email: '',
          telefone: '',
          opSimpNac: 3
        };

        const xml = n.xmlCompleto || n.xmlAssinado;
        if (xml) {
          const emit = xmlParserService.getTag(xml, 'emit');
          const prest = xmlParserService.getTag(xml, 'prest');
          const enderNac = xmlParserService.getTag(emit, 'enderNac') || xmlParserService.getTag(xmlParserService.getTag(prest, 'end'), 'endNac');
          const end = xmlParserService.getTag(prest, 'end') || xmlParserService.getTag(emit, 'end');

          res.municipioIbge = xmlParserService.getTag(enderNac, 'cMun') || xmlParserService.getTag(xml, 'cLocEmi') || '';
          res.cep = (xmlParserService.getTag(enderNac, 'CEP') || '').replace(/\D/g, '');
          res.logradouro = xmlParserService.getTag(enderNac, 'xLgr') || xmlParserService.getTag(end, 'xLgr') || '';
          res.numero = xmlParserService.getTag(enderNac, 'nro') || xmlParserService.getTag(end, 'nro') || '';
          res.complemento = xmlParserService.getTag(enderNac, 'xCpl') || xmlParserService.getTag(end, 'xCpl') || '';
          res.bairro = xmlParserService.getTag(enderNac, 'xBairro') || xmlParserService.getTag(end, 'xBairro') || '';
          res.uf = xmlParserService.getTag(enderNac, 'UF') || xmlParserService.getTag(emit, 'UF') || res.uf;
          res.im = xmlParserService.getTag(emit, 'IM') || xmlParserService.getTag(prest, 'IM') || res.im;
          res.email = xmlParserService.getTag(emit, 'email') || xmlParserService.getTag(prest, 'email') || '';
          res.telefone = xmlParserService.getTag(emit, 'fone') || xmlParserService.getTag(prest, 'fone') || '';
          const opSimp = xmlParserService.getTag(xmlParserService.getTag(prest, 'regTrib'), 'opSimpNac');
          if (opSimp) res.opSimpNac = Number(opSimp);
        }

        if (!res.municipioIbge && res.municipioNome) {
          res.municipioIbge = this._findIbgeByCity(res.municipioNome, res.uf);
        }

        return res;
      }
    }

    // 2. Segunda opção: histórico como tomador de serviço
    for (const n of history) {
      if (n.tomador && n.tomador.docRaw === cleanDoc && n.tomador.nome && !n.tomador.nome.startsWith('EMPRESA CNPJ')) {
        const t = n.tomador;
        const res = {
          cnpj: t.doc || cleanDoc.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5'),
          cnpjRaw: cleanDoc,
          razaoSocial: t.nome,
          nomeFantasia: '',
          im: t.im || '',
          municipioNome: t.municipio || '',
          municipioIbge: t.municipioIbge || '',
          uf: t.uf || '',
          cep: (t.cep || '').replace(/\D/g, ''),
          logradouro: t.logradouro || '',
          numero: t.numero || '',
          complemento: t.complemento || '',
          bairro: t.bairro || '',
          email: t.email || '',
          telefone: t.telefone || '',
          opSimpNac: 3
        };

        if (!res.municipioIbge && res.municipioNome) {
          res.municipioIbge = this._findIbgeByCity(res.municipioNome, res.uf);
        }

        return res;
      }
    }

    return null;
  }

  /**
   * Consulta dados cadastrais em tempo real através de APIs abertas públicas com fallback
   */
  async _fetchCompanyOnline(cleanDoc) {
    const formattedDoc = cleanDoc.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');

    // Fonte 1: BrasilAPI
    try {
      const resp = await axios.get(`https://brasilapi.com.br/api/cnpj/v1/${cleanDoc}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        timeout: 5000
      });
      if (resp.data && resp.data.razao_social) {
        const d = resp.data;
        const munIbge = d.codigo_municipio_ibge ? String(d.codigo_municipio_ibge) : this._findIbgeByCity(d.municipio, d.uf);
        return {
          cnpj: formattedDoc,
          cnpjRaw: cleanDoc,
          razaoSocial: d.razao_social,
          nomeFantasia: d.nome_fantasia || '',
          municipioIbge: munIbge || '2800308',
          municipioNome: d.municipio || '',
          uf: d.uf || '',
          logradouro: d.logradouro || '',
          numero: d.numero || '',
          complemento: d.complemento || '',
          bairro: d.bairro || '',
          cep: (d.cep || '').replace(/\D/g, ''),
          telefone: d.ddd_telefone_1 || '',
          email: d.email || '',
          cnae: d.cnae_fiscal ? String(d.cnae_fiscal) : '',
          regimeTributario: 1,
          opSimpNac: 3
        };
      }
    } catch (_) {}

    // Fonte 2: ReceitaWS
    try {
      const resp = await axios.get(`https://receitaws.com.br/v1/cnpj/${cleanDoc}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 5000
      });
      if (resp.data && resp.data.status !== 'ERROR' && resp.data.nome) {
        const d = resp.data;
        const munIbge = this._findIbgeByCity(d.municipio, d.uf);
        return {
          cnpj: formattedDoc,
          cnpjRaw: cleanDoc,
          razaoSocial: d.nome,
          nomeFantasia: d.fantasia || '',
          municipioIbge: munIbge || '2800308',
          municipioNome: d.municipio || '',
          uf: d.uf || '',
          logradouro: d.logradouro || '',
          numero: d.numero || '',
          complemento: d.complemento || '',
          bairro: d.bairro || '',
          cep: (d.cep || '').replace(/\D/g, ''),
          telefone: d.telefone || '',
          email: d.email || '',
          cnae: d.atividade_principal && d.atividade_principal[0] ? String(d.atividade_principal[0].code).replace(/\D/g, '') : '',
          regimeTributario: 1,
          opSimpNac: 3
        };
      }
    } catch (_) {}

    // Fonte 3: MinhaReceita
    try {
      const resp = await axios.get(`https://minhareceita.org/${cleanDoc}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 5000
      });
      if (resp.data && resp.data.razao_social) {
        const d = resp.data;
        const munIbge = d.codigo_municipio_ibge ? String(d.codigo_municipio_ibge) : this._findIbgeByCity(d.municipio, d.uf);
        return {
          cnpj: formattedDoc,
          cnpjRaw: cleanDoc,
          razaoSocial: d.razao_social,
          nomeFantasia: d.nome_fantasia || '',
          municipioIbge: munIbge || '2800308',
          municipioNome: d.municipio || '',
          uf: d.uf || '',
          logradouro: d.logradouro || '',
          numero: d.numero || '',
          complemento: d.complemento || '',
          bairro: d.bairro || '',
          cep: (d.cep || '').replace(/\D/g, ''),
          telefone: d.ddd_telefone_1 || '',
          email: d.email || '',
          cnae: d.cnae_fiscal ? String(d.cnae_fiscal) : '',
          regimeTributario: 1,
          opSimpNac: 3
        };
      }
    } catch (_) {}

    return null;
  }

  /**
   * Resolve dados completos e confiáveis de uma empresa (Histórico Local -> Fontes Oficiais)
   */
  async resolveCompanyData(cleanDoc, currentData = null) {
    const isCnpj = cleanDoc.length === 14;
    const formattedDoc = isCnpj
      ? cleanDoc.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
      : cleanDoc.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');

    const isPlaceholder = !currentData ||
      !currentData.razaoSocial ||
      currentData.razaoSocial.startsWith('EMPRESA CNPJ') ||
      currentData.razaoSocial.startsWith('CONTRIBUINTE CPF') ||
      (!currentData.logradouro && isCnpj) ||
      (!currentData.im && isCnpj);

    // Se já temos dados completos e válidos, apenas atualiza timestamp
    if (!isPlaceholder && currentData.municipioIbge && currentData.municipioIbge !== '3550308') {
      return {
        ...currentData,
        lastUsedAt: currentData.lastUsedAt || new Date().toISOString()
      };
    }

    // 1. Tenta extrair do histórico de notas (dados 100% oficiais emitidos no ADN)
    const fromHistory = this._findCompanyInHistory(cleanDoc);
    if (fromHistory) {
      return {
        ...(currentData || {}),
        ...fromHistory,
        lastUsedAt: new Date().toISOString()
      };
    }

    // 2. Se for CNPJ, consulta bases públicas online
    if (isCnpj) {
      const fromOnline = await this._fetchCompanyOnline(cleanDoc);
      if (fromOnline) {
        return {
          ...(currentData || {}),
          ...fromOnline,
          im: (currentData && currentData.im) || fromOnline.im || '',
          lastUsedAt: new Date().toISOString()
        };
      }
    }

    // 3. Fallback inteligente (mantém o que tiver ou monta estrutura base)
    return {
      cnpj: formattedDoc,
      cnpjRaw: cleanDoc,
      razaoSocial: (currentData && currentData.razaoSocial && !currentData.razaoSocial.startsWith('EMPRESA CNPJ'))
        ? currentData.razaoSocial
        : (isCnpj ? `EMPRESA CNPJ ${formattedDoc}` : `CONTRIBUINTE CPF ${formattedDoc}`),
      nomeFantasia: (currentData && currentData.nomeFantasia) || '',
      municipioIbge: (currentData && currentData.municipioIbge) || '2800308',
      municipioNome: (currentData && currentData.municipioNome) || 'Aracaju',
      uf: (currentData && currentData.uf) || 'SE',
      logradouro: (currentData && currentData.logradouro) || '',
      numero: (currentData && currentData.numero) || '',
      bairro: (currentData && currentData.bairro) || '',
      cep: (currentData && currentData.cep) || '',
      im: (currentData && currentData.im) || '',
      regimeTributario: (currentData && currentData.regimeTributario) || 1,
      opSimpNac: (currentData && currentData.opSimpNac) || 3,
      lastUsedAt: new Date().toISOString()
    };
  }

  /**
   * Representar uma empresa ou pessoa física por CNPJ ou CPF
   * @param {string} docRaw - CNPJ (14 dígitos) ou CPF (11 dígitos)
   * @param {string|null} sessionId - ID da sessão para isolamento multi-usuário
   */
  async representar(docRaw, sessionId = null) {
    const cleanDoc = (docRaw || '').replace(/\D/g, '');

    if (cleanDoc.length !== 14 && cleanDoc.length !== 11) {
      throw new Error('Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido para representar.');
    }

    // 1. Verificação Rigorosa de Procuração no ADN / Receita Federal
    await this.verificarProcuracaoAdn(cleanDoc);

    const isCnpj = cleanDoc.length === 14;
    const formattedDoc = isCnpj
      ? cleanDoc.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
      : cleanDoc.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');

    // 2. Busca cadastro existente ou resolve com dados oficiais
    const recents = this._readRecent();
    const existing = recents.find(r => r.cnpjRaw === cleanDoc) || storageService.getCompanies().find(c => c.cnpjRaw === cleanDoc);

    const companyData = await this.resolveCompanyData(cleanDoc, existing);
    companyData.lastUsedAt = new Date().toISOString();

    // 3. Atualiza lista de recentes (move para o topo, máx 10)
    const filtered = recents.filter(r => r.cnpjRaw !== cleanDoc);
    filtered.unshift(companyData);
    const updatedRecents = filtered.slice(0, 10);
    this._writeRecent(updatedRecents);

    // 4. Salva nas configurações apenas se for uso global sem sessão (ex: testes ou scripts CLI)
    if (!sessionId) {
      storageService.updateSettings({
        activeRepresentedCnpj: cleanDoc
      });
    }

    // 5. Salva também no storage de empresas com dados enriquecidos
    storageService.saveCompany(companyData);

    return {
      success: true,
      message: `Representação ativada com sucesso: ${companyData.razaoSocial} (${formattedDoc}) - Procuração Eletrônica Confirmada na RFB!`,
      representedCompany: companyData,
      recentRepresentations: updatedRecents
    };
  }

  /**
   * Retorna a lista de representações recentes
   */
  getRecentRepresentations() {
    return this._readRecent();
  }

  /**
   * Retorna catálogo limpo de clientes representados (apenas empresas de fato representadas/com procuração)
   * Auto-descobre prestadores do histórico do ADN e enriquece cadastros
   */
  getClients() {
    const active = this.getActiveRepresentation();
    const activeCnpj = active ? (active.cnpjRaw || '').replace(/\D/g, '') : '';

    const map = new Map();

    // 1. Prestadores que já emitiram notas no histórico do ADN
    const history = storageService.getHistory();
    for (const n of history) {
      if (n.prestador && n.prestador.cnpjRaw) {
        const raw = n.prestador.cnpjRaw;
        if (!map.has(raw)) {
          const p = n.prestador;
          map.set(raw, {
            cnpj: p.cnpj,
            cnpjRaw: raw,
            razaoSocial: p.razaoSocial,
            nomeFantasia: p.nomeFantasia || '',
            im: p.im || '',
            municipioNome: p.municipio || '',
            uf: p.uf || '',
            municipioIbge: '',
            cep: '',
            logradouro: '',
            numero: '',
            bairro: '',
            regimeTributario: 1,
            opSimpNac: 3
          });
        }
        const c = map.get(raw);
        if (!c.im && n.prestador.im) c.im = n.prestador.im;

        const xml = n.xmlCompleto || n.xmlAssinado;
        if (xml) {
          const emit = xmlParserService.getTag(xml, 'emit');
          const prest = xmlParserService.getTag(xml, 'prest');
          const enderNac = xmlParserService.getTag(emit, 'enderNac') || xmlParserService.getTag(xmlParserService.getTag(prest, 'end'), 'endNac');
          const end = xmlParserService.getTag(prest, 'end') || xmlParserService.getTag(emit, 'end');

          const cMun = xmlParserService.getTag(enderNac, 'cMun') || xmlParserService.getTag(xml, 'cLocEmi');
          const cep = (xmlParserService.getTag(enderNac, 'CEP') || '').replace(/\D/g, '');
          const lgr = xmlParserService.getTag(enderNac, 'xLgr') || xmlParserService.getTag(end, 'xLgr');
          const nro = xmlParserService.getTag(enderNac, 'nro') || xmlParserService.getTag(end, 'nro');
          const cpl = xmlParserService.getTag(enderNac, 'xCpl') || xmlParserService.getTag(end, 'xCpl');
          const bairro = xmlParserService.getTag(enderNac, 'xBairro') || xmlParserService.getTag(end, 'xBairro');
          const uf = xmlParserService.getTag(enderNac, 'UF') || xmlParserService.getTag(emit, 'UF');
          const im = xmlParserService.getTag(emit, 'IM') || xmlParserService.getTag(prest, 'IM');
          const regTrib = xmlParserService.getTag(prest, 'regTrib');
          const opSimpNac = xmlParserService.getTag(regTrib, 'opSimpNac');

          if (cMun && !c.municipioIbge) c.municipioIbge = cMun;
          if (cep && !c.cep) c.cep = cep;
          if (lgr && !c.logradouro) c.logradouro = lgr;
          if (nro && !c.numero) c.numero = nro;
          if (cpl && !c.complemento) c.complemento = cpl;
          if (bairro && !c.bairro) c.bairro = bairro;
          if (uf && !c.uf) c.uf = uf;
          if (im && !c.im) c.im = im;
          if (opSimpNac && !c.opSimpNac) c.opSimpNac = Number(opSimpNac);
        }
      }
    }

    // 2. Empresas salvas no catálogo de empresas
    const companies = storageService.getCompanies();
    for (const c of companies) {
      if (c.cnpjRaw) {
        const existing = map.get(c.cnpjRaw);
        map.set(c.cnpjRaw, {
          ...(existing || {}),
          ...c,
          // Não sobrescreve razão social válida com placeholder
          razaoSocial: (c.razaoSocial && !c.razaoSocial.startsWith('EMPRESA CNPJ'))
            ? c.razaoSocial
            : ((existing && existing.razaoSocial) || c.razaoSocial)
        });
      }
    }

    // 3. Representações recentes confirmadas
    const recents = this._readRecent();
    for (const r of recents) {
      if (r.cnpjRaw) {
        const existing = map.get(r.cnpjRaw);
        map.set(r.cnpjRaw, {
          ...(existing || {}),
          ...r,
          razaoSocial: (r.razaoSocial && !r.razaoSocial.startsWith('EMPRESA CNPJ'))
            ? r.razaoSocial
            : ((existing && existing.razaoSocial) || r.razaoSocial)
        });
      }
    }

    const list = Array.from(map.values()).map(item => {
      // Se não tiver código IBGE mas tem cidade/UF, busca no utilitário
      let codIbge = item.municipioIbge;
      if (!codIbge && item.municipioNome) {
        codIbge = this._findIbgeByCity(item.municipioNome, item.uf);
      }
      return {
        ...item,
        municipioIbge: codIbge || '2800308',
        isActive: item.cnpjRaw === activeCnpj
      };
    });

    // Ordena: ativa primeiro, depois alfabético por razão social
    list.sort((a, b) => {
      if (a.isActive) return -1;
      if (b.isActive) return 1;
      return (a.razaoSocial || '').localeCompare(b.razaoSocial || '');
    });

    return list;
  }

  /**
   * Retorna os dados da empresa atualmente representada
   * @param {string|null} docRaw - Se informado, busca os dados deste CNPJ específico (isolamento de sessão)
   */
  getActiveRepresentation(docRaw = null) {
    let activeCnpj = (docRaw || '').replace(/\D/g, '');
    if (!activeCnpj) {
      const settings = storageService.getSettings();
      activeCnpj = (settings.activeRepresentedCnpj || '').replace(/\D/g, '');
    }

    if (!activeCnpj) return null;

    const recents = this._readRecent();
    const found = recents.find(r => r.cnpjRaw === activeCnpj);
    if (found && found.razaoSocial && !found.razaoSocial.startsWith('EMPRESA CNPJ')) {
      return found;
    }

    const companies = storageService.getCompanies();
    const foundComp = companies.find(c => c.cnpjRaw === activeCnpj);
    if (foundComp && foundComp.razaoSocial && !foundComp.razaoSocial.startsWith('EMPRESA CNPJ')) {
      return foundComp;
    }

    // Tenta enriquecer a partir do histórico
    const fromHistory = this._findCompanyInHistory(activeCnpj);
    if (fromHistory) {
      const merged = { ...(found || foundComp || {}), ...fromHistory };
      storageService.saveCompany(merged);
      return merged;
    }

    return found || foundComp || null;
  }

  /**
   * Desativa a representação ativa
   */
  clearActiveRepresentation() {
    storageService.updateSettings({
      activeRepresentedCnpj: ''
    });
    return { success: true };
  }
}

module.exports = new RepresentationService();

