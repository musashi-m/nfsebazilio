/**
 * Tabela Oficial da Nomenclatura Brasileira de Serviços (NBS)
 * Baseada no Decreto Federal nº 7.708/2012 e Padrão Nacional NFS-e (CGNFS-e / ADN)
 */

const ITENS_NBS = [
  // ========================================================
  // GRUPO 1.11: SERVIÇOS IMOBILIÁRIOS E CORRETAGEM
  // ========================================================
  {
    codigo: '1.1103.21.00',
    cNBS: '111032100',
    descricao: 'Serviços de corretagem e intermediação na compra e venda de bens imóveis',
    categoria: 'Serviços Imobiliários'
  },
  {
    codigo: '1.1103.22.00',
    cNBS: '111032200',
    descricao: 'Serviços de corretagem e intermediação no aluguel e arrendamento de bens imóveis',
    categoria: 'Serviços Imobiliários'
  },
  {
    codigo: '1.1103.10.00',
    cNBS: '111031000',
    descricao: 'Serviços de administração de bens imóveis por conta de terceiros',
    categoria: 'Serviços Imobiliários'
  },
  {
    codigo: '1.1103.90.00',
    cNBS: '111039000',
    descricao: 'Outros serviços imobiliários prestados sob contrato ou por comissão',
    categoria: 'Serviços Imobiliários'
  },
  {
    codigo: '1.1101.11.00',
    cNBS: '111011100',
    descricao: 'Serviços de compra e venda de bens imóveis residenciais próprios ou arrendados',
    categoria: 'Serviços Imobiliários'
  },
  {
    codigo: '1.1101.12.00',
    cNBS: '111011200',
    descricao: 'Serviços de compra e venda de bens imóveis não residenciais próprios ou arrendados',
    categoria: 'Serviços Imobiliários'
  },
  {
    codigo: '1.1102.11.00',
    cNBS: '111021100',
    descricao: 'Serviços de aluguel e arrendamento de bens imóveis residenciais próprios ou arrendados',
    categoria: 'Serviços Imobiliários'
  },
  {
    codigo: '1.1102.12.00',
    cNBS: '111021200',
    descricao: 'Serviços de aluguel e arrendamento de bens imóveis não residenciais próprios ou arrendados',
    categoria: 'Serviços Imobiliários'
  },
  {
    codigo: '1.1103.30.00',
    cNBS: '111033000',
    descricao: 'Serviços de avaliação imobiliária e peritagem de bens imóveis',
    categoria: 'Serviços Imobiliários'
  },

  // ========================================================
  // GRUPO 1.14: SERVIÇOS PROFISSIONAIS, CONTÁBEIS, JURÍDICOS E DE GESTÃO
  // ========================================================
  {
    codigo: '1.1402.10.00',
    cNBS: '114021000',
    descricao: 'Serviços de contabilidade, escrituração contábil e fiscal',
    categoria: 'Contabilidade e Auditoria'
  },
  {
    codigo: '1.1402.20.00',
    cNBS: '114022000',
    descricao: 'Serviços de auditoria contábil, financeira e fiscal',
    categoria: 'Contabilidade e Auditoria'
  },
  {
    codigo: '1.1402.30.00',
    cNBS: '114023000',
    descricao: 'Serviços de planejamento, consultoria tributária e conformidade fiscal',
    categoria: 'Contabilidade e Auditoria'
  },
  {
    codigo: '1.1402.90.00',
    cNBS: '114029000',
    descricao: 'Outros serviços contábeis, de folha de pagamento e perícia contábil',
    categoria: 'Contabilidade e Auditoria'
  },
  {
    codigo: '1.1401.10.00',
    cNBS: '114011000',
    descricao: 'Serviços jurídicos e de representação processual e advocacia',
    categoria: 'Serviços Jurídicos'
  },
  {
    codigo: '1.1401.20.00',
    cNBS: '114012000',
    descricao: 'Serviços de consultoria jurídica, assessoria legal e elaboração de pareceres',
    categoria: 'Serviços Jurídicos'
  },
  {
    codigo: '1.1401.30.00',
    cNBS: '114013000',
    descricao: 'Serviços de cartórios, notariais, tabelionatos e registros públicos',
    categoria: 'Serviços Jurídicos'
  },
  {
    codigo: '1.1403.10.00',
    cNBS: '114031000',
    descricao: 'Serviços de consultoria em gestão empresarial, estratégia e finanças corporativas',
    categoria: 'Consultoria Empresarial'
  },
  {
    codigo: '1.1403.20.00',
    cNBS: '114032000',
    descricao: 'Serviços de relações públicas, assessoria de imprensa e comunicação corporativa',
    categoria: 'Consultoria Empresarial'
  },
  {
    codigo: '1.1403.90.00',
    cNBS: '114039000',
    descricao: 'Outros serviços de consultoria em gestão e processos operacionais',
    categoria: 'Consultoria Empresarial'
  },
  {
    codigo: '1.1406.33.00',
    cNBS: '114063300',
    descricao: 'Serviços de representação comercial e intermediação mercantil em geral',
    categoria: 'Representação e Vendas'
  },

  // ========================================================
  // GRUPO 1.15: SERVIÇOS DE TECNOLOGIA DA INFORMAÇÃO (TI)
  // ========================================================
  {
    codigo: '1.1501.10.00',
    cNBS: '115011000',
    descricao: 'Serviços de licenciamento e cessão de direito de uso de software',
    categoria: 'Tecnologia da Informação'
  },
  {
    codigo: '1.1501.20.00',
    cNBS: '115012000',
    descricao: 'Serviços de desenvolvimento, programação e adaptação de software sob encomenda',
    categoria: 'Tecnologia da Informação'
  },
  {
    codigo: '1.1501.30.00',
    cNBS: '115013000',
    descricao: 'Serviços de desenvolvimento e programação de software não customizável / aplicativos móveis',
    categoria: 'Tecnologia da Informação'
  },
  {
    codigo: '1.1502.10.00',
    cNBS: '115021000',
    descricao: 'Serviços de suporte técnico, manutenção e pós-venda em software e TI',
    categoria: 'Tecnologia da Informação'
  },
  {
    codigo: '1.1502.20.00',
    cNBS: '115022000',
    descricao: 'Serviços de suporte técnico e manutenção de infraestrutura de TI, redes e servidores',
    categoria: 'Tecnologia da Informação'
  },
  {
    codigo: '1.1503.10.00',
    cNBS: '115031000',
    descricao: 'Serviços de hospedagem de servidores, hosting, datacenters e computação em nuvem (cloud)',
    categoria: 'Tecnologia da Informação'
  },
  {
    codigo: '1.1503.20.00',
    cNBS: '115032000',
    descricao: 'Serviços de processamento de dados, provedores de aplicação e serviços de hospedagem na internet',
    categoria: 'Tecnologia da Informação'
  },
  {
    codigo: '1.1504.10.00',
    cNBS: '115041000',
    descricao: 'Serviços de consultoria em tecnologia da informação e segurança cibernética',
    categoria: 'Tecnologia da Informação'
  },
  {
    codigo: '1.1509.00.00',
    cNBS: '115090000',
    descricao: 'Outros serviços de tecnologia da informação e telecomunicações correlatos',
    categoria: 'Tecnologia da Informação'
  },

  // ========================================================
  // GRUPO 1.09: SERVIÇOS DE CONSTRUÇÃO CIVIL E ENGENHARIA
  // ========================================================
  {
    codigo: '1.0906.11.00',
    cNBS: '109061100',
    descricao: 'Serviços de construção de edifícios residenciais e habitacionais',
    categoria: 'Construção Civil'
  },
  {
    codigo: '1.0906.12.00',
    cNBS: '109061200',
    descricao: 'Serviços de construção de edifícios comerciais, industriais e institucionais',
    categoria: 'Construção Civil'
  },
  {
    codigo: '1.0907.10.00',
    cNBS: '109071000',
    descricao: 'Serviços de reformas, ampliações e restaurações em edifícios',
    categoria: 'Construção Civil'
  },
  {
    codigo: '1.0908.10.00',
    cNBS: '109081000',
    descricao: 'Serviços de demolição, desmantelamento de edifícios e preparação de canteiros',
    categoria: 'Construção Civil'
  },
  {
    codigo: '1.0909.10.00',
    cNBS: '109091000',
    descricao: 'Serviços de instalações elétricas, cabeamento e iluminação em edificações',
    categoria: 'Construção Civil'
  },
  {
    codigo: '1.0909.20.00',
    cNBS: '109092000',
    descricao: 'Serviços de instalações hidráulicas, sanitárias, de gás e climatização',
    categoria: 'Construção Civil'
  },
  {
    codigo: '1.0910.10.00',
    cNBS: '109101000',
    descricao: 'Serviços de acabamento, pintura predial, revestimento de pisos e paredes',
    categoria: 'Construção Civil'
  },
  {
    codigo: '1.0910.20.00',
    cNBS: '109102000',
    descricao: 'Serviços de colocação de esquadrias, vidros e montagem de drywall',
    categoria: 'Construção Civil'
  },
  {
    codigo: '1.1302.10.00',
    cNBS: '113021000',
    descricao: 'Serviços de arquitetura, urbanismo e projetos arquitetônicos',
    categoria: 'Arquitetura e Engenharia'
  },
  {
    codigo: '1.1302.20.00',
    cNBS: '113022000',
    descricao: 'Serviços de engenharia consultiva, projetos estruturais e complementares',
    categoria: 'Arquitetura e Engenharia'
  },
  {
    codigo: '1.1302.21.00',
    cNBS: '113022100',
    descricao: 'Serviços de gerenciamento, acompanhamento técnico e fiscalização de obras de engenharia',
    categoria: 'Arquitetura e Engenharia'
  },
  {
    codigo: '1.1302.30.00',
    cNBS: '113023000',
    descricao: 'Serviços de topografia, agrimensura, cartografia e georreferenciamento',
    categoria: 'Arquitetura e Engenharia'
  },

  // ========================================================
  // GRUPO 1.22: SERVIÇOS DE SAÚDE, MEDICINA E ODONTOLOGIA
  // ========================================================
  {
    codigo: '1.2201.10.00',
    cNBS: '122011000',
    descricao: 'Serviços médicos ambulatoriais, consultas clínicas e atendimentos preventivos',
    categoria: 'Saúde e Medicina'
  },
  {
    codigo: '1.2201.20.00',
    cNBS: '122012000',
    descricao: 'Serviços médicos especializados e procedimentos cirúrgicos ambulatoriais',
    categoria: 'Saúde e Medicina'
  },
  {
    codigo: '1.2202.10.00',
    cNBS: '122021000',
    descricao: 'Serviços odontológicos gerais, consultas, próteses e procedimentos dentários',
    categoria: 'Saúde e Medicina'
  },
  {
    codigo: '1.2203.10.00',
    cNBS: '122031000',
    descricao: 'Serviços de fisioterapia, fonoaudiologia, terapia ocupacional e reabilitação',
    categoria: 'Saúde e Medicina'
  },
  {
    codigo: '1.2204.10.00',
    cNBS: '122041000',
    descricao: 'Serviços de enfermagem, curativos e atendimento médico domiciliar (home care)',
    categoria: 'Saúde e Medicina'
  },
  {
    codigo: '1.2205.10.00',
    cNBS: '122051000',
    descricao: 'Serviços de diagnóstico por imagem (raio-X, tomografia, ressonância, ultrassom)',
    categoria: 'Saúde e Medicina'
  },
  {
    codigo: '1.2205.14.00',
    cNBS: '122051400',
    descricao: 'Serviços de patologia clínica, análises clínicas e exames laboratoriais',
    categoria: 'Saúde e Medicina'
  },
  {
    codigo: '1.2206.10.00',
    cNBS: '122061000',
    descricao: 'Serviços hospitalares, internações e centros de terapia intensiva',
    categoria: 'Saúde e Medicina'
  },
  {
    codigo: '1.2207.10.00',
    cNBS: '122071000',
    descricao: 'Serviços de psicologia, psicanálise e psicoterapia',
    categoria: 'Saúde e Medicina'
  },

  // ========================================================
  // GRUPO 1.14.04: SERVIÇOS DE PUBLICIDADE, MARKETING E MÍDIA
  // ========================================================
  {
    codigo: '1.1404.10.00',
    cNBS: '114041000',
    descricao: 'Serviços de agências de publicidade, planejamento de campanhas e criação visual',
    categoria: 'Publicidade e Marketing'
  },
  {
    codigo: '1.1404.20.00',
    cNBS: '114042000',
    descricao: 'Serviços de veiculação e exibição de material publicitário em mídias diversas',
    categoria: 'Publicidade e Marketing'
  },
  {
    codigo: '1.1404.30.00',
    cNBS: '114043000',
    descricao: 'Serviços de marketing digital, gestão de mídias sociais, SEO e tráfego pago',
    categoria: 'Publicidade e Marketing'
  },
  {
    codigo: '1.1405.10.00',
    cNBS: '114051000',
    descricao: 'Serviços de pesquisa de mercado, análise de dados de consumo e opinião pública',
    categoria: 'Publicidade e Marketing'
  },
  {
    codigo: '1.1408.10.00',
    cNBS: '114081000',
    descricao: 'Serviços de design gráfico, desenho industrial e programação visual',
    categoria: 'Design e Criação'
  },
  {
    codigo: '1.1407.10.00',
    cNBS: '114071000',
    descricao: 'Serviços fotográficos profissionais, filmagens e produção de vídeos publicitários',
    categoria: 'Design e Criação'
  },

  // ========================================================
  // GRUPO 1.16: SERVIÇOS ADMINISTRATIVOS, APOIO, LIMPEZA E SEGURANÇA
  // ========================================================
  {
    codigo: '1.1601.10.00',
    cNBS: '116011000',
    descricao: 'Serviços de limpeza e conservação predial, comercial e industrial',
    categoria: 'Limpeza e Apoio Predial'
  },
  {
    codigo: '1.1601.20.00',
    cNBS: '116012000',
    descricao: 'Serviços de desinfecção, desratização, dedetização e controle de pragas urbanas',
    categoria: 'Limpeza e Apoio Predial'
  },
  {
    codigo: '1.1602.10.00',
    cNBS: '116021000',
    descricao: 'Serviços de vigilância patrimonial, portaria física e controle de acesso',
    categoria: 'Segurança e Vigilância'
  },
  {
    codigo: '1.1602.20.00',
    cNBS: '116022000',
    descricao: 'Serviços de monitoramento remoto de sistemas eletrônicos de segurança e alarmes',
    categoria: 'Segurança e Vigilância'
  },
  {
    codigo: '1.1603.10.00',
    cNBS: '116031000',
    descricao: 'Serviços de apoio operacional a edifícios, zeladoria e pequenos reparos integrados',
    categoria: 'Limpeza e Apoio Predial'
  },
  {
    codigo: '1.1604.10.00',
    cNBS: '116041000',
    descricao: 'Serviços de secretariado, atendimento telefônico e apoio administrativo a escritórios',
    categoria: 'Apoio Administrativo'
  },
  {
    codigo: '1.1605.10.00',
    cNBS: '116051000',
    descricao: 'Serviços de recrutamento, seleção e fornecimento de recursos humanos temporários',
    categoria: 'Recursos Humanos'
  },
  {
    codigo: '1.1606.10.00',
    cNBS: '116061000',
    descricao: 'Serviços de organização e produção de eventos, feiras, congressos e exposições',
    categoria: 'Eventos e Congressos'
  },

  // ========================================================
  // GRUPO 1.17: SERVIÇOS DE EDUCAÇÃO, ENSINO E TREINAMENTO
  // ========================================================
  {
    codigo: '1.1701.10.00',
    cNBS: '117011000',
    descricao: 'Serviços de educação infantil, creches e pré-escolas',
    categoria: 'Educação e Treinamento'
  },
  {
    codigo: '1.1701.20.00',
    cNBS: '117012000',
    descricao: 'Serviços de ensino fundamental regular',
    categoria: 'Educação e Treinamento'
  },
  {
    codigo: '1.1701.30.00',
    cNBS: '117013000',
    descricao: 'Serviços de ensino médio geral e técnico integrado',
    categoria: 'Educação e Treinamento'
  },
  {
    codigo: '1.1702.10.00',
    cNBS: '117021000',
    descricao: 'Serviços de ensino superior, graduação, pós-graduação e mestrado/doutorado',
    categoria: 'Educação e Treinamento'
  },
  {
    codigo: '1.1703.10.00',
    cNBS: '117031000',
    descricao: 'Serviços de formação profissional, cursos livres de idiomas, informática e desenvolvimento pessoal',
    categoria: 'Educação e Treinamento'
  },
  {
    codigo: '1.1703.20.00',
    cNBS: '117032000',
    descricao: 'Serviços de treinamento de funcionários e capacitação gerencial para empresas',
    categoria: 'Educação e Treinamento'
  },

  // ========================================================
  // GRUPO 1.03 E 1.04: TRANSPORTE, LOGÍSTICA E CORREIOS
  // ========================================================
  {
    codigo: '1.0301.10.00',
    cNBS: '103011000',
    descricao: 'Serviços de transporte rodoviário de cargas municipal (carretos, mudanças, distribuição)',
    categoria: 'Transporte e Logística'
  },
  {
    codigo: '1.0302.10.00',
    cNBS: '103021000',
    descricao: 'Serviços de transporte rodoviário coletivo de passageiros (fretamento, turismo e excursões)',
    categoria: 'Transporte e Logística'
  },
  {
    codigo: '1.0303.10.00',
    cNBS: '103031000',
    descricao: 'Serviços de transporte individual de passageiros (táxi, carros executivos e veículos com condutor)',
    categoria: 'Transporte e Logística'
  },
  {
    codigo: '1.0401.10.00',
    cNBS: '104011000',
    descricao: 'Serviços de entrega rápida urbana, motoboys e entregas fracionadas locais',
    categoria: 'Transporte e Logística'
  },
  {
    codigo: '1.0402.10.00',
    cNBS: '104021000',
    descricao: 'Serviços de armazenagem geral, guarda-móveis e depósito de mercadorias de terceiros',
    categoria: 'Transporte e Logística'
  },
  {
    codigo: '1.0403.10.00',
    cNBS: '104031000',
    descricao: 'Serviços de carga, descarga, estivagem e movimentação interna de mercadorias',
    categoria: 'Transporte e Logística'
  },

  // ========================================================
  // GRUPO 1.19: SERVIÇOS DE MANUTENÇÃO, REPARAÇÃO E INSTALAÇÃO
  // ========================================================
  {
    codigo: '1.1901.10.00',
    cNBS: '119011000',
    descricao: 'Serviços de manutenção e reparação mecânica, elétrica e eletrônica de veículos automotores',
    categoria: 'Manutenção e Reparação'
  },
  {
    codigo: '1.1901.20.00',
    cNBS: '119012000',
    descricao: 'Serviços de funilaria, pintura, polimento e lavagem de veículos automotores',
    categoria: 'Manutenção e Reparação'
  },
  {
    codigo: '1.1902.10.00',
    cNBS: '119021000',
    descricao: 'Serviços de manutenção e reparação de computadores, notebooks, impressoras e periféricos',
    categoria: 'Manutenção e Reparação'
  },
  {
    codigo: '1.1903.10.00',
    cNBS: '119031000',
    descricao: 'Serviços de manutenção e reparação de aparelhos eletrodomésticos e eletrônicos de consumo',
    categoria: 'Manutenção e Reparação'
  },
  {
    codigo: '1.1904.10.00',
    cNBS: '119041000',
    descricao: 'Serviços de manutenção e reparação de máquinas, motores e equipamentos industriais',
    categoria: 'Manutenção e Reparação'
  },
  {
    codigo: '1.1905.10.00',
    cNBS: '119051000',
    descricao: 'Serviços de instalação de máquinas e equipamentos industriais e comerciais',
    categoria: 'Manutenção e Reparação'
  },

  // ========================================================
  // GRUPO 1.02: ALOJAMENTO, ALIMENTAÇÃO E BEBIDAS
  // ========================================================
  {
    codigo: '1.0201.10.00',
    cNBS: '102011000',
    descricao: 'Serviços de hospedagem em hotéis, pousadas, apart-hotéis e motéis',
    categoria: 'Alojamento e Alimentação'
  },
  {
    codigo: '1.0202.10.00',
    cNBS: '102021000',
    descricao: 'Serviços de alimentação e fornecimento de refeições em restaurantes, lanchonetes e buffets',
    categoria: 'Alojamento e Alimentação'
  },
  {
    codigo: '1.0202.20.00',
    cNBS: '102022000',
    descricao: 'Serviços de catering, bufê para festas, eventos e fornecimento de comida preparada sob encomenda',
    categoria: 'Alojamento e Alimentação'
  },

  // ========================================================
  // GRUPO 1.08: LOCAÇÃO DE BENS MÓVEIS
  // ========================================================
  {
    codigo: '1.0801.10.00',
    cNBS: '108011000',
    descricao: 'Serviços de locação de veículos automotores sem condutor (rent a car)',
    categoria: 'Locação de Bens Móveis'
  },
  {
    codigo: '1.0802.10.00',
    cNBS: '108021000',
    descricao: 'Serviços de locação de máquinas, andaimes e equipamentos para construção civil sem operador',
    categoria: 'Locação de Bens Móveis'
  },
  {
    codigo: '1.0803.10.00',
    cNBS: '108031000',
    descricao: 'Serviços de locação de equipamentos de áudio, iluminação, palcos e estruturas para eventos',
    categoria: 'Locação de Bens Móveis'
  },
  {
    codigo: '1.0809.00.00',
    cNBS: '108090000',
    descricao: 'Serviços de locação de outros bens móveis, objetos pessoais e aparelhos sem operador',
    categoria: 'Locação de Bens Móveis'
  },

  // ========================================================
  // GRUPO 1.06: SERVIÇOS FINANCEIROS E SEGUROS
  // ========================================================
  {
    codigo: '1.0601.10.00',
    cNBS: '106011000',
    descricao: 'Serviços de intermediação e corretagem de seguros, previdência e títulos de capitalização',
    categoria: 'Serviços Financeiros'
  },
  {
    codigo: '1.0602.10.00',
    cNBS: '106021000',
    descricao: 'Serviços de fomento mercantil (factoring), securitização e antecipação de recebíveis',
    categoria: 'Serviços Financeiros'
  },
  {
    codigo: '1.0603.10.00',
    cNBS: '106031000',
    descricao: 'Serviços de administração de cartões de crédito, carteiras digitais e meios de pagamento eletrônico',
    categoria: 'Serviços Financeiros'
  },

  // ========================================================
  // DEMAIS SERVIÇOS E GENÉRICOS
  // ========================================================
  {
    codigo: '1.2301.98.00',
    cNBS: '123019800',
    descricao: 'Serviços de embelezamento, cabeleireiros, barbearias, estética e cuidados pessoais',
    categoria: 'Serviços Pessoais'
  },
  {
    codigo: '1.2401.10.00',
    cNBS: '124011000',
    descricao: 'Serviços funerários, velórios, cremação e sepultamento',
    categoria: 'Serviços Pessoais'
  },
  {
    codigo: '1.2501.10.00',
    cNBS: '125011000',
    descricao: 'Serviços veterinários, clínicas para animais de estimação e vacinação',
    categoria: 'Veterinária'
  },
  {
    codigo: '9.9999.99.99',
    cNBS: '999999999',
    descricao: 'Outros serviços não classificados ou especificados anteriormente',
    categoria: 'Diversos / Outros'
  }
];

module.exports = {
  ITENS_NBS
};

