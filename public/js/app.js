/**
 * Controlador Principal da Interface do Emissor Nacional (NFS-e ADN / RFB)
 * Implementa fluxo oficial de Procuração / Representação e Diagnóstico em tempo real
 */

/**
 * Helper seguro para requisições com tratamento de respostas HTML/404
 */
async function safeFetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (err) {
    if (text.includes('<!DOCTYPE') || res.status === 404) {
      throw new Error('O servidor precisa ser reiniciado para reconhecer as novas rotas. Por favor, encerre o processo anterior e execute "npm start" ou "iniciar_emissor.bat" novamente.');
    }
    throw new Error(text || res.statusText || 'Erro ao processar resposta do servidor.');
  }
}

const IBGE_MUNICIPIOS_MAP = {
  '2800308': 'Aracaju/SE',
  '2905701': 'Camaçari/BA',
  '2927408': 'Salvador/BA',
  '2910800': 'Feira de Santana/BA',
  '2803609': 'Laranjeiras/SE',
  '2804805': 'Nossa Senhora do Socorro/SE',
  '2806701': 'São Cristóvão/SE',
  '2802908': 'Itabaiana/SE',
  '2803500': 'Lagarto/SE',
  '2802106': 'Estância/SE',
  '2800605': 'Barra dos Coqueiros/SE',
  '2807402': 'Tobias Barreto/SE',
  '2807105': 'Simão Dias/SE',
  '2805703': 'Propriá/SE',
  '2802809': 'Itaporanga d\'Ajuda/SE',
  '3550308': 'São Paulo/SP',
  '3509502': 'Campinas/SP',
  '3549805': 'São José dos Campos/SP',
  '3548500': 'Santos/SP',
  '3547809': 'Santo André/SP',
  '3548708': 'São Bernardo do Campo/SP',
  '3518800': 'Guarulhos/SP',
  '3534401': 'Osasco/SP',
  '3543402': 'Ribeirão Preto/SP',
  '3552205': 'Sorocaba/SP',
  '3304557': 'Rio de Janeiro/RJ',
  '3303302': 'Niterói/RJ',
  '3106200': 'Belo Horizonte/MG',
  '3170206': 'Uberlândia/MG',
  '3118601': 'Contagem/MG',
  '4106902': 'Curitiba/PR',
  '4113700': 'Londrina/PR',
  '4115200': 'Maringá/PR',
  '4314902': 'Porto Alegre/RS',
  '4305108': 'Caxias do Sul/RS',
  '4205407': 'Florianópolis/SC',
  '4204301': 'Concórdia/SC',
  '4209102': 'Joinville/SC',
  '4202404': 'Blumenau/SC',
  '5300108': 'Brasília/DF',
  '5208707': 'Goiânia/GO',
  '2304400': 'Fortaleza/CE',
  '2611606': 'Recife/PE',
  '3205309': 'Vitória/ES',
  '1501402': 'Belém/PA',
  '1302603': 'Manaus/AM',
  '2704302': 'Maceió/AL',
  '2408102': 'Natal/RN',
  '2111300': 'São Luís/MA',
  '2507507': 'João Pessoa/PB',
  '2211001': 'Teresina/PI',
  '5002704': 'Campo Grande/MS',
  '5103403': 'Cuiabá/MT',
  '1721000': 'Palmas/TO',
  '1100205': 'Porto Velho/RO',
  '1200401': 'Rio Branco/AC',
  '1400100': 'Boa Vista/RR',
  '1600303': 'Macapá/AP'
};

// Integração de todos os 5.571 municípios do Brasil para o mapa IBGE
if (typeof window !== 'undefined') {
  const popularMunicipiosMap = () => {
    if (window.MUNICIPIOS_BRASIL && Array.isArray(window.MUNICIPIOS_BRASIL)) {
      window.MUNICIPIOS_BRASIL.forEach(m => {
        IBGE_MUNICIPIOS_MAP[m.id] = `${m.nome}/${m.uf}`;
      });
    }
  };
  popularMunicipiosMap();
  window.addEventListener('DOMContentLoaded', popularMunicipiosMap);
}

const App = {
  state: {
    currentEnvironment: 'HOMOLOGACAO',
    envConfig: null,
    certificate: null,
    activeRepresentation: null,
    recentRepresentations: [],
    history: [],
    templates: [],
    currentEmissionStep: 1,
    auxData: null,
    connectivity: null,
    currentTab: 'dashboard',
    lastDiagnosticReport: null
  },

  async init() {
    console.log('Inicializando Emissor Nacional...');
    this.initTheme();
    this.initSidebarState();
    this.bindEvents();
    await this.loadInitialData();
    this.renderHeader();
    this.renderActiveTab();
    if (window.lucide) lucide.createIcons();
  },

  bindEvents() {
    // Máscara e formatação estrita MM/AAAA nos campos de Competência do Histórico
    const compIniEl = document.getElementById('fltCompetenciaIni');
    const compFimEl = document.getElementById('fltCompetenciaFim');
    if (compIniEl) this.bindCompetenciaMask(compIniEl);
    if (compFimEl) this.bindCompetenciaMask(compFimEl);

    // Máscara CPF/CNPJ no campo de carregar por documento do tomador
    const loadDocEl = document.getElementById('loadPrevTomadorDoc');
    if (loadDocEl) {
      loadDocEl.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '');
        if (v.length > 14) v = v.substring(0, 14);
        if (v.length <= 11) {
          v = v.replace(/(\d{3})(\d)/, '$1.$2');
          v = v.replace(/(\d{3})(\d)/, '$1.$2');
          v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        } else {
          v = v.replace(/^(\d{2})(\d)/, '$1.$2');
          v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
          v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
          v = v.replace(/(\d{4})(\d)/, '$1-$2');
        }
        e.target.value = v;
      });
    }

    // Tecla Enter nos campos de texto da pesquisa para acionar o filtro
    const filterInputIds = [
      'fltNumeroNota', 'fltCompetenciaIni', 'fltCompetenciaFim',
      'fltDocTomador', 'fltRpsIni', 'fltRpsFim', 'fltSerieRps',
      'fltNotaIni', 'fltNotaFim', 'fltMunicipioIncidencia', 'fltChaveAcesso'
    ];
    filterInputIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this.applyHistoryFilters();
          }
        });
      }
    });

    // Abas de navegação
    document.querySelectorAll('[data-nav-tab]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-nav-tab');
        this.switchTab(tab);
      });
    });

    // Seletor de ambiente no topo
    const envBtn = document.getElementById('envSelectorBtn');
    if (envBtn) {
      envBtn.addEventListener('click', () => {
        this.openEnvModal();
      });
    }

    // Formulário de emissão: Cálculos dinâmicos de impostos e retenções
    [
      'fValorServico', 'fValorIntermediario', 'fDescontoIncondicionado', 'fDescontoCondicionado',
      'fAliquotaIss', 'fRetIr', 'fRetContrSociais', 'fRetInss', 'fAliquotaSimplesNacional'
    ].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => this.calculateEmissionTotals());
        el.addEventListener('change', () => this.calculateEmissionTotals());
      }
    });

    // Data de competência padrão: Hoje e sincronização com exibição
    const compInput = document.getElementById('fDataCompetencia');
    const dispComp = document.getElementById('dispDataCompetencia');
    const updateDispComp = () => {
      if (dispComp && compInput?.value) {
        const parts = compInput.value.split('-');
        if (parts.length === 3) {
          dispComp.value = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
      }
    };
    if (compInput) {
      if (!compInput.value) {
        compInput.value = new Date().toISOString().substring(0, 10);
      }
      updateDispComp();
      compInput.addEventListener('change', updateDispComp);
      compInput.addEventListener('input', updateDispComp);
    }

    // Inicializa contador da descrição
    const descEl = document.getElementById('fDescricaoServico');
    if (descEl) {
      this.handleDescricaoInput(descEl);
    }

    // CNPJ do Prestador: Validação de Procuração em tempo real
    const cnpjPrestInput = document.getElementById('fPrestadorCnpj');
    if (cnpjPrestInput) {
      cnpjPrestInput.addEventListener('input', (e) => {
        this.formatDocInput(e.target);
        this.validateProxyDebounced(e.target.value);
      });
    }

    // Input do Modal de Representação
    const repDocInput = document.getElementById('repDocInput');
    if (repDocInput) {
      repDocInput.addEventListener('input', (e) => {
        this.formatDocInput(e.target);
      });
    }

    // Documento do Tomador: Formatação CPF/CNPJ e busca inteligente
    const docTomaInput = document.getElementById('fTomadorDoc');
    if (docTomaInput) {
      docTomaInput.addEventListener('input', (e) => {
        this.formatDocInput(e.target);
        const clean = e.target.value.replace(/\D/g, '');
        if (clean.length === 11 || clean.length === 14) {
          clearTimeout(this._tomadorSearchTimer);
          this._tomadorSearchTimer = setTimeout(() => {
            this.buscarTomador(true);
          }, 350);
        }
      });
    }

    const nomeTomaInput = document.getElementById('fTomadorNome');
    if (nomeTomaInput) {
      nomeTomaInput.addEventListener('input', () => this.applyTomadorRetencaoRules());
      nomeTomaInput.addEventListener('blur', () => this.applyTomadorRetencaoRules());
    }

    // Input do Carregar por Tomador: Formatação CPF/CNPJ
    const loadPrevDocInput = document.getElementById('loadPrevTomadorDoc');
    if (loadPrevDocInput) {
      loadPrevDocInput.addEventListener('input', (e) => {
        this.formatDocInput(e.target);
      });
    }

    // CEP do Tomador: Busca automática
    const cepInput = document.getElementById('fTomadorCep');
    if (cepInput) {
      cepInput.addEventListener('blur', (e) => {
        this.consultarCep(e.target.value);
      });
    }
  },

  async loadInitialData() {
    try {
      const [statusRes, auxRes] = await Promise.all([
        safeFetchJson('/api/status'),
        safeFetchJson('/api/aux/ibge-tributos')
      ]);

      this.state.currentEnvironment = statusRes.currentEnvironment;
      this.state.envConfig = statusRes.envConfig;
      this.state.certificate = statusRes.certificate;
      this.state.activeRepresentation = statusRes.activeRepresentation || null;
      this.state.recentRepresentations = statusRes.recentRepresentations || [];
      this.state.auxData = auxRes;

      // Se há credenciais Serpro salvas nas settings
      if (statusRes.settings) {
        const keyEl = document.getElementById('cfgSerproKey');
        const secEl = document.getElementById('cfgSerproSecret');
        if (keyEl && statusRes.settings.serproConsumerKey) keyEl.value = statusRes.settings.serproConsumerKey;
        if (secEl && statusRes.settings.serproConsumerSecret) secEl.value = statusRes.settings.serproConsumerSecret;
      }

      this.populateAuxDropdowns();
      this.updateRepresentationUI();
      await this.loadHistory();
      await this.loadTemplates();
    } catch (err) {
      console.error('Erro ao carregar dados iniciais:', err);
      window.friendlyErrorModal.show({
        title: 'Falha na Inicialização do Emissor',
        category: 'Conexão Local',
        message: 'Não foi possível carregar as configurações do servidor.',
        technicalDetail: err.message
      });
    }
  },

  renderHeader() {
    // 1. Badge do Ambiente
    const envBadge = document.getElementById('currentEnvBadge');
    if (envBadge && this.state.envConfig) {
      envBadge.className = `px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm flex items-center space-x-1.5 cursor-pointer ${this.state.envConfig.badgeColor} hover:opacity-95 transition-opacity`;
      envBadge.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-white animate-pulse"></span>
        <span>${this.state.envConfig.tagText}</span>
      `;
    }

    // 2. Certificado Digital
    const certBadge = document.getElementById('topCertInfo');
    if (certBadge) {
      if (this.state.certificate) {
        const c = this.state.certificate;
        certBadge.innerHTML = `
          <div onclick="App.switchTab('certificado')" class="flex items-center space-x-2 text-xs bg-slate-800 hover:bg-slate-700/80 border border-slate-700 px-3 py-1.5 rounded-xl text-slate-200 cursor-pointer transition-colors" title="Ver detalhes do certificado">
            <i data-lucide="shield-check" class="w-4 h-4 text-emerald-400"></i>
            <div>
              <div class="font-bold truncate max-w-[170px] text-white" title="${c.procuradorName}">${c.procuradorName}</div>
              <div class="text-[10px] text-slate-400 font-mono">${c.procuradorDoc} • ${c.daysRemaining} dias</div>
            </div>
          </div>
        `;
      } else {
        certBadge.innerHTML = `
          <button onclick="App.switchTab('certificado')" class="flex items-center space-x-1.5 text-xs bg-amber-500/10 border border-amber-500/40 text-amber-300 hover:bg-amber-500/20 px-3 py-1.5 rounded-xl transition-all">
            <i data-lucide="upload-cloud" class="w-4 h-4 text-amber-400"></i>
            <span class="font-semibold">Carregar Certificado A1</span>
          </button>
        `;
      }
    }

    this.updateRepresentationUI();
    if (window.lucide) lucide.createIcons();
  },

  // --- PROCURAÇÃO E REPRESENTAÇÃO ---
  updateRepresentationUI() {
    const repText = document.getElementById('topRepresentationText');
    const bannerTitle = document.getElementById('dashBannerTitle');
    const bannerSub = document.getElementById('dashBannerSub');
    const active = this.state.activeRepresentation;

    if (active) {
      const displayText = `${active.razaoSocial} (${active.cnpj})`;
      if (repText) repText.innerText = displayText;
      if (bannerTitle) bannerTitle.innerText = active.razaoSocial;
      if (bannerSub) {
        bannerSub.innerHTML = `Representando CNPJ <strong>${active.cnpj}</strong> via procuração eletrônica do certificado digital ativo.`;
      }
      const loadRepEl = document.getElementById('loadPreviousNoteActiveCompanyName');
      if (loadRepEl) loadRepEl.innerText = displayText;
      this.fillEmissionFormWithRepresentation(active);
    } else {
      if (repText) repText.innerText = 'Sem Representação (Clique para definir)';
      if (bannerTitle) bannerTitle.innerText = 'Nenhuma empresa representada selecionada';
      if (bannerSub) {
        bannerSub.innerText = 'Basta informar o CPF ou CNPJ que deseja representar para emitir e consultar no ADN.';
      }
      const loadRepEl = document.getElementById('loadPreviousNoteActiveCompanyName');
      if (loadRepEl) loadRepEl.innerText = 'Selecionar Representada...';
    }
  },

  async openRepresentationModal() {
    const modal = document.getElementById('representationModal');
    if (!modal) return;

    modal.classList.remove('hidden');
    const searchInput = document.getElementById('repSearchInput');
    if (searchInput) {
      searchInput.value = '';
      setTimeout(() => searchInput.focus(), 100);
    }
    const docInput = document.getElementById('repDocInput');
    if (docInput) docInput.value = '';

    await this.loadRepresentationClients();
    if (window.lucide) lucide.createIcons();
  },

  closeRepresentationModal() {
    const modal = document.getElementById('representationModal');
    if (modal) modal.classList.add('hidden');
  },

  async loadRepresentationClients() {
    try {
      const res = await safeFetchJson('/api/representation/clients');
      if (res && res.clients) {
        this.state.allClients = res.clients;
      } else {
        this.state.allClients = this.state.recentRepresentations || [];
      }
    } catch (_) {
      this.state.allClients = this.state.recentRepresentations || [];
    }
    this.renderRepresentationClients();
  },

  filterRepresentationClients(term) {
    const q = (term || '').trim().toLowerCase();
    const cleanQ = q.replace(/\D/g, '');
    const list = this.state.allClients || [];

    if (!q) {
      this.renderRepresentationClients(list);
      return;
    }

    const filtered = list.filter(c => {
      const nome = (c.razaoSocial || '').toLowerCase();
      const fant = (c.nomeFantasia || '').toLowerCase();
      const doc = (c.cnpj || '').toLowerCase();
      const docRaw = c.cnpjRaw || '';
      return (
        nome.includes(q) ||
        fant.includes(q) ||
        doc.includes(q) ||
        (cleanQ && docRaw.includes(cleanQ))
      );
    });

    this.renderRepresentationClients(filtered, q);
  },

  renderRepresentationClients(listToRender, searchFilter = '') {
    const target = document.getElementById('repClientsList');
    const badge = document.getElementById('repClientsCountBadge');
    if (!target) return;

    const list = listToRender || this.state.allClients || [];
    if (badge) {
      const total = (this.state.allClients || []).length;
      badge.innerText = `${total} empresa${total === 1 ? '' : 's'}`;
    }

    if (list.length === 0) {
      target.innerHTML = `
        <div class="p-6 text-center text-xs text-slate-500 space-y-1">
          <p class="font-bold text-slate-700">Nenhum cliente encontrado${searchFilter ? ` para "${searchFilter}"` : ''}</p>
          <p class="text-[11px] text-slate-400">Informe o CPF ou CNPJ no campo abaixo para cadastrar e representar.</p>
        </div>
      `;
      return;
    }

    const activeCnpj = (this.state.activeRepresentation?.cnpjRaw || '').replace(/\D/g, '');

    target.innerHTML = list.map(item => {
      const isActive = item.cnpjRaw === activeCnpj;
      const docFormatted = item.cnpj || item.cnpjRaw;
      const cidade = item.municipioNome ? `${item.municipioNome}${item.uf ? `/${item.uf}` : ''}` : '';

      return `
        <div onclick="App.selecionarRepresentacao('${item.cnpjRaw}')" class="flex items-center justify-between px-4 py-2.5 hover:bg-emerald-50/60 cursor-pointer transition-colors group ${isActive ? 'bg-emerald-50/50 border-l-4 border-emerald-600' : ''}">
          <div class="flex items-center space-x-2.5 min-w-0 pr-2">
            <div class="w-6 h-6 rounded-md ${isActive ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-800'} flex items-center justify-center shrink-0 transition-colors">
              <i data-lucide="building-2" class="w-3.5 h-3.5"></i>
            </div>
            <div class="min-w-0">
              <div class="font-bold text-xs text-slate-900 group-hover:text-emerald-950 truncate" title="${item.razaoSocial}">
                ${item.razaoSocial}
              </div>
              <div class="text-[10px] text-slate-400 flex items-center space-x-2">
                <span class="font-mono text-slate-500">${docFormatted}</span>
                ${cidade ? `<span>•</span><span>${cidade}</span>` : ''}
              </div>
            </div>
          </div>
          <div class="flex items-center space-x-2 shrink-0">
            ${isActive ? `
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center space-x-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                <span>Ativa</span>
              </span>
            ` : `
              <span class="text-[11px] font-semibold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-0.5">
                <span>Representar</span>
                <i data-lucide="arrow-right" class="w-3 h-3"></i>
              </span>
            `}
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  },

  renderRecentRepresentations() {
    this.loadRepresentationClients();
  },

  async submitRepresentar(event) {
    if (event) event.preventDefault();
    const input = document.getElementById('repDocInput');
    const doc = input ? input.value : '';

    if (!doc) {
      alert('Informe o CPF ou CNPJ que deseja cadastrar/representar.');
      return;
    }

    const btn = document.getElementById('btnSubmitRep');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="animate-spin text-xs">⌛</span>`;
    }

    try {
      const res = await safeFetchJson('/api/representation/representar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doc })
      });

      if (!res.success) {
        window.friendlyErrorModal.show(res.error);
      } else {
        this.state.activeRepresentation = res.representedCompany;
        this.state.recentRepresentations = res.recentRepresentations;
        this.updateRepresentationUI();
        this.closeRepresentationModal();
        await this.loadRepresentationClients();
        await this.loadHistory();
        await this.loadTemplates();
      }
    } catch (e) {
      window.friendlyErrorModal.show({
        title: 'Falha na Representação',
        category: 'Procuração Eletrônica',
        message: 'Não foi possível ativar a representação para este documento.',
        technicalDetail: e.message
      });
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="plus" class="w-3.5 h-3.5"></i><span>Adicionar</span>`;
        if (window.lucide) lucide.createIcons();
      }
    }
  },

  async selecionarRepresentacao(cnpjRaw) {
    await this.submitRepresentarDoc(cnpjRaw);
  },

  async submitRepresentarDoc(cleanDoc) {
    try {
      const res = await safeFetchJson('/api/representation/representar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doc: cleanDoc })
      });

      if (!res.success) {
        window.friendlyErrorModal.show(res.error);
      } else {
        this.state.activeRepresentation = res.representedCompany;
        this.state.recentRepresentations = res.recentRepresentations;
        this.updateRepresentationUI();
        this.closeRepresentationModal();
        await this.loadHistory();
        await this.loadTemplates();
      }
    } catch (e) {
      window.friendlyErrorModal.show({
        title: 'Falha na Representação',
        category: 'Procuração Eletrônica',
        message: 'Não foi possível ativar a representação para este documento.',
        technicalDetail: e.message
      });
    }
  },

  representarCnpjDigitado() {
    const el = document.getElementById('fPrestadorCnpj');
    if (el && el.value) {
      this.submitRepresentarDoc(el.value);
    } else {
      alert('Digite o CNPJ no campo correspondente.');
    }
  },

  fillEmissionFormWithRepresentation(comp) {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el && val !== undefined && val !== null) el.value = val;
    };

    setVal('fPrestadorCnpj', comp.cnpj);
    setVal('fPrestadorRazaoSocial', comp.razaoSocial);
    setVal('fPrestadorIm', comp.im || '842161');
    const codIbge = comp.municipioIbge || '2800308';
    setVal('fMunicipioIbge', codIbge);
    setVal('fLocalPrestacaoIbge', codIbge);
    const nomeCidade = comp.municipioNome ? `${comp.municipioNome}/${comp.uf || 'SE'}` : (IBGE_MUNICIPIOS_MAP[codIbge] || 'Aracaju/SE');
    setVal('fMunicipioIncidencia', nomeCidade);
    this.atualizarDisplayMunicipio(codIbge, 'prestador');
    this.atualizarDisplayMunicipio(codIbge, 'local');

    const hoje = new Date().toISOString().substring(0, 10);
    setVal('fDataCompetencia', hoje);
    const dispComp = document.getElementById('dispDataCompetencia');
    if (dispComp) dispComp.value = new Date().toLocaleDateString('pt-BR');

    if (comp.isMei || comp.opSimpNac === 2) {
      setVal('fOpSimpNac', 2); // 2 = MEI
    } else if (comp.regimeTributario === 1 || comp.regimeTributario === 2 || comp.opSimpNac === 3) {
      setVal('fOpSimpNac', 3); // 3 = Optante - Microempresa ou Empresa de Pequeno Porte (ME/EPP)
    } else if (comp.opSimpNac === 4) {
      setVal('fOpSimpNac', 4); // 4 = Pendente
    } else {
      setVal('fOpSimpNac', 1); // 1 = Não optante
    }
    setVal('fRegApTribSN', 1);

    this.validateProxyDebounced(comp.cnpj);
    this.calculateEmissionTotals();
  },

  // --- CARREGAR DADOS DE UMA NOTA ANTERIOR ---
  showLoadPreviousNoteAlert(msg) {
    const alertEl = document.getElementById('loadPrevNoteAlert');
    const msgEl = document.getElementById('loadPrevNoteAlertMsg');
    if (alertEl && msgEl) {
      msgEl.innerText = msg;
      alertEl.classList.remove('hidden');
      if (window.lucide) lucide.createIcons();
      clearTimeout(this._loadNoteAlertTimer);
      this._loadNoteAlertTimer = setTimeout(() => {
        alertEl.classList.add('hidden');
      }, 8000);
    }
  },

  async getNotesForActiveRepresentation() {
    const active = this.state.activeRepresentation;
    if (!active || !active.cnpjRaw) {
      alert('Selecione primeiro a Empresa Representada para consultar suas notas fiscais.');
      this.openRepresentationModal();
      return null;
    }
    const cleanRepCnpj = active.cnpjRaw;

    // Se o histórico estiver vazio, busca do backend
    if (!this.state.history || this.state.history.length === 0) {
      await this.loadHistory();
    }

    const allNotes = this.state.history || [];
    // Filtra estritamente notas onde a empresa representada é a PRESTADORA (emitente)
    const emitidas = allNotes.filter(n => {
      const prestCnpj = (n.prestador && (n.prestador.cnpjRaw || (n.prestador.cnpj && n.prestador.cnpj.replace(/\D/g, '')))) || '';
      return prestCnpj.includes(cleanRepCnpj);
    });

    return { active, cleanRepCnpj, emitidas };
  },

  preencherFormularioComNfse(nfse) {
    if (!nfse) return;

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el && val !== undefined && val !== null) {
        el.value = val;
      }
    };

    const setRadio = (name, val) => {
      const radio = document.querySelector(`input[name="${name}"][value="${val}"]`);
      if (radio) radio.checked = true;
    };

    // 1. Dados do Tomador
    if (nfse.tomador) {
      const t = nfse.tomador;
      const rawDoc = t.doc || t.docRaw || '';
      setVal('fTomadorDoc', rawDoc ? this.formatDocRaw(rawDoc) : '');
      setVal('fTomadorNome', t.nome || t.razaoSocial || '');
      setVal('fTomadorIm', t.im || '');
      setVal('fTomadorEmail', t.email || '');
      setVal('fTomadorTelefone', t.telefone || '');

      // Endereço do Tomador
      const end = t.endereco || t;
      const temEndereco = Boolean(end.cep || end.logradouro || end.bairro || end.municipio || end.xMun);
      const chkEnd = document.getElementById('chkInformarEnderecoTomador');
      if (chkEnd) {
        chkEnd.checked = temEndereco;
        this.toggleEnderecoTomador();
      }

      if (temEndereco) {
        setVal('fTomadorCep', end.cep || '');
        setVal('fTomadorLogradouro', end.logradouro || end.xLgr || '');
        setVal('fTomadorNumero', end.numero || end.nro || '');
        setVal('fTomadorComplemento', end.complemento || end.xCpl || '');
        setVal('fTomadorBairro', end.bairro || end.xBairro || '');
        setVal('fTomadorMunicipio', end.municipio || end.xMun || '');
        setVal('fTomadorUf', end.uf || 'SE');
      }
    }

    // 2. Local do Fornecimento / Incidência
    if (nfse.servico) {
      const s = nfse.servico;
      const cMun = s.cMunIncid || s.municipioIbge || '2800308';
      setVal('fLocalPrestacaoIbge', cMun);
      setVal('fMunicipioIncidencia', IBGE_MUNICIPIOS_MAP[cMun] || s.xLocIncid || 'Aracaju/SE');
      this.atualizarDisplayMunicipio(cMun, 'local');
      setVal('fPaisPrestacao', s.cPais || '1058');

      // Código de Tributação Nacional (LC 116)
      const cTrib = s.cTribNac || s.cTribMun;
      if (cTrib) {
        this.selectCTribNacByCode(cTrib);
      }

      // NBS
      if (s.itemNbs) {
        this.selectItemNbsByCode(s.itemNbs);
      }

      // Indicador da Operação
      if (s.codigoIndicadorOperacao) {
        setVal('fCodigoIndicadorOperacao', s.codigoIndicadorOperacao);
      }

      // Descrição do Serviço
      const desc = s.descricao || s.xDescServ || '';
      setVal('fDescricaoServico', desc);
      const descEl = document.getElementById('fDescricaoServico');
      if (descEl) this.handleDescricaoInput(descEl);

      // Informações Complementares
      setVal('fArtRrt', s.artRrt || '');
      setVal('fDocReferencia', s.docReferencia || '');
      setVal('fInformacoesComplementares', s.informacoesComplementares || nfse.infAdic || '');
    }

    // 3. Valores e Retenções
    if (nfse.valores) {
      const v = nfse.valores;
      const vServ = Number(v.valorServico ?? v.vServ ?? v.valorLiquido ?? v.vLiq ?? 0);
      setVal('fValorServico', vServ > 0 ? vServ.toFixed(2) : '');

      const vInterm = Number(v.valorIntermediario ?? 0);
      setVal('fValorIntermediario', vInterm > 0 ? vInterm.toFixed(2) : '');

      const vDescIncond = Number(v.descontoIncondicionado ?? v.vDescIncond ?? 0);
      setVal('fDescontoIncondicionado', vDescIncond > 0 ? vDescIncond.toFixed(2) : '');

      const vDescCond = Number(v.descontoCondicionado ?? v.vDescCond ?? 0);
      setVal('fDescontoCondicionado', vDescCond > 0 ? vDescCond.toFixed(2) : '');

      // Retenção ISSQN
      const isRetido = Boolean(v.iss?.retido || v.vISSRet > 0);
      setRadio('fRetencaoIssqnRadio', isRetido ? 'sim' : 'nao');
      this.handleRetencaoIssqnChange(isRetido ? 'sim' : 'nao');

      if (isRetido) {
        const aliq = Number(v.iss?.aliquota ?? v.pAliq ?? 2);
        const aliqStr = aliq > 0 ? aliq.toFixed(2) : '2.00';
        setVal('fAliquotaIss', aliqStr);
        setVal('fAliquotaRetencao', aliqStr);
      }
      this.applyTomadorRetencaoRules();

      // Retenções Federais
      const retFed = v.retencoesFederais || {};
      const ir = Number(retFed.ir ?? v.vIRRF ?? 0);
      const csll = Number(retFed.csll ?? v.vCSLL ?? 0);
      const inss = Number(retFed.inss ?? v.vINSS ?? 0);
      if (ir > 0) setVal('fRetIr', ir.toFixed(2));
      if (csll > 0) setVal('fRetContrSociais', csll.toFixed(2));
      if (inss > 0) setVal('fRetInss', inss.toFixed(2));
    }

    // 4. Competência atualizada para a data corrente
    const hoje = new Date().toISOString().substring(0, 10);
    setVal('fDataCompetencia', hoje);
    const dispComp = document.getElementById('dispDataCompetencia');
    if (dispComp) dispComp.value = new Date().toLocaleDateString('pt-BR');

    // 5. Recalcula totais
    this.calculateEmissionTotals();

    // 6. Alerta de sucesso
    const numNfse = nfse.numeroNfse || nfse.numeroDps || '';
    const tomadorNome = nfse.tomador?.nome || nfse.tomador?.razaoSocial || nfse.tomador?.doc || 'Tomador';
    this.showLoadPreviousNoteAlert(`Dados da NFS-e nº ${numNfse} (${tomadorNome}) carregados com sucesso! Revise os valores antes de emitir.`);

    // 7. Scroll suave para o primeiro campo do tomador
    const tomadorDocEl = document.getElementById('fTomadorDoc');
    if (tomadorDocEl) {
      tomadorDocEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      tomadorDocEl.focus();
    }
  },

  async carregarUltimaNfseEmitida() {
    const data = await this.getNotesForActiveRepresentation();
    if (!data) return;
    const { active, emitidas } = data;

    if (emitidas.length === 0) {
      alert(`Nenhuma nota fiscal emitida anteriormente foi localizada no acervo de ${active.razaoSocial} (${active.cnpj}).`);
      return;
    }

    // Ordena decrescente pela data mais recente ou maior número
    const sorted = [...emitidas].sort((a, b) => {
      const timeA = new Date(a.dataEmissao || a.dataAutorizacao || a.createdAt || 0).getTime();
      const timeB = new Date(b.dataEmissao || b.dataAutorizacao || b.createdAt || 0).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return (Number(b.numeroNfse) || 0) - (Number(a.numeroNfse) || 0);
    });

    const lastNote = sorted[0];
    this.preencherFormularioComNfse(lastNote);
  },

  async carregarNfsePorNumero() {
    const data = await this.getNotesForActiveRepresentation();
    if (!data) return;
    const { active, emitidas } = data;

    const ano = (document.getElementById('loadPrevNfseAno')?.value || '').trim();
    const numInput = (document.getElementById('loadPrevNfseNumero')?.value || '').trim();
    const cleanNum = numInput.replace(/\D/g, '');

    if (!cleanNum) {
      alert('Informe o número da NFS-e ou chave de acesso que deseja carregar.');
      document.getElementById('loadPrevNfseNumero')?.focus();
      return;
    }

    const match = emitidas.find(n => {
      const nNum = String(n.numeroNfse || '').replace(/\D/g, '');
      const nChave = String(n.chaveAcesso || '').replace(/\D/g, '');
      const nDps = String(n.numeroDps || '').replace(/\D/g, '');

      if (ano) {
        const dEmissao = n.dataEmissao || n.dataAutorizacao || n.createdAt || '';
        const comp = String(n.competencia || '');
        const noteAno = dEmissao ? new Date(dEmissao).getFullYear().toString() : (comp.slice(0, 4) || '');
        if (noteAno && noteAno !== ano) {
          return false;
        }
      }

      return nNum === cleanNum ||
             nNum.endsWith(cleanNum) ||
             nChave === cleanNum ||
             nChave.endsWith(cleanNum) ||
             nDps === cleanNum;
    });

    if (!match) {
      const anoMsg = ano ? ` no ano de ${ano}` : '';
      alert(`Nenhuma NFS-e de número "${numInput}"${anoMsg} foi localizada no acervo de ${active.razaoSocial} (${active.cnpj}).`);
      return;
    }

    this.preencherFormularioComNfse(match);
  },

  async carregarNfsePorTomador() {
    const data = await this.getNotesForActiveRepresentation();
    if (!data) return;
    const { active, emitidas } = data;

    const docInput = (document.getElementById('loadPrevTomadorDoc')?.value || '').trim();
    const cleanDoc = docInput.replace(/\D/g, '');

    if (!cleanDoc) {
      alert('Informe o CPF ou CNPJ do Tomador para carregar a nota mais recente emitida para ele.');
      document.getElementById('loadPrevTomadorDoc')?.focus();
      return;
    }

    const matchNotes = emitidas.filter(n => {
      const tDoc = (n.tomador && (n.tomador.docRaw || (n.tomador.doc && n.tomador.doc.replace(/\D/g, '')))) || '';
      return tDoc.includes(cleanDoc) || cleanDoc.includes(tDoc);
    });

    if (matchNotes.length === 0) {
      alert(`Nenhuma nota emitida anteriormente para o tomador "${docInput}" foi localizada no acervo de ${active.razaoSocial} (${active.cnpj}).`);
      return;
    }

    // Ordena pela nota mais recente emitida para este tomador
    const sorted = [...matchNotes].sort((a, b) => {
      const timeA = new Date(a.dataEmissao || a.dataAutorizacao || a.createdAt || 0).getTime();
      const timeB = new Date(b.dataEmissao || b.dataAutorizacao || b.createdAt || 0).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return (Number(b.numeroNfse) || 0) - (Number(a.numeroNfse) || 0);
    });

    const mostRecent = sorted[0];
    this.preencherFormularioComNfse(mostRecent);
  },

  // --- MODELOS PRONTOS DE NOTA FISCAL (TEMPLATES) ---
  async loadTemplates() {
    const cnpj = this.state.activeRepresentation?.cnpjRaw || '';
    if (!cnpj) {
      this.state.templates = [];
      this.renderTemplatesDropdown();
      return;
    }
    try {
      const res = await safeFetchJson(`/api/templates?cnpj=${cnpj}`);
      this.state.templates = res.templates || [];
      this.renderTemplatesDropdown();
    } catch (err) {
      console.warn('Erro ao carregar modelos:', err.message);
      this.state.templates = [];
      this.renderTemplatesDropdown();
    }
  },

  renderTemplatesDropdown() {
    const select = document.getElementById('selectEmissionTemplate');
    if (!select) return;

    const templates = this.state.templates || [];
    let html = '<option value="">Nenhum modelo selecionado (Preenchimento manual)</option>';
    templates.forEach(t => {
      const valStr = t.valorServico ? ` - R$ ${Number(t.valorServico).toFixed(2).replace('.', ',')}` : '';
      html += `<option value="${t.id}">${t.nome} (LC 116: ${t.cTribNac || 'Geral'}${valStr})</option>`;
    });
    select.innerHTML = html;
  },

  handleTemplateSelectChange(templateId) {
    // Mantém estado de seleção pronto
  },

  aplicarModelo(template) {
    if (!template) return;

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el && val !== undefined && val !== null) {
        el.value = val;
      }
    };

    const setRadio = (name, val) => {
      const radio = document.querySelector(`input[name="${name}"][value="${val}"]`);
      if (radio) radio.checked = true;
    };

    // 1. Serviço & Tributação
    if (template.cTribNac) {
      this.selectCTribNacByCode(template.cTribNac);
    }
    if (template.itemNbs) {
      this.selectItemNbsByCode(template.itemNbs);
    }
    if (template.codigoIndicadorOperacao) {
      setVal('fCodigoIndicadorOperacao', template.codigoIndicadorOperacao);
    }
    if (template.localPrestacaoIbge) {
      setVal('fLocalPrestacaoIbge', template.localPrestacaoIbge);
      setVal('fMunicipioIncidencia', IBGE_MUNICIPIOS_MAP[template.localPrestacaoIbge] || 'Aracaju/SE');
    }
    if (template.descricaoServico) {
      setVal('fDescricaoServico', template.descricaoServico);
      const descEl = document.getElementById('fDescricaoServico');
      if (descEl) this.handleDescricaoInput(descEl);
    }
    if (template.artRrt) setVal('fArtRrt', template.artRrt);
    if (template.docReferencia) setVal('fDocReferencia', template.docReferencia);
    if (template.informacoesComplementares) setVal('fInformacoesComplementares', template.informacoesComplementares);

    // 2. Valores e Retenções
    if (template.valorServico !== undefined && template.valorServico !== null && template.valorServico !== '') {
      const v = Number(template.valorServico);
      setVal('fValorServico', v > 0 ? v.toFixed(2) : '');
    }
    if (template.descontoIncondicionado) setVal('fDescontoIncondicionado', Number(template.descontoIncondicionado).toFixed(2));
    if (template.descontoCondicionado) setVal('fDescontoCondicionado', Number(template.descontoCondicionado).toFixed(2));

    const retIss = template.retencaoIssqn || 'nao';
    setRadio('fRetencaoIssqnRadio', retIss);
    this.handleRetencaoIssqnChange(retIss);
    if (retIss === 'sim' && template.aliquotaIss) {
      setVal('fAliquotaIss', Number(template.aliquotaIss).toFixed(2));
    }

    if (template.retIr) setVal('fRetIr', Number(template.retIr).toFixed(2));
    if (template.retContrSociais) setVal('fRetContrSociais', Number(template.retContrSociais).toFixed(2));
    if (template.retInss) setVal('fRetInss', Number(template.retInss).toFixed(2));

    // 3. Limpa e foca no Tomador
    setVal('fTomadorDoc', '');
    setVal('fTomadorNome', '');
    setVal('fTomadorIm', '');
    setVal('fTomadorEmail', '');
    setVal('fTomadorTelefone', '');
    setVal('fTomadorCep', '');
    setVal('fTomadorLogradouro', '');
    setVal('fTomadorNumero', '');
    setVal('fTomadorComplemento', '');
    setVal('fTomadorBairro', '');
    setVal('fTomadorMunicipio', '');

    // 4. Recalcula totais
    this.calculateEmissionTotals();

    // 5. Toast Alert
    const alertEl = document.getElementById('templateAlert');
    const msgEl = document.getElementById('templateAlertMsg');
    if (alertEl && msgEl) {
      msgEl.innerText = `Modelo "${template.nome}" aplicado com sucesso! Informe o tomador para emitir a nota.`;
      alertEl.classList.remove('hidden');
      if (window.lucide) lucide.createIcons();
      clearTimeout(this._tplAlertTimer);
      this._tplAlertTimer = setTimeout(() => alertEl.classList.add('hidden'), 7000);
    }

    // 6. Scroll até o documento do tomador
    const docTomador = document.getElementById('fTomadorDoc');
    if (docTomador) {
      docTomador.scrollIntoView({ behavior: 'smooth', block: 'center' });
      docTomador.focus();
    }
  },

  aplicarModeloSelecionado() {
    const select = document.getElementById('selectEmissionTemplate');
    const id = select?.value;
    if (!id) {
      alert('Selecione um modelo na lista suspensa para aplicar no formulário.');
      select?.focus();
      return;
    }
    const tpl = (this.state.templates || []).find(t => t.id === id);
    if (tpl) {
      this.aplicarModelo(tpl);
    }
  },

  openSaveCurrentAsTemplateModal() {
    if (!this.state.activeRepresentation) {
      alert('Selecione primeiro a Empresa Representada para salvar um modelo para ela.');
      this.openRepresentationModal();
      return;
    }
    const modal = document.getElementById('modalSalvarModelo');
    const input = document.getElementById('tplNomeInput');
    if (input) input.value = '';
    if (modal) modal.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
    setTimeout(() => input?.focus(), 100);
  },

  closeSaveCurrentAsTemplateModal() {
    const modal = document.getElementById('modalSalvarModelo');
    if (modal) modal.classList.add('hidden');
  },

  async submitSalvarModelo(event) {
    if (event) event.preventDefault();
    const nome = (document.getElementById('tplNomeInput')?.value || '').trim();
    if (!nome) {
      alert('Informe um nome para o modelo.');
      return;
    }

    const cleanRepCnpj = this.state.activeRepresentation?.cnpjRaw;
    if (!cleanRepCnpj) {
      alert('Empresa representada não selecionada.');
      return;
    }

    const getVal = (id) => document.getElementById(id)?.value?.trim() || '';
    const getNum = (id) => {
      const v = document.getElementById(id)?.value?.replace(',', '.');
      return v && !isNaN(v) ? parseFloat(v) : null;
    };

    const templateData = {
      nome,
      prestadorCnpj: cleanRepCnpj,
      cTribNac: getVal('fCTribNac'),
      itemNbs: getVal('fItemNbs'),
      codigoIndicadorOperacao: parseInt(getVal('fCodigoIndicadorOperacao'), 10) || 1,
      descricaoServico: getVal('fDescricaoServico'),
      artRrt: getVal('fArtRrt'),
      docReferencia: getVal('fDocReferencia'),
      informacoesComplementares: getVal('fInformacoesComplementares'),
      localPrestacaoIbge: getVal('fLocalPrestacaoIbge'),
      valorServico: getNum('fValorServico'),
      descontoIncondicionado: getNum('fDescontoIncondicionado'),
      descontoCondicionado: getNum('fDescontoCondicionado'),
      retencaoIssqn: document.querySelector('input[name="fRetencaoIssqnRadio"]:checked')?.value || 'nao',
      aliquotaIss: getNum('fAliquotaIss'),
      retIr: getNum('fRetIr'),
      retContrSociais: getNum('fRetContrSociais'),
      retInss: getNum('fRetInss')
    };

    try {
      const res = await safeFetchJson('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
      });

      if (!res.success) {
        alert(res.error || 'Erro ao salvar modelo.');
        return;
      }

      this.closeSaveCurrentAsTemplateModal();
      await this.loadTemplates();
      
      const select = document.getElementById('selectEmissionTemplate');
      if (select && res.template) {
        select.value = res.template.id;
      }

      alert(`Modelo "${nome}" salvo com sucesso para esta empresa!`);
    } catch (err) {
      alert('Erro ao salvar modelo: ' + err.message);
    }
  },

  openManageTemplatesModal() {
    if (!this.state.activeRepresentation) {
      alert('Selecione primeiro a Empresa Representada para gerenciar seus modelos.');
      this.openRepresentationModal();
      return;
    }

    const modal = document.getElementById('modalGerenciarModelos');
    const nameEl = document.getElementById('manageTemplatesCompanyName');
    if (nameEl) {
      nameEl.innerText = `${this.state.activeRepresentation.razaoSocial} (${this.state.activeRepresentation.cnpj})`;
    }

    this.renderManageTemplatesList();
    if (modal) modal.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  },

  closeManageTemplatesModal() {
    const modal = document.getElementById('modalGerenciarModelos');
    if (modal) modal.classList.add('hidden');
  },

  renderManageTemplatesList() {
    const target = document.getElementById('manageTemplatesList');
    if (!target) return;

    const templates = this.state.templates || [];
    if (templates.length === 0) {
      target.innerHTML = `
        <div class="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
          <i data-lucide="layout-template" class="w-8 h-8 text-slate-400 mx-auto"></i>
          <p class="text-xs font-bold text-slate-700">Nenhum modelo cadastrado para esta empresa.</p>
          <p class="text-[11px] text-slate-500">Preencha os dados do serviço no formulário e clique em "Salvar Atual como Modelo" para criar o seu primeiro modelo.</p>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    target.innerHTML = templates.map(t => {
      const valStr = t.valorServico ? `R$ ${Number(t.valorServico).toFixed(2).replace('.', ',')}` : 'Valor variável';
      const cTrib = t.cTribNac || 'Padrão';
      return `
        <div class="flex items-center justify-between p-3.5 bg-white border border-slate-200/90 rounded-xl hover:border-brand-500 shadow-sm transition-all group">
          <div class="space-y-1 min-w-0 pr-3">
            <div class="flex items-center space-x-2">
              <span class="font-bold text-xs text-slate-900 truncate" title="${t.nome}">${t.nome}</span>
              <span class="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-medium">LC 116: ${cTrib}</span>
            </div>
            <p class="text-[11px] text-slate-500 truncate max-w-md">${t.descricaoServico || 'Sem descrição detalhada'}</p>
            <div class="text-[10px] text-slate-400 font-medium">
              <span>Valor: <strong class="text-slate-700">${valStr}</strong></span> • 
              <span>Retenção ISS: <strong class="text-slate-700">${t.retencaoIssqn === 'sim' ? 'Sim' : 'Não'}</strong></span>
            </div>
          </div>
          <div class="flex items-center space-x-1.5 shrink-0">
            <button type="button" onclick="App.aplicarModeloPorId('${t.id}')" class="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold text-xs rounded-lg transition-colors flex items-center space-x-1" title="Aplicar este modelo agora">
              <i data-lucide="wand-2" class="w-3.5 h-3.5"></i>
              <span>Aplicar</span>
            </button>
            <button type="button" onclick="App.excluirModelo('${t.id}', '${t.nome.replace(/'/g, "\\'")}')" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Excluir modelo">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  },

  aplicarModeloPorId(id) {
    const tpl = (this.state.templates || []).find(t => t.id === id);
    if (tpl) {
      const select = document.getElementById('selectEmissionTemplate');
      if (select) select.value = id;
      this.closeManageTemplatesModal();
      this.aplicarModelo(tpl);
    }
  },

  async excluirModelo(id, nome) {
    if (!confirm(`Tem certeza que deseja excluir o modelo "${nome}"?`)) return;
    const cnpj = this.state.activeRepresentation?.cnpjRaw;
    try {
      const res = await safeFetchJson(`/api/templates/${id}?cnpj=${cnpj}`, { method: 'DELETE' });
      if (res.success) {
        await this.loadTemplates();
        this.renderManageTemplatesList();
      } else {
        alert('Não foi possível excluir o modelo.');
      }
    } catch (err) {
      alert('Erro ao excluir modelo: ' + err.message);
    }
  },

  // --- ETAPAS DA EMISSÃO (WIZARD / STEPPER) ---
  goToEmissionStep(step) {
    if (step < 1) step = 1;
    if (step > 4) step = 4;

    // Se estiver avançando da Etapa 1 para a 2, valida dados essenciais
    if (step === 2 && this.state.currentEmissionStep === 1) {
      const tomadorDoc = (document.getElementById('fTomadorDoc')?.value || '').replace(/\D/g, '');
      const loc = document.querySelector('input[name="fTomadorLocalizacao"]:checked')?.value || 'brasil';
      if (loc !== 'nao_informado') {
        if (!tomadorDoc) {
          alert('Por favor, informe o CPF ou CNPJ do Tomador antes de avançar para a etapa de Serviço.');
          document.getElementById('fTomadorDoc')?.focus();
          return;
        }
        if (loc === 'brasil' && tomadorDoc.length !== 11 && tomadorDoc.length !== 14) {
          alert(`O documento do tomador deve conter 11 dígitos (CPF) ou 14 dígitos (CNPJ). Foram informados ${tomadorDoc.length} dígitos.`);
          document.getElementById('fTomadorDoc')?.focus();
          return;
        }
      }
    }

    // Se estiver avançando da Etapa 2 para a 3, valida serviço
    if (step === 3 && this.state.currentEmissionStep === 2) {
      const desc = (document.getElementById('fDescricaoServico')?.value || '').trim();
      if (!desc) {
        alert('Por favor, preencha a Descrição do Serviço antes de avançar para a etapa de Valores.');
        document.getElementById('fDescricaoServico')?.focus();
        return;
      }
    }

    // Se estiver avançando da Etapa 3 para a 4, valida valor
    if (step === 4 && this.state.currentEmissionStep === 3) {
      const val = parseFloat(document.getElementById('fValorServico')?.value || '0');
      if (isNaN(val) || val <= 0) {
        alert('Por favor, informe o Valor da Operação/Serviço prestado maior que zero.');
        document.getElementById('fValorServico')?.focus();
        return;
      }
    }

    this.state.currentEmissionStep = step;

    // Alterna visibilidade dos containers
    for (let i = 1; i <= 4; i++) {
      const container = document.getElementById(`emissionStepContainer-${i}`);
      const btn = document.getElementById(`stepTab-${i}`);
      if (container) {
        if (i === step) container.classList.remove('hidden');
        else container.classList.add('hidden');
      }
      if (btn) {
        const numCircle = btn.querySelector('.step-num-circle');
        if (i === step) {
          btn.className = 'emission-step-btn flex items-center space-x-2.5 p-2.5 rounded-xl border text-left transition-all bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-100 font-bold shadow-sm';
          if (numCircle) numCircle.className = 'step-num-circle w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0';
        } else if (i < step) {
          btn.className = 'emission-step-btn flex items-center space-x-2.5 p-2.5 rounded-xl border text-left transition-all bg-emerald-50/50 dark:bg-slate-800/80 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold hover:bg-emerald-50';
          if (numCircle) numCircle.className = 'step-num-circle w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-black text-xs shrink-0';
        } else {
          btn.className = 'emission-step-btn flex items-center space-x-2.5 p-2.5 rounded-xl border text-left transition-all bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-medium hover:bg-slate-100';
          if (numCircle) numCircle.className = 'step-num-circle w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-black text-xs shrink-0';
        }
      }
    }

    if (step === 3) {
      this.applyTomadorRetencaoRules();
      this.calculateEmissionTotals();
    } else if (step === 4) {
      this.renderRevisionSummary();
    }

    if (window.lucide) lucide.createIcons();
    const panel = document.getElementById('panel-emissao');
    if (panel) {
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },

  renderRevisionSummary() {
    const payload = this.getEmissionPayload();

    // 1. Pessoas
    const elEmitNome = document.getElementById('revEmitenteNome');
    const elEmitDoc = document.getElementById('revEmitenteDoc');
    const elEmitRegime = document.getElementById('revEmitenteRegime');
    const elTomNome = document.getElementById('revTomadorNome');
    const elTomDoc = document.getElementById('revTomadorDoc');
    const elTomEnd = document.getElementById('revTomadorEnd');

    if (elEmitNome) elEmitNome.innerText = payload.prestadorRazaoSocial || 'Não informado';
    if (elEmitDoc) elEmitDoc.innerText = `CNPJ: ${payload.prestadorCnpj || '-'}`;
    if (elEmitRegime) {
      const opSimp = parseInt(payload.opSimpNac, 10);
      let regimeDesc = 'Optante - Simples Nacional (ME/EPP)';
      if (opSimp === 1) regimeDesc = '1 - Não Optante (Regime Geral)';
      else if (opSimp === 2) regimeDesc = '2 - Optante - MEI';
      else if (opSimp === 3) regimeDesc = '3 - Optante - ME/EPP';
      else if (opSimp === 4) regimeDesc = '4 - Optante - Pendente';
      elEmitRegime.innerText = regimeDesc;
    }

    if (elTomNome) elTomNome.innerText = payload.tomadorNome || 'Não informado';
    if (elTomDoc) elTomDoc.innerText = `Doc: ${payload.tomadorDoc || 'Não informado'}`;
    if (elTomEnd) {
      if (payload.informarEnderecoTomador && (payload.tomadorLogradouro || payload.tomadorMunicipio)) {
        elTomEnd.innerText = `${payload.tomadorLogradouro || ''}, ${payload.tomadorNumero || 'S/N'} - ${payload.tomadorBairro || ''}, ${payload.tomadorMunicipio || ''}/${payload.tomadorUf || ''}`;
      } else {
        elTomEnd.innerText = 'Endereço não informado / Exterior';
      }
    }

    // 2. Serviço
    const elServCod = document.getElementById('revServicoCodigo');
    const elServAtiv = document.getElementById('revServicoAtiv');
    const elServLoc = document.getElementById('revServicoLoc');
    const elServDesc = document.getElementById('revServicoDesc');

    if (elServCod) {
      elServCod.innerText = payload.itemNbs 
        ? `LC 116: ${payload.cTribNac || '-'} | NBS: ${payload.itemNbs}` 
        : `LC 116: ${payload.cTribNac || '-'}`;
    }
    if (elServAtiv) {
      const list = this.state.auxData?.tributacaoNacional || [];
      const item = list.find(i => (i.cTribNac === payload.cTribNac) || (i.codigo?.replace(/\D/g,'').slice(0,6) === payload.cTribNac));
      elServAtiv.innerText = item ? item.descricao : 'Atividade Padrão / Prestação de Serviços';
    }
    if (elServLoc) {
      const locNome = IBGE_MUNICIPIOS_MAP[payload.localPrestacaoIbge] || payload.localPrestacaoIbge;
      const incidNome = IBGE_MUNICIPIOS_MAP[payload.municipioIncidenciaIbge] || payload.municipioIncidenciaIbge;
      elServLoc.innerText = `Prestação: ${locNome} | Incidência: ${incidNome}`;
    }
    if (elServDesc) elServDesc.innerText = payload.descricaoServico || '-';

    // 3. Valores
    const elValBruto = document.getElementById('revValorBruto');
    const elIssRet = document.getElementById('revIssRetido');
    const elRetFed = document.getElementById('revRetFederais');
    const elValLiq = document.getElementById('revValorLiquido');

    const fmtBrl = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    if (elValBruto) elValBruto.innerText = fmtBrl(payload.valorServico);
    if (elIssRet) {
      if (payload.issRetido) {
        const valIss = (payload.valorServico * (payload.aliquotaIss || 0)) / 100;
        const quemTxt = payload.tipoRetencaoIss === 3 ? 'Intermediário' : 'Tomador';
        elIssRet.innerText = `SIM (Retido pelo ${quemTxt}) - ${fmtBrl(valIss)} (${payload.aliquotaIss}%)`;
      } else {
        elIssRet.innerText = 'NÃO (Recolhido pelo Prestador)';
      }
    }
    if (elRetFed) {
      const totFed = (payload.retIr || 0) + (payload.retContrSociais || 0) + (payload.retInss || 0);
      elRetFed.innerText = fmtBrl(totFed);
    }
    if (elValLiq) {
      let liq = payload.valorServico;
      if (payload.issRetido) liq -= (payload.valorServico * (payload.aliquotaIss || 0)) / 100;
      liq -= ((payload.retIr || 0) + (payload.retContrSociais || 0) + (payload.retInss || 0));
      elValLiq.innerText = fmtBrl(liq);
    }
  },

  toggleSerieNumDps() {
    const chk = document.getElementById('chkInformarSerieNum');
    const box = document.getElementById('boxSerieNumDps');
    if (chk && box) {
      if (chk.checked) box.classList.remove('hidden');
      else box.classList.add('hidden');
    }
  },

  // ==========================================
  // AUTOCOMPLETE INTELIGENTE DE MUNICÍPIOS (5.571 Cidades do Brasil)
  // ==========================================
  abrirBuscaMunicipio(tipo) {
    const input = document.getElementById(tipo === 'local' ? 'fLocalPrestacaoSearch' : 'fMunicipioPrestadorSearch');
    this.filtrarMunicipios(input?.value || '', tipo);
    const dropdown = document.getElementById(tipo === 'local' ? 'fLocalPrestacaoDropdown' : 'fMunicipioPrestadorDropdown');
    if (dropdown) dropdown.classList.remove('hidden');
  },

  fecharBuscaMunicipio(tipo) {
    setTimeout(() => {
      const dropdown = document.getElementById(tipo === 'local' ? 'fLocalPrestacaoDropdown' : 'fMunicipioPrestadorDropdown');
      if (dropdown) dropdown.classList.add('hidden');
    }, 250);
  },

  toggleBuscaMunicipio(tipo) {
    const dropdown = document.getElementById(tipo === 'local' ? 'fLocalPrestacaoDropdown' : 'fMunicipioPrestadorDropdown');
    if (dropdown && dropdown.classList.contains('hidden')) {
      this.abrirBuscaMunicipio(tipo);
    } else if (dropdown) {
      dropdown.classList.add('hidden');
    }
  },

  filtrarMunicipios(query, tipo) {
    const dropdown = document.getElementById(tipo === 'local' ? 'fLocalPrestacaoDropdown' : 'fMunicipioPrestadorDropdown');
    if (!dropdown) return;

    let lista = (window.MUNICIPIOS_BRASIL && Array.isArray(window.MUNICIPIOS_BRASIL)) ? window.MUNICIPIOS_BRASIL : [];
    const q = (query || '').trim().toLowerCase();

    let filtrados = [];
    if (!q) {
      // Destaque para Sergipe e Bahia por padrão quando o campo está limpo
      filtrados = lista.filter(m => m.uf === 'SE' || m.uf === 'BA' || m.id === '3550308' || m.id === '3304557' || m.id === '5300108').slice(0, 30);
    } else {
      const normQ = q.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      filtrados = lista.filter(m => {
        const normNome = m.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return normNome.includes(normQ) || m.id.includes(q) || `${normNome}/${m.uf.toLowerCase()}`.includes(normQ);
      }).slice(0, 50);
    }

    if (filtrados.length === 0) {
      dropdown.innerHTML = `
        <div class="px-4 py-3 text-xs text-slate-400 text-center">
          Nenhum município encontrado para "${query}".
        </div>
      `;
      dropdown.classList.remove('hidden');
      return;
    }

    dropdown.innerHTML = filtrados.map(m => {
      const isSE = m.uf === 'SE';
      const isBA = m.uf === 'BA';
      const badgeColor = isSE ? 'bg-emerald-100 text-emerald-800' : (isBA ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700');
      const nomeCompleto = `${m.nome}/${m.uf}`;
      return `
        <div onclick="App.selecionarMunicipio('${m.id}', '${nomeCompleto.replace(/'/g, "\\'")}', '${tipo}')"
          class="flex items-center justify-between px-3.5 py-2.5 hover:bg-emerald-50/70 cursor-pointer transition-colors text-xs text-slate-800">
          <div class="flex items-center space-x-2">
            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${badgeColor}">${m.uf}</span>
            <span class="font-medium text-slate-900">${m.nome}</span>
          </div>
          <span class="font-mono text-[11px] text-slate-400">IBGE: ${m.id}</span>
        </div>
      `;
    }).join('');

    dropdown.classList.remove('hidden');
  },

  selecionarMunicipio(codigoIbge, nomeUf, tipo) {
    const isLocal = tipo === 'local';
    const inputSearch = document.getElementById(isLocal ? 'fLocalPrestacaoSearch' : 'fMunicipioPrestadorSearch');
    const inputHidden = document.getElementById(isLocal ? 'fLocalPrestacaoIbge' : 'fMunicipioIbge');
    const dropdown = document.getElementById(isLocal ? 'fLocalPrestacaoDropdown' : 'fMunicipioPrestadorDropdown');

    if (inputSearch) inputSearch.value = nomeUf;
    if (inputHidden) inputHidden.value = codigoIbge;
    if (dropdown) dropdown.classList.add('hidden');

    if (!isLocal) {
      const prestSelect = document.getElementById('fMunicipioPrestadorSelect');
      if (prestSelect) prestSelect.value = codigoIbge;
      const localSearch = document.getElementById('fLocalPrestacaoSearch');
      const localHidden = document.getElementById('fLocalPrestacaoIbge');
      if (localSearch && (!localSearch.value || localSearch.value === 'Aracaju/SE')) {
        localSearch.value = nomeUf;
      }
      if (localHidden && (!localHidden.value || localHidden.value === '2800308')) {
        localHidden.value = codigoIbge;
      }
    }

    const munIncid = document.getElementById('fMunicipioIncidencia');
    if (munIncid) munIncid.value = nomeUf;
  },

  atualizarDisplayMunicipio(codigoIbge, tipo) {
    if (!codigoIbge) return;
    const nomeUf = IBGE_MUNICIPIOS_MAP[codigoIbge] || codigoIbge;
    const isLocal = tipo === 'local';
    const inputSearch = document.getElementById(isLocal ? 'fLocalPrestacaoSearch' : 'fMunicipioPrestadorSearch');
    const inputHidden = document.getElementById(isLocal ? 'fLocalPrestacaoIbge' : 'fMunicipioIbge');
    if (inputSearch) inputSearch.value = nomeUf;
    if (inputHidden) inputHidden.value = codigoIbge;
  },

  handleMunicipioPrestadorChange(val) {
    const hiddenIbge = document.getElementById('fMunicipioIbge');
    const localPrest = document.getElementById('fLocalPrestacaoIbge');
    const munIncid = document.getElementById('fMunicipioIncidencia');
    if (hiddenIbge) hiddenIbge.value = val;
    if (localPrest) localPrest.value = val;
    const text = IBGE_MUNICIPIOS_MAP[val] || 'Aracaju/SE';
    if (munIncid) munIncid.value = text;
    this.atualizarDisplayMunicipio(val, 'prestador');
    this.atualizarDisplayMunicipio(val, 'local');
  },

  handleTomadorLocalizacaoChange(loc) {
    const box = document.getElementById('boxTomadorConteudo');
    const lbl = document.getElementById('lblTomadorDoc');
    if (loc === 'nao_informado') {
      if (box) box.classList.add('opacity-40', 'pointer-events-none');
    } else {
      if (box) box.classList.remove('opacity-40', 'pointer-events-none');
      if (lbl) lbl.innerHTML = loc === 'exterior' ? 'NIF / Documento Exterior <span class="text-rose-500">*</span>' : 'CPF/CNPJ <span class="text-rose-500">*</span>';
    }
  },

  toggleEnderecoTomador() {
    const chk = document.getElementById('chkInformarEnderecoTomador');
    const box = document.getElementById('boxEnderecoTomador');
    if (chk && box) {
      if (chk.checked) box.classList.remove('hidden');
      else box.classList.add('hidden');
    }
  },

  handleBeneficioIssChange(val) {
    const selInd = document.getElementById('fCodigoIndicadorOperacao');
    if (selInd) {
      selInd.value = val === 'sim' ? '2' : '1';
    }
  },

  handleDescricaoInput(el) {
    const span = document.getElementById('charCountDescricao');
    if (span && el) {
      span.innerText = `Total de caracteres: ${el.value.length} / 2000`;
    }
  },

  async buscarCepGenerico(cepId, lgrId, bairroId, munId, ufId) {
    const cepInput = document.getElementById(cepId);
    if (!cepInput) return;
    const cleanCep = (cepInput.value || '').replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      alert('Informe um CEP válido com 8 dígitos para consultar.');
      cepInput.focus();
      return;
    }

    try {
      const res = await fetch(`https://brasilapi.com.br/api/cep/v1/${cleanCep}`);
      if (!res.ok) throw new Error('CEP não encontrado');
      const data = await res.json();
      
      const setV = (id, v) => {
        const el = document.getElementById(id);
        if (el && v) el.value = v;
      };

      if (lgrId) setV(lgrId, data.street);
      if (bairroId) setV(bairroId, data.neighborhood);
      if (munId) setV(munId, data.city);
      if (ufId) setV(ufId, data.state);
      this.showToast(`Endereço carregado para o CEP ${cleanCep}!`);
    } catch (e) {
      try {
        const res2 = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data2 = await res2.json();
        if (data2.erro) throw new Error('CEP não encontrado');
        const setV = (id, v) => {
          const el = document.getElementById(id);
          if (el && v) el.value = v;
        };
        if (lgrId) setV(lgrId, data2.logradouro);
        if (bairroId) setV(bairroId, data2.bairro);
        if (munId) setV(munId, data2.localidade);
        if (ufId) setV(ufId, data2.uf);
        this.showToast(`Endereço carregado via ViaCEP!`);
      } catch (err2) {
        alert('Não foi possível localizar o endereço para o CEP informado.');
      }
    }
  },

  handleTomadorTipoChange(tipo) {
    const lbl = document.getElementById('lblTomadorDoc');
    const input = document.getElementById('fTomadorDoc');
    const btnBusca = document.getElementById('btnBuscarTomadorCnpj');
    const badge = document.getElementById('badgeCnpjOnline');
    if (!lbl || !input) return;

    if (badge) badge.classList.add('hidden');

    if (tipo === 'CNPJ') {
      lbl.innerHTML = 'CPF/CNPJ do Tomador <span class="text-rose-500">*</span>';
      input.placeholder = '000.000.000-00 ou 00.000.000/0000-00';
      if (btnBusca) btnBusca.classList.remove('hidden');
    } else if (tipo === 'CPF') {
      lbl.innerHTML = 'CPF do Tomador <span class="text-rose-500">*</span>';
      input.placeholder = '000.000.000-00';
      if (btnBusca) btnBusca.classList.remove('hidden');
    } else {
      lbl.innerHTML = 'NIF / Documento Exterior <span class="text-rose-500">*</span>';
      input.placeholder = 'Número de Identificação Fiscal Exterior';
      if (btnBusca) btnBusca.classList.add('hidden');
    }
  },

  handleTomadorDocBlur() {
    const input = document.getElementById('fTomadorDoc');
    if (!input) return;
    const clean = (input.value || '').replace(/\D/g, '');
    if ((clean.length === 11 || clean.length === 14) && input.dataset.lastSearchedDoc !== clean) {
      this.buscarTomador(true);
    }
  },

  /**
   * Consulta e preenche automaticamente dados do Tomador por CPF ou CNPJ,
   * priorizando o acervo histórico de notas emitidas por este prestador
   */
  async buscarTomador(isAuto = false) {
    const input = document.getElementById('fTomadorDoc');
    const btn = document.getElementById('btnBuscarTomadorCnpj');
    const badge = document.getElementById('badgeCnpjOnline');
    const lbl = document.getElementById('lblTomadorDoc');
    if (!input) return;

    const raw = (input.value || '').replace(/\D/g, '');
    if (!raw) {
      if (!isAuto) {
        alert('Por favor, digite o CPF ou CNPJ do tomador para realizar a busca.');
        input.focus();
      }
      return;
    }

    if (raw.length !== 11 && raw.length !== 14) {
      if (!isAuto) {
        alert(`O documento informado possui ${raw.length} dígitos. Informe um CPF válido (11 dígitos) ou CNPJ (14 dígitos).`);
        input.focus();
      }
      return;
    }

    // Evita busca repetida em background se o documento não foi alterado
    if (isAuto && input.dataset.lastSearchedDoc === raw) {
      return;
    }

    input.dataset.lastSearchedDoc = raw;

    // Atualiza label e formatação visual
    if (raw.length === 11) {
      if (lbl) lbl.innerHTML = 'CPF do Tomador <span class="text-rose-500">*</span>';
      input.value = raw.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    } else {
      if (lbl) lbl.innerHTML = 'CNPJ do Tomador <span class="text-rose-500">*</span>';
      input.value = raw.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    }

    let origBtnHtml = '';
    if (btn) {
      origBtnHtml = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<span class="animate-spin inline-block text-xs">⏳</span> <span class="text-[11px] hidden sm:inline">Buscando...</span>`;
    }

    try {
      const activeRep = this.state.activeRepresentation;
      const prestCnpj = activeRep?.cnpjRaw || '';
      const url = `/api/aux/tomador?doc=${raw}&prestadorCnpj=${encodeURIComponent(prestCnpj)}`;

      const res = await fetch(url);
      const json = await res.json();

      if (json.success && json.data) {
        const d = json.data;

        // Atualiza campos cadastrais
        const setVal = (id, val) => {
          const el = document.getElementById(id);
          if (el && val !== undefined && val !== null && val !== '') el.value = val;
        };

        setVal('fTomadorNome', d.nome || d.razaoSocial || d.nomeFantasia);
        if (d.im) setVal('fTomadorIm', d.im);
        if (d.email) setVal('fTomadorEmail', d.email.toLowerCase());
        if (d.telefone) setVal('fTomadorTelefone', d.telefone);

        // Preenche endereço do tomador se disponível
        const temEndereco = Boolean(d.cep || d.logradouro || d.bairro || d.municipio);
        if (temEndereco) {
          const chkEnd = document.getElementById('chkInformarEnderecoTomador');
          if (chkEnd) {
            chkEnd.checked = true;
            this.toggleEnderecoTomador();
          }
          if (d.cep) {
            const cleanCep = String(d.cep).replace(/\D/g, '');
            setVal('fTomadorCep', cleanCep.length === 8 ? cleanCep.replace(/^(\d{5})(\d{3})$/, '$1-$2') : d.cep);
          }
          setVal('fTomadorLogradouro', d.logradouro);
          setVal('fTomadorNumero', d.numero || 'S/N');
          setVal('fTomadorComplemento', d.complemento);
          setVal('fTomadorBairro', d.bairro);
          setVal('fTomadorMunicipio', d.municipio);
          setVal('fTomadorUf', d.uf || 'SE');
        }

        if (d.municipioIbge) {
          input.dataset.municipioIbge = d.municipioIbge;
        }

        // Feedback visual no badge e notificação
        if (badge) {
          badge.classList.remove('hidden');
          if (json.source === 'HISTORICO_PRESTADOR') {
            const numNfse = json.sourceNfse?.numeroNfse ? ` (NFS-e nº ${json.sourceNfse.numeroNfse})` : '';
            badge.className = 'text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300';
            badge.innerText = `✓ Histórico do Prestador${numNfse}`;
            this.showToast(`Dados do tomador "${d.nome || d.razaoSocial}" preenchidos automaticamente com base no histórico deste prestador!`);
          } else if (json.source === 'HISTORICO_SISTEMA') {
            badge.className = 'text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-300';
            badge.innerText = `✓ Histórico do Sistema`;
            this.showToast(`Dados do tomador "${d.nome || d.razaoSocial}" recuperados do acervo do emissor!`);
          } else {
            badge.className = 'text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300';
            badge.innerText = `✓ ${json.sourceLabel || 'Receita Federal'}`;
            this.showToast(`Dados da empresa "${d.razaoSocial}" carregados via Receita Federal!`);
          }
        }

        // Aplica regras de retenção obrigatória com base no tomador carregado
        this.applyTomadorRetencaoRules();
      } else {
        // Não localizado no histórico
        if (json.isCpf) {
          if (badge) {
            badge.className = 'text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-300';
            badge.innerText = '✓ Novo Tomador (CPF)';
            badge.classList.remove('hidden');
          }
          if (!isAuto) {
            this.showToast('Primeira nota deste prestador para este CPF. Preencha o nome e dados cadastrais (serão salvos automaticamente).', 'info');
          }
          const nomeInput = document.getElementById('fTomadorNome');
          if (nomeInput && !nomeInput.value.trim()) {
            nomeInput.focus();
          }
        } else {
          if (badge) badge.classList.add('hidden');
          if (!isAuto) {
            alert(`Não foi possível localizar dados cadastrais para o CNPJ ${raw}. Por favor, preencha manualmente.`);
          }
        }
      }
    } catch (err) {
      if (!isAuto) {
        alert(`Erro ao consultar dados do tomador: ${err.message}`);
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = origBtnHtml;
        if (window.lucide) lucide.createIcons();
      }
    }
  },

  /**
   * Mantém compatibilidade com chamadas anteriores de busca por CNPJ
   */
  buscarTomadorPorCnpj(isAuto = false) {
    return this.buscarTomador(isAuto);
  },

  showToast(msg, type = 'success') {
    const existing = document.getElementById('appToastPill');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'appToastPill';
    toast.className = `fixed top-5 right-5 z-50 flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xl border border-emerald-400 transition-all duration-300 transform ${
      type === 'success' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-white'
    }`;
    toast.innerHTML = `<span class="text-sm">✓</span><span>${msg}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 400);
    }, 4500);
  },

  toggleIntermediarioSection() {
    const chk = document.getElementById('chkTemIntermediario');
    const sec = document.getElementById('sectionIntermediario');
    if (sec && chk) {
      if (chk.checked) sec.classList.remove('hidden');
      else sec.classList.add('hidden');
    }
  },

  toggleConstrucaoCivilSection() {
    const chk = document.getElementById('chkConstrucaoCivil');
    const sec = document.getElementById('sectionConstrucaoCivil');
    if (sec && chk) {
      if (chk.checked) sec.classList.remove('hidden');
      else sec.classList.add('hidden');
    }
  },

  autoCalculateFederalTaxes() {
    const getNum = id => parseFloat(document.getElementById(id)?.value || 0) || 0;
    const vServ = getNum('fValorServico');
    if (vServ <= 0) {
      alert('Informe o Valor dos Serviços primeiro para calcular as alíquotas federais sugeridas.');
      return;
    }

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val.toFixed(2);
    };

    // Alíquotas federais padrão da legislação brasileira para serviços
    const pis = Math.round((vServ * 0.0065) * 100) / 100;    // 0,65%
    const cofins = Math.round((vServ * 0.0300) * 100) / 100; // 3,00%
    const csll = Math.round((vServ * 0.0100) * 100) / 100;   // 1,00%
    const irrf = Math.round((vServ * 0.0150) * 100) / 100;   // 1,50%
    const aprox = Math.round((vServ * 0.1345) * 100) / 100; // 13,45% (Lei 12.741/12)

    setVal('fRetPis', pis);
    setVal('fRetCofins', cofins);
    setVal('fRetCsll', csll);
    setVal('fRetIr', irrf);
    setVal('fTotTributosAprox', aprox);

    this.calculateEmissionTotals();
  },

  // --- DIAGNÓSTICO EM TEMPO REAL ---
  async runLiveDiagnostic() {
    const btn = document.getElementById('btnRunDiagnostic');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="animate-spin mr-2">⏳</span> Testando conexões oficiais...`;
    }

    try {
      const res = await safeFetchJson('/api/connectivity/test', { method: 'POST' });
      this.state.connectivity = res;
      this.state.lastDiagnosticReport = res;
      this.renderDiagnosticModal(res);
      this.openDiagnosticModal();
    } catch (e) {
      window.friendlyErrorModal.show({
        title: 'Falha no Diagnóstico',
        category: 'Conectividade',
        message: 'Não foi possível executar os testes de rede contra os servidores governamentais.',
        technicalDetail: e.message
      });
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="activity" class="w-4 h-4 mr-1.5 text-emerald-400"></i> Executar Diagnóstico Agora`;
        if (window.lucide) lucide.createIcons();
      }
    }
  },

  openDiagnosticModal() {
    const modal = document.getElementById('diagnosticModal');
    if (modal) modal.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  },

  closeDiagnosticModal() {
    const modal = document.getElementById('diagnosticModal');
    if (modal) modal.classList.add('hidden');
  },

  renderDiagnosticModal(diag) {
    const target = document.getElementById('diagModalBody');
    const tsEl = document.getElementById('diagTimestamp');
    if (!target) return;

    if (tsEl) tsEl.innerText = `Executado em: ${new Date(diag.timestamp).toLocaleString('pt-BR')}`;

    const rfbOk = diag.rfbDirect && diag.rfbDirect.online;
    const serproOk = diag.serproGateway && diag.serproGateway.online;
    const certOk = diag.certificate && diag.certificate.loaded;
    const repOk = diag.representation && diag.representation.active;

    target.innerHTML = `
      <!-- Banner de Conclusão -->
      <div class="p-4 rounded-xl border ${rfbOk && certOk ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-amber-50 border-amber-200 text-amber-950'} flex items-start space-x-3">
        <i data-lucide="${rfbOk && certOk ? 'check-circle' : 'alert-triangle'}" class="w-5 h-5 ${rfbOk && certOk ? 'text-emerald-600' : 'text-amber-600'} shrink-0 mt-0.5"></i>
        <div>
          <span class="font-bold text-sm block">${diag.statusSummary}</span>
          <span class="text-[11px] block mt-0.5 opacity-90">Ambiente ativo: <strong>${diag.envConfig.name}</strong></span>
        </div>
      </div>

      <!-- Grid dos 4 Componentes -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
        <!-- 1. Conexão Direta RFB ADN -->
        <div class="border border-slate-200 rounded-xl p-3.5 bg-slate-50 space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-bold text-slate-800">1. Conexão Direta RFB ADN</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${rfbOk ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
              ${rfbOk ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          <div class="text-[11px] text-slate-600 space-y-1 font-mono">
            <div><span class="text-slate-400">Endpoint:</span> ${diag.rfbDirect.endpoint}</div>
            <div><span class="text-slate-400">Latência:</span> ${diag.rfbDirect.latencyMs} ms</div>
            <div><span class="text-slate-400">Status:</span> ${diag.rfbDirect.statusText || 'mTLS Handshake'}</div>
          </div>
        </div>

        <!-- 2. SERPRO API Gateway -->
        <div class="border border-slate-200 rounded-xl p-3.5 bg-slate-50 space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-bold text-slate-800">2. SERPRO API Gateway</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${serproOk ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
              ${serproOk ? 'ONLINE' : 'CONFIGURAR'}
            </span>
          </div>
          <div class="text-[11px] text-slate-600 space-y-1 font-mono">
            <div><span class="text-slate-400">Endpoint:</span> ${diag.serproGateway.endpoint}</div>
            <div><span class="text-slate-400">Latência:</span> ${diag.serproGateway.latencyMs} ms</div>
            <div><span class="text-slate-400">Status:</span> ${diag.serproGateway.statusText}</div>
          </div>
        </div>

        <!-- 3. Certificado Digital A1 -->
        <div class="border border-slate-200 rounded-xl p-3.5 bg-slate-50 space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-bold text-slate-800">3. Certificado Digital A1</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${certOk ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
              ${certOk ? 'ATIVO' : 'NÃO CARREGADO'}
            </span>
          </div>
          <div class="text-[11px] text-slate-600 space-y-1 font-mono">
            ${certOk ? `
              <div><span class="text-slate-400">Titular:</span> ${diag.certificate.titular}</div>
              <div><span class="text-slate-400">Doc:</span> ${diag.certificate.documento}</div>
              <div><span class="text-slate-400">Validade:</span> ${diag.certificate.daysRemaining} dias restantes</div>
            ` : `
              <div class="text-rose-600 font-sans">Carregue o arquivo .pfx para habilitar a assinatura digital e o canal mTLS.</div>
            `}
          </div>
        </div>

        <!-- 4. Mandato de Representação -->
        <div class="border border-slate-200 rounded-xl p-3.5 bg-slate-50 space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-bold text-slate-800">4. Empresa Representada</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${repOk ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}">
              ${repOk ? 'VINCULADA' : 'AVULSO'}
            </span>
          </div>
          <div class="text-[11px] text-slate-600 space-y-1 font-mono">
            ${repOk ? `
              <div><span class="text-slate-400">Empresa:</span> ${diag.representation.razaoSocial}</div>
              <div><span class="text-slate-400">CNPJ:</span> ${diag.representation.cnpj}</div>
              <div><span class="text-slate-400">UF:</span> ${diag.representation.uf}</div>
            ` : `
              <div class="text-slate-500 font-sans">Nenhuma representada ativa no momento. Clique em 'Procuração/Representação' no topo para vincular.</div>
            `}
          </div>
        </div>
      </div>
    `;

    // Atualiza também os pontinhos indicadores do topo
    const rfbInd = document.getElementById('connRfbStatus');
    if (rfbInd) {
      rfbInd.className = `w-2.5 h-2.5 rounded-full ${rfbOk ? 'bg-emerald-500 pulse-online' : 'bg-rose-500'}`;
    }
    const serproInd = document.getElementById('connSerproStatus');
    if (serproInd) {
      serproInd.className = `w-2.5 h-2.5 rounded-full ${serproOk ? 'bg-emerald-500' : 'bg-amber-500'}`;
    }
  },

  copyDiagnosticReport() {
    if (this.state.lastDiagnosticReport) {
      const text = JSON.stringify(this.state.lastDiagnosticReport, null, 2);
      navigator.clipboard.writeText(text);
      alert('Relatório técnico de diagnóstico copiado para a área de transferência!');
    }
  },

  // --- CERTIFICADO DIGITAL ---
  renderCertManagement() {
    const c = this.state.certificate;
    const target = document.getElementById('certDetailsCard');
    const btnRemove = document.getElementById('btnRemoveCert');
    if (!target) return;

    if (!c) {
      if (btnRemove) btnRemove.classList.add('hidden');
      target.innerHTML = `
        <div class="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
          <i data-lucide="key" class="w-8 h-8 text-slate-400 mx-auto"></i>
          <p class="text-xs font-semibold text-slate-700">Nenhum certificado digital A1 ativo.</p>
          <p class="text-[11px] text-slate-500 max-w-xs mx-auto">Importe o arquivo .pfx com a respectiva senha no formulário ao lado para assinar as notas e conectar diretamente à Receita Federal.</p>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    if (btnRemove) btnRemove.classList.remove('hidden');
    target.innerHTML = `
      <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
        <div class="flex items-center justify-between pb-2 border-b border-slate-200">
          <span class="font-bold text-slate-800 text-sm">${c.procuradorName}</span>
          <span class="px-2.5 py-0.5 rounded-full font-bold text-[10px] ${c.isValid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
            ${c.isValid ? 'VÁLIDO (' + c.daysRemaining + ' DIAS)' : 'EXPIRADO'}
          </span>
        </div>
        <div class="grid grid-cols-2 gap-2 text-slate-600">
          <div><span class="text-slate-400 block">Titular / Procurador:</span> <span class="font-bold text-slate-900 font-mono">${c.procuradorDoc}</span></div>
          <div><span class="text-slate-400 block">Tipo:</span> <span class="font-semibold text-slate-900">${c.docType} ICP-Brasil</span></div>
          <div><span class="text-slate-400 block">Autoridade Emissora:</span> <span class="font-medium text-slate-800">${c.issuer}</span></div>
          <div><span class="text-slate-400 block">Validade Até:</span> <span class="font-medium text-slate-800">${new Date(c.validTo).toLocaleDateString('pt-BR')}</span></div>
        </div>
        <div class="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-[11px] flex items-center space-x-2">
          <i data-lucide="check" class="w-4 h-4 text-emerald-600 shrink-0"></i>
          <span>Certificado persistido com segurança. Pronto para emissão por procuração e conexão mTLS direta.</span>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  },

  async uploadCertificate(event) {
    event.preventDefault();
    const form = document.getElementById('certUploadForm');
    const formData = new FormData(form);
    const btn = document.getElementById('btnUploadCert');

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="animate-spin mr-2">⏳</span> Validando e extraindo chaves...`;
    }

    try {
      const res = await safeFetchJson('/api/certificate/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.success) {
        window.friendlyErrorModal.show(res.error);
      } else {
        this.state.certificate = res.certificate;
        this.renderHeader();
        this.renderCertManagement();
        alert('Certificado A1 carregado, validado e ativado com sucesso!');
        form.reset();
      }
    } catch (e) {
      window.friendlyErrorModal.show({
        title: 'Falha no Upload do Certificado',
        category: 'Certificado Digital',
        message: 'Não foi possível ler o arquivo .pfx enviado.',
        technicalDetail: e.message
      });
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="upload-cloud" class="w-4 h-4 mr-2"></i> Carregar e Ativar Certificado A1`;
        if (window.lucide) lucide.createIcons();
      }
    }
  },

  async removeCertificate() {
    if (!confirm('Deseja realmente desvincular o certificado digital ativo?')) return;
    try {
      await safeFetchJson('/api/certificate/remove', { method: 'POST' });
      this.state.certificate = null;
      this.renderHeader();
      this.renderCertManagement();
      alert('Certificado desvinculado.');
    } catch (e) {
      console.error(e);
    }
  },

  // --- HISTÓRICO ADN ---
  async loadHistory() {
    const cnpj = this.state.activeRepresentation ? this.state.activeRepresentation.cnpjRaw : '';
    try {
      const url = `/api/adn/history?prestadorCnpj=${cnpj}&ambiente=${this.state.currentEnvironment}`;
      const res = await safeFetchJson(url);
      this.state.history = res.notas || [];
      if (!this.state.pagination) {
        this.state.pagination = { page: 1, pageSize: 50 };
      }
      this.applyHistoryFilters();
      this.renderDashboard();
      this.loadSyncStatus(cnpj);

      // Sincronização automática incremental com ADN para capturar cancelamentos ou novos eventos do Portal Nacional
      if (cnpj && this.state.certificate) {
        this.silentSyncAdn(cnpj);
      }
    } catch (e) {
      console.error('Erro ao carregar histórico:', e);
    }
  },

  async silentSyncAdn(cnpj) {
    if (!cnpj || this._isSilentSyncing) return;
    this._isSilentSyncing = true;
    try {
      const res = await fetch('/api/adn/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prestadorCnpj: cnpj, startFromZero: false, maxBatches: 5 })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.totalSincronizadas > 0) {
          const fresh = await safeFetchJson(`/api/adn/history?prestadorCnpj=${cnpj}&ambiente=${this.state.currentEnvironment}`);
          this.state.history = fresh.notas || [];
          this.applyHistoryFilters();
          this.renderDashboard();
          this.loadSyncStatus(cnpj);
        }
      }
    } catch (err) {
      console.debug('Background ADN sync info:', err.message);
    } finally {
      this._isSilentSyncing = false;
    }
  },

  async loadSyncStatus(cnpj) {
    if (!cnpj) return;
    try {
      const res = await safeFetchJson(`/api/adn/sync-status?cnpj=${cnpj}`);
      const st = res.state;
      const el = document.getElementById('historyNsuStatus');
      if (el && st) {
        const lastDate = st.lastSync ? new Date(st.lastSync).toLocaleString('pt-BR') : 'Nunca';
        el.innerText = `Último NSU processado: ${st.ultNSU || 0} | Última Sincronização: ${lastDate}`;
      }
    } catch (e) {}
  },

  // --- MÁSCARA E NORMALIZAÇÃO DE COMPETÊNCIA ---
  bindCompetenciaMask(input) {
    if (!input) return;
    input.addEventListener('input', () => {
      let v = input.value.replace(/\D/g, '');
      if (v.length > 6) v = v.substring(0, 6);
      if (v.length >= 2) {
        let mm = parseInt(v.substring(0, 2), 10);
        if (mm > 12) mm = 12;
        if (mm === 0) mm = 1;
        const mmStr = String(mm).padStart(2, '0');
        if (v.length > 2) {
          input.value = `${mmStr}/${v.substring(2)}`;
        } else {
          input.value = `${mmStr}/`;
        }
      } else {
        input.value = v;
      }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && input.value.length === 3 && input.value.endsWith('/')) {
        e.preventDefault();
        input.value = input.value.substring(0, 2);
      }
    });
  },

  parseCompetenciaInputYm(val) {
    if (!val) return '';
    const clean = String(val).replace(/\D/g, '');
    if (clean.length === 6) {
      // MMYYYY -> YYYYMM
      const mm = clean.substring(0, 2);
      const yyyy = clean.substring(2, 6);
      return `${yyyy}${mm}`;
    }
    return '';
  },

  extractNoteCompetenciaYm(note) {
    if (!note) return '';
    let raw = note.competencia || note.dataCompetencia || note.dataEmissao || note.dataAutorizacao || '';
    if (typeof raw === 'string') {
      raw = raw.trim();
      if (/^\d{4}-\d{2}/.test(raw)) {
        return raw.substring(0, 4) + raw.substring(5, 7);
      }
      if (/^\d{2}\/\d{4}/.test(raw)) {
        return raw.substring(3, 7) + raw.substring(0, 2);
      }
      const digits = raw.replace(/\D/g, '');
      if (digits.length >= 6 && (digits.startsWith('20') || digits.startsWith('19'))) {
        return digits.substring(0, 6);
      }
    }
    return '';
  },

  // --- CONTROLE DE SIDEBAR COLAPSÁVEL ---
  toggleSidebar() {
    const sidebar = document.getElementById('appSidebar');
    if (!sidebar) return;
    const isCollapsed = sidebar.classList.toggle('sidebar-collapsed');
    localStorage.setItem('emissor_sidebar_collapsed', isCollapsed ? 'true' : 'false');
    const toggleBtn = document.getElementById('btnToggleSidebar');
    if (toggleBtn) {
      toggleBtn.innerHTML = isCollapsed
        ? `<i data-lucide="panel-left-open" class="w-4 h-4 sidebar-toggle-icon"></i>`
        : `<i data-lucide="panel-left-close" class="w-4 h-4 sidebar-toggle-icon"></i>`;
      toggleBtn.title = isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral';
    }
    if (window.lucide) lucide.createIcons();
    setTimeout(() => this.setupDualScrollbar(), 280);
  },

  // --- TEMA NOTURNO / DARK MODE ---
  initTheme() {
    const saved = localStorage.getItem('emissor_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved === 'dark' || (!saved && prefersDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    this.updateThemeIcon(isDark);
  },

  toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('emissor_theme', isDark ? 'dark' : 'light');
    this.updateThemeIcon(isDark);
  },

  updateThemeIcon(isDark) {
    const icon = document.getElementById('themeToggleIcon');
    const btn = document.getElementById('btnToggleTheme');
    if (icon) {
      icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
    }
    if (btn) {
      btn.title = isDark ? 'Mudar para Tema Claro' : 'Mudar para Tema Noturno';
    }
    if (window.lucide) lucide.createIcons();
  },

  initSidebarState() {
    const isCollapsed = localStorage.getItem('emissor_sidebar_collapsed') === 'true';
    const sidebar = document.getElementById('appSidebar');
    if (sidebar && isCollapsed) {
      sidebar.classList.add('sidebar-collapsed');
      const toggleBtn = document.getElementById('btnToggleSidebar');
      if (toggleBtn) {
        toggleBtn.innerHTML = `<i data-lucide="panel-left-open" class="w-4 h-4 sidebar-toggle-icon"></i>`;
        toggleBtn.title = 'Expandir menu lateral';
      }
    }
  },

  // --- EXPORTAÇÃO CSV E DOWNLOAD PACOTE ZIP ---
  exportHistoryCsv() {
    const notes = (this.state.filteredHistory && this.state.filteredHistory.length > 0)
      ? this.state.filteredHistory
      : (this.state.history || []);

    if (notes.length === 0) {
      alert('Nenhuma nota fiscal disponível para exportação.');
      return;
    }

    const headers = [
      'Situação',
      'Tomador CPF/CNPJ',
      'Tomador Razão Social',
      'Número NFS-e',
      'Série',
      'Valor dos Serviços (R$)',
      'Valor Total (R$)',
      'Alíquota ISS (%)',
      'ISSQN (R$)',
      'ISS Retido',
      'Data de Emissão',
      'Competência',
      'Município de Incidência',
      'Código Tributação',
      'CNAE',
      'Chave de Acesso'
    ];

    const rows = notes.map(n => {
      const isCanc = n.status === 'CANCELADA' || Boolean(n.dataCancelamento) || Boolean(n.motivoCancelamento);
      const isSubst = /substitui/i.test(n.motivoCancelamento || '') || n.status === 'SUBSTITUIDA';
      const isAut = !isCanc && (n.status === 'AUTORIZADA' || !n.status);
      const situacao = isSubst ? 'Substituída' : (isCanc ? 'Cancelada' : (isAut ? 'Autorizada' : (n.status || 'Normal')));
      const tomDoc = n.tomador?.doc || n.tomador?.docRaw || '';
      const tomNome = (n.tomador?.nome || '').replace(/;/g, ' ');
      const numNfse = n.numeroNfse || '';
      const serie = n.serie || '';
      
      const valServico = Number(n.valores?.valorServico ?? n.valores?.vServ ?? n.valores?.valorLiquido ?? n.valores?.vLiq ?? 0) || 0;
      const valTotal = Number(n.valores?.valorLiquido ?? n.valores?.vLiq ?? n.valores?.baseCalculo ?? n.valores?.vBC ?? valServico) || 0;
      const aliqIss = Number(n.valores?.iss?.aliquota ?? n.valores?.pAliq ?? n.valores?.pAliqAplic ?? 0) || 0;
      const valIss = Number(n.valores?.iss?.valorIss ?? n.valores?.vISSQN ?? 0) || 0;
      const isRetido = Boolean(n.valores?.iss?.retido || n.valores?.vISSRet > 0) ? 'SIM' : 'NÃO';
      
      const dEmissao = n.dataEmissao || n.dataAutorizacao;
      const dataEmissaoFormatada = dEmissao ? new Date(dEmissao).toLocaleDateString('pt-BR') : '';
      
      const compYm = this.extractNoteCompetenciaYm(n);
      const compFormatada = compYm && compYm.length === 6 ? `${compYm.substring(4, 6)}/${compYm.substring(0, 4)}` : '';
      
      const munIncid = (this.getMunicipioFormatado(n) || '').replace(/;/g, ' ');
      const trib = n.servico?.cTribNac || n.servico?.cTribMun || '1005';
      const cnae = this.getCnaeFormatado(n);
      const chave = n.chaveAcesso || '';

      const fmtNum = (v) => v.toFixed(2).replace('.', ',');

      return [
        `"${situacao}"`,
        `"${tomDoc}"`,
        `"${tomNome}"`,
        `"${numNfse}"`,
        `"${serie}"`,
        `"${fmtNum(valServico)}"`,
        `"${fmtNum(valTotal)}"`,
        `"${fmtNum(aliqIss)}"`,
        `"${fmtNum(valIss)}"`,
        `"${isRetido}"`,
        `"${dataEmissaoFormatada}"`,
        `"${compFormatada}"`,
        `"${munIncid}"`,
        `"${trib}"`,
        `"${cnae}"`,
        `"${chave}"`
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const nowStr = new Date().toISOString().slice(0, 10);
    a.download = `relatorio_nfse_adn_${nowStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  async downloadXmlBatchZip() {
    const notes = (this.state.filteredHistory && this.state.filteredHistory.length > 0)
      ? this.state.filteredHistory
      : (this.state.history || []);

    if (notes.length === 0) {
      alert('Nenhuma nota fiscal disponível para exportação.');
      return;
    }

    if (typeof JSZip === 'undefined') {
      alert('Carregando biblioteca de compactação ZIP... Tente novamente em 2 segundos.');
      return;
    }

    const zip = new JSZip();
    let count = 0;

    for (const n of notes) {
      const xml = n.xmlCompleto || n.xmlAssinado || n.xml;
      if (xml) {
        const num = n.numeroNfse || n.numeroDps || n.chaveAcesso?.slice(-8) || `nota_${count + 1}`;
        const chave = n.chaveAcesso || num;
        zip.file(`NFSe_${chave}.xml`, xml);
        count++;
      }
    }

    if (count === 0) {
      alert('Nenhum arquivo XML completo encontrado nas notas selecionadas.');
      return;
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const nowStr = new Date().toISOString().slice(0, 10);
    a.download = `pacote_nfse_xmls_${nowStr}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Aplica todos os filtros da pesquisa oficial na lista de notas
  applyHistoryFilters() {
    if (!this.state.pagination) {
      this.state.pagination = { page: 1, pageSize: 50 };
    }

    const rep = this.state.activeRepresentation;
    const cleanRepCnpj = rep ? rep.cnpjRaw : '';

    // Valores dos campos de filtro
    const ano = document.getElementById('fltAnoNota')?.value || '';
    const numNota = (document.getElementById('fltNumeroNota')?.value || '').trim();
    const compIniYm = this.parseCompetenciaInputYm(document.getElementById('fltCompetenciaIni')?.value);
    const compFimYm = this.parseCompetenciaInputYm(document.getElementById('fltCompetenciaFim')?.value);
    const dataIni = document.getElementById('fltDataEmissaoIni')?.value || '';
    const dataFim = document.getElementById('fltDataEmissaoFim')?.value || '';
    const situacao = document.getElementById('fltSituacao')?.value || '';
    const docTomador = (document.getElementById('fltDocTomador')?.value || '').trim().replace(/\D/g, '');
    const rpsIni = (document.getElementById('fltRpsIni')?.value || '').trim();
    const rpsFim = (document.getElementById('fltRpsFim')?.value || '').trim();
    const serieRps = (document.getElementById('fltSerieRps')?.value || '').trim().toLowerCase();
    const notaIni = parseInt((document.getElementById('fltNotaIni')?.value || '').trim(), 10);
    const notaFim = parseInt((document.getElementById('fltNotaFim')?.value || '').trim(), 10);
    const tipoServico = (document.getElementById('fltTipoServico')?.value || document.getElementById('fltTipoServicoSearch')?.value || '').trim();
    const munIncid = (document.getElementById('fltMunicipioIncidencia')?.value || '').trim().toLowerCase();
    const exigibilidade = document.getElementById('fltExigibilidade')?.value || '';
    const issRetido = document.getElementById('fltIssRetido')?.value || '';
    const chkSubst = document.getElementById('fltChkSubstituidas')?.checked || false;
    const chkAvulsas = document.getElementById('fltChkAvulsas')?.checked || false;
    const rpsDataIni = document.getElementById('fltRpsDataIni')?.value || '';
    const rpsDataFim = document.getElementById('fltRpsDataFim')?.value || '';
    const situacaoDebito = document.getElementById('fltSituacaoDebito')?.value || '';
    const chaveAcesso = (document.getElementById('fltChaveAcesso')?.value || '').trim().replace(/\D/g, '');
    const papelFiltro = document.getElementById('selectFiltroPapel')?.value || 'EMITIDAS';

    let notes = this.state.history || [];

    // 1. Filtro por Papel (EMITIDAS / RECEBIDAS / TODAS)
    if (cleanRepCnpj) {
      if (papelFiltro === 'EMITIDAS') {
        notes = notes.filter(n => {
          const prestCnpj = (n.prestador && n.prestador.cnpjRaw) || '';
          return prestCnpj.includes(cleanRepCnpj);
        });
      } else if (papelFiltro === 'RECEBIDAS') {
        notes = notes.filter(n => {
          const tomDoc = (n.tomador && (n.tomador.docRaw || (n.tomador.doc && n.tomador.doc.replace(/\D/g, '')))) || '';
          return tomDoc.includes(cleanRepCnpj);
        });
      }
    }

    // 2. Filtro por Ano da Nota
    if (ano && ano !== 'TODOS') {
      notes = notes.filter(n => {
        const d = n.dataEmissao || n.dataAutorizacao || '';
        const noteYear = d ? new Date(d).getFullYear().toString() : '';
        const numStr = String(n.numeroNfse || '');
        return noteYear === ano || numStr.startsWith(ano);
      });
    }

    // 3. Filtro por Número da Nota
    if (numNota) {
      notes = notes.filter(n => {
        const num = String(n.numeroNfse || '');
        const dps = String(n.numeroDps || '');
        return num.includes(numNota) || dps.includes(numNota);
      });
    }

    // 4. Intervalo de Notas
    if (!isNaN(notaIni)) {
      notes = notes.filter(n => {
        const val = parseInt(String(n.numeroNfse || '').replace(/\D/g, ''), 10);
        return !isNaN(val) && val >= notaIni;
      });
    }
    if (!isNaN(notaFim)) {
      notes = notes.filter(n => {
        const val = parseInt(String(n.numeroNfse || '').replace(/\D/g, ''), 10);
        return !isNaN(val) && val <= notaFim;
      });
    }

    // 5. Período de Emissão da Nota
    if (dataIni) {
      notes = notes.filter(n => {
        const d = (n.dataEmissao || n.dataAutorizacao || '').substring(0, 10);
        return d >= dataIni;
      });
    }
    if (dataFim) {
      notes = notes.filter(n => {
        const d = (n.dataEmissao || n.dataAutorizacao || '').substring(0, 10);
        return d <= dataFim;
      });
    }

    // 5.1 Filtro Estrito de Competência (MM/AAAA)
    if (compIniYm) {
      notes = notes.filter(n => {
        const ym = this.extractNoteCompetenciaYm(n);
        return ym && ym >= compIniYm;
      });
    }
    if (compFimYm) {
      notes = notes.filter(n => {
        const ym = this.extractNoteCompetenciaYm(n);
        return ym && ym <= compFimYm;
      });
    }

    // 6. Situação
    if (situacao) {
      notes = notes.filter(n => {
        const isC = n.status === 'CANCELADA' || Boolean(n.dataCancelamento) || Boolean(n.motivoCancelamento);
        const isSubst = /substitui/i.test(n.motivoCancelamento || '') || n.status === 'SUBSTITUIDA';
        if (situacao === 'CANCELADA' || situacao === 'Cancelada') return isC;
        if (situacao === 'SUBSTITUIDA') return isSubst;
        if (situacao === 'AUTORIZADA' || situacao === 'Normal') return !isC;
        return n.status === situacao;
      });
    }

    // 7. Documento Tomador
    if (docTomador) {
      notes = notes.filter(n => {
        const tomDoc = (n.tomador && (n.tomador.docRaw || (n.tomador.doc && n.tomador.doc.replace(/\D/g, '')))) || '';
        return tomDoc.includes(docTomador);
      });
    }

    // 8. Chave de Acesso
    if (chaveAcesso) {
      notes = notes.filter(n => {
        const ch = (n.chaveAcesso || '').replace(/\D/g, '');
        return ch.includes(chaveAcesso);
      });
    }

    // 9. Série do RPS / DPS
    if (serieRps) {
      notes = notes.filter(n => String(n.serie || '').toLowerCase().includes(serieRps));
    }

    // 10. Tipo de Serviço / Código de Tributação Nacional
    if (tipoServico) {
      const normQuery = this.normalizeSearchText(tipoServico);
      const digitsOnly = tipoServico.replace(/\D/g, '');
      notes = notes.filter(n => {
        const trib = String(n.servico?.cTribNac || n.servico?.cTribMun || '').toLowerCase();
        const tribDigits = trib.replace(/\D/g, '');
        const desc = this.normalizeSearchText(n.servico?.xDescServ || n.servico?.descricao || n.servico?.discriminacao || '');
        return (
          trib.includes(normQuery) ||
          (digitsOnly && tribDigits.includes(digitsOnly)) ||
          desc.includes(normQuery)
        );
      });
    }

    // 11. Município de Incidência (Busca inteligente por Nome do Município e Código)
    if (munIncid) {
      notes = notes.filter(n => {
        const munName = this.getMunicipioFormatado(n).toLowerCase();
        const munRaw = ((n.servico && (n.servico.cMunIncid || n.servico.xLocIncid)) || n.prestador?.municipio || '').toLowerCase();
        return munName.includes(munIncid) || munRaw.includes(munIncid);
      });
    }

    // 12. ISS Retido
    if (issRetido === 'SIM') {
      notes = notes.filter(n => Boolean(n.valores?.iss?.retido || n.valores?.vISSRet > 0));
    } else if (issRetido === 'NAO') {
      notes = notes.filter(n => !Boolean(n.valores?.iss?.retido || n.valores?.vISSRet > 0));
    }

    this.state.filteredHistory = notes;
    this.state.pagination.page = 1;
    this.renderHistoryTable();
  },

  clearHistoryFilters() {
    this.clearFltTipoServico();

    const ids = [
      'fltNumeroNota', 'fltCompetenciaIni', 'fltCompetenciaFim',
      'fltDataEmissaoIni', 'fltDataEmissaoFim', 'fltSituacao',
      'fltDocTomador', 'fltRpsIni', 'fltRpsFim', 'fltSerieRps',
      'fltNotaIni', 'fltNotaFim', 'fltTipoServico', 'fltTipoServicoSearch', 'fltMunicipioIncidencia',
      'fltExigibilidade', 'fltIssRetido', 'fltRpsDataIni', 'fltRpsDataFim',
      'fltSituacaoDebito', 'fltChaveAcesso'
    ];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

    const ano = document.getElementById('fltAnoNota');
    if (ano) ano.value = 'TODOS';

    const chk1 = document.getElementById('fltChkSubstituidas');
    if (chk1) chk1.checked = false;
    const chk2 = document.getElementById('fltChkAvulsas');
    if (chk2) chk2.checked = false;

    this.applyHistoryFilters();
  },

  changePageSize(newSize) {
    if (!this.state.pagination) {
      this.state.pagination = { page: 1, pageSize: 50 };
    }
    this.state.pagination.pageSize = parseInt(newSize, 10) || 50;
    this.state.pagination.page = 1;
    this.renderHistoryTable();
  },

  goToPage(pageNum) {
    if (!this.state.pagination) return;
    const total = (this.state.filteredHistory || []).length;
    const maxPage = Math.max(1, Math.ceil(total / this.state.pagination.pageSize));
    const p = Math.max(1, Math.min(pageNum, maxPage));
    this.state.pagination.page = p;
    this.renderHistoryTable();
  },

  renderHistoryTable() {
    const target = document.getElementById('historyTableBody');
    const subtitle = document.getElementById('historySubtitle');
    const countBadge = document.getElementById('historyCountBadge');
    const pageInfo = document.getElementById('paginationInfo');
    const pageControls = document.getElementById('paginationControls');
    if (!target) return;

    const rep = this.state.activeRepresentation;
    const cleanRepCnpj = rep ? rep.cnpjRaw : '';

    if (subtitle) {
      if (rep) {
        subtitle.innerText = `Notas fiscais vinculadas a ${rep.razaoSocial} (${rep.cnpj}) no ADN`;
      } else {
        subtitle.innerText = `Sincronização direta com a base nacional da Receita Federal`;
      }
    }

    if (!this.state.filteredHistory) {
      this.state.filteredHistory = this.state.history || [];
    }
    const allNotes = this.state.filteredHistory;
    const total = allNotes.length;

    if (!this.state.pagination) {
      this.state.pagination = { page: 1, pageSize: 50 };
    }
    const { page, pageSize } = this.state.pagination;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const curPage = Math.min(page, totalPages);
    this.state.pagination.page = curPage;

    const startIdx = (curPage - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, total);
    const pagedNotes = allNotes.slice(startIdx, endIdx);

    // Atualiza contadores
    if (countBadge) {
      countBadge.innerText = `${total.toLocaleString('pt-BR')} registro(s) encontrado(s)`;
    }
    const resultsBadge = document.getElementById('historyResultsBadge');
    if (resultsBadge) {
      resultsBadge.innerText = `${total.toLocaleString('pt-BR')} ${total === 1 ? 'nota encontrada' : 'notas encontradas'}`;
    }
    if (pageInfo) {
      if (total === 0) {
        pageInfo.innerText = 'Mostrando 0 registros';
      } else {
        pageInfo.innerText = `Mostrando ${(startIdx + 1).toLocaleString('pt-BR')} a ${endIdx.toLocaleString('pt-BR')} de ${total.toLocaleString('pt-BR')} registros`;
      }
    }

    // Renderiza controles de paginação
    if (pageControls) {
      if (totalPages <= 1) {
        pageControls.innerHTML = '';
      } else {
        let html = '';
        
        // Botão Primeira
        html += `
          <button onclick="App.goToPage(1)" ${curPage === 1 ? 'disabled' : ''} class="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold ${curPage === 1 ? 'opacity-40 cursor-not-allowed bg-slate-50 text-slate-400' : 'bg-white hover:bg-slate-100 text-slate-700 shadow-sm'} transition-colors" title="Primeira Página">
            &laquo;
          </button>
        `;

        // Botão Anterior
        html += `
          <button onclick="App.goToPage(${curPage - 1})" ${curPage === 1 ? 'disabled' : ''} class="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold ${curPage === 1 ? 'opacity-40 cursor-not-allowed bg-slate-50 text-slate-400' : 'bg-white hover:bg-slate-100 text-slate-700 shadow-sm'} transition-colors" title="Página Anterior">
            &lsaquo;
          </button>
        `;

        // Janela de páginas ao redor da atual (ex: 5 páginas visíveis)
        const maxVisible = 5;
        let startPage = Math.max(1, curPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        if (endPage - startPage + 1 < maxVisible) {
          startPage = Math.max(1, endPage - maxVisible + 1);
        }

        if (startPage > 1) {
          html += `<button onclick="App.goToPage(1)" class="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 shadow-sm">1</button>`;
          if (startPage > 2) html += `<span class="px-1 text-slate-400">...</span>`;
        }

        for (let i = startPage; i <= endPage; i++) {
          const isActive = i === curPage;
          html += `
            <button onclick="App.goToPage(${i})" class="px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
              isActive
                ? 'bg-brand-700 text-white shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm'
            }">
              ${i}
            </button>
          `;
        }

        if (endPage < totalPages) {
          if (endPage < totalPages - 1) html += `<span class="px-1 text-slate-400">...</span>`;
          html += `<button onclick="App.goToPage(${totalPages})" class="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 shadow-sm">${totalPages}</button>`;
        }

        // Botão Próxima
        html += `
          <button onclick="App.goToPage(${curPage + 1})" ${curPage === totalPages ? 'disabled' : ''} class="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold ${curPage === totalPages ? 'opacity-40 cursor-not-allowed bg-slate-50 text-slate-400' : 'bg-white hover:bg-slate-100 text-slate-700 shadow-sm'} transition-colors" title="Próxima Página">
            &rsaquo;
          </button>
        `;

        // Botão Última
        html += `
          <button onclick="App.goToPage(${totalPages})" ${curPage === totalPages ? 'disabled' : ''} class="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold ${curPage === totalPages ? 'opacity-40 cursor-not-allowed bg-slate-50 text-slate-400' : 'bg-white hover:bg-slate-100 text-slate-700 shadow-sm'} transition-colors" title="Última Página">
            &raquo;
          </button>
        `;

        pageControls.innerHTML = html;
      }
    }

    // Tabela Vazia
    const footEl = document.getElementById('historyTableFoot');
    if (total === 0) {
      if (footEl) footEl.innerHTML = '';
      target.innerHTML = `
        <tr>
          <td colspan="17" class="py-12 text-center text-slate-400">
            <i data-lucide="inbox" class="w-10 h-10 mx-auto text-slate-300 mb-2"></i>
            <p class="font-medium text-slate-600">Nenhuma nota fiscal encontrada para os filtros selecionados.</p>
            <p class="text-xs text-slate-400 mt-1">Ajuste os filtros acima ou clique em "Limpar Filtros" para ver todas as notas.</p>
          </td>
        </tr>
      `;
      if (window.lucide) lucide.createIcons();
      this.setupDualScrollbar();
      return;
    }

    // Renderiza Linhas da Página com as 17 colunas oficiais do emissor
    target.innerHTML = pagedNotes.map(n => {
      const isCanc = n.status === 'CANCELADA' || Boolean(n.dataCancelamento) || Boolean(n.motivoCancelamento);
      const isAut = !isCanc && (n.status === 'AUTORIZADA' || !n.status);
      const isEmitida = cleanRepCnpj && n.prestador && n.prestador.cnpjRaw && n.prestador.cnpjRaw.includes(cleanRepCnpj);
      const tomadorDocFormatted = n.tomador?.doc || (n.tomador?.docRaw ? this.formatDocRaw(n.tomador.docRaw) : '-');
      const tomadorNome = n.tomador?.nome || 'Tomador Não Identificado';
      
      const valServico = n.valores?.valorServico || n.valores?.vServ || n.valores?.valorLiquido || n.valores?.vLiq || 0;
      const valTotal = n.valores?.valorLiquido || n.valores?.vLiq || n.valores?.baseCalculo || n.valores?.vBC || valServico;
      const aliqIss = n.valores?.iss?.aliquota || n.valores?.pAliq || n.valores?.pAliqAplic || 0;
      const valIss = n.valores?.iss?.valorIss || n.valores?.vISSQN || 0;
      const isRetido = Boolean(n.valores?.iss?.retido || n.valores?.vISSRet > 0);

      // Datas
      const dEmissao = n.dataEmissao || n.dataAutorizacao;
      const dataEmissaoFormatada = dEmissao ? new Date(dEmissao).toLocaleDateString('pt-BR') : '-';
      
      let compFormatada = '-';
      if (n.competencia) {
        const cClean = String(n.competencia).replace(/\D/g, '');
        if (cClean.length === 6) compFormatada = `${cClean.substring(4, 6)}/${cClean.substring(0, 4)}`;
        else if (n.competencia.includes('-')) {
          const parts = n.competencia.split('-');
          compFormatada = `${parts[1]}/${parts[0]}`;
        } else {
          compFormatada = n.competencia;
        }
      } else if (dEmissao) {
        const dObj = new Date(dEmissao);
        compFormatada = `${String(dObj.getMonth() + 1).padStart(2, '0')}/${dObj.getFullYear()}`;
      }

      // Município e Atividade
      const munIncid = this.getMunicipioFormatado(n);
      const atividade = n.servico?.cTribNac || n.servico?.cTribMun || '1005';
      const cnae = this.getCnaeFormatado(n);

      let situacaoBadge = '';
      const isSubst = /substitui/i.test(n.motivoCancelamento || '') || n.status === 'SUBSTITUIDA';
      if (isSubst) {
        situacaoBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-xs" title="${n.motivoCancelamento || 'Cancelada por Substituição no ADN'}"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Substituída</span>`;
      } else if (isCanc) {
        situacaoBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-xs" title="${n.motivoCancelamento || 'Cancelamento registrado no ADN'}"><span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>Cancelada</span>`;
      } else {
        situacaoBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Autorizada</span>`;
      }

      const retidoBadge = isRetido 
        ? `<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-100">Sim (Retido)</span>`
        : `<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium text-slate-500 bg-slate-100">Não</span>`;

      return `
        <tr class="border-b border-slate-200 hover:bg-slate-50 transition-colors text-xs text-slate-700">
          <!-- 1. Situação -->
          <td class="py-2.5 px-3 border-r border-slate-200 text-center font-bold">
            ${situacaoBadge}
          </td>

          <!-- 2. Tomador (CPF/CNPJ) -->
          <td class="py-2.5 px-3 border-r border-slate-200 font-mono text-center text-slate-800">
            ${tomadorDocFormatted}
          </td>

          <!-- 3. Razão Social -->
          <td class="py-2.5 px-4 border-r border-slate-200 font-medium text-slate-900 truncate max-w-xs" title="${tomadorNome}">
            ${tomadorNome}
          </td>

          <!-- 4. Número -->
          <td class="py-2.5 px-3 border-r border-slate-200 font-mono font-bold text-center text-slate-900">
            ${n.numeroNfse || '-'}
          </td>

          <!-- 5. Serviço(R$) -->
          <td class="py-2.5 px-3 border-r border-slate-200 text-right font-medium text-slate-900">
            ${valServico.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </td>

          <!-- 6. Total(R$) -->
          <td class="py-2.5 px-3 border-r border-slate-200 text-right font-bold text-slate-900">
            ${valTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </td>

          <!-- 7. Alíq.(%) -->
          <td class="py-2.5 px-2.5 border-r border-slate-200 text-right text-slate-700">
            ${aliqIss.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </td>

          <!-- 8. ISSQN(R$) -->
          <td class="py-2.5 px-3 border-r border-slate-200 text-right text-slate-700">
            ${valIss.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </td>

          <!-- 9. Retido -->
          <td class="py-2.5 px-2.5 border-r border-slate-200 text-center">
            ${retidoBadge}
          </td>

          <!-- 10. Emissão -->
          <td class="py-2.5 px-3 border-r border-slate-200 text-center text-slate-700">
            ${dataEmissaoFormatada}
          </td>

          <!-- 11. Comp. -->
          <td class="py-2.5 px-2.5 border-r border-slate-200 text-center text-slate-700">
            ${compFormatada}
          </td>

          <!-- 12. Incidência -->
          <td class="py-2.5 px-3 border-r border-slate-200 text-center text-slate-700">
            ${munIncid}
          </td>

          <!-- 13. Atividade -->
          <td class="py-2.5 px-2.5 border-r border-slate-200 text-center font-mono text-slate-700">
            ${atividade}
          </td>

          <!-- 14. Tipo -->
          <td class="py-2.5 px-2.5 border-r border-slate-200 text-center text-slate-700">
            ${n.tipo || 'Normal'}
          </td>

          <!-- 15. Débito -->
          <td class="py-2.5 px-2.5 border-r border-slate-200 text-center text-slate-500">
            ${n.debito || '-'}
          </td>

          <!-- 16. CNAE -->
          <td class="py-2.5 px-3 border-r border-slate-200 text-center font-mono text-slate-700">
            ${cnae}
          </td>

          <!-- 17. Opções -->
          <td class="py-2 px-3 text-center whitespace-nowrap">
            <div class="inline-flex items-center rounded-lg border border-slate-300 bg-white p-0.5 shadow-sm divide-x divide-slate-200">
              ${!isCanc && isAut && isEmitida ? `
              <button onclick="App.promptCancelamento('${n.chaveAcesso}')" class="p-1 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors" title="Cancelar Nota">
                <i data-lucide="x-circle" class="w-4 h-4"></i>
              </button>` : ''}
              <button onclick="App.consultarNfseOnline('${n.chaveAcesso}')" class="p-1 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-colors" title="Consultar e Atualizar Status no ADN">
                <i data-lucide="refresh-cw" class="w-4 h-4"></i>
              </button>
              <button onclick="App.viewDanfse('${n.chaveAcesso}')" class="p-1 hover:bg-slate-100 text-slate-600 hover:text-brand-600 transition-colors" title="Visualizar DANFSE">
                <i data-lucide="eye" class="w-4 h-4"></i>
              </button>
              <button onclick="App.downloadXml('${n.chaveAcesso}')" class="p-1 hover:bg-slate-100 text-slate-600 hover:text-brand-600 transition-colors" title="Baixar XML">
                <i data-lucide="download" class="w-4 h-4"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // ========================================================
    // RODAPÉ COM SUB-TOTAL (PÁGINA) E TOTAL GERAL (FILTRO)
    // ========================================================
    if (footEl) {
      const getNoteVals = (n) => {
        const vServ = Number(n.valores?.valorServico ?? n.valores?.vServ ?? n.valores?.valorLiquido ?? n.valores?.vLiq ?? 0) || 0;
        const vTot = Number(n.valores?.valorLiquido ?? n.valores?.vLiq ?? n.valores?.baseCalculo ?? n.valores?.vBC ?? vServ) || 0;
        const vIss = Number(n.valores?.iss?.valorIss ?? n.valores?.vISSQN ?? 0) || 0;
        return { vServ, vTot, vIss };
      };

      // 1. Subtotal da página atual
      let subServ = 0, subTotal = 0, subIss = 0;
      pagedNotes.forEach(n => {
        const v = getNoteVals(n);
        subServ += v.vServ;
        subTotal += v.vTot;
        subIss += v.vIss;
      });
      const subCount = pagedNotes.length;

      // 2. Total geral de todas as notas filtradas
      let totServ = 0, totTotal = 0, totIss = 0;
      allNotes.forEach(n => {
        const v = getNoteVals(n);
        totServ += v.vServ;
        totTotal += v.vTot;
        totIss += v.vIss;
      });
      const totCount = allNotes.length;

      const fmtMoeda = (val) => Number(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      footEl.innerHTML = `
        <!-- Linha 1: Subtotal -->
        <tr class="bg-slate-100/95 border-t border-b border-slate-300 text-xs font-semibold text-slate-800">
          <td colspan="3" class="py-2 px-3 font-bold border-r border-slate-200 text-left">
            Subtotal
          </td>
          <td class="py-2 px-3 border-r border-slate-200 font-mono font-bold text-center text-slate-900">
            ${subCount}
          </td>
          <td class="py-2 px-3 border-r border-slate-200 text-right font-medium text-slate-900">
            ${fmtMoeda(subServ)}
          </td>
          <td class="py-2 px-3 border-r border-slate-200 text-right font-bold text-slate-900">
            ${fmtMoeda(subTotal)}
          </td>
          <td class="py-2 px-2.5 border-r border-slate-200 text-center text-slate-400">
            -
          </td>
          <td class="py-2 px-3 border-r border-slate-200 text-right font-medium text-slate-900">
            ${fmtMoeda(subIss)}
          </td>
          <td colspan="9" class="py-2 px-3 text-center text-slate-400"></td>
        </tr>

        <!-- Linha 2: Total Geral -->
        <tr class="bg-slate-200/90 border-b-2 border-slate-300 text-xs font-bold text-slate-900">
          <td colspan="3" class="py-2 px-3 font-bold border-r border-slate-300 text-left">
            Total
          </td>
          <td class="py-2 px-3 border-r border-slate-300 font-mono font-bold text-center text-slate-950">
            ${totCount}
          </td>
          <td class="py-2 px-3 border-r border-slate-300 text-right font-bold text-slate-950">
            ${fmtMoeda(totServ)}
          </td>
          <td class="py-2 px-3 border-r border-slate-300 text-right font-bold text-slate-950">
            ${fmtMoeda(totTotal)}
          </td>
          <td class="py-2 px-2.5 border-r border-slate-300 text-center text-slate-400">
            -
          </td>
          <td class="py-2 px-3 border-r border-slate-300 text-right font-bold text-slate-950">
            ${fmtMoeda(totIss)}
          </td>
          <td colspan="9" class="py-2 px-3 text-center text-slate-400"></td>
        </tr>
      `;
    }

    if (window.lucide) lucide.createIcons();
    this.setupDualScrollbar();
  },

  getMunicipioFormatado(n) {
    // 1. Se houver xLocIncid explícito em texto
    if (n.servico?.xLocIncid && isNaN(n.servico.xLocIncid)) {
      const raw = String(n.servico.xLocIncid).trim();
      if (raw.includes('/')) return raw;
      const uf = n.prestador?.uf || (n.servico?.cMunIncid && this.getUfByIbgePrefix(n.servico.cMunIncid)) || 'SE';
      return `${raw}/${uf}`;
    }

    // 2. Mapeamento por Código IBGE de 7 dígitos
    const ibge = String(n.servico?.cMunIncid || '').trim();
    if (ibge && IBGE_MUNICIPIOS_MAP[ibge]) {
      return IBGE_MUNICIPIOS_MAP[ibge];
    }

    // 3. Consulta no auxData se carregado
    if (ibge && this.state.auxData?.municipios) {
      const found = this.state.auxData.municipios.find(m => m.codigoIbge === ibge);
      if (found) return `${found.nome}/${found.uf}`;
    }

    // 4. Município do prestador caso seja texto
    if (n.prestador?.municipio && isNaN(n.prestador.municipio)) {
      const m = String(n.prestador.municipio).trim();
      const uf = n.prestador.uf ? String(n.prestador.uf).trim() : (ibge ? this.getUfByIbgePrefix(ibge) : 'SE');
      return `${m}/${uf}`;
    }

    // 5. Fallback por prefixo UF do código IBGE
    if (ibge && ibge.length >= 2) {
      const uf = this.getUfByIbgePrefix(ibge);
      if (uf === 'SE') return 'Aracaju/SE';
      if (uf === 'SP') return 'São Paulo/SP';
      if (uf === 'MG') return 'Belo Horizonte/MG';
      if (uf === 'RJ') return 'Rio de Janeiro/RJ';
      if (uf) return `Município/${uf}`;
    }

    return 'Aracaju/SE';
  },

  getUfByIbgePrefix(ibge) {
    const p = String(ibge || '').substring(0, 2);
    const ufs = {
      '11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA', '16': 'AP', '17': 'TO',
      '21': 'MA', '22': 'PI', '23': 'CE', '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL', '28': 'SE', '29': 'BA',
      '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP',
      '41': 'PR', '42': 'SC', '43': 'RS',
      '50': 'MS', '51': 'MT', '52': 'GO', '53': 'DF'
    };
    return ufs[p] || 'SE';
  },

  getCnaeFormatado(n) {
    const raw = n.servico?.cnae || n.prestador?.cnae || this.state.activeRepresentation?.cnae;
    if (!raw || raw === '6821801') {
      const real = n.servico?.cnae || n.prestador?.cnae;
      return real || '-';
    }
    return raw;
  },

  formatDocRaw(docRaw) {
    if (!docRaw) return '-';
    const clean = String(docRaw).replace(/\D/g, '');
    if (clean.length === 14) {
      return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    }
    if (clean.length === 11) {
      return clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    }
    return docRaw;
  },

  setupDualScrollbar() {
    const top = document.getElementById('tableScrollTopWrapper');
    const bottom = document.getElementById('tableScrollBottomWrapper');
    const inner = document.getElementById('tableScrollTopInner');
    const table = document.getElementById('mainHistoryTable');

    if (!top || !bottom || !inner || !table) return;

    const updateWidth = () => {
      inner.style.width = `${table.scrollWidth}px`;
    };

    updateWidth();
    setTimeout(updateWidth, 100);

    let isSyncingTop = false;
    let isSyncingBottom = false;

    top.onscroll = () => {
      if (!isSyncingTop) {
        isSyncingBottom = true;
        bottom.scrollLeft = top.scrollLeft;
      }
      isSyncingTop = false;
    };

    bottom.onscroll = () => {
      if (!isSyncingBottom) {
        isSyncingTop = true;
        top.scrollLeft = bottom.scrollLeft;
      }
      isSyncingBottom = false;
    };
  },

  async syncAdn(startFromZero = false) {
    const cnpj = this.state.activeRepresentation ? this.state.activeRepresentation.cnpjRaw : '';
    if (!cnpj) {
      alert('Vincule uma empresa representada por CNPJ antes de sincronizar o histórico ADN.');
      this.openRepresentationModal();
      return;
    }

    const btn = startFromZero ? document.getElementById('btnSyncAdnAll') : document.getElementById('btnSyncAdn');
    let origHtml = '';
    if (btn) {
      origHtml = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<span class="animate-spin inline-block text-xs mr-1">⌛</span> ${startFromZero ? 'Sincronizando Todo o Histórico...' : 'Sincronizando com ADN...'}`;
    }

    this.showToast(startFromZero ? 'Iniciando sincronização completa por NSU no ADN...' : 'Buscando novos documentos no ADN...', 'info');

    try {
      const res = await safeFetchJson('/api/adn/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prestadorCnpj: cnpj,
          startFromZero: Boolean(startFromZero),
          maxBatches: 35
        })
      });

      if (!res.success) {
        window.friendlyErrorModal.show(res.error);
      } else {
        await this.loadHistory();
        this.showToast(`Sincronização com o ADN concluída! Documentos sincronizados: ${res.totalSincronizadas}`);
        alert(`Sincronização ADN Oficial Concluída!\n\nDocumentos processados nesta execução: ${res.totalSincronizadas}\nÚltimo NSU da fila: ${res.ultNSU}\nTotal de notas disponíveis: ${res.notas ? res.notas.length : 0}`);
      }
    } catch (e) {
      window.friendlyErrorModal.show({
        title: 'Falha na Sincronização ADN',
        category: 'Ambiente de Dados Nacional',
        message: 'Não foi possível contatar o endpoint de distribuição do ADN da Receita Federal.',
        technicalDetail: e.message
      });
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = origHtml;
        if (window.lucide) lucide.createIcons();
      }
    }
  },

  async consultarPorChaveOnline() {
    const input = document.getElementById('inputBuscarChave');
    const btn = document.getElementById('btnBuscarChaveOnline');
    if (!input) return;

    const chave = (input.value || '').replace(/\D/g, '');
    if (!chave || chave.length !== 50) {
      alert(`Por favor, digite a Chave de Acesso completa com 50 dígitos. Você digitou ${chave.length} dígitos.`);
      input.focus();
      return;
    }

    let origHtml = '';
    if (btn) {
      origHtml = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<span class="animate-spin mr-1">⏳</span> Consultando...`;
    }

    try {
      const res = await safeFetchJson('/api/adn/consultar-chave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chaveAcesso: chave })
      });

      if (!res.success) {
        window.friendlyErrorModal.show(res.error);
      } else {
        await this.loadHistory();
        this.showToast(`NFS-e Nº ${res.nfse.numeroNfse} consultada e sincronizada com sucesso!`);
        input.value = '';
      }
    } catch (e) {
      window.friendlyErrorModal.show({
        title: 'Falha na Consulta por Chave',
        category: 'SEFIN Nacional',
        message: 'Não foi possível consultar a NFS-e informada.',
        technicalDetail: e.message
      });
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = origHtml;
        if (window.lucide) lucide.createIcons();
      }
    }
  },

  async handleXmlBatchUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('xmlFiles', files[i]);
    }

    this.showToast(`Importando ${files.length} arquivo(s) XML...`, 'info');

    try {
      const response = await fetch('/api/adn/import-xml', {
        method: 'POST',
        body: formData
      });
      const res = await response.json();

      if (!res.success) {
        window.friendlyErrorModal.show(res.error);
      } else {
        await this.loadHistory();
        this.showToast(`${res.totalImportadas} arquivo(s) XML de NFS-e importado(s) com sucesso!`);
        alert(`Importação concluída com sucesso!\n\nDocumentos XML processados: ${res.totalImportadas}\nTotal adicionados/atualizados: ${res.totalSalvas}`);
      }
    } catch (e) {
      alert(`Falha ao importar arquivos XML: ${e.message}`);
    } finally {
      event.target.value = '';
    }
  },

  viewDanfse(chaveAcesso) {
    const nfse = this.state.history.find(n => n.chaveAcesso === chaveAcesso);
    if (nfse) {
      window.danfseViewer.show(nfse);
    }
  },

  downloadXml(chaveAcesso) {
    window.location.href = `/api/adn/nfse/${chaveAcesso}/xml`;
  },

  async promptCancelamento(chaveAcesso) {
    const motivo = prompt('Informe o motivo oficial do cancelamento (ex: Erro na emissão, Serviço não prestado, Duplicidade):', 'Erro na emissão');
    if (!motivo) return;

    const justificativa = prompt('Digite a justificativa detalhada (mínimo 15 caracteres):', 'Cancelamento operacional solicitado pelo prestador');
    if (!justificativa) return;

    try {
      const res = await safeFetchJson(`/api/adn/nfse/${chaveAcesso}/cancelar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo, justificativa })
      });

      if (!res.success) {
        window.friendlyErrorModal.show(res.error);
      } else {
        alert(res.mensagem);
        await this.loadHistory();
      }
    } catch (err) {
      window.friendlyErrorModal.show({
        title: 'Falha ao Cancelar NFS-e',
        category: 'ADN Cancelamento',
        message: 'Ocorreu um erro ao registrar o evento de cancelamento no ADN.',
        technicalDetail: err.message
      });
    }
  },

  // --- EMISSÃO ---
  validateProxyDebounced(cnpj) {
    clearTimeout(this._proxyTimeout);
    this._proxyTimeout = setTimeout(async () => {
      const clean = (cnpj || '').replace(/\D/g, '');
      const badge = document.getElementById('proxyValidationBadge');
      if (!badge) return;

      if (clean.length !== 14 && clean.length !== 11) {
        badge.className = 'p-3 rounded-xl text-xs bg-slate-50 text-slate-500 border border-slate-200';
        badge.innerHTML = `Digite os 14 dígitos do CNPJ para verificar a representação por procuração.`;
        return;
      }

      try {
        const res = await safeFetchJson('/api/proxy/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prestadorCnpj: clean })
        });

        if (res.valid) {
          if (res.isProxy) {
            badge.className = 'p-3 rounded-xl text-xs bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-start space-x-2';
            badge.innerHTML = `
              <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"></i>
              <div>
                <span class="font-bold">Emissão via Procuração Eletrônica RFB:</span>
                <p class="mt-0.5">${res.message}</p>
              </div>
            `;
          } else {
            badge.className = 'p-3 rounded-xl text-xs bg-blue-50 text-blue-900 border border-blue-200 flex items-start space-x-2';
            badge.innerHTML = `
              <i data-lucide="shield" class="w-4 h-4 text-blue-600 shrink-0 mt-0.5"></i>
              <div>
                <span class="font-bold">Titular Direto do Certificado:</span>
                <p class="mt-0.5">${res.message}</p>
              </div>
            `;
          }
        } else {
          badge.className = 'p-3 rounded-xl text-xs bg-rose-50 text-rose-900 border border-rose-200 flex items-start space-x-2';
          badge.innerHTML = `
            <i data-lucide="alert-triangle" class="w-4 h-4 text-rose-600 shrink-0 mt-0.5"></i>
            <div>
              <span class="font-bold">Aviso de Procuração:</span>
              <p class="mt-0.5">${res.message}</p>
            </div>
          `;
        }
        if (window.lucide) lucide.createIcons();
      } catch (e) {
        console.error('Erro ao validar procuração:', e);
      }
    }, 400);
  },

  calculateEmissionTotals() {
    const getNum = id => parseFloat(document.getElementById(id)?.value || 0) || 0;

    const vServ = getNum('fValorServico');
    const vDescIncond = getNum('fDescontoIncondicionado');
    const vDed = getNum('fValorDeducoes');

    // Base de Cálculo Efetiva = Valor Serviço - Desconto Incondicionado - Deduções
    const vBcIss = Math.max(0, Math.round((vServ - vDescIncond - vDed) * 100) / 100);

    const retencaoSim = document.querySelector('input[name="fRetencaoIssqnRadio"]:checked')?.value === 'sim';
    const pAliq = getNum('fAliquotaIss');
    const vIss = (retencaoSim && pAliq > 0) ? Math.round((vBcIss * (pAliq / 100)) * 100) / 100 : 0;
    const vIssRet = retencaoSim ? vIss : 0;

    const vIr = getNum('fRetIr');
    const vContrSoc = getNum('fRetContrSociais');
    const vInss = getNum('fRetInss');

    const totalRetencoes = vIssRet + vIr + vContrSoc + vInss;
    const vLiquido = Math.max(0, Math.round((vServ - vDescIncond - totalRetencoes) * 100) / 100);

    const setTxt = (id, txt) => {
      const el = document.getElementById(id);
      if (el) el.innerText = txt;
    };

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    };

    const fmt = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    setVal('calcBaseCalculoIss', vBcIss > 0 ? fmt(vBcIss) : '-');
    setVal('calcValorIssDisp', vIss > 0 ? fmt(vIss) : '-');
    setTxt('calcValorIss', retencaoSim ? fmt(vIss) : 'Simples Nacional');
    setTxt('calcValorIssRet', fmt(vIssRet));
    setTxt('calcTotalRetencoes', fmt(totalRetencoes));
    setTxt('calcValorLiquido', fmt(vLiquido));
  },

  checkTomadorObrigaRetencao(doc, nome) {
    const cleanDoc = (doc || '').replace(/\D/g, '');
    const cleanNome = (nome || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // 1. Caixa Econômica Federal (todas as agências/filiais têm raiz 00.360.305)
    if (cleanDoc.startsWith('00360305') || cleanNome.includes('CAIXA ECONOMICA') || cleanNome.includes(' C E F ') || cleanNome.startsWith('CEF ')) {
      return {
        obriga: true,
        entidade: 'Caixa Econômica Federal (CEF)',
        motivo: 'Instituição financeira e responsável tributário legal pela retenção na fonte do ISSQN (art. 6º, § 2º, II da LC 116/2003).'
      };
    }

    // 2. Banco do Brasil
    if (cleanDoc.startsWith('00000000') || cleanNome.includes('BANCO DO BRASIL')) {
      return {
        obriga: true,
        entidade: 'Banco do Brasil S.A.',
        motivo: 'Instituição financeira e responsável tributário legal pela retenção na fonte do ISSQN (art. 6º da LC 116/2003).'
      };
    }

    // 3. BANESE (Banco do Estado de Sergipe)
    if (cleanDoc.startsWith('13009717') || cleanNome.includes('BANCO DO ESTADO DE SERGIPE') || cleanNome.includes('BANESE')) {
      return {
        obriga: true,
        entidade: 'BANESE (Banco do Estado de Sergipe)',
        motivo: 'Instituição financeira e responsável tributário legal pela retenção na fonte do ISSQN.'
      };
    }

    // 4. Outros Bancos de Grande Porte
    const bancosRaiz = [
      { raiz: '90400888', nome: 'Banco Santander' },
      { raiz: '60746948', nome: 'Banco Bradesco' },
      { raiz: '60701190', nome: 'Banco Itaú / Unibanco' },
      { raiz: '07237373', nome: 'Banco do Nordeste (BNB)' }
    ];
    for (const b of bancosRaiz) {
      if (cleanDoc.startsWith(b.raiz)) {
        return {
          obriga: true,
          entidade: b.nome,
          motivo: 'Instituição financeira sujeita a retenção obrigatória de ISSQN na fonte (art. 6º da LC 116/2003).'
        };
      }
    }

    if (cleanNome.includes('BANCO ') || cleanNome.includes('SICOOB') || cleanNome.includes('SICREDI') || cleanNome.includes('COOPERATIVA DE CREDITO')) {
      return {
        obriga: true,
        entidade: 'Instituição Financeira / Bancária',
        motivo: 'Instituição financeira sujeita a retenção obrigatória de ISSQN na fonte (art. 6º da LC 116/2003).'
      };
    }

    // 5. Órgãos Públicos e Entidades da Administração Pública
    if (
      cleanNome.includes('PREFEITURA') ||
      cleanNome.includes('MUNICIPIO DE') ||
      cleanNome.includes('GOVERNO DO ESTADO') ||
      cleanNome.includes('ESTADO DE SERGIPE') ||
      cleanNome.includes('SECRETARIA DE ESTADO') ||
      cleanNome.includes('TRIBUNAL DE JUSTICA') ||
      cleanNome.includes('TRIBUNAL REGIONAL') ||
      cleanNome.includes('UNIVERSIDADE FEDERAL') ||
      cleanNome.includes('PETROBRAS') ||
      cleanNome.includes('EMBRAPA') ||
      cleanNome.includes('CORREIOS')
    ) {
      return {
        obriga: true,
        entidade: 'Órgão / Entidade Pública',
        motivo: 'Órgão ou entidade pública com retenção obrigatória do ISSQN na fonte (art. 6º, § 2º, I da LC 116/2003).'
      };
    }

    return { obriga: false };
  },

  applyTomadorRetencaoRules() {
    const doc = (document.getElementById('fTomadorDoc')?.value || '').trim();
    const nome = (document.getElementById('fTomadorNome')?.value || '').trim();
    const lblTomadorDesc = document.getElementById('lblRetidoTomadorDesc');
    const badgeAuto = document.getElementById('badgeRetencaoAutoDetect');
    const txtBadgeAuto = document.getElementById('txtBadgeRetencaoAutoDetect');

    if (lblTomadorDesc) {
      if (doc || nome) {
        lblTomadorDesc.innerText = `${doc || '-'} - ${nome || 'Tomador Não Informado'}`;
      } else {
        lblTomadorDesc.innerText = '00.000.000/0000-00 - Tomador Não Informado';
      }
    }

    const check = this.checkTomadorObrigaRetencao(doc, nome);
    if (check.obriga) {
      if (badgeAuto && txtBadgeAuto) {
        txtBadgeAuto.innerText = `Retenção Obrigatória: ${check.entidade}`;
        badgeAuto.classList.remove('hidden');
      }

      // Se o usuário não alterou manualmente para 'nao', seleciona 'sim' automaticamente
      if (!this.state.manualRetencaoNao) {
        const radioSim = document.querySelector('input[name="fRetencaoIssqnRadio"][value="sim"]');
        if (radioSim && !radioSim.checked) {
          radioSim.checked = true;
          this.handleRetencaoIssqnChange('sim', true);
        }
      }
    } else {
      if (badgeAuto) badgeAuto.classList.add('hidden');
    }
  },

  handleRetencaoIssqnChange(val, isAuto = false) {
    if (!isAuto && val === 'nao') {
      this.state.manualRetencaoNao = true;
    } else if (!isAuto && val === 'sim') {
      this.state.manualRetencaoNao = false;
    }

    const boxOpcoes = document.getElementById('boxOpcoesRetencaoIssqn');
    const alertAviso = document.getElementById('alertTomadorRetencaoAviso');
    const txtAviso = document.getElementById('txtTomadorRetencaoAviso');
    const aliqInp = document.getElementById('fAliquotaIss');
    const aliqRetInp = document.getElementById('fAliquotaRetencao');

    const doc = (document.getElementById('fTomadorDoc')?.value || '').trim();
    const nome = (document.getElementById('fTomadorNome')?.value || '').trim();
    const check = this.checkTomadorObrigaRetencao(doc, nome);

    if (val === 'sim') {
      if (boxOpcoes) boxOpcoes.classList.remove('hidden');
      if (alertAviso) alertAviso.classList.add('hidden');

      // Garante alíquota padrão válida se vazia (2.00%)
      if (aliqRetInp && (!aliqRetInp.value || parseFloat(aliqRetInp.value) <= 0)) {
        aliqRetInp.value = '2.00';
      }
      if (aliqInp) {
        aliqInp.value = aliqRetInp ? aliqRetInp.value : '2.00';
        aliqInp.readOnly = false;
        aliqInp.classList.remove('cursor-not-allowed', 'bg-slate-100');
        aliqInp.classList.add('bg-white');
      }

      // Atualiza texto do tomador na opção
      this.applyTomadorRetencaoRules();

      if (isAuto) {
        this.showToast(`Tomador (${check.entidade}) identificado como retentor obrigatório de ISS. Retenção selecionada!`, 'info');
      }
    } else {
      if (boxOpcoes) boxOpcoes.classList.add('hidden');

      // Se tomador for CEF / Banco / Órgão Público, exibe aviso de atenção
      if (check.obriga && alertAviso && txtAviso) {
        txtAviso.innerText = `O tomador informado (${check.entidade}) é legalmente qualificado como Responsável Tributário pela retenção na fonte do ISSQN (art. 6º da LC 116/2003). Caso a legislação não dispense expressamente, selecione "Sim".`;
        alertAviso.classList.remove('hidden');
      } else if (alertAviso) {
        alertAviso.classList.add('hidden');
      }

      if (aliqInp) {
        aliqInp.readOnly = true;
        aliqInp.classList.add('cursor-not-allowed', 'bg-slate-100');
        aliqInp.classList.remove('bg-white');
        aliqInp.value = '-';
      }
    }

    if (window.lucide) lucide.createIcons();
    this.calculateEmissionTotals();
  },

  handleQuemRetemIssqnChange(quem) {
    if (quem === 'intermediario') {
      const doc = (document.getElementById('fIntermDoc')?.value || '').trim();
      const nome = (document.getElementById('fIntermNome')?.value || '').trim();
      if (!doc || !nome) {
        this.abrirModalIntermediario();
      }
    }
    this.calculateEmissionTotals();
  },

  handleAliquotaRetencaoInput(el) {
    const aliqInp = document.getElementById('fAliquotaIss');
    if (aliqInp) {
      aliqInp.value = el.value || '2.00';
    }
    this.calculateEmissionTotals();
  },

  editarTomadorNaEtapa1() {
    this.goToEmissionStep(1);
    const docEl = document.getElementById('fTomadorDoc');
    if (docEl) {
      docEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      docEl.focus();
    }
  },

  abrirModalIntermediario() {
    const modal = document.getElementById('modalIntermediario');
    if (modal) {
      modal.classList.remove('hidden');
      const docInput = document.getElementById('fIntermDoc');
      if (docInput) setTimeout(() => docInput.focus(), 50);
      if (window.lucide) lucide.createIcons();
    }
  },

  closeModalIntermediario() {
    const modal = document.getElementById('modalIntermediario');
    if (modal) modal.classList.add('hidden');
  },

  salvarIntermediario(e) {
    if (e && e.preventDefault) e.preventDefault();
    const doc = (document.getElementById('fIntermDoc')?.value || '').trim();
    const nome = (document.getElementById('fIntermNome')?.value || '').trim();
    if (!doc || !nome) {
      alert('Informe o CPF/CNPJ e o Nome/Razão Social do Intermediário.');
      return;
    }
    const lbl = document.getElementById('lblRetidoIntermediarioDesc');
    if (lbl) {
      lbl.innerText = `${doc} - ${nome}`;
      lbl.classList.remove('italic', 'text-slate-500');
      lbl.classList.add('font-medium', 'text-slate-700');
    }
    const btnTxt = document.getElementById('txtBtnAcaoIntermediario');
    if (btnTxt) btnTxt.innerText = 'Editar Intermediário';

    // Seleciona a opção de retenção pelo intermediário
    const radioInterm = document.querySelector('input[name="fQuemRetemIssqn"][value="intermediario"]');
    if (radioInterm) radioInterm.checked = true;

    this.closeModalIntermediario();
    this.showToast('Intermediário do serviço cadastrado com sucesso!');
    this.calculateEmissionTotals();
  },

  limparIntermediario() {
    const docEl = document.getElementById('fIntermDoc');
    const nomeEl = document.getElementById('fIntermNome');
    const imEl = document.getElementById('fIntermIm');
    if (docEl) docEl.value = '';
    if (nomeEl) nomeEl.value = '';
    if (imEl) imEl.value = '';

    const lbl = document.getElementById('lblRetidoIntermediarioDesc');
    if (lbl) {
      lbl.innerText = 'Não informado';
      lbl.classList.add('italic', 'text-slate-500');
      lbl.classList.remove('font-medium', 'text-slate-700');
    }
    const btnTxt = document.getElementById('txtBtnAcaoIntermediario');
    if (btnTxt) btnTxt.innerText = 'Incluir Intermediário';

    const radioTomador = document.querySelector('input[name="fQuemRetemIssqn"][value="tomador"]');
    if (radioTomador) radioTomador.checked = true;

    this.closeModalIntermediario();
    this.calculateEmissionTotals();
  },

  handleModoTribAproxChange(modo) {
    const box = document.getElementById('boxAliqSimplesNac');
    if (box) {
      if (modo === 'simples') box.classList.remove('hidden');
      else box.classList.add('hidden');
    }
  },

  getEmissionPayload() {
    const getVal = id => (document.getElementById(id)?.value || '').trim();
    const getNum = id => parseFloat(document.getElementById(id)?.value || 0) || 0;
    const chkSerieNum = document.getElementById('chkInformarSerieNum')?.checked;
    const tomadorLocalizacao = document.querySelector('input[name="fTomadorLocalizacao"]:checked')?.value || 'brasil';
    const tomadorDocRaw = getVal('fTomadorDoc').replace(/\D/g, '');
    const tomadorTipoDoc = tomadorLocalizacao === 'exterior' ? 'NIF' : (tomadorDocRaw.length === 11 ? 'CPF' : 'CNPJ');

    const retencaoSim = document.querySelector('input[name="fRetencaoIssqnRadio"]:checked')?.value === 'sim';
    const exigSuspSim = document.querySelector('input[name="fExigibilidadeSuspensa"]:checked')?.value === 'sim';

    return {
      // 0. Configurações Iniciais da NFS-e
      ibsCbs: document.querySelector('input[name="fIbsCbs"]:checked')?.value || 'nao',
      dataCompetencia: getVal('fDataCompetencia') || new Date().toISOString().substring(0, 10),
      serie: (chkSerieNum ? getVal('fSerieDps') : '00001') || '00001',
      numeroDps: (chkSerieNum && getVal('fNumeroDps')) ? parseInt(getVal('fNumeroDps'), 10) : Math.floor(1000 + Math.random() * 9000),

      // 1. Prestador Representado / Emitente
      tpEmit: document.querySelector('input[name="fTpEmit"]:checked')?.value || '1',
      prestadorCnpj: getVal('fPrestadorCnpj'),
      prestadorRazaoSocial: getVal('fPrestadorRazaoSocial'),
      prestadorIm: getVal('fPrestadorIm') || '842161',
      municipioIbge: getVal('fMunicipioIbge') || '2800308',
      opSimpNac: parseInt(getVal('fOpSimpNac'), 10) || 3,
      regApTribSN: parseInt(getVal('fRegApTribSN'), 10) || 1,
      regEspTrib: parseInt(getVal('fRegEspTribSelect') || getVal('fRegEspTrib') || '0', 10),
      prestadorCep: getVal('fPrestadorCep'),
      prestadorLogradouro: getVal('fPrestadorLogradouro'),
      prestadorNumero: getVal('fPrestadorNumero'),
      prestadorBairro: getVal('fPrestadorBairro'),

      // 2. Compras Governamentais
      comprasGovernamentais: document.querySelector('input[name="fComprasGov"]:checked')?.value || 'nao',

      // 3. Tomador / Adquirente
      tomadorLocalizacao,
      tomadorTipoDoc,
      tomadorDoc: getVal('fTomadorDoc'),
      tomadorNome: getVal('fTomadorNome'),
      tomadorIm: getVal('fTomadorIm'),
      tomadorEmail: getVal('fTomadorEmail'),
      tomadorTelefone: getVal('fTomadorTelefone'),
      informarEnderecoTomador: document.getElementById('chkInformarEnderecoTomador')?.checked !== false,
      tomadorCep: getVal('fTomadorCep'),
      tomadorLogradouro: getVal('fTomadorLogradouro'),
      tomadorNumero: getVal('fTomadorNumero'),
      tomadorComplemento: getVal('fTomadorComplemento'),
      tomadorBairro: getVal('fTomadorBairro'),
      tomadorMunicipio: getVal('fTomadorMunicipio'),
      tomadorUf: getVal('fTomadorUf') || 'SE',
      tomadorMunIbge: document.getElementById('fTomadorDoc')?.dataset?.municipioIbge || getVal('fMunicipioIbge') || '2800308',

      // 4. Local da Prestação
      localPrestacaoIbge: getVal('fLocalPrestacaoIbge') || getVal('fMunicipioIbge') || '2800308',
      paisPrestacao: getVal('fPaisPrestacao') || '1058',

      // 5. Serviço & Classificação Nacional
      cTribNac: getVal('fCTribNac') || '171901',
      cTribMun: getVal('fCTribMun'),
      beneficioIss: document.querySelector('input[name="fBeneficioIss"]:checked')?.value || 'nao',
      itemNbs: getVal('fItemNbs') || '',
      codigoIndicadorOperacao: parseInt(getVal('fCodigoIndicadorOperacao'), 10) || 1,
      tribIssqn: exigSuspSim ? 6 : (parseInt(getVal('fCodigoIndicadorOperacao'), 10) || 1),
      municipioIncidenciaIbge: getVal('fLocalPrestacaoIbge') || getVal('fMunicipioIbge') || '2800308',
      descricaoServico: getVal('fDescricaoServico') || 'PRESTACAO DE SERVICOS',

      // 6. Informações Complementares
      artRrt: getVal('fArtRrt'),
      docReferencia: getVal('fDocReferencia'),
      informacoesComplementares: getVal('fInformacoesComplementares'),

      // 7. Intermediário (se houver)
      temIntermediario: document.getElementById('chkTemIntermediario')?.checked || false,
      intermDoc: getVal('fIntermDoc'),
      intermNome: getVal('fIntermNome'),
      intermIm: getVal('fIntermIm'),

      // 8. Construção Civil / Informações para Obra (<obra>)
      dadosObra: this.getDadosObraPayload(),
      tipoObra: document.querySelector('input[name="fTipoObra"]:checked')?.value || 'codigo_obra',
      codigoObra: getVal('fObraCodigo'),
      codigoObraCno: getVal('fObraCodigo'),
      cibObra: getVal('fObraCib'),
      inscImobFiscObra: getVal('fObraInscImobFisc'),
      cepObra: getVal('fObraCep'),
      municipioIbgeObra: getVal('fObraMunicipioIbge'),
      bairroObra: getVal('fObraBairro'),
      logradouroObra: getVal('fObraLogradouro'),
      numeroObra: getVal('fObraNumero'),
      complementoObra: getVal('fObraComplemento'),
      cepExtObra: getVal('fObraCepExt'),
      paisObra: getVal('fObraPaisExt'),
      cidadeExtObra: getVal('fObraCidadeExt'),
      estadoExtObra: getVal('fObraEstadoExt'),
      bairroExtObra: getVal('fObraBairroExt'),
      logradouroExtObra: getVal('fObraLogradouroExt'),
      numeroExtObra: getVal('fObraNumeroExt'),
      complementoExtObra: getVal('fObraComplementoExt'),
      artRegistro: getVal('fArtRegistro'),

      // 9. Valores do Fornecimento & Tributação Municipal
      valorServico: getNum('fValorServico'),
      valorIntermediario: getNum('fValorIntermediario'),
      descontoIncondicionado: getNum('fDescontoIncondicionado'),
      descontoCondicionado: getNum('fDescontoCondicionado'),
      valorDeducoes: getNum('fValorDeducoes'),
      exigibilidadeSuspensa: exigSuspSim ? 'sim' : 'nao',
      retencaoIss: retencaoSim ? 'sim' : 'nao',
      tipoRetencaoIss: retencaoSim ? (document.querySelector('input[name="fQuemRetemIssqn"]:checked')?.value === 'intermediario' ? 3 : 2) : 1,
      issRetido: retencaoSim,
      quemRetemIssqn: document.querySelector('input[name="fQuemRetemIssqn"]:checked')?.value || 'tomador',
      beneficioMunicipal: document.querySelector('input[name="fBeneficioMunicipal"]:checked')?.value || 'nao',
      aliquotaIss: retencaoSim ? (getNum('fAliquotaRetencao') || getNum('fAliquotaIss') || 2.0) : (getNum('fAliquotaIss') || 0),

      // 10. Tributação Federal & IBS/CBS
      cstPisCofins: getVal('fCstPisCofins'),
      tipoRetencaoPisCofinsCsll: getVal('fTipoRetencaoPisCofinsCsll'),
      retIr: getNum('fRetIr'),
      retContrSociais: getNum('fRetContrSociais'),
      retCsll: getNum('fRetContrSociais'),
      retInss: getNum('fRetInss'),
      cstIbsCbs: getVal('fCstIbsCbs'),
      cClassIbsCbs: getVal('fCClassIbsCbs'),

      // 11. Valor Aproximado dos Tributos
      modoValorAproxTrib: document.querySelector('input[name="fModoValorAproxTrib"]:checked')?.value || 'simples',
      aliquotaSimplesNacional: getNum('fAliquotaSimplesNacional') || 15.50,
      pTotTribSN: getNum('fAliquotaSimplesNacional') || 15.50,
      totTributosAprox: getNum('fAliquotaSimplesNacional') || 15.50
    };
  },

  getDadosObraPayload() {
    const secao = document.getElementById('secaoInformacoesObra');
    if (!secao || secao.classList.contains('hidden')) {
      return null;
    }
    const getVal = id => (document.getElementById(id)?.value || '').trim();
    const tipo = document.querySelector('input[name="fTipoObra"]:checked')?.value || 'codigo_obra';
    const payload = {
      tipo,
      inscImobFisc: getVal('fObraInscImobFisc')
    };

    if (tipo === 'codigo_obra') {
      payload.codigoObra = getVal('fObraCodigo');
    } else if (tipo === 'cib') {
      payload.cib = getVal('fObraCib').replace(/\D/g, '');
    } else if (tipo === 'endereco_brasil') {
      payload.cep = getVal('fObraCep').replace(/\D/g, '');
      payload.municipioIbge = getVal('fObraMunicipioIbge') || getVal('fLocalPrestacaoIbge') || getVal('fMunicipioIbge');
      payload.municipioNome = getVal('fObraMunicipioNome');
      payload.bairro = getVal('fObraBairro');
      payload.logradouro = getVal('fObraLogradouro');
      payload.numero = getVal('fObraNumero');
      payload.complemento = getVal('fObraComplemento');
    } else if (tipo === 'endereco_exterior') {
      payload.cep = getVal('fObraCepExt');
      payload.pais = getVal('fObraPaisExt') || '1058';
      payload.cidade = getVal('fObraCidadeExt');
      payload.estado = getVal('fObraEstadoExt');
      payload.bairro = getVal('fObraBairroExt');
      payload.logradouro = getVal('fObraLogradouroExt');
      payload.numero = getVal('fObraNumeroExt');
      payload.complemento = getVal('fObraComplementoExt');
    }
    return payload;
  },

  handleTipoObraChange(tipo) {
    const containers = {
      codigo_obra: document.getElementById('containerObraCodigo'),
      cib: document.getElementById('containerObraCib'),
      endereco_brasil: document.getElementById('containerObraEndBrasil'),
      endereco_exterior: document.getElementById('containerObraEndExterior')
    };

    Object.keys(containers).forEach(key => {
      if (containers[key]) {
        if (key === tipo) {
          containers[key].classList.remove('hidden');
        } else {
          containers[key].classList.add('hidden');
        }
      }
    });

    if (window.lucide) lucide.createIcons();
  },

  toggleSecaoObra(show, isRequired = false) {
    const secao = document.getElementById('secaoInformacoesObra');
    const btnAtivar = document.getElementById('btnAtivarObraWrapper');
    const badge = document.getElementById('badgeObraObrigatoria');
    const btnFechar = document.getElementById('btnFecharObra');
    if (!secao) return;

    if (show) {
      secao.classList.remove('hidden');
      if (btnAtivar) btnAtivar.classList.add('hidden');
      if (isRequired) {
        if (badge) badge.classList.remove('hidden');
        if (btnFechar) btnFechar.classList.add('hidden');
      } else {
        if (badge) badge.classList.add('hidden');
        if (btnFechar) btnFechar.classList.remove('hidden');
      }
    } else {
      secao.classList.add('hidden');
      if (btnAtivar) btnAtivar.classList.remove('hidden');
      if (badge) badge.classList.add('hidden');
    }
    if (window.lucide) lucide.createIcons();
  },

  verificarObrigatoriedadeObra(codigoOuSubitem) {
    const SUBITENS_OBRA = [
      '070201', '070202', '070401', '070501', '070502',
      '070601', '070602', '070701', '070801', '071701',
      '071901', '141403', '141404'
    ];
    const clean = String(codigoOuSubitem || '').replace(/\D/g, '').slice(0, 6);
    if (SUBITENS_OBRA.includes(clean)) {
      this.toggleSecaoObra(true, true);
    } else {
      const badge = document.getElementById('badgeObraObrigatoria');
      const btnFechar = document.getElementById('btnFecharObra');
      if (badge) badge.classList.add('hidden');
      if (btnFechar) btnFechar.classList.remove('hidden');
    }
  },

  async buscarCepObra() {
    const cepInput = document.getElementById('fObraCep');
    if (!cepInput) return;
    const cleanCep = (cepInput.value || '').replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      alert('Informe um CEP válido com 8 dígitos para consultar.');
      cepInput.focus();
      return;
    }

    try {
      const resViaCep = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const dataViaCep = await resViaCep.json();
      if (!dataViaCep.erro) {
        if (document.getElementById('fObraLogradouro')) document.getElementById('fObraLogradouro').value = dataViaCep.logradouro || '';
        if (document.getElementById('fObraBairro')) document.getElementById('fObraBairro').value = dataViaCep.bairro || '';
        if (document.getElementById('fObraMunicipioNome')) document.getElementById('fObraMunicipioNome').value = `${dataViaCep.localidade} / ${dataViaCep.uf}`;
        if (document.getElementById('fObraMunicipioIbge')) document.getElementById('fObraMunicipioIbge').value = dataViaCep.ibge || '';
        this.showToast(`Endereço da obra preenchido via CEP (${dataViaCep.localidade}/${dataViaCep.uf})!`);
        return;
      }
    } catch (e) {}

    try {
      const resBrasil = await fetch(`https://brasilapi.com.br/api/cep/v1/${cleanCep}`);
      if (resBrasil.ok) {
        const dataBrasil = await resBrasil.json();
        if (document.getElementById('fObraLogradouro')) document.getElementById('fObraLogradouro').value = dataBrasil.street || '';
        if (document.getElementById('fObraBairro')) document.getElementById('fObraBairro').value = dataBrasil.neighborhood || '';
        if (document.getElementById('fObraMunicipioNome')) document.getElementById('fObraMunicipioNome').value = `${dataBrasil.city} / ${dataBrasil.state}`;
        if (window.MUNICIPIOS_BRASIL && Array.isArray(window.MUNICIPIOS_BRASIL)) {
          const matchMun = window.MUNICIPIOS_BRASIL.find(m => m.nome.toLowerCase() === dataBrasil.city.toLowerCase() && m.uf === dataBrasil.state);
          if (matchMun && document.getElementById('fObraMunicipioIbge')) {
            document.getElementById('fObraMunicipioIbge').value = matchMun.id;
          }
        }
        this.showToast(`Endereço da obra preenchido via CEP!`);
        return;
      }
    } catch (e2) {}

    alert('Não foi possível localizar o endereço para o CEP da obra informado.');
  },

  async previewXmlDps() {
    const payload = this.getEmissionPayload();
    if (!payload.prestadorCnpj) {
      alert('Selecione ou informe a Empresa Representada (Prestador) primeiro.');
      return;
    }
    if (!payload.tomadorDoc) {
      alert('Informe o Documento (CPF/CNPJ) do Tomador de Serviços.');
      return;
    }

    try {
      const res = await safeFetchJson('/api/nfse/preview-dps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.success) {
        window.friendlyErrorModal.show(res.error);
        return;
      }

      const modal = document.getElementById('xmlPreviewModal');
      const contentEl = document.getElementById('xmlPreviewContent');
      const chaveEl = document.getElementById('xmlPreviewChave');

      if (contentEl) contentEl.innerText = res.preview.xml;
      if (chaveEl) chaveEl.innerText = `Chave de Acesso (50 dígitos): ${res.preview.chaveAcesso}`;
      if (modal) modal.classList.remove('hidden');
      if (window.lucide) lucide.createIcons();
    } catch (err) {
      window.friendlyErrorModal.show({
        title: 'Falha na Geração do XML da DPS',
        category: 'CGNFS-e Schema',
        message: 'Não foi possível validar a estrutura XML da DPS com as informações atuais.',
        technicalDetail: err.message
      });
    }
  },

  closeXmlPreviewModal() {
    const modal = document.getElementById('xmlPreviewModal');
    if (modal) modal.classList.add('hidden');
  },

  copyXmlPreview() {
    const content = document.getElementById('xmlPreviewContent')?.innerText || '';
    if (content) {
      navigator.clipboard.writeText(content).then(() => alert('XML da DPS copiado para a área de transferência!'));
    }
  },

  async submitEmission() {
    const payload = this.getEmissionPayload();

    // Validação preventiva de obra para Construção Civil (LC 116 / E0370)
    const SUBITENS_OBRA = [
      '070201', '070202', '070401', '070501', '070502',
      '070601', '070602', '070701', '070801', '071701',
      '071901', '141403', '141404'
    ];
    const cleanCtn = String(payload.cTribNac || '').replace(/\D/g, '').slice(0, 6);
    if (SUBITENS_OBRA.includes(cleanCtn)) {
      const tipo = payload.tipoObra || 'codigo_obra';
      if (tipo === 'codigo_obra' && !payload.codigoObra) {
        alert('Atenção: Para o serviço selecionado (Construção Civil), o preenchimento do Código da Obra (CNO ou CEI) é obrigatório pela Receita Federal.');
        this.goToEmissionStep(2);
        document.getElementById('fObraCodigo')?.focus();
        return;
      } else if (tipo === 'cib' && (!payload.cibObra || payload.cibObra.length !== 8)) {
        alert('Atenção: O Código do Cadastro Imobiliário Brasileiro (CIB) deve conter exatamente 8 dígitos.');
        this.goToEmissionStep(2);
        document.getElementById('fObraCib')?.focus();
        return;
      } else if (tipo === 'endereco_brasil' && (!payload.cepObra || !payload.logradouroObra)) {
        alert('Atenção: Informe o CEP e Logradouro da obra.');
        this.goToEmissionStep(2);
        document.getElementById('fObraCep')?.focus();
        return;
      }
    }

    const btn = document.getElementById('btnSubmitEmissao');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="animate-spin mr-2">⏳</span> Assinando e Transmitindo para o ADN...`;
    }

    try {
      const res = await safeFetchJson('/api/nfse/emitir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.success) {
        window.friendlyErrorModal.show(res.error);
      } else {
        await this.loadHistory();
        this.showEmissionSuccessModal(res.nfse);
      }
    } catch (err) {
      window.friendlyErrorModal.show({
        title: 'Erro na Transmissão da NFS-e',
        category: 'Conexão RFB / SERPRO',
        message: 'Não foi possível completar a transmissão da DPS.',
        technicalDetail: err.message
      });
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="send" class="w-4 h-4 mr-1.5"></i> Emitir NFS-e Nacional Agora`;
        if (window.lucide) lucide.createIcons();
      }
    }
  },

  showEmissionSuccessModal(nfse) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm fade-in';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-6 text-center space-y-4">
        <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-bold">
          ✓
        </div>
        <div>
          <h3 class="text-xl font-bold text-slate-900">NFS-e Emitida com Sucesso!</h3>
          <p class="text-sm text-slate-600 mt-1">Autorizada pelo Ambiente de Dados Nacional da Receita Federal.</p>
        </div>
        <div class="bg-slate-50 border border-slate-200 rounded-xl p-3 text-left text-xs space-y-1 font-mono">
          <div><span class="text-slate-400">NFS-e Nacional:</span> <span class="font-bold text-slate-800">${nfse.numeroNfse}</span></div>
          <div><span class="text-slate-400">Protocolo:</span> <span class="text-slate-800">${nfse.protocolo}</span></div>
          <div><span class="text-slate-400">Valor Bruto:</span> <span class="font-bold text-emerald-700">${(nfse.valores.vServ || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
        </div>
        <div class="grid grid-cols-2 gap-2 pt-2">
          <button onclick="this.closest('.fixed').remove(); window.danfseViewer.show(App.state.history.find(n => n.chaveAcesso === '${nfse.chaveAcesso}'))" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors">
            Visualizar DANFSE
          </button>
          <button onclick="this.closest('.fixed').remove(); App.switchTab('historico')" class="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-colors">
            Ver no Histórico
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  getNotaValor(n) {
    if (!n || !n.valores) return 0;
    const v = n.valores.vServ ?? n.valores.valorServico ?? n.valores.vLiquido ?? n.valores.valorLiquido ?? 0;
    return Number(v) || 0;
  },

  setDashPapelFilter(papel) {
    this.state.dashPapelFilter = papel;
    const btnEmit = document.getElementById('btnDashPapelEmitidas');
    const btnRec = document.getElementById('btnDashPapelRecebidas');
    const btnTodas = document.getElementById('btnDashPapelTodas');

    [btnEmit, btnRec, btnTodas].forEach(b => {
      if (!b) return;
      b.classList.remove('bg-white', 'shadow-sm', 'text-emerald-800', 'font-bold');
      b.classList.add('text-slate-600');
    });

    if (papel === 'EMITIDAS' && btnEmit) {
      btnEmit.classList.add('bg-white', 'shadow-sm', 'text-emerald-800', 'font-bold');
      btnEmit.classList.remove('text-slate-600');
    } else if (papel === 'RECEBIDAS' && btnRec) {
      btnRec.classList.add('bg-white', 'shadow-sm', 'text-emerald-800', 'font-bold');
      btnRec.classList.remove('text-slate-600');
    } else if (papel === 'TODAS' && btnTodas) {
      btnTodas.classList.add('bg-white', 'shadow-sm', 'text-emerald-800', 'font-bold');
      btnTodas.classList.remove('text-slate-600');
    }

    this.renderDashboard();
  },

  // --- DASHBOARD ---
  renderDashboard() {
    const notes = this.state.history || [];
    const cleanRepCnpj = (this.state.activeRepresentation?.cnpjRaw || '').replace(/\D/g, '');

    // Classificação por papel da empresa representada ativa
    const prestadas = notes.filter(n => {
      const pCnpj = (n.prestador?.cnpjRaw || n.prestador?.cnpj || '').replace(/\D/g, '');
      return cleanRepCnpj ? pCnpj.includes(cleanRepCnpj) : true;
    });

    const tomadas = notes.filter(n => {
      const tDoc = (n.tomador?.docRaw || n.tomador?.doc || '').replace(/\D/g, '');
      return cleanRepCnpj ? tDoc.includes(cleanRepCnpj) : false;
    });

    const totalCanceladas = notes.filter(n => n.status === 'CANCELADA' || Boolean(n.dataCancelamento));
    const autorizadasPrestadas = prestadas.filter(n => n.status !== 'CANCELADA' && !n.dataCancelamento);
    const faturamentoTotal = autorizadasPrestadas.reduce((acc, cur) => acc + this.getNotaValor(cur), 0);
    const despesasTomadasTotal = tomadas.filter(n => n.status !== 'CANCELADA' && !n.dataCancelamento).reduce((acc, cur) => acc + this.getNotaValor(cur), 0);

    // Cards de Indicadores
    const elEmitidas = document.getElementById('dashTotalEmitidas');
    if (elEmitidas) elEmitidas.innerText = cleanRepCnpj ? prestadas.length : notes.length;

    const elSubEmit = document.getElementById('dashSubEmitidas');
    if (elSubEmit) {
      elSubEmit.innerText = cleanRepCnpj 
        ? `${autorizadasPrestadas.length} autorizada(s)` 
        : 'Visão Geral do Acervo';
    }

    const elFaturado = document.getElementById('dashTotalFaturado');
    if (elFaturado) {
      elFaturado.innerText = faturamentoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    const elTomadas = document.getElementById('dashTotalTomadas');
    if (elTomadas) elTomadas.innerText = tomadas.length;

    const elTomadasVal = document.getElementById('dashTotalTomadasValor');
    if (elTomadasVal) {
      elTomadasVal.innerText = `Despesas: ${despesasTomadasTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
    }

    const elCanc = document.getElementById('dashTotalCanceladas');
    if (elCanc) elCanc.innerText = totalCanceladas.length;

    // Compatibilidade com ids legados
    const elTotal = document.getElementById('dashTotalNotas');
    if (elTotal) elTotal.innerText = notes.length;
    const elAut = document.getElementById('dashTotalAutorizadas');
    if (elAut) elAut.innerText = autorizadasPrestadas.length;

    // Tabela de Últimas NFS-e
    const recentTarget = document.getElementById('dashRecentTableBody');
    if (recentTarget) {
      const papelFilter = this.state.dashPapelFilter || 'EMITIDAS';
      let tableNotes = notes;
      if (papelFilter === 'EMITIDAS') {
        tableNotes = prestadas;
      } else if (papelFilter === 'RECEBIDAS') {
        tableNotes = tomadas;
      }

      if (tableNotes.length === 0) {
        recentTarget.innerHTML = `
          <tr>
            <td colspan="6" class="py-6 text-center text-slate-400">
              Nenhuma NFS-e encontrada nesta categoria para ${this.state.activeRepresentation?.razaoSocial || 'esta empresa'}.
            </td>
          </tr>
        `;
      } else {
        recentTarget.innerHTML = tableNotes.slice(0, 6).map(n => {
          const pCnpj = (n.prestador?.cnpjRaw || n.prestador?.cnpj || '').replace(/\D/g, '');
          const isEmitida = cleanRepCnpj ? pCnpj.includes(cleanRepCnpj) : true;
          const isCanc = n.status === 'CANCELADA' || Boolean(n.dataCancelamento);

          const papelBadge = isEmitida
            ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">Prestada</span>`
            : `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">Tomada</span>`;

          const contraparteNome = isEmitida
            ? (n.tomador?.nome || 'Tomador Não Identificado')
            : (n.prestador?.razaoSocial || n.prestador?.nomeFantasia || 'Prestador');

          const contraparteDoc = isEmitida
            ? (n.tomador?.doc || n.tomador?.docRaw || '')
            : (n.prestador?.cnpj || n.prestador?.cnpjRaw || '');

          const valorFormatado = this.getNotaValor(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          const dataFmt = n.dataEmissao ? new Date(n.dataEmissao).toLocaleDateString('pt-BR') : '-';

          return `
            <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors text-xs cursor-pointer" onclick="App.viewDanfse('${n.chaveAcesso}')">
              <td class="py-3 px-4 font-mono font-semibold text-slate-900 flex items-center space-x-1.5">
                <span>${n.numeroNfse || '-'}</span>
              </td>
              <td class="py-3 px-4">${papelBadge}</td>
              <td class="py-3 px-4 text-slate-600">${dataFmt}</td>
              <td class="py-3 px-4 font-medium text-slate-800 max-w-[240px] truncate" title="${contraparteNome}">
                <div class="truncate font-semibold">${contraparteNome}</div>
                ${contraparteDoc ? `<div class="text-[10px] text-slate-400 font-mono">${contraparteDoc}</div>` : ''}
              </td>
              <td class="py-3 px-4 font-bold text-slate-900">${valorFormatado}</td>
              <td class="py-3 px-4">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${isCanc ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}">
                  ${isCanc ? 'CANCELADA' : (n.status || 'AUTORIZADA')}
                </span>
              </td>
            </tr>
          `;
        }).join('');
      }
    }
  },

  // --- AMBIENTES ---
  openEnvModal() {
    const modal = document.getElementById('envSwitchModal');
    if (modal) modal.classList.remove('hidden');
  },

  closeEnvModal() {
    const modal = document.getElementById('envSwitchModal');
    if (modal) modal.classList.add('hidden');
  },

  async switchEnvironment(envId) {
    if (envId === 'PRODUCAO') {
      const confirmProd = confirm('ATENÇÃO: Você está selecionando o AMBIENTE DE PRODUÇÃO OFICIAL NACIONAL DA RECEITA FEDERAL. As notas emitidas possuem valor jurídico e tributário real. Deseja prosseguir?');
      if (!confirmProd) return;
    }

    try {
      const res = await safeFetchJson('/api/environments/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environmentId: envId })
      });

      if (!res.success) {
        window.friendlyErrorModal.show(res.error);
      } else {
        this.state.currentEnvironment = res.activeEnvironment;
        this.state.envConfig = res.envConfig;
        this.renderHeader();
        this.closeEnvModal();
        await this.loadHistory();
        alert(`Ambiente alterado para: ${res.envConfig.name}`);
      }
    } catch (e) {
      console.error(e);
    }
  },

  async saveSerproSettings() {
    const key = document.getElementById('cfgSerproKey')?.value || '';
    const secret = document.getElementById('cfgSerproSecret')?.value || '';

    try {
      await safeFetchJson('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serproConsumerKey: key,
          serproConsumerSecret: secret
        })
      });
      alert('Credenciais da API SERPRO salvas com sucesso!');
    } catch (e) {
      console.error(e);
    }
  },

  // --- NAVEGAÇÃO ENTRE ABAS ---
  switchTab(tabId) {
    this.state.currentTab = tabId;

    document.querySelectorAll('[data-nav-tab]').forEach(btn => {
      const active = btn.getAttribute('data-nav-tab') === tabId;
      if (active) {
        btn.classList.add('bg-slate-800', 'text-white', 'shadow-sm');
        btn.classList.remove('text-slate-600', 'hover:bg-slate-100');
      } else {
        btn.classList.remove('bg-slate-800', 'text-white', 'shadow-sm');
        btn.classList.add('text-slate-600', 'hover:bg-slate-100');
      }
    });

    document.querySelectorAll('.tab-content-panel').forEach(panel => {
      panel.classList.add('hidden');
    });

    const activePanel = document.getElementById(`panel-${tabId}`);
    if (activePanel) {
      activePanel.classList.remove('hidden');
      activePanel.classList.add('fade-in');
    }

    if (tabId === 'dashboard') this.renderDashboard();
    if (tabId === 'historico') {
      this.renderHistoryTable();
      setTimeout(() => this.setupDualScrollbar(), 60);
    }
    if (tabId === 'certificado') this.renderCertManagement();
    if (tabId === 'ajuda') this.renderErrorDictionary();
    if (tabId === 'emissao') {
      if (this.state.activeRepresentation) {
        this.fillEmissionFormWithRepresentation(this.state.activeRepresentation);
      }
      this.goToEmissionStep(1);
    }

    if (window.lucide) lucide.createIcons();
  },

  renderActiveTab() {
    this.switchTab(this.state.currentTab);
  },

  populateAuxDropdowns() {
    if (!this.state.auxData) return;

    // 1. Inicializa Comboboxes com Busca Inteligente em Tempo Real (LC 116 / Códigos de Tributação Nacional e NBS)
    this.setupCTribNacCombobox();
    this.setupItemNbsCombobox();
    this.setupFltTipoServicoCombobox();

    // 2. Opções do Simples Nacional
    const simpSelect = document.getElementById('fOpSimpNac');
    if (simpSelect && this.state.auxData.opcoesSimplesNacional) {
      simpSelect.innerHTML = '';
      this.state.auxData.opcoesSimplesNacional.forEach(o => {
        const opt = document.createElement('option');
        opt.value = o.codigo;
        opt.innerText = o.nome;
        simpSelect.appendChild(opt);
      });
    }

    // 3. Regimes Especiais de Tributação
    const regEspSelect = document.getElementById('fRegEspTrib');
    if (regEspSelect && this.state.auxData.regimesEspeciaisTributacao) {
      regEspSelect.innerHTML = '';
      this.state.auxData.regimesEspeciaisTributacao.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.codigo;
        opt.innerText = r.nome;
        regEspSelect.appendChild(opt);
      });
    }

    // 4. Natureza da Operação / Exigibilidade do ISS
    const exigSelect = document.getElementById('fTribIssqn');
    if (exigSelect && this.state.auxData.exigibilidadesIss) {
      exigSelect.innerHTML = '';
      this.state.auxData.exigibilidadesIss.forEach(ex => {
        const opt = document.createElement('option');
        opt.value = ex.codigo;
        opt.innerText = ex.nome;
        exigSelect.appendChild(opt);
      });
      exigSelect.addEventListener('change', () => this.calculateEmissionTotals());
    }

    // 5. Tipos de Retenção do ISS
    const retSelect = document.getElementById('fTipoRetencaoIss');
    if (retSelect && this.state.auxData.tiposRetencaoIss) {
      retSelect.innerHTML = '';
      this.state.auxData.tiposRetencaoIss.forEach(ret => {
        const opt = document.createElement('option');
        opt.value = ret.codigo;
        opt.innerText = ret.nome;
        retSelect.appendChild(opt);
      });
      retSelect.addEventListener('change', () => this.calculateEmissionTotals());
    }
  },

  // --- NORMALIZAÇÃO E BUSCA DE ATIVIDADES / CÓDIGOS DE TRIBUTAÇÃO NACIONAL (LC 116/2003) ---
  normalizeSearchText(str) {
    if (!str) return '';
    return String(str)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  },

  // 1. Combobox de Atividade / Código de Tributação Nacional na Emissão (DPS)
  setupCTribNacCombobox() {
    const searchInput = document.getElementById('fCTribNacSearch');
    const dropdown = document.getElementById('fCTribNacDropdown');
    const hiddenInput = document.getElementById('fCTribNac');
    if (!searchInput || !dropdown || !hiddenInput) return;

    const list = this.state.auxData?.tributacaoNacional || [];

    // Inicializa seleção padrão se não houver
    const currentCode = hiddenInput.value || '100901';
    const found = list.find(item => item.cTribNac === currentCode || item.codigo === currentCode || item.codigo.replace(/\D/g,'').startsWith(currentCode));
    if (found) {
      this.selectCTribNac(found, false);
    } else if (list.length > 0) {
      this.selectCTribNac(list[0], false);
    }

    searchInput.addEventListener('input', () => {
      this.renderCTribNacDropdown(searchInput.value);
    });

    searchInput.addEventListener('focus', () => {
      this.renderCTribNacDropdown(searchInput.value);
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        dropdown.classList.add('hidden');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const firstOption = dropdown.querySelector('[data-trib-item]');
        if (firstOption) {
          firstOption.click();
        }
      }
    });

    document.addEventListener('click', (e) => {
      const wrapper = document.getElementById('comboboxCTribNacWrapper');
      if (wrapper && !wrapper.contains(e.target)) {
        dropdown.classList.add('hidden');
      }
    });
  },

  toggleCTribNacDropdown() {
    const dropdown = document.getElementById('fCTribNacDropdown');
    const searchInput = document.getElementById('fCTribNacSearch');
    if (!dropdown) return;
    if (dropdown.classList.contains('hidden')) {
      this.renderCTribNacDropdown(searchInput?.value || '');
      searchInput?.focus();
    } else {
      dropdown.classList.add('hidden');
    }
  },

  renderCTribNacDropdown(query) {
    const dropdown = document.getElementById('fCTribNacDropdown');
    if (!dropdown) return;

    const list = this.state.auxData?.tributacaoNacional || [];
    const norm = this.normalizeSearchText(query);
    const digitsOnly = (query || '').replace(/\D/g, '');

    let matches = list;
    if (norm) {
      matches = list.filter(item => {
        const itemNorm = this.normalizeSearchText(item.descricao);
        const codeClean = (item.cTribNac || item.codigo || '').replace(/\D/g, '');
        const codeFmt = item.codigo ? item.codigo.toLowerCase() : '';
        const lcNorm = item.itemLc116 ? item.itemLc116.replace(/\D/g, '') : '';
        return (
          itemNorm.includes(norm) ||
          codeFmt.includes(norm) ||
          (digitsOnly && (codeClean.includes(digitsOnly) || lcNorm.includes(digitsOnly)))
        );
      });
    }

    dropdown.classList.remove('hidden');

    if (matches.length === 0) {
      dropdown.innerHTML = `
        <div class="p-3 text-center text-slate-500">
          <p class="font-medium">Nenhuma atividade encontrada para "${query}".</p>
          ${digitsOnly ? `
            <button type="button" onclick="App.selectCustomCTribNac('${digitsOnly}')" class="mt-2 inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition-colors">
              <span>Usar código numérico "${digitsOnly}"</span>
            </button>
          ` : ''}
        </div>
      `;
      return;
    }

    const maxItems = 45;
    const pagedMatches = matches.slice(0, maxItems);

    dropdown.innerHTML = pagedMatches.map(item => {
      const codeDigits = item.cTribNac || item.codigo.replace(/\D/g,'').slice(0,6);
      return `
        <div data-trib-item="${codeDigits}" onclick="App.selectCTribNacByCode('${codeDigits}')" class="p-2.5 hover:bg-emerald-50/80 cursor-pointer transition-colors flex items-start justify-between gap-3 group">
          <div class="space-y-0.5 min-w-0">
            <div class="flex items-center space-x-2">
              <span class="font-mono font-bold text-slate-900 group-hover:text-emerald-800 text-[11px] bg-slate-100 group-hover:bg-emerald-100 px-1.5 py-0.5 rounded">
                ${item.codigo}
              </span>
              <span class="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-medium">
                Item ${item.itemLc116}
              </span>
            </div>
            <p class="text-xs text-slate-700 leading-snug group-hover:text-slate-950 font-medium">
              ${item.descricao}
            </p>
          </div>
          <span class="text-[10px] font-semibold text-slate-500 group-hover:text-emerald-700 whitespace-nowrap bg-slate-50 group-hover:bg-white px-2 py-1 rounded border border-slate-200 shrink-0">
            Alíq. ${Number(item.aliquotaReferencia || 2).toFixed(2).replace('.', ',')}%
          </span>
        </div>
      `;
    }).join('');

    if (matches.length > maxItems) {
      dropdown.innerHTML += `
        <div class="p-2 text-center text-[11px] text-slate-400 bg-slate-50 font-medium">
          Mostrando ${maxItems} de ${matches.length} atividades disponíveis. Digite termos específicos para filtrar...
        </div>
      `;
    }
  },

  selectCTribNac(item, updateAliq = true) {
    if (!item) return;
    const searchInput = document.getElementById('fCTribNacSearch');
    const hiddenInput = document.getElementById('fCTribNac');
    const dropdown = document.getElementById('fCTribNacDropdown');
    const badgeCode = document.getElementById('badgeCTribNacCode');
    const badgeDesc = document.getElementById('badgeCTribNacDesc');
    const badgeAliq = document.getElementById('badgeCTribNacAliq');

    const cleanCode = item.cTribNac || item.codigo.replace(/\D/g,'').slice(0, 6);
    if (hiddenInput) hiddenInput.value = cleanCode;
    if (searchInput) searchInput.value = `${item.codigo} - ${item.descricao}`;
    if (dropdown) dropdown.classList.add('hidden');

    if (badgeCode) badgeCode.innerText = item.codigo || cleanCode;
    if (badgeDesc) badgeDesc.innerText = item.descricao;
    if (badgeAliq) {
      const aliq = Number(item.aliquotaReferencia || 2).toFixed(2).replace('.', ',');
      badgeAliq.innerText = `Alíq. Sugerida: ${aliq}%`;
    }

    // Verifica se a atividade exige informações de obra (LC 116 / E0370)
    this.verificarObrigatoriedadeObra(cleanCode);

    if (updateAliq) {
      const aliqInput = document.getElementById('fAliquotaIss');
      if (aliqInput && (!aliqInput.value || parseFloat(aliqInput.value) <= 0)) {
        aliqInput.value = item.aliquotaReferencia || '2.0';
        this.calculateEmissionTotals();
      }
      this.suggestNbsForActivity(item.codigo, item.descricao);
    }
  },

  suggestNbsForActivity(codigo, descricao) {
    const hiddenInput = document.getElementById('fItemNbs');
    const searchInput = document.getElementById('fItemNbsSearch');
    if (!this.state.auxData?.itensNbs || !codigo) return;
    const cleanCod = (codigo || '').replace(/\D/g, '');
    const descLower = (descricao || '').toLowerCase();

    let targetNbs = null;

    if (cleanCod.startsWith('1009') || cleanCod.startsWith('1005') || descLower.includes('imobil') || descLower.includes('corretagem')) {
      targetNbs = '1.1103.21.00'; // Corretagem na compra e venda de imóveis
    } else if (cleanCod.startsWith('1719') || cleanCod.startsWith('1718') || descLower.includes('contab')) {
      targetNbs = '1.1402.10.00'; // Contabilidade e escrituração
    } else if (cleanCod.startsWith('1714') || descLower.includes('advoc') || descLower.includes('jurid')) {
      targetNbs = '1.1401.10.00'; // Consultoria e representação jurídica
    } else if (cleanCod.startsWith('010') || cleanCod.startsWith('01') || descLower.includes('software') || descLower.includes('computa') || descLower.includes('desenvolvimento')) {
      targetNbs = '1.1501.10.00'; // Licenciamento / software
    } else if (cleanCod.startsWith('0702') || cleanCod.startsWith('0705') || descLower.includes('obra') || descLower.includes('constru')) {
      targetNbs = '1.0401.10.00'; // Construção de edifícios
    } else if (cleanCod.startsWith('04') || descLower.includes('medic') || descLower.includes('clinica')) {
      targetNbs = '1.2201.10.00'; // Serviços médicos
    } else if (cleanCod.startsWith('1706') || descLower.includes('publicid') || descLower.includes('propag')) {
      targetNbs = '1.1601.10.00'; // Publicidade e propaganda
    } else if (cleanCod.startsWith('1601') || descLower.includes('transp')) {
      targetNbs = '1.0101.10.00'; // Transporte rodoviário municipal
    } else if (cleanCod.startsWith('0301') || descLower.includes('loca') || descLower.includes('locação')) {
      targetNbs = '1.2001.10.00'; // Locação de bens móveis / veículos
    }

    if (targetNbs) {
      if (searchInput && (!hiddenInput || !hiddenInput.value)) {
        searchInput.placeholder = `Opcional • Sugestão NBS p/ esta atividade: ${targetNbs} (ou deixe vazio)`;
      } else if (hiddenInput && hiddenInput.value) {
        this.selectItemNbsByCode(targetNbs);
      }
    }
  },

  selectCTribNacByCode(codeDigits) {
    const list = this.state.auxData?.tributacaoNacional || [];
    const item = list.find(i => (i.cTribNac === codeDigits) || (i.codigo.replace(/\D/g,'').slice(0,6) === codeDigits));
    if (item) {
      this.selectCTribNac(item, true);
    }
  },

  selectCustomCTribNac(customCode) {
    const hiddenInput = document.getElementById('fCTribNac');
    const searchInput = document.getElementById('fCTribNacSearch');
    const dropdown = document.getElementById('fCTribNacDropdown');
    const badgeCode = document.getElementById('badgeCTribNacCode');
    const badgeDesc = document.getElementById('badgeCTribNacDesc');
    const badgeAliq = document.getElementById('badgeCTribNacAliq');

    if (hiddenInput) hiddenInput.value = customCode;
    if (searchInput) searchInput.value = `Código Personalizado: ${customCode}`;
    if (dropdown) dropdown.classList.add('hidden');
    if (badgeCode) badgeCode.innerText = customCode;
    if (badgeDesc) badgeDesc.innerText = 'Atividade Fiscal Customizada (Manual)';
    if (badgeAliq) badgeAliq.innerText = 'Alíq: Conforme Município';
    this.verificarObrigatoriedadeObra(customCode);
  },

  // --- COMBOBOX DE ITENS DA NBS (NOMENCLATURA BRASILEIRA DE SERVIÇOS - OPCIONAL) ---
  setupItemNbsCombobox() {
    const searchInput = document.getElementById('fItemNbsSearch');
    const dropdown = document.getElementById('fItemNbsDropdown');
    const hiddenInput = document.getElementById('fItemNbs');
    if (!searchInput || !dropdown || !hiddenInput) return;

    // NBS é opcional por padrão: só seleciona se já tiver valor inicial no input
    if (hiddenInput.value) {
      this.selectItemNbsByCode(hiddenInput.value);
    } else {
      this.clearItemNbs();
    }

    searchInput.addEventListener('input', () => {
      this.renderItemNbsDropdown(searchInput.value);
    });

    searchInput.addEventListener('focus', () => {
      this.renderItemNbsDropdown(searchInput.value);
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        dropdown.classList.add('hidden');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const firstOption = dropdown.querySelector('[data-nbs-item]');
        if (firstOption) {
          firstOption.click();
        }
      }
    });

    document.addEventListener('click', (e) => {
      const wrapper = document.getElementById('comboboxItemNbsWrapper');
      if (wrapper && !wrapper.contains(e.target)) {
        dropdown.classList.add('hidden');
      }
    });
  },

  clearItemNbs() {
    const hiddenInput = document.getElementById('fItemNbs');
    const searchInput = document.getElementById('fItemNbsSearch');
    const dropdown = document.getElementById('fItemNbsDropdown');
    const badge = document.getElementById('itemNbsSelectedBadge');

    if (hiddenInput) hiddenInput.value = '';
    if (searchInput) {
      searchInput.value = '';
      searchInput.placeholder = 'Opcional • Digite código ou serviço (ou deixe em branco)...';
    }
    if (dropdown) dropdown.classList.add('hidden');
    if (badge) badge.classList.add('hidden');
  },

  toggleItemNbsDropdown() {
    const dropdown = document.getElementById('fItemNbsDropdown');
    const searchInput = document.getElementById('fItemNbsSearch');
    if (!dropdown) return;
    if (dropdown.classList.contains('hidden')) {
      this.renderItemNbsDropdown(searchInput?.value || '');
      searchInput?.focus();
    } else {
      dropdown.classList.add('hidden');
    }
  },

  renderItemNbsDropdown(query) {
    const dropdown = document.getElementById('fItemNbsDropdown');
    if (!dropdown) return;

    const list = this.state.auxData?.itensNbs || [];
    const norm = this.normalizeSearchText(query);
    const digitsOnly = (query || '').replace(/\D/g, '');

    let matches = list;
    if (norm) {
      matches = list.filter(item => {
        const itemNorm = this.normalizeSearchText(item.descricao);
        const catNorm = this.normalizeSearchText(item.categoria || '');
        const codeClean = (item.cNBS || item.codigo || '').replace(/\D/g, '');
        const codeFmt = (item.codigo || '').toLowerCase();
        return (
          itemNorm.includes(norm) ||
          catNorm.includes(norm) ||
          codeFmt.includes(norm) ||
          (digitsOnly && codeClean.includes(digitsOnly))
        );
      });
    }

    dropdown.classList.remove('hidden');

    let html = `
      <div onclick="App.clearItemNbs()" class="p-2.5 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors flex items-center justify-between border-b border-slate-100 text-slate-600 font-semibold">
        <div class="flex items-center space-x-2">
          <span class="text-rose-500 font-bold text-xs">✕</span>
          <span class="text-xs">Não informar NBS (Deixar em branco)</span>
        </div>
        <span class="text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">Opcional</span>
      </div>
    `;

    if (matches.length === 0) {
      html += `
        <div class="p-3 text-center text-slate-500">
          <p class="font-medium">Nenhum item da NBS encontrado para "${query}".</p>
          ${query ? `
            <button type="button" onclick="App.selectCustomItemNbs('${query.replace(/'/g, "\\'")}')" class="mt-2 inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition-colors">
              <span>Usar código informado: "${query}"</span>
            </button>
          ` : ''}
        </div>
      `;
      dropdown.innerHTML = html;
      return;
    }

    const maxItems = 45;
    const pagedMatches = matches.slice(0, maxItems);

    html += pagedMatches.map(item => {
      const escCode = item.codigo.replace(/'/g, "\\'");
      return `
        <div data-nbs-item="${item.codigo}" onclick="App.selectItemNbsByCode('${escCode}')" class="p-2.5 hover:bg-emerald-50/80 cursor-pointer transition-colors flex items-start justify-between gap-3 group">
          <div class="space-y-0.5 min-w-0">
            <div class="flex items-center space-x-2">
              <span class="font-mono font-bold text-slate-900 group-hover:text-emerald-800 text-[11px] bg-slate-100 group-hover:bg-emerald-100 px-1.5 py-0.5 rounded">
                ${item.codigo}
              </span>
              <span class="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-sans font-medium truncate max-w-[200px]">
                ${item.categoria || 'NBS'}
              </span>
            </div>
            <p class="text-xs text-slate-700 leading-snug group-hover:text-slate-950 font-medium">
              ${item.descricao}
            </p>
          </div>
        </div>
      `;
    }).join('');

    if (matches.length > maxItems) {
      html += `
        <div class="p-2 text-center text-[11px] text-slate-400 bg-slate-50 font-medium">
          Mostrando ${maxItems} de ${matches.length} itens NBS disponíveis. Digite termos específicos para filtrar...
        </div>
      `;
    }

    dropdown.innerHTML = html;
  },

  selectItemNbs(item) {
    if (!item) return;
    const searchInput = document.getElementById('fItemNbsSearch');
    const hiddenInput = document.getElementById('fItemNbs');
    const dropdown = document.getElementById('fItemNbsDropdown');
    const badge = document.getElementById('itemNbsSelectedBadge');
    const badgeCode = document.getElementById('badgeItemNbsCode');
    const badgeDesc = document.getElementById('badgeItemNbsDesc');
    const badgeCat = document.getElementById('badgeItemNbsCat');

    if (hiddenInput) hiddenInput.value = item.codigo;
    if (searchInput) searchInput.value = `${item.codigo} - ${item.descricao}`;
    if (dropdown) dropdown.classList.add('hidden');
    if (badge) badge.classList.remove('hidden');

    if (badgeCode) badgeCode.innerText = item.codigo;
    if (badgeDesc) badgeDesc.innerText = item.descricao;
    if (badgeCat) badgeCat.innerText = item.categoria || 'NBS';
  },

  selectItemNbsByCode(code) {
    if (!code) {
      this.clearItemNbs();
      return;
    }
    const list = this.state.auxData?.itensNbs || [];
    const clean = code.replace(/\D/g, '');
    const item = list.find(i => (i.codigo === code) || (i.cNBS === clean) || (i.codigo.replace(/\D/g,'') === clean));
    if (item) {
      this.selectItemNbs(item);
    } else {
      this.selectCustomItemNbs(code);
    }
  },

  selectCustomItemNbs(customCode) {
    if (!customCode) {
      this.clearItemNbs();
      return;
    }
    const hiddenInput = document.getElementById('fItemNbs');
    const searchInput = document.getElementById('fItemNbsSearch');
    const dropdown = document.getElementById('fItemNbsDropdown');
    const badge = document.getElementById('itemNbsSelectedBadge');
    const badgeCode = document.getElementById('badgeItemNbsCode');
    const badgeDesc = document.getElementById('badgeItemNbsDesc');
    const badgeCat = document.getElementById('badgeItemNbsCat');

    if (hiddenInput) hiddenInput.value = customCode;
    if (searchInput) searchInput.value = customCode;
    if (dropdown) dropdown.classList.add('hidden');
    if (badge) badge.classList.remove('hidden');

    if (badgeCode) badgeCode.innerText = customCode;
    if (badgeDesc) badgeDesc.innerText = 'Item NBS Informado pelo Usuário';
    if (badgeCat) badgeCat.innerText = 'Manual';
  },

  async consultarNfseOnline(chaveAcesso) {
    if (!chaveAcesso) return;
    try {
      this.showToast('Consultando e sincronizando status desta NFS-e no ADN / SEFIN...', 'info');
      const res = await safeFetchJson('/api/adn/consultar-chave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chaveAcesso })
      });
      if (!res.success) {
        window.friendlyErrorModal.show(res.error);
      } else {
        await this.loadHistory();
        const sit = res.nfse.status === 'CANCELADA' ? 'CANCELADA' : 'AUTORIZADA';
        this.showToast(`NFS-e Nº ${res.nfse.numeroNfse} sincronizada do ADN! Status atual: ${sit}`);
      }
    } catch (err) {
      window.friendlyErrorModal.show({
        title: 'Falha ao Consultar NFS-e no ADN',
        category: 'ADN SEFIN',
        message: 'Não foi possível consultar a NFS-e no Ambiente de Dados Nacional.',
        technicalDetail: err.message
      });
    }
  },

  // 2. Combobox de Tipo de Serviço na Pesquisa de Histórico
  setupFltTipoServicoCombobox() {
    const searchInput = document.getElementById('fltTipoServicoSearch');
    const dropdown = document.getElementById('fltTipoServicoDropdown');
    const hiddenInput = document.getElementById('fltTipoServico');
    const clearBtn = document.getElementById('btnClearFltTipoServico');
    if (!searchInput || !dropdown || !hiddenInput) return;

    searchInput.addEventListener('input', () => {
      this.renderFltTipoServicoDropdown(searchInput.value);
      if (clearBtn) {
        if (searchInput.value) clearBtn.classList.remove('hidden');
        else clearBtn.classList.add('hidden');
      }
      hiddenInput.value = searchInput.value.trim();
    });

    searchInput.addEventListener('focus', () => {
      this.renderFltTipoServicoDropdown(searchInput.value);
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        dropdown.classList.add('hidden');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const firstOption = dropdown.querySelector('[data-flt-item]');
        if (firstOption) {
          firstOption.click();
        } else {
          dropdown.classList.add('hidden');
          this.applyHistoryFilters();
        }
      }
    });

    document.addEventListener('click', (e) => {
      const wrapper = document.getElementById('comboboxFltTipoServicoWrapper');
      if (wrapper && !wrapper.contains(e.target)) {
        dropdown.classList.add('hidden');
      }
    });
  },

  renderFltTipoServicoDropdown(query) {
    const dropdown = document.getElementById('fltTipoServicoDropdown');
    if (!dropdown) return;

    const list = this.state.auxData?.tributacaoNacional || [];
    const norm = this.normalizeSearchText(query);
    const digitsOnly = (query || '').replace(/\D/g, '');

    let matches = list;
    if (norm) {
      matches = list.filter(item => {
        const itemNorm = this.normalizeSearchText(item.descricao);
        const codeClean = (item.cTribNac || item.codigo || '').replace(/\D/g, '');
        const codeFmt = item.codigo ? item.codigo.toLowerCase() : '';
        const lcNorm = item.itemLc116 ? item.itemLc116.replace(/\D/g, '') : '';
        return (
          itemNorm.includes(norm) ||
          codeFmt.includes(norm) ||
          (digitsOnly && (codeClean.includes(digitsOnly) || lcNorm.includes(digitsOnly)))
        );
      });
    }

    dropdown.classList.remove('hidden');

    if (matches.length === 0) {
      dropdown.innerHTML = `
        <div class="p-2.5 text-center text-slate-500">
          Nenhuma atividade encontrada para "${query}".
        </div>
      `;
      return;
    }

    const maxItems = 40;
    dropdown.innerHTML = matches.slice(0, maxItems).map(item => {
      const codeDigits = item.cTribNac || item.codigo.replace(/\D/g,'').slice(0, 6);
      return `
        <div data-flt-item="${codeDigits}" onclick="App.selectFltTipoServico('${codeDigits}', '${item.codigo} - ${item.descricao.replace(/'/g, "\\'")}')" class="p-2 hover:bg-brand-50 cursor-pointer transition-colors flex items-center justify-between text-xs">
          <div class="truncate pr-2">
            <span class="font-mono font-bold text-slate-900 bg-slate-100 px-1 py-0.5 rounded mr-1.5">${item.codigo}</span>
            <span class="text-slate-700">${item.descricao}</span>
          </div>
          <span class="text-[10px] text-slate-400 font-mono shrink-0">Item ${item.itemLc116}</span>
        </div>
      `;
    }).join('');
  },

  selectFltTipoServico(codeDigits, label) {
    const hiddenInput = document.getElementById('fltTipoServico');
    const searchInput = document.getElementById('fltTipoServicoSearch');
    const dropdown = document.getElementById('fltTipoServicoDropdown');
    const clearBtn = document.getElementById('btnClearFltTipoServico');

    if (hiddenInput) hiddenInput.value = codeDigits;
    if (searchInput) searchInput.value = label;
    if (clearBtn) clearBtn.classList.remove('hidden');
    if (dropdown) dropdown.classList.add('hidden');

    this.applyHistoryFilters();
  },

  clearFltTipoServico() {
    const hiddenInput = document.getElementById('fltTipoServico');
    const searchInput = document.getElementById('fltTipoServicoSearch');
    const dropdown = document.getElementById('fltTipoServicoDropdown');
    const clearBtn = document.getElementById('btnClearFltTipoServico');

    if (hiddenInput) hiddenInput.value = '';
    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.classList.add('hidden');
    if (dropdown) dropdown.classList.add('hidden');

    this.applyHistoryFilters();
  },

  async renderErrorDictionary() {
    const target = document.getElementById('errorDictList');
    if (!target) return;

    try {
      const res = await safeFetchJson('/api/errors/dictionary');
      target.innerHTML = res.map(item => `
        <div class="border border-slate-200 rounded-xl p-4 bg-white hover:border-slate-300 transition-colors space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">${item.category}</span>
            <span class="text-xs font-mono text-slate-400">${item.severity.toUpperCase()}</span>
          </div>
          <h4 class="font-bold text-sm text-slate-900">${item.title}</h4>
          <p class="text-xs text-slate-600">${item.friendlyMessage}</p>
          <div class="bg-emerald-50/70 p-3 rounded-lg border border-emerald-100 text-xs text-emerald-900">
            <span class="font-bold block mb-1">Como Resolver:</span>
            <ul class="list-disc list-inside space-y-1">
              ${item.howToFix.map(step => `<li>${step}</li>`).join('')}
            </ul>
          </div>
        </div>
      `).join('');
    } catch (e) {
      console.error(e);
    }
  },

  formatDocInput(el) {
    let v = el.value.replace(/\D/g, '').slice(0, 14);
    if (v.length <= 11) {
      if (v.length > 9) v = v.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2})$/, '$1.$2.$3-$4');
      else if (v.length > 6) v = v.replace(/^(\d{3})(\d{3})(\d{0,3})$/, '$1.$2.$3');
      else if (v.length > 3) v = v.replace(/^(\d{3})(\d{0,3})$/, '$1.$2');
    } else {
      if (v.length > 12) v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})$/, '$1.$2.$3/$4-$5');
      else if (v.length > 8) v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})$/, '$1.$2.$3/$4');
      else if (v.length > 5) v = v.replace(/^(\d{2})(\d{3})(\d{0,3})$/, '$1.$2.$3');
      else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,3})$/, '$1.$2');
    }
    el.value = v;
  },

  async consultarCep(cepVal) {
    const clean = (cepVal || '').replace(/\D/g, '');
    if (clean.length !== 8) return;

    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`).then(r => r.json());
      if (!res.erro) {
        const setVal = (id, val) => {
          const el = document.getElementById(id);
          if (el && val) el.value = val;
        };
        setVal('fTomadorLogradouro', res.logradouro);
        setVal('fTomadorBairro', res.bairro);
        setVal('fTomadorMunicipio', res.localidade);
        setVal('fTomadorUf', res.uf);
      }
    } catch (e) {
      console.warn('Erro ao consultar CEP:', e);
    }
  }
};

// Fecha dropdowns de municípios ao clicar fora
document.addEventListener('click', (e) => {
  if (!e.target.closest('#comboboxPrestadorMunWrapper')) {
    const d = document.getElementById('fMunicipioPrestadorDropdown');
    if (d) d.classList.add('hidden');
  }
  if (!e.target.closest('#comboboxLocalPrestacaoWrapper')) {
    const d = document.getElementById('fLocalPrestacaoDropdown');
    if (d) d.classList.add('hidden');
  }
});

window.App = App;
window.addEventListener('DOMContentLoaded', () => App.init());
