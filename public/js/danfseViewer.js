/**
 * Visualizador Oficial do DANFSE (Documento Auxiliar da NFS-e Padrão Nacional)
 * Padrão Comitê Gestor da NFS-e (CGNFS-e) / Receita Federal do Brasil
 */

class DanfseViewer {
  constructor() {
    this.modalEl = null;
    this.currentNfse = null;
    this.init();
  }

  init() {
    if (!document.getElementById('danfseModal')) {
      const container = document.createElement('div');
      container.id = 'danfseModal';
      container.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm hidden overflow-y-auto';
      container.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-300 my-8 flex flex-col max-h-[92vh] overflow-hidden">
          <!-- Barra de Ações Superior (Não sai na impressão) -->
          <div class="no-print px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div class="flex items-center space-x-2">
              <span class="w-3 h-3 rounded-full bg-emerald-400"></span>
              <span class="font-bold text-sm tracking-wide">DANFSE NACIONAL • VISUALIZAÇÃO OFICIAL</span>
            </div>
            <div class="flex items-center space-x-2">
              <button onclick="window.danfseViewer.downloadXml()" class="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center space-x-1 transition-colors">
                <i data-lucide="file-code" class="w-4 h-4"></i>
                <span>Baixar XML Oficial</span>
              </button>
              <button onclick="window.danfseViewer.print()" class="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center space-x-1.5 shadow-sm transition-colors">
                <i data-lucide="printer" class="w-4 h-4"></i>
                <span>Imprimir / Salvar PDF</span>
              </button>
              <button onclick="window.danfseViewer.close()" class="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>
          </div>

          <!-- Área do DANFSE Formatado (Área imprimível) -->
          <div id="danfsePrintArea" class="p-8 overflow-y-auto bg-slate-50 text-slate-900 text-xs font-sans leading-snug">
            <div id="danfseRenderTarget" class="bg-white p-6 border border-slate-300 shadow-sm max-w-3xl mx-auto space-y-4">
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

  downloadXml() {
    if (this.currentNfse && this.currentNfse.chaveAcesso) {
      window.location.href = `/api/adn/nfse/${this.currentNfse.chaveAcesso}/xml`;
    }
  }

  formatChave(chave) {
    if (!chave) return '';
    return chave.replace(/(\d{4})/g, '$1 ').trim();
  }

  formatCurrency(val) {
    const num = parseFloat(val) || 0;
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatDate(iso) {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return d.toLocaleString('pt-BR');
    } catch {
      return iso;
    }
  }

  renderDanfse(nfse) {
    const target = document.getElementById('danfseRenderTarget');
    const isCancelada = nfse.status === 'CANCELADA';
    const isTeste = nfse.ambiente === 'TESTE';
    const chaveFormatada = this.formatChave(nfse.chaveAcesso);
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=https://www.nfse.gov.br/consultapublica/danfse?chave=${nfse.chaveAcesso}`;

    target.innerHTML = `
      <!-- Cabeçalho Oficial -->
      <div class="border border-slate-800 p-3 relative">
        ${isCancelada ? '<div class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 transform -rotate-12"><span class="text-6xl font-black text-rose-600 border-8 border-rose-600 px-6 py-2 uppercase">CANCELADA</span></div>' : ''}
        ${isTeste ? '<div class="absolute top-1 right-2"><span class="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 border border-amber-300">SEM VALOR FISCAL - AMBIENTE DE TESTE</span></div>' : ''}
        
        <div class="flex items-center justify-between pb-2 border-b border-slate-300">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 flex items-center justify-center bg-slate-100 border border-slate-300 rounded font-bold text-slate-700 text-lg">
              RFB
            </div>
            <div>
              <h1 class="text-sm font-extrabold uppercase text-slate-900 tracking-wide">Documento Auxiliar da NFS-e Nacional (DANFSE)</h1>
              <p class="text-[11px] text-slate-600">Ambiente de Dados Nacional • Receita Federal do Brasil</p>
            </div>
          </div>
          <div class="text-right">
            <span class="text-[10px] text-slate-500 block">NÚMERO DA NFS-e</span>
            <span class="text-base font-extrabold text-slate-900 font-mono">${nfse.numeroNfse || '-'}</span>
          </div>
        </div>

        <!-- Chave de Acesso e QR Code -->
        <div class="grid grid-cols-4 gap-3 pt-3 items-center">
          <div class="col-span-3 space-y-1.5">
            <div>
              <span class="text-[10px] text-slate-500 font-semibold uppercase block">Chave de Acesso da NFS-e Nacional</span>
              <span class="font-mono text-xs font-bold text-slate-900 tracking-wider bg-slate-50 px-2 py-1 border border-slate-200 block">${chaveFormatada}</span>
            </div>
            <div class="grid grid-cols-3 gap-2 text-[11px]">
              <div>
                <span class="text-slate-500 block text-[10px]">Data/Hora Emissão:</span>
                <span class="font-semibold">${this.formatDate(nfse.dataEmissao)}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[10px]">Protocolo de Autorização:</span>
                <span class="font-mono font-semibold">${nfse.protocolo || '-'}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[10px]">Série / Número DPS:</span>
                <span class="font-semibold">Série ${nfse.serie || 1} • DPS nº ${nfse.numeroDps || '-'}</span>
              </div>
            </div>
          </div>
          <div class="col-span-1 flex flex-col items-center justify-center border-l border-slate-200 pl-2">
            <img src="${qrCodeUrl}" alt="QR Code Autenticidade" class="w-20 h-20 border border-slate-200 p-0.5 bg-white" />
            <span class="text-[9px] text-slate-500 mt-1 text-center font-medium">Consulte no portal oficial</span>
          </div>
        </div>
      </div>

      <!-- Prestador dos Serviços (Empresa Representada) -->
      <div class="border border-slate-800">
        <div class="bg-slate-100 px-3 py-1 font-bold text-[11px] uppercase border-b border-slate-300 flex items-center justify-between">
          <span>Dados do Prestador dos Serviços (Empresa Representada)</span>
          ${nfse.procurador && nfse.procurador.viaProcuracao ? '<span class="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">Emitido por Procurador via Representação RFB</span>' : ''}
        </div>
        <div class="p-3 grid grid-cols-3 gap-2">
          <div class="col-span-2">
            <span class="text-[10px] text-slate-500 block">Razão Social / Nome:</span>
            <span class="font-bold text-slate-900 text-xs">${nfse.prestador.razaoSocial}</span>
          </div>
          <div>
            <span class="text-[10px] text-slate-500 block">CNPJ do Prestador:</span>
            <span class="font-bold font-mono text-slate-900 text-xs">${nfse.prestador.cnpj}</span>
          </div>
          <div>
            <span class="text-[10px] text-slate-500 block">Inscrição Municipal (IM):</span>
            <span class="font-semibold">${nfse.prestador.im || 'Isento / Não Informado'}</span>
          </div>
          <div class="col-span-2">
            <span class="text-[10px] text-slate-500 block">Regime de Tributação:</span>
            <span class="font-semibold">${nfse.prestador.regime}</span>
          </div>
          ${nfse.procurador && nfse.procurador.viaProcuracao ? `
          <div class="col-span-3 pt-1 border-t border-slate-200 text-[10px] text-slate-600">
            <span class="font-semibold">Procurador Certificado:</span> ${nfse.procurador.nome} (${nfse.procurador.doc})
          </div>
          ` : ''}
        </div>
      </div>

      <!-- Tomador dos Serviços -->
      <div class="border border-slate-800">
        <div class="bg-slate-100 px-3 py-1 font-bold text-[11px] uppercase border-b border-slate-300">
          Dados do Tomador dos Serviços (Cliente)
        </div>
        <div class="p-3 grid grid-cols-3 gap-2">
          <div class="col-span-2">
            <span class="text-[10px] text-slate-500 block">Razão Social / Nome do Tomador:</span>
            <span class="font-bold text-slate-900 text-xs">${nfse.tomador.nome}</span>
          </div>
          <div>
            <span class="text-[10px] text-slate-500 block">CPF / CNPJ:</span>
            <span class="font-bold font-mono text-slate-900 text-xs">${nfse.tomador.doc}</span>
          </div>
          <div class="col-span-2">
            <span class="text-[10px] text-slate-500 block">Endereço / Município:</span>
            <span class="font-medium">${nfse.tomador.logradouro || ''} ${nfse.tomador.numero || ''} • ${nfse.tomador.municipio} - ${nfse.tomador.uf}</span>
          </div>
          <div>
            <span class="text-[10px] text-slate-500 block">E-mail:</span>
            <span class="font-medium truncate block">${nfse.tomador.email || '-'}</span>
          </div>
        </div>
      </div>

      <!-- Discriminação dos Serviços -->
      <div class="border border-slate-800">
        <div class="bg-slate-100 px-3 py-1 font-bold text-[11px] uppercase border-b border-slate-300 flex justify-between">
          <span>Discriminação dos Serviços Prestados</span>
          <span class="font-mono text-[10px] text-slate-600">cTribNac: ${nfse.servico.cTribNac}</span>
        </div>
        <div class="p-3 min-h-[70px] whitespace-pre-wrap text-slate-800 font-sans text-xs leading-relaxed">
${nfse.servico.descricao}
        </div>
      </div>

      <!-- Quadro de Valores e Tributação -->
      <div class="border border-slate-800">
        <div class="bg-slate-100 px-3 py-1 font-bold text-[11px] uppercase border-b border-slate-300">
          Valores do Serviço e Apuração de Tributos
        </div>
        <div class="p-3 space-y-3">
          <!-- Linha Principal -->
          <div class="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 border border-slate-200 text-center">
            <div>
              <span class="text-[10px] text-slate-500 block">VALOR DOS SERVIÇOS</span>
              <span class="font-extrabold text-sm text-slate-900">${this.formatCurrency(nfse.valores.vServ)}</span>
            </div>
            <div>
              <span class="text-[10px] text-slate-500 block">ALÍQUOTA ISS</span>
              <span class="font-bold text-sm text-slate-800">${(nfse.valores.pAliq || 0).toFixed(2)}%</span>
            </div>
            <div>
              <span class="text-[10px] text-slate-500 block">VALOR DO ISS</span>
              <span class="font-bold text-sm text-slate-800">${this.formatCurrency(nfse.valores.vIss)}</span>
            </div>
            <div>
              <span class="text-[10px] text-slate-500 block">ISS RETIDO?</span>
              <span class="font-bold text-sm ${nfse.valores.issRetido ? 'text-amber-700' : 'text-slate-800'}">
                ${nfse.valores.issRetido ? 'SIM (Retido)' : 'NÃO'}
              </span>
            </div>
          </div>

          <!-- Tributos Federais Retidos -->
          <div class="grid grid-cols-5 gap-2 text-center text-[11px] pt-1 border-t border-slate-200">
            <div>
              <span class="text-[10px] text-slate-500 block">PIS Retido</span>
              <span class="font-semibold">${this.formatCurrency(nfse.valores.vPis)}</span>
            </div>
            <div>
              <span class="text-[10px] text-slate-500 block">COFINS Retido</span>
              <span class="font-semibold">${this.formatCurrency(nfse.valores.vCofins)}</span>
            </div>
            <div>
              <span class="text-[10px] text-slate-500 block">INSS Retido</span>
              <span class="font-semibold">${this.formatCurrency(nfse.valores.vInss)}</span>
            </div>
            <div>
              <span class="text-[10px] text-slate-500 block">IRRF Retido</span>
              <span class="font-semibold">${this.formatCurrency(nfse.valores.vIr)}</span>
            </div>
            <div>
              <span class="text-[10px] text-slate-500 block">CSLL Retida</span>
              <span class="font-semibold">${this.formatCurrency(nfse.valores.vCsll)}</span>
            </div>
          </div>

          <!-- Totalizador Líquido -->
          <div class="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-300 rounded font-bold text-emerald-950">
            <span>VALOR LÍQUIDO A RECEBER:</span>
            <span class="text-base text-emerald-900">${this.formatCurrency(nfse.valores.vLiquido)}</span>
          </div>
        </div>
      </div>

      <!-- Rodapé do Documento -->
      <div class="text-[9px] text-slate-500 pt-1 flex justify-between items-center border-t border-slate-200">
        <span>Emissor Nacional NFS-e • Conexão Direta RFB/ADN • CGNFS-e</span>
        <span>Autenticidade garantida por assinatura digital ICP-Brasil</span>
      </div>
    `;
  }
}

window.danfseViewer = new DanfseViewer();

