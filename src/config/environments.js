/**
 * Configuração dos 3 Ambientes Oficiais do Emissor Nacional NFS-e / ADN
 * - Teste (Ambiente de Testes / Sandbox Oficial da RFB e SERPRO)
 * - Homologação (Produção Restrita Oficial RFB / SERPRO)
 * - Produção (Ambiente Oficial Nacional RFB / SERPRO)
 */

module.exports = {
  ENVIRONMENTS: {
    TESTE: {
      id: 'TESTE',
      name: 'Ambiente de Teste (Sandbox Oficial RFB / SERPRO)',
      description: 'Ambiente oficial para testes de integração e validação de regras fiscais sem valor fiscal.',
      badgeColor: 'bg-emerald-600',
      tagText: 'TESTE (SANDBOX OFICIAL)',
      rfbSefinBaseUrl: 'https://sefin.producaorestrita.nfse.gov.br/SefinNacional',
      rfbAdnBaseUrl: 'https://adn.producaorestrita.nfse.gov.br/contribuintes',
      serproAuthUrl: 'https://gateway.apihml.serpro.gov.br/token',
      serproApiBaseUrl: 'https://gateway.apihml.serpro.gov.br/nfse',
      tpAmb: 2, // 2 = Homologação / Teste CGNFS-e
      timeoutMs: 30000,
      requiresRealCert: true
    },
    HOMOLOGACAO: {
      id: 'HOMOLOGACAO',
      name: 'Homologação (Produção Restrita Oficial RFB)',
      description: 'Ambiente oficial de Produção Restrita da Receita Federal e SEFIN/SERPRO.',
      badgeColor: 'bg-amber-500',
      tagText: 'HOMOLOGAÇÃO (PROD. RESTRITA)',
      rfbSefinBaseUrl: 'https://sefin.producaorestrita.nfse.gov.br/SefinNacional',
      rfbAdnBaseUrl: 'https://adn.producaorestrita.nfse.gov.br/contribuintes',
      serproAuthUrl: 'https://gateway.apihml.serpro.gov.br/token',
      serproApiBaseUrl: 'https://gateway.apihml.serpro.gov.br/nfse',
      tpAmb: 2,
      timeoutMs: 30000,
      requiresRealCert: true
    },
    PRODUCAO: {
      id: 'PRODUCAO',
      name: 'Produção Oficial Nacional (Receita Federal / SERPRO)',
      description: 'Ambiente oficial nacional. Todas as notas fiscais emitidas possuem validade jurídica e fiscal plena.',
      badgeColor: 'bg-rose-600',
      tagText: 'PRODUÇÃO NACIONAL',
      rfbSefinBaseUrl: 'https://sefin.nfse.gov.br/SefinNacional',
      rfbAdnBaseUrl: 'https://adn.nfse.gov.br/contribuintes',
      serproAuthUrl: 'https://gateway.serpro.gov.br/token',
      serproApiBaseUrl: 'https://gateway.serpro.gov.br/nfse',
      tpAmb: 1, // 1 = Produção Nacional
      timeoutMs: 35000,
      requiresRealCert: true
    }
  },

  DEFAULT_ENVIRONMENT: 'HOMOLOGACAO',

  // Configurações de conexão direta e redundância com RFB e SERPRO
  CONNECTION_SETTINGS: {
    preferDirectRfb: true, // Conexão direta mTLS com RFB ADN prioritária
    fallbackToSerpro: true, // Fallback automático para SERPRO caso RFB apresente instabilidade
    retryAttempts: 2,
    retryDelayMs: 2000
  }
};
