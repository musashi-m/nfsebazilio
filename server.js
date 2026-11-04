/**
 * Emissor Nacional de NFS-e - Servidor Principal (Express)
 * Integração Oficial com o Ambiente de Dados Nacional (ADN) da Receita Federal do Brasil e SERPRO
 * Suporte a Certificado Digital A1 e Procuração Eletrônica RFB (Representação)
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

const { ENVIRONMENTS, DEFAULT_ENVIRONMENT } = require('./src/config/environments');
const certService = require('./src/services/certService');
const dpsService = require('./src/services/dpsService');
const adnService = require('./src/services/adnService');
const serproService = require('./src/services/serproService');
const storageService = require('./src/services/storageService');
const xmlParserService = require('./src/services/xmlParserService');
const representationService = require('./src/services/representationService');
const { translateError, ERROR_DICTIONARY } = require('./src/services/errorTranslator');
const {
  CODIGOS_TRIBUTACAO_NACIONAL,
  EXIGIBILIDADES_ISS,
  OPCOES_SIMPLES_NACIONAL,
  REGIMES_ESPECIAIS_TRIBUTACAO,
  TIPOS_RETENCAO_ISS,
  REGIMES_TRIBUTARIOS,
  MUNICIPIOS_EXEMPLO
} = require('./src/utils/ibgeTributos');
const { ITENS_NBS } = require('./src/utils/nbsCodes');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração de Multer para upload em memória do certificado .pfx
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // máx 5MB
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Estado de configuração em memória / persistido
let currentEnvironment = storageService.getSettings().activeEnvironment || DEFAULT_ENVIRONMENT;

// ==========================================
// ROTAS DE STATUS E AMBIENTES
// ==========================================

// Retorna status geral da aplicação e do certificado
app.get('/api/status', async (req, res) => {
  const envConfig = ENVIRONMENTS[currentEnvironment] || ENVIRONMENTS.HOMOLOGACAO;
  const certInfo = certService.getPublicCertInfo();
  const settings = storageService.getSettings();
  const activeRepresentation = representationService.getActiveRepresentation();
  const recentRepresentations = representationService.getRecentRepresentations();

  res.json({
    status: 'ONLINE',
    version: '1.0.0',
    currentEnvironment,
    envConfig,
    certificate: certInfo,
    activeRepresentation,
    recentRepresentations,
    settings,
    timestamp: new Date().toISOString()
  });
});

// Lista os 3 ambientes disponíveis
app.get('/api/environments', (req, res) => {
  res.json({
    current: currentEnvironment,
    environments: Object.values(ENVIRONMENTS)
  });
});

// Altera o ambiente ativo (TESTE, HOMOLOGACAO, PRODUCAO)
app.post('/api/environments/select', (req, res) => {
  const { environmentId } = req.body;
  if (!ENVIRONMENTS[environmentId]) {
    return res.status(400).json({
      success: false,
      error: translateError('Ambiente selecionado inválido. Escolha TESTE, HOMOLOGACAO ou PRODUCAO.')
    });
  }

  currentEnvironment = environmentId;
  storageService.updateSettings({ activeEnvironment: environmentId });

  res.json({
    success: true,
    message: `Ambiente alterado para: ${ENVIRONMENTS[environmentId].name}`,
    activeEnvironment: currentEnvironment,
    envConfig: ENVIRONMENTS[environmentId]
  });
});

// ==========================================
// ROTAS DE CERTIFICADO E PROCURAÇÃO
// ==========================================

// Consulta informações do certificado ativo
app.get('/api/certificate', (req, res) => {
  const cert = certService.getPublicCertInfo();
  res.json({ certificate: cert });
});

// Upload de Certificado A1 (.pfx / .p12)
app.post('/api/certificate/upload', upload.single('certFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: translateError('Nenhum arquivo de certificado (.pfx ou .p12) foi enviado.')
      });
    }

    const password = req.body.password || '';
    const result = certService.loadPfx(req.file.buffer, password);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Certificado digital A1 carregado e validado com sucesso!',
      certificate: result.certificate
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: translateError(err, { step: 'Upload de Certificado' })
    });
  }
});

// Remover/desvincular certificado ativo
app.post('/api/certificate/remove', (req, res) => {
  certService.clearCert();
  res.json({ success: true, message: 'Certificado digital desvinculado com sucesso.' });
});

// Validação de Procuração Eletrônica RFB para um determinado CNPJ
app.post('/api/proxy/validate', (req, res) => {
  const { prestadorCnpj } = req.body;
  const result = certService.validateProxy(prestadorCnpj);
  res.json(result);
});

// ==========================================
// ROTAS DE PROCURAÇÃO E REPRESENTAÇÃO (EMISSOR NACIONAL)
// ==========================================

// Ativa a representação por CPF ou CNPJ (Consulta dados oficiais e vincula)
app.post('/api/representation/representar', async (req, res) => {
  try {
    const { doc } = req.body;
    const result = await representationService.representar(doc);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: translateError(err, { step: 'Representação por Procuração' }) });
  }
});

// Lista unificada de todos os clientes representados (catálogo + histórico)
app.get('/api/representation/clients', (req, res) => {
  const clients = representationService.getClients();
  res.json({ success: true, clients });
});

// Lista de Representações Recentes
app.get('/api/representation/recent', (req, res) => {
  const recents = representationService.getRecentRepresentations();
  res.json(recents);
});

// Representação Ativa Atual
app.get('/api/representation/active', (req, res) => {
  const active = representationService.getActiveRepresentation();
  res.json({ activeRepresentation: active });
});

// Limpa representação ativa
app.post('/api/representation/clear', (req, res) => {
  representationService.clearActiveRepresentation();
  res.json({ success: true, message: 'Representação encerrada. Emissão em modo titular direto.' });
});

// ==========================================
// ROTAS DE EMPRESAS REPRESENTADAS
// ==========================================

app.get('/api/companies', (req, res) => {
  const companies = storageService.getCompanies();
  res.json(companies);
});

app.post('/api/companies', (req, res) => {
  try {
    const saved = storageService.saveCompany(req.body);
    res.json({ success: true, company: saved });
  } catch (err) {
    res.status(400).json({ success: false, error: translateError(err) });
  }
});

// ==========================================
// MODELOS / TEMPLATES DE EMISSÃO DE NFS-E
// ==========================================

app.get('/api/templates', (req, res) => {
  try {
    const { cnpj } = req.query;
    const templates = storageService.getTemplates(cnpj);
    res.json({ success: true, templates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/templates', (req, res) => {
  try {
    const saved = storageService.saveTemplate(req.body);
    res.json({ success: true, template: saved });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.delete('/api/templates/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { cnpj } = req.query;
    const deleted = storageService.deleteTemplate(id, cnpj);
    res.json({ success: deleted });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==========================================
// TABELAS AUXILIARES (IBGE / TRIBUTOS)
// ==========================================

app.get('/api/aux/ibge-tributos', (req, res) => {
  res.json({
    tributacaoNacional: CODIGOS_TRIBUTACAO_NACIONAL,
    itensNbs: ITENS_NBS,
    exigibilidadesIss: EXIGIBILIDADES_ISS,
    opcoesSimplesNacional: OPCOES_SIMPLES_NACIONAL,
    regimesEspeciaisTributacao: REGIMES_ESPECIAIS_TRIBUTACAO,
    tiposRetencaoIss: TIPOS_RETENCAO_ISS,
    regimesTributarios: REGIMES_TRIBUTARIOS,
    municipios: MUNICIPIOS_EXEMPLO
  });
});

app.get('/api/aux/nbs', (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  if (!q) {
    return res.json({ success: true, total: ITENS_NBS.length, data: ITENS_NBS });
  }
  const filtered = ITENS_NBS.filter(item => {
    const cod = (item.codigo || '').toLowerCase().replace(/\./g, '');
    const cleanQ = q.replace(/\./g, '');
    const desc = (item.descricao || '').toLowerCase();
    const cat = (item.categoria || '').toLowerCase();
    return cod.includes(cleanQ) || desc.includes(q) || cat.includes(q);
  });
  res.json({ success: true, total: filtered.length, data: filtered });
});

// Consulta de dados cadastrais de empresa por CNPJ (BrasilAPI com fallback)
app.get('/api/aux/cnpj/:cnpj', async (req, res) => {
  const clean = (req.params.cnpj || '').replace(/\D/g, '');
  if (!clean || clean.length !== 14) {
    return res.status(400).json({
      success: false,
      error: 'CNPJ deve conter exatamente 14 dígitos numéricos.'
    });
  }

  let data = null;
  let source = '';

  // 1. Tenta BrasilAPI
  try {
    const bRes = await axios.get(`https://brasilapi.com.br/api/cnpj/v1/${clean}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 5000
    });
    if (bRes.data && bRes.data.razao_social) {
      const d = bRes.data;
      data = {
        razaoSocial: d.razao_social,
        nomeFantasia: d.nome_fantasia || '',
        cep: d.cep ? String(d.cep).replace(/\D/g, '') : '',
        logradouro: [d.descricao_tipo_de_logradouro, d.logradouro].filter(Boolean).join(' ') || d.logradouro || '',
        numero: d.numero || '',
        complemento: d.complemento || '',
        bairro: d.bairro || '',
        municipio: d.municipio || '',
        municipioIbge: d.codigo_municipio_ibge ? String(d.codigo_municipio_ibge) : '',
        uf: d.uf || '',
        email: d.email || '',
        telefone: d.ddd_telefone_1 ? `${d.ddd_telefone_1}` : ''
      };
      source = 'BrasilAPI';
    }
  } catch (err) {
    // Falha ou rate limit na BrasilAPI -> prossegue para fallback
  }

  // 2. Fallback Minha Receita
  if (!data) {
    try {
      const mrRes = await axios.get(`https://minhareceita.org/${clean}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 6000
      });
      if (mrRes.data && mrRes.data.razao_social) {
        const d = mrRes.data;
        const tipoLog = d.descricao_tipo_de_logradouro ? `${d.descricao_tipo_de_logradouro} ` : '';
        data = {
          razaoSocial: d.razao_social,
          nomeFantasia: d.nome_fantasia || '',
          cep: d.cep ? String(d.cep).replace(/\D/g, '') : '',
          logradouro: `${tipoLog}${d.logradouro || ''}`.trim(),
          numero: d.numero || '',
          complemento: d.complemento || '',
          bairro: d.bairro || '',
          municipio: d.municipio || '',
          municipioIbge: d.codigo_municipio_ibge ? String(d.codigo_municipio_ibge) : '',
          uf: d.uf || '',
          email: d.email || '',
          telefone: d.ddd_telefone_1 ? `${d.ddd_telefone_1}` : ''
        };
        source = 'MinhaReceita';
      }
    } catch (err) {}
  }

  // 3. Fallback CNPJa
  if (!data) {
    try {
      const cnpjaRes = await axios.get(`https://open.cnpja.com/office/${clean}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 6000
      });
      if (cnpjaRes.data && cnpjaRes.data.company) {
        const d = cnpjaRes.data;
        data = {
          razaoSocial: d.company.name,
          nomeFantasia: d.alias || '',
          cep: d.address?.zip ? String(d.address.zip).replace(/\D/g, '') : '',
          logradouro: d.address?.street || '',
          numero: d.address?.number || '',
          complemento: d.address?.details || '',
          bairro: d.address?.district || '',
          municipio: d.address?.city || '',
          municipioIbge: d.address?.ibge ? String(d.address.ibge) : '',
          uf: d.address?.state || '',
          email: d.emails?.[0]?.address || '',
          telefone: d.phones?.[0]?.number || ''
        };
        source = 'CNPJa';
      }
    } catch (err) {}
  }

  if (!data) {
    return res.status(404).json({
      success: false,
      error: 'Não foi possível localizar os dados deste CNPJ nos serviços da Receita Federal.'
    });
  }

  const formattedCnpj = clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');

  res.json({
    success: true,
    source,
    data: {
      ...data,
      cnpj: formattedCnpj,
      cnpjRaw: clean
    }
  });
});

// Consulta e preenchimento inteligente de Tomador por CPF ou CNPJ
app.get('/api/aux/tomador', async (req, res) => {
  const doc = (req.query.doc || '').replace(/\D/g, '');
  const prestadorCnpj = (req.query.prestadorCnpj || '').replace(/\D/g, '');

  if (!doc || (doc.length !== 11 && doc.length !== 14)) {
    return res.status(400).json({
      success: false,
      error: 'O documento deve ser um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.'
    });
  }

  const isCpf = doc.length === 11;

  // 1. Tenta localizar no histórico de notas (priorizando o prestador ativo)
  const historyResult = storageService.findTomador(prestadorCnpj, doc);
  if (historyResult && historyResult.tomador && historyResult.tomador.nome) {
    return res.json({
      success: true,
      source: historyResult.source,
      sourceLabel: historyResult.sourceLabel,
      data: historyResult.tomador,
      sourceNfse: historyResult.sourceNfse
    });
  }

  // 2. Se for CPF e não estiver no histórico do prestador
  if (isCpf) {
    const formattedCpf = doc.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    return res.json({
      success: false,
      notFound: true,
      isCpf: true,
      doc: formattedCpf,
      docRaw: doc,
      message: 'Tomador (CPF) novo para este prestador. Preencha os dados cadastrais (serão salvos para as próximas emissões).'
    });
  }

  // 3. Se for CNPJ e não estava no histórico, busca via BrasilAPI / Receita Federal
  try {
    const bRes = await axios.get(`https://brasilapi.com.br/api/cnpj/v1/${doc}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 5000
    });
    if (bRes.data && bRes.data.razao_social) {
      const d = bRes.data;
      const formattedCnpj = doc.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
      const cleanCep = d.cep ? String(d.cep).replace(/\D/g, '') : '';
      const cepFormatted = cleanCep.length === 8 ? cleanCep.replace(/^(\d{5})(\d{3})$/, '$1-$2') : cleanCep;
      return res.json({
        success: true,
        source: 'RECEITA_FEDERAL',
        sourceLabel: 'BrasilAPI / Receita Federal',
        data: {
          doc: formattedCnpj,
          docRaw: doc,
          tipoDoc: 'CNPJ',
          nome: d.razao_social,
          razaoSocial: d.razao_social,
          nomeFantasia: d.nome_fantasia || '',
          cep: cepFormatted,
          logradouro: [d.descricao_tipo_de_logradouro, d.logradouro].filter(Boolean).join(' ') || d.logradouro || '',
          numero: d.numero || 'S/N',
          complemento: d.complemento || '',
          bairro: d.bairro || '',
          municipio: d.municipio || '',
          municipioIbge: d.codigo_municipio_ibge ? String(d.codigo_municipio_ibge) : '',
          uf: d.uf || '',
          email: d.email ? d.email.toLowerCase() : '',
          telefone: d.ddd_telefone_1 ? `${d.ddd_telefone_1}` : ''
        }
      });
    }
  } catch (err) {
    // Falha BrasilAPI
  }

  // Fallback Minha Receita se CNPJ
  try {
    const mrRes = await axios.get(`https://minhareceita.org/${doc}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 6000
    });
    if (mrRes.data && mrRes.data.razao_social) {
      const d = mrRes.data;
      const formattedCnpj = doc.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
      const tipoLog = d.descricao_tipo_de_logradouro ? `${d.descricao_tipo_de_logradouro} ` : '';
      const cleanCep = d.cep ? String(d.cep).replace(/\D/g, '') : '';
      const cepFormatted = cleanCep.length === 8 ? cleanCep.replace(/^(\d{5})(\d{3})$/, '$1-$2') : cleanCep;
      return res.json({
        success: true,
        source: 'RECEITA_FEDERAL',
        sourceLabel: 'Minha Receita / Receita Federal',
        data: {
          doc: formattedCnpj,
          docRaw: doc,
          tipoDoc: 'CNPJ',
          nome: d.razao_social,
          razaoSocial: d.razao_social,
          nomeFantasia: d.nome_fantasia || '',
          cep: cepFormatted,
          logradouro: `${tipoLog}${d.logradouro || ''}`.trim(),
          numero: d.numero || 'S/N',
          complemento: d.complemento || '',
          bairro: d.bairro || '',
          municipio: d.municipio || '',
          municipioIbge: d.codigo_municipio_ibge ? String(d.codigo_municipio_ibge) : '',
          uf: d.uf || '',
          email: d.email ? d.email.toLowerCase() : '',
          telefone: d.ddd_telefone_1 ? `${d.ddd_telefone_1}` : ''
        }
      });
    }
  } catch (err) {}

  return res.json({
    success: false,
    notFound: true,
    isCpf: false,
    message: 'CNPJ não localizado na Receita Federal. Preencha os dados manualmente.'
  });
});

// ==========================================
// ROTAS DE EMISSÃO DE NFS-E (PADRÃO NACIONAL)
// ==========================================

// Emissão de NFS-e via DPS (Receita Federal / ADN)
app.post('/api/nfse/emitir', async (req, res) => {
  try {
    const dpsInput = req.body;
    const settings = storageService.getSettings();

    const result = await adnService.emitirNfse(dpsInput, currentEnvironment, {
      preferDirectRfb: settings.preferDirectRfb !== false,
      serproCredentials: {
        consumerKey: settings.serproConsumerKey,
        consumerSecret: settings.serproConsumerSecret
      }
    });

    res.json(result);
  } catch (err) {
    console.error('Erro na emissão:', err);
    const friendly = err.category ? err : translateError(err, { step: 'Emissão NFS-e Nacional' });
    res.status(400).json({ success: false, error: friendly });
  }
});

// Pré-visualização do XML da DPS antes do envio
app.post('/api/nfse/preview-dps', (req, res) => {
  try {
    const dpsInput = req.body;
    const certInfo = certService.getPublicCertInfo();
    const env = ENVIRONMENTS[currentEnvironment] || ENVIRONMENTS.TESTE;
    const result = dpsService.buildDps(dpsInput, certInfo, env.tpAmb);
    res.json({ success: true, preview: result });
  } catch (err) {
    res.status(400).json({ success: false, error: translateError(err) });
  }
});

// ==========================================
// TECNOLOGIA ADN (HISTÓRICO E CONSULTAS)
// ==========================================

// Consulta histórico de notas da empresa representada no ADN
app.get('/api/adn/history', (req, res) => {
  const { prestadorCnpj, status, search, ambiente, papel } = req.query;
  const history = storageService.getHistory({
    prestadorCnpj,
    status,
    search,
    papel,
    ambiente: ambiente === 'TODOS' ? null : (ambiente || currentEnvironment)
  });
  res.json({
    total: history.length,
    ambiente: currentEnvironment,
    notas: history
  });
});

// Sincroniza histórico diretamente com o ADN da Receita Federal via Distribuição DF-e por NSU
app.post('/api/adn/sync', async (req, res) => {
  try {
    const { prestadorCnpj, startFromZero, maxBatches } = req.body;
    const result = await adnService.sincronizarHistoricoAdn(prestadorCnpj, currentEnvironment, {
      startFromZero: Boolean(startFromZero),
      maxBatches: Number(maxBatches) || 30
    });
    res.json(result);
  } catch (err) {
    const friendly = err.category ? err : translateError(err, { step: 'Sincronização ADN' });
    res.status(400).json({ success: false, error: friendly });
  }
});

// Status da sincronização ADN (último NSU processado)
app.get('/api/adn/sync-status', (req, res) => {
  const cnpj = req.query.cnpj;
  const state = storageService.getNsuState(cnpj);
  res.json({ success: true, state });
});

// Consulta NFS-e individual por Chave de Acesso diretamente no SEFIN Nacional / ADN
app.post('/api/adn/consultar-chave', async (req, res) => {
  try {
    const { chaveAcesso } = req.body;
    if (!chaveAcesso) {
      return res.status(400).json({
        success: false,
        error: translateError('Informe a chave de acesso com 50 dígitos da NFS-e para consulta.')
      });
    }
    const result = await adnService.consultarNfsePorChave(chaveAcesso, currentEnvironment);
    res.json(result);
  } catch (err) {
    const friendly = err.category ? err : translateError(err, { step: 'Consulta de Chave no SEFIN Nacional' });
    res.status(400).json({ success: false, error: friendly });
  }
});

// Importação em lote de arquivos XML de NFS-e (baixados anteriormente do Emissor Nacional ou prefeitura)
app.post('/api/adn/import-xml', upload.array('xmlFiles', 100), async (req, res) => {
  try {
    const records = [];
    const errors = [];

    // 1. Arquivos enviados via multipart/form-data
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const content = file.buffer.toString('utf-8');
          const parsed = xmlParserService.parseNfseXml(content, {
            origem: 'UPLOAD_ARQUIVO_XML',
            nomeArquivo: file.originalname
          });
          records.push(parsed);
        } catch (e) {
          errors.push({ file: file.originalname, erro: e.message });
        }
      }
    }

    // 2. Ou conteúdo XML em texto via JSON no body
    if (req.body.xmlContent) {
      try {
        const parsed = xmlParserService.parseNfseXml(req.body.xmlContent, {
          origem: 'IMPORTACAO_DIRETA_XML'
        });
        records.push(parsed);
      } catch (e) {
        errors.push({ erro: e.message });
      }
    }

    if (records.length === 0 && errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: translateError(new Error(`Falha ao importar XMLs: ${errors[0].erro}`)),
        detalhes: errors
      });
    }

    const totalSalvas = storageService.saveNfseBatch(records);

    res.json({
      success: true,
      totalImportadas: records.length,
      totalSalvas,
      erros: errors.length > 0 ? errors : undefined,
      notas: records
    });
  } catch (err) {
    res.status(400).json({ success: false, error: translateError(err, { step: 'Importação de XML' }) });
  }
});

// Consulta NFS-e por Chave de Acesso no banco local
app.get('/api/adn/nfse/:chave', (req, res) => {
  const { chave } = req.params;
  const nfse = storageService.getNfseByChave(chave);
  if (!nfse) {
    return res.status(404).json({
      success: false,
      error: translateError(`Chave de acesso ${chave} não localizada no histórico local. Utilize a consulta online por chave para sincronizá-la do SEFIN Nacional.`)
    });
  }
  res.json({ success: true, nfse });
});

// Cancelamento de NFS-e no ADN
app.post('/api/adn/nfse/:chave/cancelar', async (req, res) => {
  try {
    const { chave } = req.params;
    const { motivo, justificativa } = req.body;

    if (!motivo) {
      return res.status(400).json({
        success: false,
        error: translateError('Selecione o motivo oficial de cancelamento da NFS-e.')
      });
    }

    const result = await adnService.cancelarNfse(chave, motivo, justificativa, currentEnvironment);
    res.json(result);
  } catch (err) {
    const friendly = err.category ? err : translateError(err, { step: 'Cancelamento ADN' });
    res.status(400).json({ success: false, error: friendly });
  }
});

// Download do XML Oficial da NFS-e
app.get('/api/adn/nfse/:chave/xml', (req, res) => {
  const { chave } = req.params;
  const nfse = storageService.getNfseByChave(chave);
  const xml = (nfse && (nfse.xmlAssinado || nfse.xmlCompleto)) || null;
  if (!nfse || !xml) {
    return res.status(404).send('XML não encontrado.');
  }

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Content-Disposition', `attachment; filename=NFSe_${chave}.xml`);
  res.send(xml);
});

// ==========================================
// TESTES DE CONECTIVIDADE E DIAGNÓSTICO COMPLETO (RFB ADN E SERPRO)
// ==========================================

app.post('/api/connectivity/test', async (req, res) => {
  const settings = storageService.getSettings();
  const envConfig = ENVIRONMENTS[currentEnvironment] || ENVIRONMENTS.HOMOLOGACAO;
  const certInfo = certService.getPublicCertInfo();
  const activeRepresentation = representationService.getActiveRepresentation();

  const [rfbStatus, serproStatus] = await Promise.all([
    adnService.testDirectRfbConnection(currentEnvironment),
    serproService.testConnection(currentEnvironment, {
      consumerKey: settings.serproConsumerKey,
      consumerSecret: settings.serproConsumerSecret
    })
  ]);

  let overallStatus = 'OPERACIONAL';
  let statusSummary = 'Serviços conectados e prontos para operação.';

  if (!certInfo) {
    overallStatus = 'ALERTA_CERTIFICADO';
    statusSummary = 'Certificado digital A1 não carregado. Necessário para assinatura e mTLS.';
  } else if (!rfbStatus.online && !serproStatus.online) {
    overallStatus = 'INDISPONIVEL';
    statusSummary = 'Não foi possível alcançar os servidores da Receita Federal ou SERPRO.';
  } else if (!rfbStatus.online) {
    overallStatus = 'ATENCAO';
    statusSummary = 'Conexão direta RFB com oscilação. Fallback SERPRO ativo.';
  }

  res.json({
    ambiente: currentEnvironment,
    envConfig,
    overallStatus,
    statusSummary,
    rfbDirect: {
      ...rfbStatus,
      endpoint: envConfig.rfbAdnBaseUrl
    },
    serproGateway: {
      ...serproStatus,
      endpoint: envConfig.serproApiBaseUrl
    },
    certificate: certInfo ? {
      loaded: true,
      titular: certInfo.procuradorName,
      documento: certInfo.procuradorDoc,
      emissor: certInfo.issuer,
      validTo: certInfo.validTo,
      daysRemaining: certInfo.daysRemaining,
      isValid: certInfo.isValid
    } : {
      loaded: false,
      message: 'Nenhum certificado A1 carregado'
    },
    representation: activeRepresentation ? {
      active: true,
      cnpj: activeRepresentation.cnpj,
      razaoSocial: activeRepresentation.razaoSocial,
      municipio: activeRepresentation.municipioNome || 'São Paulo',
      uf: activeRepresentation.uf || 'SP'
    } : {
      active: false,
      message: 'Nenhuma empresa representada selecionada (modo titular direto)'
    },
    timestamp: new Date().toISOString()
  });
});

// Atualiza configurações de conectividade e credenciais Serpro
app.post('/api/settings', (req, res) => {
  const updated = storageService.updateSettings(req.body);
  res.json({ success: true, settings: updated });
});

// Dicionário amigável de erros para consulta do usuário
app.get('/api/errors/dictionary', (req, res) => {
  res.json(ERROR_DICTIONARY);
});

// Inicia servidor apenas se executado diretamente
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  EMISSOR NACIONAL DE NOTAS FISCAIS (NFS-e ADN / RFB)  `);
    console.log(`  Servidor rodando em: http://localhost:${PORT}        `);
    console.log(`  Ambiente Inicial: ${currentEnvironment}              `);
    console.log(`=======================================================`);
  });
}

module.exports = app;
