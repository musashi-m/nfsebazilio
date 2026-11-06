const NFSE_LOGO_BASE64 = 'data:image/png;base64,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';

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
              <button onclick="window.danfseViewer.downloadPdf()" id="btnDanfseDownloadPdf" class="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center space-x-1.5 shadow-sm transition-colors" title="Baixar DANFSE em PDF com texto legível e copiável">
                <i data-lucide="file-down" class="w-4 h-4"></i>
                <span id="btnDanfseDownloadPdfText">Baixar DANFSE</span>
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

  showProgressToast(msg, duration = 0, isSuccess = false) {
    let toast = document.getElementById('danfseProgressToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'danfseProgressToast';
      document.body.appendChild(toast);
    }

    if (isSuccess) {
      toast.className = 'fixed bottom-6 right-6 z-[9999] px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2.5 text-xs font-semibold bg-emerald-600 text-white transition-all duration-300';
      toast.innerHTML = `<span class="text-base font-bold">✓</span><span>${msg}</span>`;
    } else {
      toast.className = 'fixed bottom-6 right-6 z-[9999] px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2.5 text-xs font-semibold bg-slate-900/95 text-white border border-slate-700 backdrop-blur-md transition-all duration-300';
      toast.innerHTML = `<span class="animate-spin text-emerald-400 text-sm">⌛</span><span>${msg}</span>`;
    }

    toast.style.display = 'flex';

    if (duration > 0) {
      setTimeout(() => {
        if (toast) toast.style.display = 'none';
      }, duration);
    }
  }

  addSelectableTextLayer(pdf, docEl, marginX = 5, marginY = 4) {
    try {
      const docRect = docEl.getBoundingClientRect();
      if (!docRect || !docRect.width) return;
      const scaleX = 200 / docRect.width;

      if (pdf.internal && pdf.internal.write) {
        // Modo 3 Tr = texto invisível ao olho (preserva o visual oficial da tabela),
        // mas 100% selecionável com o mouse e copiável (Ctrl+C / Ctrl+F) no PDF!
        pdf.internal.write('3 Tr');
      }

      // Seletores pontuais de texto para execução ultrarrápida sem travar o navegador
      const selectors = '.danfse-val, .danfse-lbl, .danfse-chave-num, .danfse-title-main, .danfse-title-sub, .danfse-sec-title, .danfse-qr-text';
      const textElements = docEl.querySelectorAll(selectors);
      const seen = new Set();

      for (let i = 0; i < textElements.length; i++) {
        const el = textElements[i];
        if (el.children.length > 0 && Array.from(el.children).some(c => (c.textContent || '').trim())) continue;
        const text = (el.textContent || '').trim();
        if (!text || text === '-') continue;

        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;

        const relX = (r.left - docRect.left) * scaleX + marginX;
        const relY = (r.top - docRect.top) * scaleX + marginY + (r.height * scaleX * 0.82);

        const key = `${Math.round(relX)}_${Math.round(relY)}_${text}`;
        if (seen.has(key)) continue;
        seen.add(key);

        try {
          pdf.setFontSize(7.5);
          pdf.text(text, Math.max(0, relX), Math.max(0, relY));
        } catch (_) {}
      }
    } catch (e) {
      console.warn('Aviso ao gerar camada de texto selecionável:', e);
    }
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
      btn.innerHTML = `<span class="animate-spin inline-block text-xs mr-1">⌛</span><span>Gerando DANFSE...</span>`;
    }

    this.showProgressToast('Gerando DANFSE em alta definição...');

    // Libera a thread do navegador para renderizar o spinner e o toast imediatamente
    await new Promise(r => setTimeout(r, 60));

    try {
      const data = this.extractData(targetNfse);
      const cleanNum = String(data.numNfse || targetNfse.numeroNfse || '').replace(/\D/g, '');
      const cleanChave = String(data.chave || targetNfse.chaveAcesso || '').replace(/\D/g, '');
      const filename = cleanNum ? `DANFSE_${cleanNum}.pdf` : `DANFSE_${cleanChave ? cleanChave.substring(0, 15) : 'NACIONAL'}.pdf`;

      const targetEl = document.getElementById('danfseRenderTarget');
      if (!targetEl) throw new Error('Elemento de visualização não encontrado.');

      const docEl = targetEl.querySelector('.danfse-document') || targetEl;

      // Garante que imagens em base64/canvas estejam prontas
      const images = docEl.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(res => {
          img.onload = res;
          img.onerror = res;
          setTimeout(res, 150);
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
          scale: 1.5,
          useCORS: true,
          imageTimeout: 0, // Nunca espera 15s por imagens externas
          letterRendering: false, // Renderização instantânea (evita cálculo caractere a caractere)
          backgroundColor: '#ffffff',
          logging: false,
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
        await html2pdf()
          .set(opt)
          .from(docEl)
          .toPdf()
          .get('pdf')
          .then((pdf) => {
            this.addSelectableTextLayer(pdf, docEl, 5, 4);
          })
          .save();

        this.showProgressToast('✓ DANFSE baixado com sucesso!', 3000, true);
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
    const situacao = isCancelada ? 'NFS-e Cancelada' : 'NFS-e Gerada';
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

    if (!tomaDoc) tomaDoc = nfse.tomador?.doc || nfse.tomador?.docRaw || '-';
    if (!tomaNome) tomaNome = nfse.tomador?.nome || '-';
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
    const xTribNac = getXml('xTribNac') || 'Contabilidade, inclusive serviços técnicos e auxiliares.';
    const xDescServ = getXml('xDescServ') || nfse.servico?.descricao || 'Honorários';
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

    // Informações complementares
    let infoComp = `Totais aproximados dos Tributos cfe. Lei nº 12.741/2012: Federais: R$ 0,00; Estaduais: R$ 0,00; Municipais: R$ 0,00;`;
    if (vIss && parseFloat(vIss) > 0) {
      infoComp = `Totais aproximados dos Tributos cfe. Lei nº 12.741/2012: Federais: -; Estaduais: R$ 0,00; Municipais: ${this.formatCurrency(vIss, false)};`;
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
  
  renderQrCode(container, text) {
    if (!container) return;
    container.innerHTML = '';
    try {
      if (typeof QRCode !== 'undefined') {
        new QRCode(container, {
          text: text,
          width: 68,
          height: 68,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M
        });
        const img = container.querySelector('img');
        if (img) {
          img.style.display = 'block';
          img.style.margin = 'auto';
        }
        const cvs = container.querySelector('canvas');
        if (cvs) {
          cvs.style.display = 'block';
          cvs.style.margin = 'auto';
        }
        return;
      }
    } catch (e) {
      console.warn('Erro ao gerar QRCode offline:', e);
    }

    // Fallback caso QRCode.js não esteja disponível
    const img = document.createElement('img');
    img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=72x72&data=' + encodeURIComponent(text);
    img.style.width = '68px';
    img.style.height = '68px';
    img.style.margin = 'auto';
    img.style.display = 'block';
    container.appendChild(img);
  }

  renderDanfse(nfse) {
    const target = document.getElementById('danfseRenderTarget');
    if (!target) return;

    const data = this.extractData(nfse);
    this.currentChave = data.chave;

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=72x72&data=https://www.nfse.gov.br/consultapublica/danfse?chave=${data.chave}`;

    // HTML montado abaixo
    target.innerHTML = `
      <div class="danfse-document relative">
        ${data.isCancelada ? '<div class="danfse-watermark">CANCELADA</div>' : ''}

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
              <img src="${NFSE_LOGO_BASE64}" alt="NFS-e Nacional" style="max-height: 32px; max-width: 95%; display: block; margin: auto;">
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
              <div id="danfseQrContainer" style="width: 68px; height: 68px; margin: auto; display: flex; align-items: center; justify-content: center; min-height: 68px;"></div>
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
          <tr>
            <td colspan="4" class="danfse-bar-neutral">INTERMEDIÁRIO DA OPERAÇÃO NÃO IDENTIFICADO NA NFS-e</td>
          </tr>

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

    const qrBox = document.getElementById("danfseQrContainer");
    if (qrBox) {
      this.renderQrCode(qrBox, "https://www.nfse.gov.br/consultapublica/danfse?chave=" + data.chave);
    }
  }
}

window.danfseViewer = new DanfseViewer();
