/**
 * Visualizador Oficial do DANFSe v2.0 (Documento Auxiliar da NFS-e - Padrão Nacional)
 * Padrão Comitê Gestor da NFS-e (CGNFS-e) / Receita Federal do Brasil (RFB) / SEFIN Nacional
 * 
 * Réplica fidedigna do DANFSe v2.0 emitido pelo Portal de Gestão da NFS-e (nfse.gov.br)
 * - Seções separadas exclusivamente por linhas horizontais oficiais
 * - Sem linhas de grade verticais internas nos dados cadastrais e tributários
 * - Impressão otimizada para exatamente 1 página A4 sem páginas em branco
 */

class DanfseViewer {
  constructor() {
    this.modalEl = null;
    this.currentNfse = null;
    this.currentChave = null;
    this.init();
  }

  init() {
    if (!document.getElementById('danfseModal')) {
      const container = document.createElement('div');
      container.id = 'danfseModal';
      container.className = 'fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm hidden overflow-y-auto';
      container.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl max-w-5xl w-full border border-slate-300 my-4 sm:my-8 flex flex-col max-h-[96vh] overflow-hidden">
          <!-- Barra de Ações Superior (Não sai na impressão) -->
          <div class="no-print px-4 sm:px-6 py-3 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
            <div class="flex items-center space-x-2.5">
              <span class="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
              <div>
                <span class="font-bold text-xs sm:text-sm tracking-wide block">DANFSe v2.0 • DOCUMENTO AUXILIAR DA NFS-e</span>
                <span class="text-[10px] text-slate-400">Padrão Nacional CGNFS-e / Receita Federal</span>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <button onclick="window.danfseViewer.copyChave()" id="btnDanfseCopyChave" class="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center space-x-1.5 transition-colors border border-slate-700">
                <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                <span id="btnDanfseCopyText">Copiar Chave</span>
              </button>
              <button onclick="window.danfseViewer.downloadXml()" class="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center space-x-1.5 transition-colors border border-slate-700">
                <i data-lucide="file-code" class="w-3.5 h-3.5"></i>
                <span>Baixar XML</span>
              </button>
              <button onclick="window.danfseViewer.downloadPdf()" id="btnDanfseDownloadPdf" class="px-3.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center space-x-1.5 transition-colors border border-slate-700" title="Baixa o arquivo PDF direto para a pasta Downloads">
                <i data-lucide="file-down" class="w-3.5 h-3.5"></i>
                <span id="btnDanfseDownloadPdfText">Baixar PDF</span>
              </button>
              <button onclick="window.danfseViewer.print()" class="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center space-x-1.5 shadow-sm transition-colors" title="Gera o PDF com texto 100% selecionável e copiável (Ctrl+C)">
                <i data-lucide="printer" class="w-4 h-4"></i>
                <span>PDF com Texto Copiável / Imprimir</span>
              </button>
              <button onclick="window.danfseViewer.close()" class="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1">
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>
          </div>

          <!-- Área do DANFSe Oficial (Área imprimível) -->
          <div id="danfsePrintArea" class="p-2 sm:p-6 overflow-y-auto bg-slate-200 text-slate-900 font-sans">
            <div id="danfseRenderTarget" class="danfse-page-container mx-auto">
              <!-- Conteúdo gerado dinamicamente -->
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(container);
      this.modalEl = container;
      if (window.lucide) lucide.createIcons();
    }
  }

  show(nfse) {
    if (!nfse) return;
    this.init();
    this.currentNfse = nfse;
    this.renderDanfse(nfse);
    this.modalEl.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  }

  close() {
    if (this.modalEl) {
      this.modalEl.classList.add('hidden');
    }
  }

  print() {
    window.print();
  }

  async downloadPdf(nfse = null) {
    const targetNfse = nfse || this.currentNfse;
    if (!targetNfse) {
      alert('Nenhuma nota fiscal selecionada para download.');
      return;
    }

    this.init();
    if (!this.currentNfse || this.currentNfse.chaveAcesso !== targetNfse.chaveAcesso) {
      this.currentNfse = targetNfse;
      this.renderDanfse(targetNfse);
    }

    if (this.modalEl) {
      this.modalEl.classList.remove('hidden');
    }

    const btn = document.getElementById('btnDanfseDownloadPdf');
    const oldHtml = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="animate-spin inline-block text-xs mr-1">⌛</span><span>Gerando PDF...</span>`;
    }

    try {
      const data = this.extractData(targetNfse);
      const cleanNum = String(data.numNfse || targetNfse.numeroNfse || '').replace(/\D/g, '');
      const cleanChave = String(data.chave || targetNfse.chaveAcesso || '').replace(/\D/g, '');
      const filename = cleanNum ? `DANFSE_${cleanNum}.pdf` : `DANFSE_${cleanChave ? cleanChave.substring(0, 15) : 'NACIONAL'}.pdf`;

      const targetEl = document.getElementById('danfseRenderTarget');
      if (!targetEl) throw new Error('Elemento de visualização não encontrado.');

      const docEl = targetEl.querySelector('.danfse-document') || targetEl;

      // Espera imagens terminarem de carregar
      const images = docEl.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(res => {
          img.onload = res;
          img.onerror = res;
          setTimeout(res, 2000);
        });
      }));

      // Preserva estilos originais antes de fixar 200mm para proporção exata A4
      const origWidth = docEl.style.width;
      const origMaxWidth = docEl.style.maxWidth;
      docEl.style.width = '200mm';
      docEl.style.maxWidth = '200mm';

      const opt = {
        margin: [4, 5, 4, 5], // 4mm sup/inf, 5mm esq/dir (margens oficiais A4)
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2.5, // 250 DPI - altíssima nitidez de texto e linhas
          useCORS: true,
          letterRendering: true,
          backgroundColor: '#ffffff',
          scrollY: 0,
          scrollX: 0
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait'
        },
        pagebreak: { mode: 'avoid-all' }
      };

      if (typeof html2pdf !== 'undefined') {
        const pdfBlob = await html2pdf().set(opt).from(docEl).output('blob');
        const blobUrl = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
        }, 1500);
      } else {
        alert('A ferramenta de download de PDF está sendo carregada pelo navegador. Aguarde alguns instantes e clique novamente.');
      }

      // Restaura estilos originais
      docEl.style.width = origWidth;
      docEl.style.maxWidth = origMaxWidth;

    } catch (err) {
      console.error('Erro ao gerar download do PDF:', err);
      alert('Ocorreu um erro ao gerar o arquivo PDF: ' + err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = oldHtml;
        if (window.lucide) lucide.createIcons();
      }
    }
  }

  copyChave() {
    if (!this.currentChave) return;
    navigator.clipboard.writeText(this.currentChave).then(() => {
      const txt = document.getElementById('btnDanfseCopyText');
      if (txt) {
        const old = txt.textContent;
        txt.textContent = 'Copiada!';
        setTimeout(() => { txt.textContent = old; }, 2000);
      }
    }).catch(err => {
      console.warn('Erro ao copiar chave:', err);
    });
  }

  downloadXml() {
    if (this.currentNfse && this.currentNfse.chaveAcesso) {
      window.location.href = `/api/adn/nfse/${this.currentNfse.chaveAcesso}/xml`;
    }
  }

  // ========================================================
  // FORMATADORES OFICIAIS
  // ========================================================
  formatCpfCnpj(doc) {
    if (!doc || doc === '-') return '-';
    const s = String(doc).replace(/\D/g, '');
    if (s.length === 14) return s.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    if (s.length === 11) return s.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    return doc;
  }

  formatCep(cep) {
    if (!cep || cep === '-') return '-';
    const s = String(cep).replace(/\D/g, '');
    if (s.length === 8) return s.replace(/^(\d{2})(\d{3})(\d{3})$/, '$1.$2-$3');
    return cep;
  }

  formatIbge(code) {
    if (!code || code === '-') return '-';
    const s = String(code).replace(/\D/g, '');
    if (s.length === 7) return s.replace(/^(\d{2})(\d{5})$/, '$1.$2');
    return code;
  }

  formatPhone(phone) {
    if (!phone || phone === '-') return '-';
    const s = String(phone).replace(/\D/g, '');
    if (s.length === 10) return s.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
    if (s.length === 11) return s.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    return phone;
  }

  formatCtn(code) {
    if (!code || code === '-') return '-';
    const s = String(code).replace(/\D/g, '');
    if (s.length === 6) return s.replace(/^(\d{2})(\d{2})(\d{2})$/, '$1.$2.$3');
    return code;
  }

  formatDate(dStr) {
    if (!dStr || dStr === '-') return '-';
    try {
      if (dStr.includes('T')) {
        const [d] = dStr.split('T');
        const [y, m, day] = d.split('-');
        return `${day}/${m}/${y}`;
      }
      if (dStr.includes('-')) {
        const parts = dStr.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      const dt = new Date(dStr);
      return dt.toLocaleDateString('pt-BR');
    } catch {
      return dStr;
    }
  }

  formatDateTime(dtStr) {
    if (!dtStr || dtStr === '-') return '-';
    try {
      if (dtStr.includes('T')) {
        const [dPart, tPart] = dtStr.split('T');
        const [y, m, day] = dPart.split('-');
        const time = tPart.split('-')[0].split('+')[0];
        return `${day}/${m}/${y} ${time}`;
      }
      const dt = new Date(dtStr);
      return dt.toLocaleDateString('pt-BR') + ' ' + dt.toLocaleTimeString('pt-BR');
    } catch {
      return dtStr;
    }
  }

  formatCurrency(val, defaultDash = true) {
    if (val === null || val === undefined || val === '') return defaultDash ? '-' : 'R$ 0,00';
    const num = parseFloat(val);
    if (isNaN(num)) return defaultDash ? '-' : 'R$ 0,00';
    if (num === 0 && defaultDash) return '-';
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  // ========================================================
  // EXTRATOR DOS DADOS DA NOTA (XML / OBJETO)
  // ========================================================
  extractData(nfse) {
    const xmlStr = nfse.xmlAssinado || nfse.xmlCompleto || '';
    let xmlDoc = null;
    if (xmlStr && typeof window !== 'undefined' && window.DOMParser) {
      try {
        const parsed = new DOMParser().parseFromString(xmlStr, 'text/xml');
        if (!parsed.querySelector('parsererror')) {
          xmlDoc = parsed;
        }
      } catch (e) {
        console.warn('Erro ao parsear XML da NFS-e:', e);
      }
    }

    const getXml = (tag) => {
      if (!xmlDoc) return null;
      const elems = xmlDoc.getElementsByTagName(tag);
      if (elems && elems.length > 0 && elems[0].textContent) {
        return elems[0].textContent.trim();
      }
      return null;
    };

    // Chave de Acesso
    let chave = getXml('infNFSe')?.getAttribute?.('Id')?.replace('NFS', '') || nfse.chaveAcesso || '';
    if (chave.startsWith('NFS')) chave = chave.substring(3);

    // Identificação NFS-e e DPS
    const numNfse = getXml('nNFSe') || nfse.numeroNfse || '1';
    const dCompet = getXml('dCompet') || nfse.dataEmissao;
    const dhProc = getXml('dhProc') || nfse.dataAutorizacao || nfse.dataEmissao;
    const numDps = getXml('nDPS') || nfse.numeroDps || '-';
    const serieRaw = getXml('serie') || String(nfse.serie || '1');
    const serieDps = isNaN(parseInt(serieRaw, 10)) ? serieRaw : String(parseInt(serieRaw, 10));
    const dhEmi = getXml('dhEmi') || nfse.dataEmissao;
    const emitente = 'Prestador';
    const isCancelada = nfse.status === 'CANCELADA';
    const isRascunho = Boolean(nfse.isRascunho || nfse.status === 'RASCUNHO');
    let situacao = isCancelada ? 'NFS-e Cancelada' : (isRascunho ? 'RASCUNHO / PRÉ-VISUALIZAÇÃO' : 'NFS-e Gerada');
    const finalidade = '-';

    // Município emissor e ambiente
    const xLocEmi = getXml('xLocEmi') || nfse.prestador?.municipio || 'Aracaju';
    const ambGer = getXml('ambGer') || '1';
    const tpAmb = getXml('tpAmb') || (nfse.ambiente === 'TESTE' || nfse.tpAmb === 2 ? '2' : '1');

    // Prestador
    const prestCnpj = getXml('CNPJ') || nfse.prestador?.cnpj || nfse.prestador?.cnpjRaw || '';
    const prestNome = getXml('xNome') || nfse.prestador?.razaoSocial || '';
    const prestIm = getXml('IM') || nfse.prestador?.im || '-';
    const prestFone = getXml('fone') || nfse.prestador?.telefone || '(79) 3221-5331';
    const prestUf = getXml('UF') || nfse.prestador?.uf || 'SE';
    const prestMunIbge = getXml('cLocEmi') || getXml('cMun') || '2800308';
    const prestCep = getXml('CEP') || nfse.prestador?.cep || '49050710';
    const prestEmail = getXml('email') || nfse.prestador?.email || 'JOAO.BAZILIO@HOTMAIL.COM';

    // Endereço prestador
    let prestEnd = '';
    const prestLgr = getXml('xLgr');
    const prestNro = getXml('nro');
    const prestBairro = getXml('xBairro');
    if (prestLgr && prestNro) {
      prestEnd = `${prestLgr}, ${prestNro}${getXml('xCpl') ? ' ' + getXml('xCpl') : ''}${prestBairro ? ', ' + prestBairro : ''}`.trim();
    } else {
      prestEnd = nfse.prestador?.endereco || 'Rua São Judas Tadeu, 378, SALA 101, Pereira Lobo';
    }

    // Regimes Prestador
    const opSimpNac = getXml('opSimpNac') || '3';
    let simplesNacText = 'Optante - Microempresa ou Empresa de ...';
    if (opSimpNac === '1') simplesNacText = 'Não Optante';
    else if (opSimpNac === '2') simplesNacText = 'Optante - Microempreendedor Individual (MEI)';

    const regApTribSN = getXml('regApTribSN') || '1';
    let regApSNText = 'Regime de apuração dos tributos federais e municipal pelo Simples Nacional';
    if (regApTribSN === '2') regApSNText = 'Regime de apuração dos tributos federais pelo Simples Nacional e municipal pelo regime normal (fixo)';
    else if (regApTribSN === '3') regApSNText = 'Regime de apuração dos tributos federais e municipal pela NFS-e';

    // Tomador
    let tomaDoc = '';
    let tomaNome = '';
    let tomaIm = '-';
    let tomaFone = '-';
    let tomaMun = '';
    let tomaUf = '';
    let tomaMunIbge = '';
    let tomaCep = '';
    let tomaEnd = '';
    let tomaEmail = '-';

    if (xmlDoc) {
      const tomaEl = xmlDoc.getElementsByTagName('toma')[0];
      if (tomaEl) {
        const c = tomaEl.getElementsByTagName('CNPJ')[0] || tomaEl.getElementsByTagName('CPF')[0];
        if (c) tomaDoc = c.textContent.trim();
        const n = tomaEl.getElementsByTagName('xNome')[0];
        if (n) tomaNome = n.textContent.trim();
        const im = tomaEl.getElementsByTagName('IM')[0];
        if (im) tomaIm = im.textContent.trim();
        const f = tomaEl.getElementsByTagName('fone')[0];
        if (f) tomaFone = f.textContent.trim();
        const em = tomaEl.getElementsByTagName('email')[0];
        if (em) tomaEmail = em.textContent.trim();

        const endNac = tomaEl.getElementsByTagName('endNac')[0];
        if (endNac) {
          const cm = endNac.getElementsByTagName('cMun')[0];
          if (cm) tomaMunIbge = cm.textContent.trim();
          const cp = endNac.getElementsByTagName('CEP')[0];
          if (cp) tomaCep = cp.textContent.trim();
        }
        const lgr = tomaEl.getElementsByTagName('xLgr')[0];
        const nro = tomaEl.getElementsByTagName('nro')[0];
        const br = tomaEl.getElementsByTagName('xBairro')[0];
        if (lgr && nro) {
          tomaEnd = `${lgr.textContent.trim()}, ${nro.textContent.trim()}${br ? ', ' + br.textContent.trim() : ''}`;
        }
      }
    }

    if (!tomaDoc) tomaDoc = nfse.tomador?.doc || nfse.tomador?.docRaw || nfse.tomador?.documento || '-';
    if (!tomaNome) tomaNome = nfse.tomador?.nome || nfse.tomador?.razaoSocial || '-';
    if (!tomaMunIbge) tomaMunIbge = nfse.tomador?.municipioIbge || '';
    if (!tomaCep) tomaCep = nfse.tomador?.cep || '';
    if (!tomaEnd) {
      if (nfse.tomador?.logradouro) {
        tomaEnd = `${nfse.tomador.logradouro}, ${nfse.tomador.numero || 'S/N'}${nfse.tomador.bairro ? ', ' + nfse.tomador.bairro : ''}`;
      } else {
        tomaEnd = '-';
      }
    }
    if (!tomaEmail || tomaEmail === '-') tomaEmail = nfse.tomador?.email || '-';
    if (!tomaFone || tomaFone === '-') tomaFone = nfse.tomador?.telefone || '-';

    if (tomaMunIbge && window.MUNICIPIOS_BRASIL) {
      const found = window.MUNICIPIOS_BRASIL.find(m => String(m.id) === String(tomaMunIbge));
      if (found) {
        tomaMun = found.nome;
        tomaUf = found.uf;
      }
    }
    if (!tomaMun) tomaMun = nfse.tomador?.municipio || 'Aracaju';
    if (!tomaUf) tomaUf = nfse.tomador?.uf || 'SE';

    // Serviço Prestado
    const cTribNac = getXml('cTribNac') || nfse.servico?.cTribNac || '';
    let xTribNac = getXml('xTribNac') || nfse.servico?.xTribNac || nfse.servico?.xTrib || '';
    if (!xTribNac && cTribNac && window.App?.state?.auxData?.tributacaoNacional) {
      const cleanCod = String(cTribNac).replace(/\D/g, '').slice(0, 6);
      const match = window.App.state.auxData.tributacaoNacional.find(t => 
        (t.cTribNac && t.cTribNac.replace(/\D/g, '') === cleanCod) || 
        (t.codigo && t.codigo.replace(/\D/g, '').slice(0, 6) === cleanCod)
      );
      if (match) xTribNac = match.descricao;
    }
    if (!xTribNac) xTribNac = 'Prestação de Serviços';

    const xDescServ = getXml('xDescServ') || nfse.servico?.xDescServ || nfse.servico?.descricao || '-';
    const xLocPrestacao = getXml('xLocPrestacao') || xLocEmi;

    // Tributação Municipal (ISSQN)
    const tribISSQN = getXml('tribISSQN') || '1';
    let tipoTribISS = 'Operação Tributável';
    if (tribISSQN === '2') tipoTribISS = 'Exportação de Serviço';
    else if (tribISSQN === '3') tipoTribISS = 'Não Incidência';
    else if (tribISSQN === '4') tipoTribISS = 'Imunidade';

    const xLocIncid = getXml('xLocIncid') || xLocEmi;
    const tpRetISSQN = getXml('tpRetISSQN') || (nfse.valores?.issRetido ? '2' : (nfse.valores?.tpRetIssqn ? String(nfse.valores.tpRetIssqn) : '1'));
    const retencaoIss = (tpRetISSQN === '2' || tpRetISSQN === '3' || nfse.valores?.iss?.retido || nfse.valores?.issRetido) ? 'Retido' : 'Não Retido';

    // Valores
    const vServ = getXml('vServ') || nfse.valores?.vServ || nfse.valores?.valorServico || 0;
    const vLiq = getXml('vLiq') || nfse.valores?.vLiquido || nfse.valores?.valorLiquido || vServ;
    const pAliq = getXml('pAliq') || nfse.valores?.pAliq || (nfse.valores?.iss?.aliquota ? nfse.valores.iss.aliquota : null);
    const vIss = getXml('vISS') || nfse.valores?.vIss || (nfse.valores?.iss?.valorIss ? nfse.valores.iss.valorIss : null);

    // Retenções Federais
    const vPis = nfse.valores?.vPis || null;
    const vCofins = nfse.valores?.vCofins || null;
    const vInss = nfse.valores?.vInss || null;
    const vIr = nfse.valores?.vIr || null;
    const vCsll = nfse.valores?.vCsll || null;

    // Informações complementares e Tributos Aproximados (Lei 12.741/2012)
    let infoComp = '';
    const vServNum = parseFloat(vServ) || 0;

    const pTotTribSN = getXml('pTotTribSN') || nfse.valores?.pTotTribSN || nfse.valores?.aliquotaSimplesNacional || nfse.aliquotaSimplesNacional;
    const vTotTribFed = getXml('vTotTribFed') || nfse.valores?.valTribFed || nfse.valTribFed;
    const vTotTribEst = getXml('vTotTribEst') || nfse.valores?.valTribEst || nfse.valTribEst;
    const vTotTribMun = getXml('vTotTribMun') || nfse.valores?.valTribMun || nfse.valTribMun;

    const pTotTribFed = getXml('pTotTribFed') || nfse.valores?.aliqTribFed || nfse.aliqTribFed;
    const pTotTribEst = getXml('pTotTribEst') || nfse.valores?.aliqTribEst || nfse.aliqTribEst;
    const pTotTribMun = getXml('pTotTribMun') || nfse.valores?.aliqTribMun || nfse.aliqTribMun;

    if (pTotTribSN && parseFloat(pTotTribSN) > 0) {
      const pSN = parseFloat(pTotTribSN);
      const valSN = (vServNum * (pSN / 100));
      infoComp = `Valor aprox. dos tributos (alíquota Simples Nacional de ${pSN.toFixed(2).replace('.', ',')}%): ${this.formatCurrency(valSN, false)} cfe. Lei 12.741/12.`;
    } else if ((vTotTribFed !== undefined && vTotTribFed !== null) || (vTotTribEst !== undefined && vTotTribEst !== null) || (vTotTribMun !== undefined && vTotTribMun !== null)) {
      const fed = parseFloat(vTotTribFed || 0);
      const est = parseFloat(vTotTribEst || 0);
      const mun = parseFloat(vTotTribMun || 0);
      const tot = fed + est + mun;
      infoComp = `Valor aprox. dos tributos: Federais: ${this.formatCurrency(fed, false)}; Estaduais: ${this.formatCurrency(est, false)}; Municipais: ${this.formatCurrency(mun, false)}; Total: ${this.formatCurrency(tot, false)} cfe. Lei 12.741/12.`;
    } else if ((pTotTribFed !== undefined && pTotTribFed !== null) || (pTotTribEst !== undefined && pTotTribEst !== null) || (pTotTribMun !== undefined && pTotTribMun !== null)) {
      const pFed = parseFloat(pTotTribFed || 0);
      const pEst = parseFloat(pTotTribEst || 0);
      const pMun = parseFloat(pTotTribMun || 0);
      const vFed = (vServNum * (pFed / 100));
      const vEst = (vServNum * (pEst / 100));
      const vMun = (vServNum * (pMun / 100));
      const vTot = vFed + vEst + vMun;
      infoComp = `Valor aprox. dos tributos: Federais: ${this.formatCurrency(vFed, false)} (${pFed.toFixed(2).replace('.', ',')}%), Estaduais: ${this.formatCurrency(vEst, false)} (${pEst.toFixed(2).replace('.', ',')}%), Municipais: ${this.formatCurrency(vMun, false)} (${pMun.toFixed(2).replace('.', ',')}%), Total: ${this.formatCurrency(vTot, false)} cfe. Lei 12.741/12.`;
    } else if (vIss && parseFloat(vIss) > 0) {
      infoComp = `Valor aprox. dos tributos: Federais: -; Estaduais: R$ 0,00; Municipais: ${this.formatCurrency(vIss, false)} cfe. Lei 12.741/12.`;
    } else {
      infoComp = `Valor aprox. dos tributos: Federais: R$ 0,00; Estaduais: R$ 0,00; Municipais: R$ 0,00 cfe. Lei 12.741/12.`;
    }

    const xInfComp = getXml('xInfComp') || nfse.informacoesComplementares || '';
    if (xInfComp) {
      infoComp = `${infoComp} | ${xInfComp}`;
    }

    return {
      chave,
      numNfse,
      dCompet,
      dhProc,
      numDps,
      serieDps,
      dhEmi,
      emitente,
      isCancelada,
      isRascunho,
      situacao,
      finalidade,
      xLocEmi,
      ambGer,
      tpAmb,
      prestCnpj,
      prestNome,
      prestIm,
      prestFone,
      prestUf,
      prestMunIbge,
      prestCep,
      prestEnd,
      prestEmail,
      simplesNacText,
      regApSNText,
      tomaDoc,
      tomaNome,
      tomaIm,
      tomaFone,
      tomaMun,
      tomaUf,
      tomaMunIbge,
      tomaCep,
      tomaEnd,
      tomaEmail,
      cTribNac,
      xTribNac,
      xDescServ,
      xLocPrestacao,
      tipoTribISS,
      xLocIncid,
      retencaoIss,
      vServ,
      vLiq,
      pAliq,
      vIss,
      vPis,
      vCofins,
      vInss,
      vIr,
      vCsll,
      infoComp
    };
  }

  // ========================================================
  // RENDERIZAÇÃO DO DOCUMENTO OFICIAL (PADRÃO NACIONAL RFB)
  // ========================================================
  renderDanfse(nfse, targetElement = null) {
    const target = targetElement || document.getElementById('danfseRenderTarget');
    if (!target) return;

    const data = this.extractData(nfse);
    this.currentChave = data.chave;

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=72x72&data=https://www.nfse.gov.br/consultapublica/danfse?chave=${data.chave}`;

    target.innerHTML = `
      <div class="danfse-document relative">
        ${data.isCancelada ? '<div class="danfse-watermark">CANCELADA</div>' : (data.isRascunho ? '<div class="danfse-watermark danfse-watermark-draft">RASCUNHO</div>' : '')}

        <table class="danfse-table">
          <colgroup>
            <col style="width: 25%;">
            <col style="width: 25%;">
            <col style="width: 25%;">
            <col style="width: 25%;">
          </colgroup>

          <!-- 1. CABEÇALHO OFICIAL (TOPO) -->
          <tr>
            <td class="danfse-border-right" style="text-align: center; vertical-align: middle; padding: 2px;">
              <img src="/img/nfse_logo_oficial.png" crossorigin="anonymous" alt="NFS-e Nacional" style="max-height: 32px; max-width: 95%; display: block; margin: auto;">
            </td>
            <td colspan="2" class="danfse-border-right" style="text-align: center; vertical-align: middle; padding: 2px;">
              <div class="danfse-title-main">DANFSe v2.0</div>
              <div class="danfse-title-sub">Documento Auxiliar da NFS-e</div>
            </td>
            <td style="font-size: 6.8pt; vertical-align: middle; padding: 2px 4px; line-height: 1.3;">
              <div><strong>Município:</strong> ${data.xLocEmi} - ${data.prestUf}</div>
              <div><strong>Ambiente Gerador:</strong> ${data.ambGer}</div>
              <div><strong>Tipo de Ambiente:</strong> ${data.tpAmb}</div>
            </td>
          </tr>

          <!-- 2. CHAVE DE ACESSO -->
          <tr class="danfse-sec-divider">
            <td colspan="4" style="padding: 2px 4px;">
              <span class="danfse-lbl">CHAVE DE ACESSO DA NFS-e</span>
              <div class="danfse-chave-num">${data.chave}</div>
            </td>
          </tr>

          <!-- 2.1 IDENTIFICAÇÃO NFS-e / DPS / SITUAÇÃO + QR CODE -->
          <tr>
            <td colspan="3" style="padding: 0;">
              <table class="danfse-table">
                <colgroup>
                  <col style="width: 33.33%;">
                  <col style="width: 33.33%;">
                  <col style="width: 33.34%;">
                </colgroup>
                <tr>
                  <td>
                    <span class="danfse-lbl">NÚMERO DA NFS-e</span>
                    <div class="danfse-val danfse-val-bold">${data.numNfse}</div>
                  </td>
                  <td>
                    <span class="danfse-lbl">COMPETÊNCIA DA NFS-e</span>
                    <div class="danfse-val">${this.formatDate(data.dCompet)}</div>
                  </td>
                  <td>
                    <span class="danfse-lbl">DATA E HORA DA EMISSÃO DA NFS-e</span>
                    <div class="danfse-val">${this.formatDateTime(data.dhProc)}</div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <span class="danfse-lbl">NÚMERO DA DPS</span>
                    <div class="danfse-val danfse-val-bold">${data.numDps}</div>
                  </td>
                  <td>
                    <span class="danfse-lbl">SÉRIE DA DPS</span>
                    <div class="danfse-val">${data.serieDps}</div>
                  </td>
                  <td>
                    <span class="danfse-lbl">DATA E HORA DA EMISSÃO DA DPS</span>
                    <div class="danfse-val">${this.formatDateTime(data.dhEmi)}</div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <span class="danfse-lbl">EMITENTE DA NFS-e</span>
                    <div class="danfse-val">${data.emitente}</div>
                  </td>
                  <td>
                    <span class="danfse-lbl">SITUAÇÃO DA NFS-e</span>
                    <div class="danfse-val ${data.isCancelada ? 'text-rose-600 font-bold' : ''}">${data.situacao}</div>
                  </td>
                  <td>
                    <span class="danfse-lbl">FINALIDADE</span>
                    <div class="danfse-val">${data.finalidade}</div>
                  </td>
                </tr>
              </table>
            </td>
            <td class="danfse-border-left" style="text-align: center; vertical-align: middle; padding: 2px;">
              <img src="${qrCodeUrl}" crossorigin="anonymous" alt="QR Code" style="width: 68px; height: 68px; display: block; margin: auto;">
              <div class="danfse-qr-text">A autenticidade desta NFS-e pode ser verificada pela leitura deste código QR ou pela consulta da chave de acesso no portal nacional da NFS-e</div>
            </td>
          </tr>

          <!-- 3. PRESTADOR / FORNECEDOR -->
          <tr class="danfse-sec-divider">
            <td><div class="danfse-sec-title">PRESTADOR / FORNECEDOR</div></td>
            <td>
              <span class="danfse-lbl">CNPJ / CPF / NIF</span>
              <div class="danfse-val">${this.formatCpfCnpj(data.prestCnpj)}</div>
            </td>
            <td>
              <span class="danfse-lbl">Indicador Municipal (Inscrição)</span>
              <div class="danfse-val">${data.prestIm}</div>
            </td>
            <td>
              <span class="danfse-lbl">Telefone</span>
              <div class="danfse-val">${this.formatPhone(data.prestFone)}</div>
            </td>
          </tr>
          <tr>
            <td colspan="2">
              <span class="danfse-lbl">Nome / Nome Empresarial</span>
              <div class="danfse-val danfse-val-bold">${data.prestNome}</div>
            </td>
            <td>
              <span class="danfse-lbl">Município / Sigla UF</span>
              <div class="danfse-val">${data.xLocEmi} / ${data.prestUf}</div>
            </td>
            <td>
              <span class="danfse-lbl">Código IBGE / CEP</span>
              <div class="danfse-val">${this.formatIbge(data.prestMunIbge)} / ${this.formatCep(data.prestCep)}</div>
            </td>
          </tr>
          <tr>
            <td colspan="2">
              <span class="danfse-lbl">Endereço</span>
              <div class="danfse-val">${data.prestEnd}</div>
            </td>
            <td colspan="2">
              <span class="danfse-lbl">E-mail</span>
              <div class="danfse-val">${data.prestEmail}</div>
            </td>
          </tr>
          <tr>
            <td>
              <span class="danfse-lbl">Simples Nacional na Data de Competência</span>
              <div class="danfse-val" style="font-size: 6.2pt;">${data.simplesNacText}</div>
            </td>
            <td colspan="3">
              <span class="danfse-lbl">Regime de Apuração Tributária pelo SN</span>
              <div class="danfse-val" style="font-size: 6.2pt;">${data.regApSNText}</div>
            </td>
          </tr>

          <!-- 4. TOMADOR / ADQUIRENTE -->
          <tr class="danfse-sec-divider">
            <td><div class="danfse-sec-title">TOMADOR / ADQUIRENTE</div></td>
            <td>
              <span class="danfse-lbl">CNPJ / CPF / NIF</span>
              <div class="danfse-val">${this.formatCpfCnpj(data.tomaDoc)}</div>
            </td>
            <td>
              <span class="danfse-lbl">Indicador Municipal (Inscrição)</span>
              <div class="danfse-val">${data.tomaIm}</div>
            </td>
            <td>
              <span class="danfse-lbl">Telefone</span>
              <div class="danfse-val">${this.formatPhone(data.tomaFone)}</div>
            </td>
          </tr>
          <tr>
            <td colspan="2">
              <span class="danfse-lbl">Nome / Nome Empresarial</span>
              <div class="danfse-val danfse-val-bold">${data.tomaNome}</div>
            </td>
            <td>
              <span class="danfse-lbl">Município / Sigla UF</span>
              <div class="danfse-val">${data.tomaMun} / ${data.tomaUf}</div>
            </td>
            <td>
              <span class="danfse-lbl">Código IBGE / CEP</span>
              <div class="danfse-val">${this.formatIbge(data.tomaMunIbge)} / ${this.formatCep(data.tomaCep)}</div>
            </td>
          </tr>
          <tr>
            <td colspan="2">
              <span class="danfse-lbl">Endereço</span>
              <div class="danfse-val">${data.tomaEnd}</div>
            </td>
            <td colspan="2">
              <span class="danfse-lbl">E-mail</span>
              <div class="danfse-val">${data.tomaEmail}</div>
            </td>
          </tr>

          <!-- 5. DESTINATÁRIO E INTERMEDIÁRIO -->
          <tr>
            <td colspan="4" class="danfse-bar-neutral">DESTINATÁRIO DA OPERAÇÃO NÃO IDENTIFICADO NA NFS-e</td>
          </tr>
          ${(!data.intermDoc || data.intermDoc === '-' || data.intermDoc.trim() === '') ? `
          <tr>
            <td colspan="4" class="danfse-bar-neutral">INTERMEDIÁRIO DA OPERAÇÃO NÃO IDENTIFICADO NA NFS-e</td>
          </tr>` : ''}

          <!-- 6. SERVIÇO PRESTADO -->
          <tr class="danfse-sec-divider">
            <td><div class="danfse-sec-title">SERVIÇO PRESTADO</div></td>
            <td>
              <span class="danfse-lbl">Código de Tributação Nacional/Municipal</span>
              <div class="danfse-val">${this.formatCtn(data.cTribNac)} / -</div>
            </td>
            <td>
              <span class="danfse-lbl">Código da NBS</span>
              <div class="danfse-val">-</div>
            </td>
            <td>
              <span class="danfse-lbl">Local da Prestação / Sigla UF / País</span>
              <div class="danfse-val">${data.xLocPrestacao} / ${data.prestUf} / -</div>
            </td>
          </tr>
          <tr>
            <td colspan="4" style="padding-top: 1px;">
              <div class="danfse-desc-ctn">${data.xTribNac}</div>
            </td>
          </tr>
          <tr>
            <td colspan="4" style="padding-top: 2px;">
              <span class="danfse-lbl">Descrição do Serviço</span>
              <div class="danfse-desc-serv">${data.xDescServ}</div>
            </td>
          </tr>

          <!-- 7. TRIBUTAÇÃO MUNICIPAL (ISSQN) -->
          <tr class="danfse-sec-divider">
            <td><div class="danfse-sec-title">TRIBUTAÇÃO MUNICIPAL (ISSQN)</div></td>
            <td>
              <span class="danfse-lbl">Tipo de Tributação do ISSQN</span>
              <div class="danfse-val">${data.tipoTribISS}</div>
            </td>
            <td colspan="2">
              <span class="danfse-lbl">Município / Sigla UF / País de Incidência do ISSQN</span>
              <div class="danfse-val">${data.xLocIncid} / ${data.prestUf} / -</div>
            </td>
          </tr>
          <tr>
            <td>
              <span class="danfse-lbl">BC ISSQN</span>
              <div class="danfse-val">${this.formatCurrency(data.vServ)}</div>
            </td>
            <td>
              <span class="danfse-lbl">Alíquota Aplicada</span>
              <div class="danfse-val">${data.pAliq ? data.pAliq + '%' : '-'}</div>
            </td>
            <td>
              <span class="danfse-lbl">Retenção do ISSQN</span>
              <div class="danfse-val">${data.retencaoIss}</div>
            </td>
            <td>
              <span class="danfse-lbl">ISSQN Apurado</span>
              <div class="danfse-val">${this.formatCurrency(data.vIss)}</div>
            </td>
          </tr>

          <!-- 8. TRIBUTAÇÃO FEDERAL (EXCETO CBS) -->
          <tr class="danfse-sec-divider">
            <td><div class="danfse-sec-title">TRIBUTAÇÃO FEDERAL (EXCETO CBS)</div></td>
            <td>
              <span class="danfse-lbl">IRRF</span>
              <div class="danfse-val">${this.formatCurrency(data.vIr)}</div>
            </td>
            <td>
              <span class="danfse-lbl">Contribuição Previdenciária - Retida</span>
              <div class="danfse-val">${this.formatCurrency(data.vInss)}</div>
            </td>
            <td>
              <span class="danfse-lbl">Contribuições Sociais - Retidas</span>
              <div class="danfse-val">${this.formatCurrency(data.vCsll)}</div>
            </td>
          </tr>
          <tr>
            <td>
              <span class="danfse-lbl">PIS - Débito Apuração Própria</span>
              <div class="danfse-val">${this.formatCurrency(data.vPis)}</div>
            </td>
            <td>
              <span class="danfse-lbl">COFINS - Débito Apuração Própria</span>
              <div class="danfse-val">${this.formatCurrency(data.vCofins)}</div>
            </td>
            <td colspan="2">
              <span class="danfse-lbl">Descrição Contrib. Sociais - Retidas</span>
              <div class="danfse-val">-</div>
            </td>
          </tr>

          <!-- 9. TRIBUTAÇÃO IBS/CBS -->
          <tr class="danfse-sec-divider">
            <td><div class="danfse-sec-title">TRIBUTAÇÃO IBS/CBS</div></td>
            <td>
              <span class="danfse-lbl">CST / cClassTrib</span>
              <div class="danfse-val">- / -</div>
            </td>
            <td colspan="2">
              <span class="danfse-lbl">Indicador de Operação / Código IBGE Incidência / Município Incidência / Sigla UF</span>
              <div class="danfse-val">- / - / - / -</div>
            </td>
          </tr>
          <tr>
            <td>
              <span class="danfse-lbl">Exclusões e Reduções da Base de Cálculo</span>
              <div class="danfse-val">${this.formatCurrency(data.vIss, false)}</div>
            </td>
            <td>
              <span class="danfse-lbl">Base de Cálculo Após Exclusões e Reduções</span>
              <div class="danfse-val">-</div>
            </td>
            <td>
              <span class="danfse-lbl">Red. Alíquota IBS / Red. Alíquota CBS</span>
              <div class="danfse-val">- / - / -</div>
            </td>
            <td>
              <span class="danfse-lbl">Alíquota - IBS UF / IBS Mun</span>
              <div class="danfse-val">- / -</div>
            </td>
          </tr>
          <tr>
            <td>
              <span class="danfse-lbl">Alíq. Efetiva Municipal - IBS</span>
              <div class="danfse-val">-</div>
            </td>
            <td>
              <span class="danfse-lbl">Valor Apurado Municipal - IBS</span>
              <div class="danfse-val">-</div>
            </td>
            <td>
              <span class="danfse-lbl">Alíq. Efetiva Estadual - IBS</span>
              <div class="danfse-val">-</div>
            </td>
            <td>
              <span class="danfse-lbl">Valor Apurado Estadual - IBS</span>
              <div class="danfse-val">-</div>
            </td>
          </tr>
          <tr>
            <td>
              <span class="danfse-lbl">Valor Total Apurado - IBS</span>
              <div class="danfse-val">-</div>
            </td>
            <td>
              <span class="danfse-lbl">Alíquota - CBS</span>
              <div class="danfse-val">-</div>
            </td>
            <td>
              <span class="danfse-lbl">Alíquota Efetiva - CBS</span>
              <div class="danfse-val">-</div>
            </td>
            <td>
              <span class="danfse-lbl">Valor Total Apurado - CBS</span>
              <div class="danfse-val">-</div>
            </td>
          </tr>

          <!-- 10. VALOR TOTAL DA NFS-E -->
          <tr class="danfse-sec-divider">
            <td><div class="danfse-sec-title">VALOR TOTAL DA NFS-e</div></td>
            <td>
              <span class="danfse-lbl">VALOR DA OPERAÇÃO / SERVIÇO</span>
              <div class="danfse-val danfse-val-bold">${this.formatCurrency(data.vServ, false)}</div>
            </td>
            <td>
              <span class="danfse-lbl">Desconto Incondicionado</span>
              <div class="danfse-val">-</div>
            </td>
            <td>
              <span class="danfse-lbl">Desconto Condicionado</span>
              <div class="danfse-val">-</div>
            </td>
          </tr>
          <tr>
            <td>
              <span class="danfse-lbl">Total das Retenções (ISSQN / Federais)</span>
              <div class="danfse-val">-</div>
            </td>
            <td>
              <span class="danfse-lbl">VALOR LÍQUIDO DA NFS-e</span>
              <div class="danfse-val danfse-val-bold">${this.formatCurrency(data.vLiq, false)}</div>
            </td>
            <td>
              <span class="danfse-lbl">Total do IBS/CBS</span>
              <div class="danfse-val">R$ 0,00</div>
            </td>
            <td>
              <span class="danfse-lbl">VALOR LÍQUIDO DA NFS-e + IBS/CBS</span>
              <div class="danfse-val">R$ 0,00</div>
            </td>
          </tr>

          <!-- 11. INFORMAÇÕES COMPLEMENTARES -->
          <tr class="danfse-sec-divider">
            <td colspan="4" style="padding-top: 2px;">
              <span class="danfse-sec-title" style="display: block; margin-bottom: 2px;">INFORMAÇÕES COMPLEMENTARES</span>
              <div style="font-size: 6.2pt; color: #111; line-height: 1.25;">
                ${data.infoComp}
              </div>
            </td>
          </tr>

          <!-- Espaço de preenchimento até o canhoto -->
          <tr>
            <td colspan="4" class="danfse-spacer"></td>
          </tr>

          <!-- 12. CANHOTO DE RECEBIMENTO -->
          <tr class="danfse-sec-divider">
            <td class="danfse-border-right" style="height: 34px; vertical-align: top;">
              <span class="danfse-lbl">DATA CIENTIFICAÇÃO:</span>
            </td>
            <td colspan="2" class="danfse-border-right" style="height: 34px; vertical-align: top;">
              <span class="danfse-lbl">IDENTIFICAÇÃO E ASSINATURA</span>
            </td>
            <td style="height: 34px; vertical-align: top;">
              <span class="danfse-lbl">N° NFS-e / CHAVE NFS-e</span>
              <div class="danfse-val danfse-val-bold" style="font-size: 6.2pt; font-family: Arial, sans-serif; margin-top: 1px; word-break: break-all;">
                ${data.numNfse} / ${data.chave}
              </div>
            </td>
          </tr>

        </table>
      </div>
    `;
  }
}

window.danfseViewer = new DanfseViewer();
