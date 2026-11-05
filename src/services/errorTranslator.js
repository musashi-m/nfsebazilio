/**
 * Dicionário e Mecanismo de Tradução Amigável de Erros Fiscais e de Conexão
 * Converte códigos e jargões da RFB, SERPRO, ICP-Brasil e HTTP em orientações claras e práticas.
 */

const ERROR_DICTIONARY = [
  // --- PROCURAÇÃO E REPRESENTAÇÃO ---
  {
    regex: /(procura[cç][aã]o|n[aã]o autorizado a emitir por este cnpj|representa[cç][aã]o|outorgante|n[aã]o possui autoriza[cç][aã]o|E001|E101)/i,
    category: 'Procuração Eletrônica RFB',
    title: 'Procuração Eletrônica não Encontrada ou Sem Permissão',
    friendlyMessage: 'O certificado digital do procurador não tem permissão da Receita Federal para emitir notas fiscais em nome do CNPJ representado informado.',
    howToFix: [
      'Acesse o Portal e-CAC da Receita Federal com o certificado digital ou conta Gov.br (Ouro/Prata) da empresa representada (cliente).',
      'No menu, clique em "Procurações" > "Cadastrar Procuração".',
      'Insira o CPF ou CNPJ do procurador (o mesmo do certificado digital em uso).',
      'Marque a permissão do serviço "NFS-e - Padrão Nacional" (ou conceda "Todos os serviços").',
      'Assine a procuração no e-CAC e aguarde cerca de 15 minutos para a sincronização na base do ADN.'
    ],
    severity: 'error'
  },

  // --- CERTIFICADO DIGITAL ---
  {
    regex: /(bad record mac|decryption failed|0A000119|tls_get_more_records|handshake failure|0A000410|SSL alert number 40|SEC_E_ALGORITHM_MISMATCH)/i,
    category: 'Autenticação mTLS / Certificado',
    title: 'Falha na Autenticação Segura mTLS com a Receita Federal',
    friendlyMessage: 'O portal da Receita Federal (Ambiente de Dados Nacional - ADN) rejeitou a conexão segura mTLS porque o certificado digital A1 ativo está expirado, inválido ou não pertence a uma Autoridade Certificadora credenciada na ICP-Brasil.',
    howToFix: [
      'Acesse a aba "Certificado & Procuração" no menu superior.',
      'Verifique se o certificado A1 carregado está dentro do prazo de validade (não expirado).',
      'Faça o upload de um certificado digital A1 (.pfx) oficial emitido pela ICP-Brasil (ex: Serpro, Certisign, Valid, Soluti) com a sua respectiva senha.',
      'O Ambiente de Dados Nacional da Receita Federal em Produção exige obrigatoriamente um certificado ICP-Brasil válido com chave privada.'
    ],
    severity: 'error'
  },
  {
    regex: /(mac verify failure|pkcs#12|bad decrypt|password|senha incorreta)/i,
    category: 'Certificado Digital',
    title: 'Senha do Certificado Incorreta',
    friendlyMessage: 'A senha digitada para o arquivo de certificado (.pfx ou .p12) não confere.',
    howToFix: [
      'Verifique se a tecla Caps Lock está ativada.',
      'Digite com atenção a senha definida no momento da exportação do certificado A1.',
      'Caso tenha esquecido a senha, exporte novamente o certificado a partir do computador de origem ou consulte sua Autoridade Certificadora.'
    ],
    severity: 'error'
  },
  {
    regex: /(certificate has expired|certificado expirado|validade vencida|venceu em)/i,
    category: 'Certificado Digital',
    title: 'Certificado Digital A1 Vencido',
    friendlyMessage: 'O certificado digital utilizado já ultrapassou o período de validade.',
    howToFix: [
      'Renove o seu certificado digital A1 junto a uma Autoridade Certificadora ICP-Brasil (ex: Serpro, Certisign, Soluti, Safeweb, Valid).',
      'Importe o novo arquivo .pfx válido no painel de configurações do Emissor.'
    ],
    severity: 'error'
  },
  {
    regex: /(self signed|unable to get local issuer certificate|cadeia de certifica[cç][aã]o|revogado|crl)/i,
    category: 'Certificado Digital',
    title: 'Certificado Não Reconhecido pela ICP-Brasil',
    friendlyMessage: 'A cadeia de confiança do certificado não pôde ser validada pela Receita Federal ou o certificado foi revogado.',
    howToFix: [
      'Certifique-se de que o arquivo .pfx é um certificado ICP-Brasil oficial (e-CNPJ ou e-CPF).',
      'Verifique se o certificado contém a cadeia intermediária completa.',
      'Confirme se o certificado não foi cancelado ou substituído recentemente.'
    ],
    severity: 'error'
  },

  // --- INSCRIÇÃO MUNICIPAL (CNC NFS-e) ---
  {
    regex: /(E0120|IM do prestador n[aã]o deve ser informado)/i,
    category: 'Cadastro do Prestador (Prefeitura)',
    title: 'Inscrição Municipal Não Deve Ser Informada',
    friendlyMessage: 'O município emissor da empresa representada (Aracaju/SE) não permite a inclusão da tag IM no XML da DPS nacional.',
    howToFix: [
      'O sistema agora omite automaticamente a tag <IM> no XML da DPS para o município de Aracaju/SE.',
      'A nota fiscal nacional é processada e vinculada unicamente pelo CNPJ do prestador.'
    ],
    severity: 'info'
  },
  {
    regex: /(E0116|inscri[cç][aã]o municipal deve ser informada|A IM deve ser informada)/i,
    category: 'Cadastro do Prestador (Prefeitura)',
    title: 'Inscrição Municipal (IM) Obrigatória',
    friendlyMessage: 'O município emissor da empresa representada exige que o número da Inscrição Municipal (IM) seja informado na DPS.',
    howToFix: [
      'Preencha o campo "Inscrição Municipal (IM)" da empresa representada no formulário de emissão.',
      'O número da Inscrição Municipal consta no Alvará de Funcionamento ou no portal tributário da Prefeitura do município emissor.'
    ],
    severity: 'warning'
  },
  {
    regex: /(E0714|erro na assinatura|arquivo enviado com erro na assinatura)/i,
    category: 'Assinatura Digital ICP-Brasil',
    title: 'Assinatura Digital Recusada pelo Servidor',
    friendlyMessage: 'A Receita Federal (SEFIN Nacional) não conseguiu validar a integridade da assinatura digital do documento.',
    howToFix: [
      'Certifique-se de que o certificado digital A1 está válido e ativo.',
      'O sistema recalcula a assinatura com canonicalização W3C XMLDSig C14N automaticamente.'
    ],
    severity: 'error'
  },
  {
    regex: /(E0008|data de emiss[aã]o da dps n[aã]o pode ser posterior)/i,
    category: 'Data/Hora de Emissão da DPS',
    title: 'Data/Hora da DPS Divergente do Horário de Brasília',
    friendlyMessage: 'A data/hora de emissão da DPS não pode ser futura em relação ao relógio oficial da Receita Federal.',
    howToFix: [
      'O sistema sincroniza a data/hora com o fuso oficial de Brasília (UTC-3).',
      'Tente emitir novamente agora.'
    ],
    severity: 'warning'
  },

  // --- REGRAS DO SCHEMA XML / SEFIN NACIONAL ---
  {
    regex: /(E1235|E1229|falha no esquema xml|schema xml|incomplete content|list of possible elements expected)/i,
    category: 'Validação de Esquema XML da DPS',
    title: 'Inconsistência no Esquema XML da DPS',
    friendlyMessage: 'A estrutura do documento XML da DPS enviada não atende a uma das regras do schema oficial da Receita Federal (Sefin Nacional).',
    howToFix: [
      'Verifique os detalhes técnicos abaixo para identificar o campo ou tag ausente.',
      'Certifique-se de que todos os dados obrigatórios da DPS estejam preenchidos.'
    ],
    severity: 'warning'
  },

  // --- SERVIÇO, TRIBUTAÇÃO E REGRAS DE NEGÓCIO DA DPS ---
  {
    regex: /(cTribNac|c[oó]digo de tributa[cç][aã]o|tributa[cç][aã]o nacional|E025)/i,
    category: 'Dados do Serviço',
    title: 'Código de Tributação Nacional Inválido',
    friendlyMessage: 'O Código de Tributação Nacional informado não existe ou não é aceito para este município.',
    howToFix: [
      'Consulte a Tabela Nacional de Tributação da NFS-e (baseada na LC 116/2003).',
      'Utilize a busca inteligente de código no formulário de emissão deste sistema.',
      'Exemplo de código válido: 01.07.01.001 (Suporte técnico em informática).'
    ],
    severity: 'warning'
  },
  {
    regex: /(al[ií]quota|aliquota inv[aá]lida|al[ií]quota de iss|E010)/i,
    category: 'Tributação do ISS',
    title: 'Alíquota de ISS Fora dos Limites Legais',
    friendlyMessage: 'A alíquota de ISS informada deve estar entre 2,00% e 5,00% conforme a Constituição Federal (ou zerada se o regime for Simples Nacional sem retenção).',
    howToFix: [
      'Para empresas do Simples Nacional, informe a alíquota da faixa do Anexo III ou IV.',
      'Para Lucro Presumido/Real, consulte a alíquota municipal do serviço (mínimo de 2% e máximo de 5%).'
    ],
    severity: 'warning'
  },
  {
    regex: /(duplicidade|dps j[aá] enviada|dps em duplicidade|E002|chave existente)/i,
    category: 'Validação da DPS',
    title: 'Declaração de Serviço em Duplicidade',
    friendlyMessage: 'Uma DPS com o mesmo Número, Série e CNPJ já foi enviada e processada anteriormente pelo ADN.',
    howToFix: [
      'Acesse a aba "Histórico ADN" e verifique se a nota já foi autorizada.',
      'Para emitir uma nova nota fiscal, incremente o número da DPS no formulário.'
    ],
    severity: 'warning'
  },
  {
    regex: /(E0240|CEP.*n[aã]o pertence ao munic[ií]pio|CEP.*endere[cç]o.*tomador)/i,
    category: 'Endereço do Tomador (CEP / Município)',
    title: 'Divergência entre CEP e Município do Tomador',
    friendlyMessage: 'O CEP informado para o tomador não pertence ao município indicado na DPS (ou o código IBGE do município não corresponde à faixa de CEP).',
    howToFix: [
      'Confira o CEP do tomador do serviço.',
      'O sistema agora sincroniza e corrige automaticamente o código IBGE do município a partir do CEP informado.',
      'Ao alterar o CEP do tomador, utilize a busca de CEP (ícone de lupa) para atualizar o município e o código IBGE.'
    ],
    severity: 'error'
  },
  {
    regex: /(toma\.cnpj|toma\.cpf|cpf.*tomador.*inv[aá]lido|cnpj.*tomador.*inv[aá]lido|documento do tomador inv[aá]lido|E045)/i,
    category: 'Dados do Tomador',
    title: 'Documento do Tomador Inválido',
    friendlyMessage: 'O CPF ou CNPJ informado para o tomador (cliente) possui dígitos verificadores incorretos ou formatação inválida.',
    howToFix: [
      'Confira os números digitados para o CPF/CNPJ do tomador do serviço.',
      'Certifique-se de não haver espaços vazios ou caracteres extras.'
    ],
    severity: 'warning'
  },
  {
    regex: /(munic[ií]pio n[aã]o conveniado|cLocIncid|cMun|E104)/i,
    category: 'Município / Convênio ADN',
    title: 'Município de Incidência Não Vinculado ao Padrão Nacional',
    friendlyMessage: 'O município selecionado para a prestação do serviço ainda não está integrado ao Ambiente de Dados Nacional (ADN) para todos os regimes.',
    howToFix: [
      'Se o prestador for MEI, a emissão pelo padrão nacional é sempre obrigatória por lei.',
      'Para outros regimes, confirme se a prefeitura local já aderiu ao convênio nacional ou se a emissão deve ser mantida no portal municipal.'
    ],
    severity: 'info'
  },

  // --- CONEXÃO, REDE, RFB E SERPRO ---
  {
    regex: /(ETIMEDOUT|timeout|timed out|tempo limite esgotado)/i,
    category: 'Conexão e Servidores',
    title: 'Tempo Limite de Resposta Esgotado',
    friendlyMessage: 'Os servidores da Receita Federal (ADN) ou do SERPRO demoraram para responder à solicitação.',
    howToFix: [
      'Aguarde cerca de 30 segundos e tente novamente (o sistema tentará a conexão redundante automaticamente).',
      'Verifique se a sua conexão com a internet está estável.',
      'O portal nacional da NFS-e pode estar passando por oscilação momentânea de carga.'
    ],
    severity: 'error'
  },
  {
    regex: /(ECONNREFUSED|ENOTFOUND|EHOSTUNREACH)/i,
    category: 'Conectividade de Rede',
    title: 'Falha de Conexão com o Servidor',
    friendlyMessage: 'Não foi possível estabelecer contato com o endereço do servidor da Receita Federal ou SERPRO.',
    howToFix: [
      'Verifique se há bloqueios de firewall corporativo ou proxy na porta 443.',
      'No ambiente de "Teste", certifique-se de que o simulador interno está em execução.',
      'Verifique o status da sua conexão de internet.'
    ],
    severity: 'error'
  },
  {
    regex: /(unauthorized|401|token inv[aá]lido|credenciais serpro|consumer key)/i,
    category: 'Autenticação SERPRO',
    title: 'Falha de Autenticação no Gateway SERPRO',
    friendlyMessage: 'As credenciais de API do SERPRO (Consumer Key ou Consumer Secret) estão incorretas ou o token expirou.',
    howToFix: [
      'Acesse as configurações do sistema e valide suas chaves cadastradas no Serpro Desenvolvedores.',
      'Ou utilize a opção de "Conexão Direta RFB com Certificado Digital", que dispensa o gateway SERPRO.'
    ],
    severity: 'warning'
  },
  {
    regex: /(403|forbidden|acesso negado|n[aã]o autorizado|permiss[aã]o negada)/i,
    category: 'Autorização / Procuração RFB',
    title: 'Acesso Não Autorizado pelo Servidor (HTTP 403)',
    friendlyMessage: 'A Receita Federal (SEFIN Nacional) recusou o envio da DPS para esta empresa representada com o certificado digital atual.',
    howToFix: [
      'Verifique se a empresa representada outorgou Procuração Eletrônica ativa no e-CAC da Receita Federal para o CNPJ do certificado contábil.',
      'Confirme se a procuração inclui o serviço específico "NFS-e - Nota Fiscal de Serviço Eletrônica" ou "Todos os serviços".',
      'Caso a procuração seja recente, o sistema da Receita Federal pode levar até 2 horas para propagar a autorização nos servidores de emissão da SEFIN.'
    ],
    severity: 'error'
  },
  {
    regex: /(500|502|503|504|internal server error|bad gateway|service unavailable)/i,
    category: 'Servidores da RFB / SERPRO',
    title: 'Instabilidade Temporária no Portal Nacional',
    friendlyMessage: 'O Ambiente de Dados Nacional (ADN da Receita Federal) retornou uma falha temporária interna.',
    howToFix: [
      'Esta é uma instabilidade no lado da Receita Federal/SERPRO.',
      'O sistema tentará a reconexão automática.',
      'Geralmente o serviço normaliza em poucos minutos.'
    ],
    severity: 'error'
  }
];

/**
 * Traduz qualquer erro (objeto Error, string de rejeição, payload de erro da RFB/SERPRO)
 * em uma estrutura amigável, clara e didática para o usuário.
 */
function translateError(err, context = {}) {
  let rawMessage = '';
  let rawCode = '';
  let technicalDetail = '';

  if (typeof err === 'string') {
    rawMessage = err;
    technicalDetail = err;
  } else if (err && typeof err === 'object') {
    rawMessage = err.message || err.desc || err.erro || err.mensagem || JSON.stringify(err);
    rawCode = err.code || err.codigo || (err.response && err.response.status) || '';
    technicalDetail = err.stack || (err.response && JSON.stringify(err.response.data)) || rawMessage;
  }

  // Tenta encontrar correspondência no dicionário
  const fullTextToInspect = `${rawCode} ${rawMessage} ${technicalDetail}`;
  const matched = ERROR_DICTIONARY.find(entry => entry.regex.test(fullTextToInspect));

  if (matched) {
    return {
      success: false,
      title: matched.title,
      category: matched.category,
      message: matched.friendlyMessage,
      howToFix: matched.howToFix,
      severity: matched.severity,
      rawCode: rawCode || 'RFB_ADN_ERR',
      technicalDetail: technicalDetail.substring(0, 1000),
      context
    };
  }

  // Fallback padrão amigável se não for um erro mapeado especificamente
  return {
    success: false,
    title: context.title || 'Aviso de Processamento Fiscal',
    category: context.category || 'Processamento ADN',
    message: cleanRawMessage(rawMessage) || 'Não foi possível concluir a operação junto ao Ambiente de Dados Nacional neste momento.',
    howToFix: context.howToFix || [
      'Revise os dados informados no formulário de emissão.',
      'Verifique se a empresa representada possui o CNPJ ativo e regular na Receita Federal.',
      'Consulte os detalhes técnicos abaixo se precisar de auxílio de suporte contábil/TI.'
    ],
    severity: 'warning',
    rawCode: rawCode || 'GENERIC_NOTICE',
    technicalDetail: technicalDetail.substring(0, 1000),
    context
  };
}

/**
 * Remove jargões crípticos de mensagens brutas
 */
function cleanRawMessage(msg) {
  if (!msg) return '';
  return msg
    .replace(/^Error:\s*/i, '')
    .replace(/\[\w+\]\s*/g, '')
    .replace(/\{.*\}/g, '')
    .trim();
}

module.exports = {
  translateError,
  ERROR_DICTIONARY
};

