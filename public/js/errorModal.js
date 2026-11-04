/**
 * Modal e Notificações de Erros Amigáveis
 * Apresenta mensagens de erro da RFB, SERPRO e validações com linguagem simples e instruções práticas
 */

class ErrorModal {
  constructor() {
    this.modalEl = null;
    this.init();
  }

  init() {
    // Cria o elemento do modal no DOM se não existir
    if (!document.getElementById('friendlyErrorModal')) {
      const container = document.createElement('div');
      container.id = 'friendlyErrorModal';
      container.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm hidden transition-opacity';
      container.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden fade-in flex flex-col max-h-[90vh]">
          <!-- Header -->
          <div class="px-6 py-4 bg-gradient-to-r from-rose-50 to-amber-50 border-b border-rose-100 flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold text-xl">
                <i data-lucide="alert-circle" class="w-6 h-6"></i>
              </div>
              <div>
                <span id="errCategoryBadge" class="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 uppercase tracking-wider">Aviso Fiscal</span>
                <h3 id="errTitle" class="text-lg font-bold text-slate-900">Atenção na Emissão</h3>
              </div>
            </div>
            <button onclick="window.friendlyErrorModal.close()" class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white/80 transition-colors">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Body -->
          <div class="p-6 overflow-y-auto space-y-5 text-sm text-slate-700">
            <!-- Mensagem Amigável Principal -->
            <div class="bg-rose-50/60 border border-rose-200/80 rounded-xl p-4">
              <div class="flex items-start space-x-3">
                <i data-lucide="help-circle" class="w-5 h-5 text-rose-500 shrink-0 mt-0.5"></i>
                <div>
                  <h4 class="font-semibold text-rose-900 mb-1">O que aconteceu?</h4>
                  <p id="errFriendlyMessage" class="text-rose-800 leading-relaxed font-normal">
                    Não foi possível concluir a operação com o Ambiente de Dados Nacional.
                  </p>
                </div>
              </div>
            </div>

            <!-- Passos para Resolver -->
            <div class="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4">
              <div class="flex items-start space-x-3">
                <i data-lucide="check-circle-2" class="w-5 h-5 text-emerald-600 shrink-0 mt-0.5"></i>
                <div class="flex-1">
                  <h4 class="font-semibold text-emerald-900 mb-2">Como resolver de forma simples:</h4>
                  <ul id="errHowToFixList" class="space-y-2 text-emerald-800 list-disc list-inside">
                    <li>Verifique os dados digitados e tente novamente.</li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Detalhes Técnicos (Colapsável) -->
            <div class="border border-slate-200 rounded-xl overflow-hidden">
              <button onclick="window.friendlyErrorModal.toggleTechnical()" class="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-medium text-slate-600 transition-colors">
                <span class="flex items-center space-x-1.5">
                  <i data-lucide="terminal" class="w-4 h-4 text-slate-500"></i>
                  <span>Detalhes Técnicos da RFB / SERPRO (para suporte TI)</span>
                </span>
                <i id="errTechArrow" data-lucide="chevron-down" class="w-4 h-4 text-slate-400"></i>
              </button>
              <div id="errTechDetails" class="hidden p-3 bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto max-h-40">
                <pre id="errTechnicalContent" class="whitespace-pre-wrap break-all"></pre>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span class="text-xs text-slate-500 flex items-center space-x-1">
              <i data-lucide="shield-check" class="w-3.5 h-3.5 text-slate-400"></i>
              <span>Emissor Nacional NFS-e • RFB / ADN</span>
            </span>
            <div class="flex space-x-2">
              <button onclick="window.friendlyErrorModal.copyDetails()" class="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center space-x-1">
                <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                <span>Copiar Detalhes</span>
              </button>
              <button onclick="window.friendlyErrorModal.close()" class="px-4 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors">
                Entendido
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(container);
      this.modalEl = container;
      if (window.lucide) lucide.createIcons();
    }
  }

  show(errorObj) {
    this.init();
    const title = errorObj.title || 'Aviso de Processamento Fiscal';
    const category = errorObj.category || 'Receita Federal / ADN';
    const message = errorObj.message || 'Ocorreu uma divergência durante o processamento da nota fiscal.';
    const howToFix = Array.isArray(errorObj.howToFix) && errorObj.howToFix.length > 0
      ? errorObj.howToFix
      : ['Revise as informações da empresa representada e tente novamente.', 'Se persistir, consulte o suporte contábil.'];
    const technicalDetail = errorObj.technicalDetail || errorObj.rawCode || 'Sem detalhe adicional.';

    document.getElementById('errTitle').innerText = title;
    document.getElementById('errCategoryBadge').innerText = category;
    document.getElementById('errFriendlyMessage').innerText = message;

    const listEl = document.getElementById('errHowToFixList');
    listEl.innerHTML = '';
    howToFix.forEach(step => {
      const li = document.createElement('li');
      li.className = 'leading-relaxed';
      li.innerText = step;
      listEl.appendChild(li);
    });

    document.getElementById('errTechnicalContent').innerText = technicalDetail;
    this.lastTechnicalDetail = `[${category}] ${title}\nMensagem: ${message}\nDetalhes Técnicos: ${technicalDetail}`;

    this.modalEl.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  }

  close() {
    if (this.modalEl) {
      this.modalEl.classList.add('hidden');
    }
  }

  toggleTechnical() {
    const el = document.getElementById('errTechDetails');
    const arrow = document.getElementById('errTechArrow');
    if (el.classList.contains('hidden')) {
      el.classList.remove('hidden');
      arrow.style.transform = 'rotate(180deg)';
    } else {
      el.classList.add('hidden');
      arrow.style.transform = 'rotate(0deg)';
    }
  }

  copyDetails() {
    if (navigator.clipboard && this.lastTechnicalDetail) {
      navigator.clipboard.writeText(this.lastTechnicalDetail);
      alert('Detalhes do erro copiados para a área de transferência!');
    }
  }
}

window.friendlyErrorModal = new ErrorModal();

