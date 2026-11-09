/**
 * Serviço de Automação & Sincronização Agendada (Robô Noturno)
 * Bazilio Contabilidade - Emissor Nacional NFS-e ADN
 * 
 * Executa diariamente de madrugada (padrão: 03:00 AM) para sincronizar
 * automaticamente o acervo de todas as empresas representadas via ADN/DFe.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const storageService = require('./storageService');
const certService = require('./certService');

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const BASE_DATA_DIR = path.join(__dirname, '../../data');
const DATA_DIR = isServerless ? path.join(os.tmpdir(), 'emissor_data') : BASE_DATA_DIR;
const STATE_FILE = path.join(DATA_DIR, 'scheduler_state.json');

class SchedulerService {
  constructor() {
    this.enabled = true;
    this.scheduledHour = 3;   // 03:00 AM
    this.scheduledMinute = 0;
    this.isRunning = false;
    this.intervalId = null;
    this.lastRunDate = null;
    this.logs = [];

    this._loadState();
    this._initTimer();
  }

  _loadState() {
    try {
      if (fs.existsSync(STATE_FILE)) {
        const raw = fs.readFileSync(STATE_FILE, 'utf8');
        const data = JSON.parse(raw);
        this.enabled = data.enabled !== undefined ? Boolean(data.enabled) : true;
        this.scheduledHour = typeof data.scheduledHour === 'number' ? data.scheduledHour : 3;
        this.scheduledMinute = typeof data.scheduledMinute === 'number' ? data.scheduledMinute : 0;
        this.lastRunDate = data.lastRunDate || null;
        this.logs = Array.isArray(data.logs) ? data.logs : [];
      }
    } catch (e) {
      console.warn('Erro ao carregar estado do agendador noturno:', e.message);
    }
  }

  _saveState() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const data = {
        enabled: this.enabled,
        scheduledHour: this.scheduledHour,
        scheduledMinute: this.scheduledMinute,
        lastRunDate: this.lastRunDate,
        logs: this.logs.slice(-30), // Mantém os últimos 30 registros
        updatedAt: new Date().toISOString()
      };
      fs.writeFileSync(STATE_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.warn('Erro ao salvar estado do agendador noturno:', e.message);
    }
  }

  _addLog(mensagem, tipo = 'info') {
    const timestamp = new Date().toLocaleString('pt-BR');
    const entry = {
      timestamp,
      tipo,
      mensagem
    };
    this.logs.unshift(entry);
    if (this.logs.length > 50) this.logs.pop();
    console.log(`[ROBÔ NOTURNO] [${timestamp}] ${mensagem}`);
    this._saveState();
  }

  _initTimer() {
    if (this.intervalId) clearInterval(this.intervalId);

    // Verifica a cada 60 segundos se chegou a hora programada
    this.intervalId = setInterval(() => {
      this._checkSchedule();
    }, 60000);
    if (this.intervalId && typeof this.intervalId.unref === 'function') {
      this.intervalId.unref();
    }

    // Primeira checagem rápida após 15 segundos de inicialização
    const initialCheck = setTimeout(() => this._checkSchedule(), 15000);
    if (initialCheck && typeof initialCheck.unref === 'function') {
      initialCheck.unref();
    }
  }

  _checkSchedule() {
    if (!this.enabled || this.isRunning) return;

    // Hora oficial de Brasília (UTC-3)
    const now = new Date();
    const utcHours = now.getUTCHours();
    const brHours = (utcHours - 3 + 24) % 24;
    const brMinutes = now.getUTCMinutes();
    const todayStr = now.toISOString().substring(0, 10);

    // Se a hora e minuto baterem e ainda não tiver rodado hoje
    if (brHours === this.scheduledHour && brMinutes === this.scheduledMinute) {
      const lastRunDay = this.lastRunDate ? this.lastRunDate.substring(0, 10) : null;
      if (lastRunDay !== todayStr) {
        this._addLog(`Horário programado atingido (${String(this.scheduledHour).padStart(2, '0')}:${String(this.scheduledMinute).padStart(2, '0')} BRT). Iniciando sincronização noturna do acervo...`);
        this.runNightlySync('AUTOMATICO');
      }
    }
  }

  getNextRunTime() {
    const now = new Date();
    const next = new Date(now);
    // Ajusta para o horário de Brasília
    next.setHours(this.scheduledHour, this.scheduledMinute, 0, 0);
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    return next.toLocaleString('pt-BR');
  }

  /**
   * Executa a varredura e sincronização noturna de todas as empresas
   */
  async runNightlySync(origem = 'MANUAL') {
    if (this.isRunning) {
      return { success: false, message: 'O robô de sincronização já está em execução no momento.' };
    }

    this.isRunning = true;
    this.lastRunDate = new Date().toISOString();
    this._addLog(`Iniciando varredura noturna do acervo (${origem})...`);

    // Lazy load adnService para evitar dependência circular
    const adnService = require('./adnService');

    try {
      const certInfo = certService.activeCert;
      if (!certInfo || !certInfo.pfxBuffer) {
        this._addLog('Certificado digital A1 não carregado no servidor. Varredura cancelada.', 'warn');
        this.isRunning = false;
        return { success: false, message: 'Certificado digital não carregado.' };
      }

      // 1. Obtém lista consolidada de empresas da carteira
      const companies = storageService.getCompanies() || [];
      const recents = storageService._readJson(path.join(DATA_DIR, 'recent_representations.json'), []) || [];

      const lista = [
        { cnpjRaw: '12627708000156', razaoSocial: 'BAZILIO CONTABILIDADE LTDA' },
        ...companies,
        ...recents
      ];

      const cnpjsUnicos = new Map();
      lista.forEach(c => {
        const raw = (c.cnpjRaw || c.cnpj || '').replace(/\D/g, '');
        if (raw && raw.length === 14 && !cnpjsUnicos.has(raw)) {
          cnpjsUnicos.set(raw, c.razaoSocial || c.nome || 'Cliente Representado');
        }
      });

      this._addLog(`Identificadas ${cnpjsUnicos.size} empresa(s) para sincronização automática.`);

      let totalNovasGeral = 0;
      let totalEventosGeral = 0;
      let empresasSucesso = 0;
      let empresasFalha = 0;

      for (const [cnpj, nome] of cnpjsUnicos.entries()) {
        try {
          const startTime = Date.now();
          const res = await adnService.sincronizarHistoricoAdn(cnpj, 'PRODUCAO', {
            startFromZero: false,
            maxBatches: 25 // Sincronização incremental ágil
          });

          const duracaoSec = ((Date.now() - startTime) / 1000).toFixed(1);
          const novas = res.totalNovas || 0;
          const ev = res.totalEventos || 0;
          totalNovasGeral += novas;
          totalEventosGeral += ev;
          empresasSucesso++;

          this._addLog(`[OK] ${nome} (${cnpj}): +${novas} nota(s), +${ev} evento(s) em ${duracaoSec}s.`);

          // Pausa preventiva de 1.5s entre empresas para evitar rate limit da RFB
          await new Promise(r => setTimeout(r, 1500));
        } catch (errEmpresa) {
          empresasFalha++;
          this._addLog(`[AVISO] Falha ao sincronizar ${nome} (${cnpj}): ${errEmpresa.message}`, 'warn');
        }
      }

      const msgFinal = `Varredura noturna finalizada! ${empresasSucesso} empresa(s) sincronizadas, ${totalNovasGeral} nova(s) NFS-e e ${totalEventosGeral} evento(s) baixados.`;
      this._addLog(msgFinal, 'success');

      return {
        success: true,
        message: msgFinal,
        stats: {
          empresasSucesso,
          empresasFalha,
          totalNovasGeral,
          totalEventosGeral
        }
      };
    } catch (err) {
      this._addLog(`Erro crítico durante a execução do robô: ${err.message}`, 'error');
      return { success: false, message: err.message };
    } finally {
      this.isRunning = false;
      this._saveState();
    }
  }

  getStatus() {
    return {
      enabled: this.enabled,
      scheduledHour: this.scheduledHour,
      scheduledMinute: this.scheduledMinute,
      scheduledTimeFormatted: `${String(this.scheduledHour).padStart(2, '0')}:${String(this.scheduledMinute).padStart(2, '0')} BRT`,
      nextRunTime: this.getNextRunTime(),
      lastRunDate: this.lastRunDate ? new Date(this.lastRunDate).toLocaleString('pt-BR') : 'Ainda não executado',
      isRunning: this.isRunning,
      logs: this.logs.slice(0, 15)
    };
  }

  updateConfig(config = {}) {
    if (config.enabled !== undefined) this.enabled = Boolean(config.enabled);
    if (typeof config.scheduledHour === 'number' && config.scheduledHour >= 0 && config.scheduledHour <= 23) {
      this.scheduledHour = config.scheduledHour;
    }
    if (typeof config.scheduledMinute === 'number' && config.scheduledMinute >= 0 && config.scheduledMinute <= 59) {
      this.scheduledMinute = config.scheduledMinute;
    }
    this._saveState();
    this._addLog(`Configuração do robô atualizada: Diariamente às ${String(this.scheduledHour).padStart(2, '0')}:${String(this.scheduledMinute).padStart(2, '0')} BRT (Ativo: ${this.enabled ? 'SIM' : 'NÃO'}).`);
    return this.getStatus();
  }
}

module.exports = new SchedulerService();
