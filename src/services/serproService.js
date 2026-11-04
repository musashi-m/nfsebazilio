/**
 * Serviço de Integração com a API Oficial do SERPRO
 * - Autenticação OAuth2 (Client Credentials)
 * - Transmissão de DPS via Gateway SERPRO
 * - Consulta de NFS-e e NSU
 * Comunicação direta e real com os gateways oficiais da SERPRO.
 */

const axios = require('axios');
const { ENVIRONMENTS } = require('../config/environments');
const { translateError } = require('./errorTranslator');

class SerproService {
  constructor() {
    this.tokenCache = {}; // Cache de tokens por ambiente
  }

  /**
   * Obtém token de acesso OAuth2 real junto ao SERPRO
   */
  async getAccessToken(envKey, credentials = {}) {
    const env = ENVIRONMENTS[envKey] || ENVIRONMENTS.HOMOLOGACAO;

    const consumerKey = credentials.consumerKey || process.env.SERPRO_CONSUMER_KEY;
    const consumerSecret = credentials.consumerSecret || process.env.SERPRO_CONSUMER_SECRET;

    if (!consumerKey || !consumerSecret) {
      throw new Error('Credenciais da API SERPRO (Consumer Key e Consumer Secret) não configuradas. Configure suas credenciais na aba "Ambientes & SERPRO" ou utilize a Conexão Direta mTLS com a Receita Federal.');
    }

    // Verifica se há token válido em cache
    const cached = this.tokenCache[envKey];
    if (cached && cached.expiresAt > Date.now() + 60000) {
      return cached;
    }

    try {
      const basicAuth = Buffer.from(`${consumerKey.trim()}:${consumerSecret.trim()}`).toString('base64');
      const response = await axios.post(
        env.serproAuthUrl,
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: env.timeoutMs
        }
      );

      const tokenData = {
        ...response.data,
        expiresAt: Date.now() + (response.data.expires_in || 3600) * 1000
      };
      this.tokenCache[envKey] = tokenData;
      return tokenData;
    } catch (err) {
      console.error('Erro ao obter token SERPRO:', err.message);
      throw translateError(err, { step: 'Autenticação OAuth2 SERPRO' });
    }
  }

  /**
   * Envia DPS assinada através do Gateway SERPRO oficial
   */
  async sendDps(signedXml, envKey, credentials = {}) {
    const env = ENVIRONMENTS[envKey] || ENVIRONMENTS.HOMOLOGACAO;

    try {
      const tokenInfo = await this.getAccessToken(envKey, credentials);
      const response = await axios.post(
        `${env.serproApiBaseUrl}/dps`,
        { xmlDps: Buffer.from(signedXml).toString('base64') },
        {
          headers: {
            'Authorization': `Bearer ${tokenInfo.access_token}`,
            'Content-Type': 'application/json'
          },
          timeout: env.timeoutMs
        }
      );

      return {
        success: true,
        protocolo: response.data.protocolo || response.data.numeroProtocolo,
        data: response.data
      };
    } catch (err) {
      throw translateError(err, { step: 'Envio de DPS via SERPRO' });
    }
  }

  /**
   * Testa a conectividade real com a API do SERPRO
   */
  async testConnection(envKey, credentials = {}) {
    const startTime = Date.now();
    const env = ENVIRONMENTS[envKey] || ENVIRONMENTS.HOMOLOGACAO;

    try {
      const consumerKey = credentials.consumerKey || process.env.SERPRO_CONSUMER_KEY;
      const consumerSecret = credentials.consumerSecret || process.env.SERPRO_CONSUMER_SECRET;

      if (!consumerKey || !consumerSecret) {
        return {
          online: false,
          latencyMs: 0,
          environment: envKey,
          service: 'SERPRO API Gateway',
          statusText: 'Credenciais (Consumer Key / Secret) não informadas',
          configured: false
        };
      }

      await this.getAccessToken(envKey, credentials);
      return {
        online: true,
        configured: true,
        latencyMs: Date.now() - startTime,
        environment: envKey,
        service: 'SERPRO API Gateway',
        statusText: 'Autenticação OAuth2 SERPRO ativa'
      };
    } catch (err) {
      return {
        online: false,
        configured: true,
        latencyMs: Date.now() - startTime,
        environment: envKey,
        service: 'SERPRO API Gateway',
        error: translateError(err, { step: 'Teste de Conexão SERPRO' })
      };
    }
  }
}

module.exports = new SerproService();
