/**
 * Tabelas e Auxiliares Fiscais da NFS-e Padrão Nacional (CGNFS-e / RFB / ADN)
 * - Tabela Completa de Códigos de Tributação Nacional (cTribNac / LC 116/2003)
 * - Exigibilidade do ISS / Natureza da Operação
 * - Regimes Tributários e Regimes Especiais
 * - Opções do Simples Nacional
 * - Tipos de Retenção e Municípios IBGE
 */

const CODIGOS_TRIBUTACAO_NACIONAL = [
  // ========================================================
  // GRUPO 01: Serviços de Informática e Congêneres
  // ========================================================
  {
    codigo: '01.01.01.000',
    cTribNac: '010101',
    itemLc116: '01.01',
    descricao: 'Análise e desenvolvimento de sistemas de computação, softwares e aplicativos',
    aliquotaReferencia: 2.5
  },
  {
    codigo: '01.02.01.000',
    cTribNac: '010201',
    itemLc116: '01.02',
    descricao: 'Programação de computadores e desenvolvimento de páginas web',
    aliquotaReferencia: 2.5
  },
  {
    codigo: '01.03.01.000',
    cTribNac: '010301',
    itemLc116: '01.03',
    descricao: 'Processamento, armazenamento ou hospedagem de dados, textos, imagens, vídeos, páginas e aplicativos',
    aliquotaReferencia: 2.0
  },
  {
    codigo: '01.04.01.000',
    cTribNac: '010401',
    itemLc116: '01.04',
    descricao: 'Elaboração de programas de computadores, inclusive de jogos eletrônicos',
    aliquotaReferencia: 2.5
  },
  {
    codigo: '01.05.01.000',
    cTribNac: '010501',
    itemLc116: '01.05',
    descricao: 'Licenciamento ou cessão de direito de uso de programas de computação (software e SaaS)',
    aliquotaReferencia: 2.0
  },
  {
    codigo: '01.06.01.000',
    cTribNac: '010601',
    itemLc116: '01.06',
    descricao: 'Assessoria e consultoria em informática e tecnologia da informação',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '01.07.01.000',
    cTribNac: '010701',
    itemLc116: '01.07',
    descricao: 'Suporte técnico em informática, manutenção de software, hardware e bancos de dados',
    aliquotaReferencia: 2.5
  },
  {
    codigo: '01.08.01.000',
    cTribNac: '010801',
    itemLc116: '01.08',
    descricao: 'Planejamento, confecção, manutenção e atualização de páginas eletrônicas (websites)',
    aliquotaReferencia: 2.5
  },
  {
    codigo: '01.09.01.000',
    cTribNac: '010901',
    itemLc116: '01.09',
    descricao: 'Disponibilização, sem cessão definitiva, de conteúdos de áudio, vídeo, imagem e texto por meio da internet (streaming)',
    aliquotaReferencia: 2.0
  },

  // ========================================================
  // GRUPO 02: Serviços de Pesquisas e Desenvolvimento
  // ========================================================
  {
    codigo: '02.01.01.000',
    cTribNac: '020101',
    itemLc116: '02.01',
    descricao: 'Serviços de pesquisas e desenvolvimento de qualquer natureza (P&D científico e tecnológico)',
    aliquotaReferencia: 2.5
  },

  // ========================================================
  // GRUPO 03: Serviços Prestados Mediante Locação e Cessão de Uso
  // ========================================================
  {
    codigo: '03.02.01.000',
    cTribNac: '030201',
    itemLc116: '03.02',
    descricao: 'Cessão de direito de uso ou passagem em ferrovia, rodovia, postes, cabos, dutos e condutos',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '03.03.01.000',
    cTribNac: '030301',
    itemLc116: '03.03',
    descricao: 'Exploração de salões de festas, centros de convenções, escritórios virtuais, stands e quadras',
    aliquotaReferencia: 5.0
  },
  {
    codigo: '03.04.01.000',
    cTribNac: '030401',
    itemLc116: '03.04',
    descricao: 'Locação, sublocação, arrendamento ou permissão de uso de outros bens móveis',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '03.05.01.000',
    cTribNac: '030501',
    itemLc116: '03.05',
    descricao: 'Cessão de andaimes, palcos, coberturas e outras estruturas de uso temporário',
    aliquotaReferencia: 3.5
  },

  // ========================================================
  // GRUPO 04: Serviços de Saúde, Assistência Médica e Congêneres
  // ========================================================
  {
    codigo: '04.01.01.000',
    cTribNac: '040101',
    itemLc116: '04.01',
    descricao: 'Medicina e biomedicina (consultas, exames clínicos e tratamentos médicos)',
    aliquotaReferencia: 2.0
  },
  {
    codigo: '04.02.01.000',
    cTribNac: '040201',
    itemLc116: '04.02',
    descricao: 'Análises clínicas, patologia, tomografia, ressonância, radiologia e ultrassonografia',
    aliquotaReferencia: 2.5
  },
  {
    codigo: '04.03.01.000',
    cTribNac: '040301',
    itemLc116: '04.03',
    descricao: 'Hospitais, clínicas, prontos-socorros, ambulatórios e centros de diagnóstico',
    aliquotaReferencia: 2.0
  },
  {
    codigo: '04.04.01.000',
    cTribNac: '040401',
    itemLc116: '04.04',
    descricao: 'Instrumentação cirúrgica',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '04.05.01.000',
    cTribNac: '040501',
    itemLc116: '04.05',
    descricao: 'Acupuntura',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '04.06.01.000',
    cTribNac: '040601',
    itemLc116: '04.06',
    descricao: 'Enfermagem, inclusive home care e serviços de parteiras',
    aliquotaReferencia: 2.5
  },
  {
    codigo: '04.07.01.000',
    cTribNac: '040701',
    itemLc116: '04.07',
    descricao: 'Serviços farmacêuticos, manipulação e assistência farmacêutica',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '04.08.01.000',
    cTribNac: '040801',
    itemLc116: '04.08',
    descricao: 'Terapia ocupacional, fisioterapia e fonoaudiologia',
    aliquotaReferencia: 2.0
  },
  {
    codigo: '04.09.01.000',
    cTribNac: '040901',
    itemLc116: '04.09',
    descricao: 'Terapias de qualquer espécie destinadas ao tratamento físico, orgânico e mental',
    aliquotaReferencia: 2.5
  },
  {
    codigo: '04.10.01.000',
    cTribNac: '041001',
    itemLc116: '04.10',
    descricao: 'Nutrição e dietética',
    aliquotaReferencia: 2.5
  },
  {
    codigo: '04.11.01.000',
    cTribNac: '041101',
    itemLc116: '04.11',
    descricao: 'Obstetrícia',
    aliquotaReferencia: 2.5
  },
  {
    codigo: '04.12.01.000',
    cTribNac: '041201',
    itemLc116: '04.12',
    descricao: 'Odontologia (cirurgião-dentista, prótese dentária e ortodontia)',
    aliquotaReferencia: 2.0
  },
  {
    codigo: '04.13.01.000',
    cTribNac: '041301',
    itemLc116: '04.13',
    descricao: 'Ortóptica',
    aliquotaReferencia: 2.5
  },
  {
    codigo: '04.14.01.000',
    cTribNac: '041401',
    itemLc116: '04.14',
    descricao: 'Próteses sob encomenda',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '04.15.01.000',
    cTribNac: '041501',
    itemLc116: '04.15',
    descricao: 'Psicanálise',
    aliquotaReferencia: 2.0
  },
  {
    codigo: '04.16.01.000',
    cTribNac: '041601',
    itemLc116: '04.16',
    descricao: 'Psicologia e atendimento psicológico',
    aliquotaReferencia: 2.0
  },
  {
    codigo: '04.17.01.000',
    cTribNac: '041701',
    itemLc116: '04.17',
    descricao: 'Casas de repouso, recuperação, creches, asilos e congêneres',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '04.18.01.000',
    cTribNac: '041801',
    itemLc116: '04.18',
    descricao: 'Inseminação artificial, fertilização in vitro e reprodução assistida',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '04.19.01.000',
    cTribNac: '041901',
    itemLc116: '04.19',
    descricao: 'Bancos de sangue, leite, pele, olhos, sêmen e órgãos',
    aliquotaReferencia: 2.5
  },
  {
    codigo: '04.20.01.000',
    cTribNac: '042001',
    itemLc116: '04.20',
    descricao: 'Coleta de sangue, leite, tecidos e materiais biológicos para análise',
    aliquotaReferencia: 2.5
  },
  {
    codigo: '04.21.01.000',
    cTribNac: '042101',
    itemLc116: '04.21',
    descricao: 'Unidade de atendimento, UTI móvel, resgate e ambulâncias',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '04.22.01.000',
    cTribNac: '042201',
    itemLc116: '04.22',
    descricao: 'Planos de medicina de grupo, operadoras de saúde e convênios médico-hospitalares',
    aliquotaReferencia: 2.0
  },
  {
    codigo: '04.23.01.000',
    cTribNac: '042301',
    itemLc116: '04.23',
    descricao: 'Outros planos de saúde contratados com prestadores terceirizados',
    aliquotaReferencia: 2.0
  },

  // ========================================================
  // GRUPO 05: Medicina e Assistência Veterinária
  // ========================================================
  {
    codigo: '05.01.01.000',
    cTribNac: '050101',
    itemLc116: '05.01',
    descricao: 'Medicina veterinária e zootecnia',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '05.02.01.000',
    cTribNac: '050201',
    itemLc116: '05.02',
    descricao: 'Hospitais, clínicas e ambulatórios veterinários',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '05.03.01.000',
    cTribNac: '050301',
    itemLc116: '05.03',
    descricao: 'Laboratórios de análises clínicas veterinárias',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '05.08.01.000',
    cTribNac: '050801',
    itemLc116: '05.08',
    descricao: 'Guarda, tratamento, adestramento, embelezamento (banho e tosa) e hospedagem de animais (pet shop)',
    aliquotaReferencia: 3.5
  },
  {
    codigo: '05.09.01.000',
    cTribNac: '050901',
    itemLc116: '05.09',
    descricao: 'Planos de atendimento e assistência médico-veterinária (plano pet)',
    aliquotaReferencia: 3.0
  },

  // ========================================================
  // GRUPO 06: Cuidados Pessoais, Estética e Atividades Físicas
  // ========================================================
  {
    codigo: '06.01.01.000',
    cTribNac: '060101',
    itemLc116: '06.01',
    descricao: 'Barbearia, cabeleireiros, manicuros, pedicuros e salões de beleza',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '06.02.01.000',
    cTribNac: '060201',
    itemLc116: '06.02',
    descricao: 'Esteticistas, tratamento de pele, depilação e estética corporal/facial',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '06.03.01.000',
    cTribNac: '060301',
    itemLc116: '06.03',
    descricao: 'Banhos, duchas, saunas e massagens relaxantes/terapêuticas',
    aliquotaReferencia: 4.0
  },
  {
    codigo: '06.04.01.000',
    cTribNac: '060401',
    itemLc116: '06.04',
    descricao: 'Ginástica, dança, esportes, natação, artes marciais, crossfit e academias',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '06.05.01.000',
    cTribNac: '060501',
    itemLc116: '06.05',
    descricao: 'Centros de emagrecimento, spas e bem-estar',
    aliquotaReferencia: 3.5
  },
  {
    codigo: '06.06.01.000',
    cTribNac: '060601',
    itemLc116: '06.06',
    descricao: 'Aplicação de tatuagens, piercings e colocação de adereços corporais',
    aliquotaReferencia: 3.5
  },

  // ========================================================
  // GRUPO 07: Engenharia, Arquitetura, Construção Civil e Saneamento
  // ========================================================
  {
    codigo: '07.01.01.000',
    cTribNac: '070101',
    itemLc116: '07.01',
    descricao: 'Engenharia, agronomia, agrimensura, arquitetura, geologia, urbanismo e paisagismo',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '07.02.01.000',
    cTribNac: '070201',
    itemLc116: '07.02',
    descricao: 'Execução de obras de construção civil, hidráulica ou elétrica e reformas estruturais',
    aliquotaReferencia: 5.0
  },
  {
    codigo: '07.03.01.000',
    cTribNac: '070301',
    itemLc116: '07.03',
    descricao: 'Elaboração de planos diretores, estudos de viabilidade, anteprojetos, projetos básicos e executivos de engenharia',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '07.04.01.000',
    cTribNac: '070401',
    itemLc116: '07.04',
    descricao: 'Demolição de edifícios e estruturas',
    aliquotaReferencia: 4.0
  },
  {
    codigo: '07.05.01.000',
    cTribNac: '070501',
    itemLc116: '07.05',
    descricao: 'Reparação, conservação e reforma de edifícios, estradas, pontes e portos',
    aliquotaReferencia: 4.0
  },
  {
    codigo: '07.06.01.000',
    cTribNac: '070601',
    itemLc116: '07.06',
    descricao: 'Instalação de tapetes, cortinas, gesso, divisórias, vidros e revestimentos de parede/piso',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '07.07.01.000',
    cTribNac: '070701',
    itemLc116: '07.07',
    descricao: 'Recuperação, raspagem, polimento e lustração de pisos e paredes',
    aliquotaReferencia: 3.5
  },
  {
    codigo: '07.08.01.000',
    cTribNac: '070801',
    itemLc116: '07.08',
    descricao: 'Calafetação e vedação técnica de estruturas',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '07.09.01.000',
    cTribNac: '070901',
    itemLc116: '07.09',
    descricao: 'Varrição, coleta, remoção, tratamento, reciclagem e destinação final de lixo e resíduos',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '07.10.01.000',
    cTribNac: '071001',
    itemLc116: '07.10',
    descricao: 'Limpeza, conservação e manutenção de imóveis, piscinas, condomínios, parques e vias públicas',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '07.11.01.000',
    cTribNac: '071101',
    itemLc116: '07.11',
    descricao: 'Decoração e jardinagem, inclusive corte, poda de árvores e paisagismo',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '07.12.01.000',
    cTribNac: '071201',
    itemLc116: '07.12',
    descricao: 'Controle e tratamento de efluentes, saneamento básico e agentes poluentes',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '07.13.01.000',
    cTribNac: '071301',
    itemLc116: '07.13',
    descricao: 'Dedetização, desinfecção, higienização, controle de pragas urbanas e desratização',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '07.14.01.000',
    cTribNac: '071401',
    itemLc116: '07.14',
    descricao: 'Florestamento, reflorestamento, semeadura, adubação, preparo de solo, plantio e corte de árvores',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '07.15.01.000',
    cTribNac: '071501',
    itemLc116: '07.15',
    descricao: 'Escoramento, contenção de encostas e serviços de engenharia geotécnica',
    aliquotaReferencia: 4.0
  },
  {
    codigo: '07.16.01.000',
    cTribNac: '071601',
    itemLc116: '07.16',
    descricao: 'Limpeza e dragagem de rios, portos, canais, baías, lagos, lagoas e represas',
    aliquotaReferencia: 4.0
  },
  {
    codigo: '07.17.01.000',
    cTribNac: '071701',
    itemLc116: '07.17',
    descricao: 'Acompanhamento e fiscalização da execução de obras de engenharia e arquitetura',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '07.18.01.000',
    cTribNac: '071801',
    itemLc116: '07.18',
    descricao: 'Aerofotogrametria, topografia, levantamentos geográficos, cartografia e geodésicos',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '07.19.01.000',
    cTribNac: '071901',
    itemLc116: '07.19',
    descricao: 'Pesquisa, perfuração, cimentação e serviços na exploração de petróleo e gás natural',
    aliquotaReferencia: 4.0
  },
  {
    codigo: '07.21.01.000',
    cTribNac: '072101',
    itemLc116: '07.21',
    descricao: 'Perfuração e exploração de poços artesianos',
    aliquotaReferencia: 4.0
  },
  {
    codigo: '07.22.01.000',
    cTribNac: '072201',
    itemLc116: '07.22',
    descricao: 'Restauração de obras de arte e edifícios tombados ou de valor histórico',
    aliquotaReferencia: 3.5
  },

  // ========================================================
  // GRUPO 08: Educação, Ensino e Treinamento
  // ========================================================
  {
    codigo: '08.01.01.000',
    cTribNac: '080101',
    itemLc116: '08.01',
    descricao: 'Ensino regular pré-escolar, fundamental, médio e superior (escolas e faculdades)',
    aliquotaReferencia: 2.0
  },
  {
    codigo: '08.02.01.000',
    cTribNac: '080201',
    itemLc116: '08.02',
    descricao: 'Instrução, treinamento, cursos livres, idiomas, informática e desenvolvimento pessoal',
    aliquotaReferencia: 2.5
  },

  // ========================================================
  // GRUPO 09: Hospedagem, Turismo e Viagens
  // ========================================================
  {
    codigo: '09.01.01.000',
    cTribNac: '090101',
    itemLc116: '09.01',
    descricao: 'Hospedagem em hotéis, apart-hotéis, pousadas, flats, motéis e pensões',
    aliquotaReferencia: 4.0
  },
  {
    codigo: '09.02.01.000',
    cTribNac: '090201',
    itemLc116: '09.02',
    descricao: 'Agenciamento, organização e execução de programas de turismo, passeios, excursões e viagens',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '09.03.01.000',
    cTribNac: '090301',
    itemLc116: '09.03',
    descricao: 'Guias de turismo credenciados',
    aliquotaReferencia: 2.5
  },

  // ========================================================
  // GRUPO 10: Intermediação, Corretagem e Agenciamento
  // ========================================================
  {
    codigo: '10.01.01.000',
    cTribNac: '100101',
    itemLc116: '10.01',
    descricao: 'Agenciamento, corretagem ou intermediação de câmbio, seguros e previdência privada',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '10.02.01.000',
    cTribNac: '100201',
    itemLc116: '10.02',
    descricao: 'Agenciamento, corretagem ou intermediação de títulos e valores mobiliários',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '10.03.01.000',
    cTribNac: '100301',
    itemLc116: '10.03',
    descricao: 'Agenciamento de direitos de propriedade industrial, marcas, patentes e direitos autorais',
    aliquotaReferencia: 3.5
  },
  {
    codigo: '10.04.01.000',
    cTribNac: '100401',
    itemLc116: '10.04',
    descricao: 'Agenciamento e intermediação de leasing, franquias (franchising) e factoring',
    aliquotaReferencia: 4.0
  },
  {
    codigo: '10.05.01.000',
    cTribNac: '100501',
    itemLc116: '10.05',
    descricao: 'Agenciamento, corretagem ou intermediação de bens móveis ou imóveis (imobiliárias, corretores e comissões)',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '10.06.01.000',
    cTribNac: '100601',
    itemLc116: '10.06',
    descricao: 'Agenciamento marítimo e operações correlatas',
    aliquotaReferencia: 3.5
  },
  {
    codigo: '10.07.01.000',
    cTribNac: '100701',
    itemLc116: '10.07',
    descricao: 'Agenciamento de notícias e assessoria de pauta',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '10.08.01.000',
    cTribNac: '100801',
    itemLc116: '10.08',
    descricao: 'Agenciamento de publicidade, propaganda e veiculação em mídias',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '10.09.01.000',
    cTribNac: '100901',
    itemLc116: '10.09',
    descricao: 'Representação comercial de qualquer natureza e representação mercantil',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '10.10.01.000',
    cTribNac: '101001',
    itemLc116: '10.10',
    descricao: 'Distribuição de bens e mercadorias de terceiros',
    aliquotaReferencia: 3.0
  },

  // ========================================================
  // GRUPO 11: Guarda, Estacionamento, Armazenamento e Vigilância
  // ========================================================
  {
    codigo: '11.01.01.000',
    cTribNac: '110101',
    itemLc116: '11.01',
    descricao: 'Guarda e estacionamento de veículos terrestres, embarcações e aeronaves',
    aliquotaReferencia: 5.0
  },
  {
    codigo: '11.02.01.000',
    cTribNac: '110201',
    itemLc116: '11.02',
    descricao: 'Vigilância, segurança privada ou monitoramento de bens, pessoas e condomínios',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '11.03.01.000',
    cTribNac: '110301',
    itemLc116: '11.03',
    descricao: 'Escolta armada e desarmada de veículos e cargas',
    aliquotaReferencia: 4.0
  },
  {
    codigo: '11.04.01.000',
    cTribNac: '110401',
    itemLc116: '11.04',
    descricao: 'Armazenamento, depósito, carga, descarga e guarda de bens de qualquer espécie (galpões e armazéns)',
    aliquotaReferencia: 3.5
  },
  {
    codigo: '11.05.01.000',
    cTribNac: '110501',
    itemLc116: '11.05',
    descricao: 'Rastreamento e monitoramento veicular e de cargas via satélite/GPS',
    aliquotaReferencia: 2.5
  },

  // ========================================================
  // GRUPO 12: Diversões, Lazer, Eventos e Entretenimento
  // ========================================================
  {
    codigo: '12.01.01.000',
    cTribNac: '120101',
    itemLc116: '12.01',
    descricao: 'Espetáculos teatrais e montagens cênicas',
    aliquotaReferencia: 2.5
  },
  {
    codigo: '12.02.01.000',
    cTribNac: '120201',
    itemLc116: '12.02',
    descricao: 'Exibições cinematográficas (cinemas)',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '12.03.01.000',
    cTribNac: '120301',
    itemLc116: '12.03',
    descricao: 'Espetáculos circenses e trupes artísticas',
    aliquotaReferencia: 2.5
  },
  {
    codigo: '12.05.01.000',
    cTribNac: '120501',
    itemLc116: '12.05',
    descricao: 'Parques de diversões, centros de lazer, quadras e recreação',
    aliquotaReferencia: 4.0
  },
  {
    codigo: '12.06.01.000',
    cTribNac: '120601',
    itemLc116: '12.06',
    descricao: 'Boates, casas noturnas e discotecas',
    aliquotaReferencia: 5.0
  },
  {
    codigo: '12.07.01.000',
    cTribNac: '120701',
    itemLc116: '12.07',
    descricao: 'Shows, apresentações musicais, festivais, desfiles e concertos',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '12.08.01.000',
    cTribNac: '120801',
    itemLc116: '12.08',
    descricao: 'Organização e promoção de feiras, exposições, congressos e convenções',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '12.11.01.000',
    cTribNac: '121101',
    itemLc116: '12.11',
    descricao: 'Competições esportivas ou de destreza física ou intelectual',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '12.12.01.000',
    cTribNac: '121201',
    itemLc116: '12.12',
    descricao: 'Execução de música ao vivo ou mecânica',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '12.13.01.000',
    cTribNac: '121301',
    itemLc116: '12.13',
    descricao: 'Produção e organização geral de eventos, festivais, shows e cerimoniais',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '12.17.01.000',
    cTribNac: '121701',
    itemLc116: '12.17',
    descricao: 'Recreação, animação infantil e entretenimento em festas',
    aliquotaReferencia: 3.0
  },

  // ========================================================
  // GRUPO 13: Audiovisual, Fotografia e Artes Gráficas
  // ========================================================
  {
    codigo: '13.02.01.000',
    cTribNac: '130201',
    itemLc116: '13.02',
    descricao: 'Gravação e mixagem de sons, estúdios de áudio, dublagem e masterização',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '13.03.01.000',
    cTribNac: '130301',
    itemLc116: '13.03',
    descricao: 'Fotografia profissional, filmagens, ensaios e coberturas audiovisuais',
    aliquotaReferencia: 2.5
  },
  {
    codigo: '13.04.01.000',
    cTribNac: '130401',
    itemLc116: '13.04',
    descricao: 'Digitalização, reprografia, plotagem e microfilmagem de documentos',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '13.05.01.000',
    cTribNac: '130501',
    itemLc116: '13.05',
    descricao: 'Serviços gráficos, tipografia, impressão personalizada e editoração gráfica',
    aliquotaReferencia: 3.0
  },

  // ========================================================
  // GRUPO 14: Oficinas, Reparação, Conservação e Instalações
  // ========================================================
  {
    codigo: '14.01.01.000',
    cTribNac: '140101',
    itemLc116: '14.01',
    descricao: 'Revisão, conserto, manutenção e conservação mecânica/elétrica de máquinas, motores e veículos',
    aliquotaReferencia: 3.5
  },
  {
    codigo: '14.02.01.000',
    cTribNac: '140201',
    itemLc116: '14.02',
    descricao: 'Assistência técnica em eletrodomésticos, eletrônicos e equipamentos de informática',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '14.03.01.000',
    cTribNac: '140301',
    itemLc116: '14.03',
    descricao: 'Recondicionamento de motores e componentes mecânicos',
    aliquotaReferencia: 3.5
  },
  {
    codigo: '14.04.01.000',
    cTribNac: '140401',
    itemLc116: '14.04',
    descricao: 'Recauchutagem ou regeneração de pneus',
    aliquotaReferencia: 3.5
  },
  {
    codigo: '14.05.01.000',
    cTribNac: '140501',
    itemLc116: '14.05',
    descricao: 'Pintura, polimento, lavagem, secagem e acabamento de objetos e veículos (estética automotiva)',
    aliquotaReferencia: 3.5
  },
  {
    codigo: '14.06.01.000',
    cTribNac: '140601',
    itemLc116: '14.06',
    descricao: 'Instalação e montagem de máquinas, motores e equipamentos industriais/comerciais',
    aliquotaReferencia: 3.5
  },
  {
    codigo: '14.07.01.000',
    cTribNac: '140701',
    itemLc116: '14.07',
    descricao: 'Colocação de molduras e vidraçaria artesanal',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '14.08.01.000',
    cTribNac: '140801',
    itemLc116: '14.08',
    descricao: 'Encadernação, gravação e douração de livros, revistas e catálogos',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '14.09.01.000',
    cTribNac: '140901',
    itemLc116: '14.09',
    descricao: 'Alfaiataria, ateliê e costura sob encomenda',
    aliquotaReferencia: 2.5
  },
  {
    codigo: '14.10.01.000',
    cTribNac: '141001',
    itemLc116: '14.10',
    descricao: 'Tinturaria e lavanderia de roupas, uniformes e estofados',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '14.11.01.000',
    cTribNac: '141101',
    itemLc116: '14.11',
    descricao: 'Tapeçaria e reforma de estofados em geral',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '14.12.01.000',
    cTribNac: '141201',
    itemLc116: '14.12',
    descricao: 'Funilaria e lanternagem automotiva',
    aliquotaReferencia: 4.0
  },
  {
    codigo: '14.13.01.000',
    cTribNac: '141301',
    itemLc116: '14.13',
    descricao: 'Carpintaria, marcenaria sob encomenda e serralheria',
    aliquotaReferencia: 3.5
  },
  {
    codigo: '14.14.01.000',
    cTribNac: '141401',
    itemLc116: '14.14',
    descricao: 'Guincho municipal, guindaste e içamento de cargas',
    aliquotaReferencia: 4.0
  },

  // ========================================================
  // GRUPO 15: Setor Bancário e Financeiro
  // ========================================================
  {
    codigo: '15.01.01.000',
    cTribNac: '150101',
    itemLc116: '15.01',
    descricao: 'Administração de fundos, consórcios e cartões de crédito/débito',
    aliquotaReferencia: 4.0
  },
  {
    codigo: '15.02.01.000',
    cTribNac: '150201',
    itemLc116: '15.02',
    descricao: 'Abertura e manutenção de contas em geral no País e exterior',
    aliquotaReferencia: 4.0
  },
  {
    codigo: '15.08.01.000',
    cTribNac: '150801',
    itemLc116: '15.08',
    descricao: 'Emissão, contratação e registro de contratos de crédito, fiança e aval',
    aliquotaReferencia: 4.0
  },
  {
    codigo: '15.09.01.000',
    cTribNac: '150901',
    itemLc116: '15.09',
    descricao: 'Arrendamento mercantil (leasing) de bens',
    aliquotaReferencia: 4.0
  },
  {
    codigo: '15.10.01.000',
    cTribNac: '151001',
    itemLc116: '15.10',
    descricao: 'Serviços relacionados a cobranças bancárias, boletos, recebimentos e pagamentos',
    aliquotaReferencia: 4.0
  },
  {
    codigo: '15.13.01.000',
    cTribNac: '151301',
    itemLc116: '15.13',
    descricao: 'Serviços de câmbio de moedas estrangeiras e remessas internacionais',
    aliquotaReferencia: 4.0
  },
  {
    codigo: '15.18.01.000',
    cTribNac: '151801',
    itemLc116: '15.18',
    descricao: 'Serviços relacionados a crédito imobiliário, avaliação e vistoria de imóvel',
    aliquotaReferencia: 3.5
  },

  // ========================================================
  // GRUPO 16: Transporte Municipal
  // ========================================================
  {
    codigo: '16.01.01.000',
    cTribNac: '160101',
    itemLc116: '16.01',
    descricao: 'Transporte coletivo municipal rodoviário, metroviário ou aquaviário de passageiros',
    aliquotaReferencia: 2.0
  },
  {
    codigo: '16.02.01.000',
    cTribNac: '160201',
    itemLc116: '16.02',
    descricao: 'Transporte escolar, táxi, mototaxi, fretamento e fretes municipais de carga',
    aliquotaReferencia: 3.0
  },

  // ========================================================
  // GRUPO 17: Apoio Técnico, Administrativo, Jurídico, Contábil e Consultorias
  // ========================================================
  {
    codigo: '17.01.01.000',
    cTribNac: '170101',
    itemLc116: '17.01',
    descricao: 'Assessoria ou consultoria empresarial, planejamento e gestão estratégica',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '17.02.01.000',
    cTribNac: '170201',
    itemLc116: '17.02',
    descricao: 'Digitação, estenografia, secretaria em geral, redação, tradução, escritório virtual e apoio administrativo',
    aliquotaReferencia: 2.5
  },
  {
    codigo: '17.03.01.000',
    cTribNac: '170301',
    itemLc116: '17.03',
    descricao: 'Planejamento, coordenação e organização técnica/financeira',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '17.04.01.000',
    cTribNac: '170401',
    itemLc116: '17.04',
    descricao: 'Recrutamento, agenciamento, seleção e colocação de mão de obra (RH e hunting)',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '17.05.01.000',
    cTribNac: '170501',
    itemLc116: '17.05',
    descricao: 'Fornecimento de mão de obra temporária ou terceirizada',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '17.06.01.000',
    cTribNac: '170601',
    itemLc116: '17.06',
    descricao: 'Propaganda e publicidade, criação de campanhas, branding e marketing digital',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '17.08.01.000',
    cTribNac: '170801',
    itemLc116: '17.08',
    descricao: 'Franquias comerciais e serviços de franchising',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '17.09.01.000',
    cTribNac: '170901',
    itemLc116: '17.09',
    descricao: 'Perícias técnicas, laudos periciais e análises técnicas judiciais/extrajudiciais',
    aliquotaReferencia: 3.5
  },
  {
    codigo: '17.10.01.000',
    cTribNac: '171001',
    itemLc116: '17.10',
    descricao: 'Organização e administração de feiras, exposições, congressos e eventos corporativos',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '17.11.01.000',
    cTribNac: '171101',
    itemLc116: '17.11',
    descricao: 'Organização de festas, recepções e serviços de bufê para eventos',
    aliquotaReferencia: 3.5
  },
  {
    codigo: '17.12.01.000',
    cTribNac: '171201',
    itemLc116: '17.12',
    descricao: 'Administração de condomínios, bens móveis/imóveis e negócios de terceiros',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '17.13.01.000',
    cTribNac: '171301',
    itemLc116: '17.13',
    descricao: 'Leilões públicos e privados',
    aliquotaReferencia: 4.0
  },
  {
    codigo: '17.14.01.000',
    cTribNac: '171401',
    itemLc116: '17.14',
    descricao: 'Advocacia, assessoria e consultoria jurídica (escritórios de advocacia)',
    aliquotaReferencia: 4.0
  },
  {
    codigo: '17.15.01.000',
    cTribNac: '171501',
    itemLc116: '17.15',
    descricao: 'Arbitragem jurídica e mediação de conflitos',
    aliquotaReferencia: 3.5
  },
  {
    codigo: '17.16.01.000',
    cTribNac: '171601',
    itemLc116: '17.16',
    descricao: 'Auditoria independente e auditoria fiscal de demonstrações contábeis',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '17.17.01.000',
    cTribNac: '171701',
    itemLc116: '17.17',
    descricao: 'Análise de Organização e Métodos (O&M)',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '17.18.01.000',
    cTribNac: '171801',
    itemLc116: '17.18',
    descricao: 'Atuária e cálculos periciais e financeiros de qualquer natureza',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '17.19.01.000',
    cTribNac: '171901',
    itemLc116: '17.19',
    descricao: 'Contabilidade, perícia contábil, auditoria e assessoria fiscal (escritórios contábeis)',
    aliquotaReferencia: 2.0
  },
  {
    codigo: '17.20.01.000',
    cTribNac: '172001',
    itemLc116: '17.20',
    descricao: 'Consultoria e assessoria financeira, valuation e M&A',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '17.21.01.000',
    cTribNac: '172101',
    itemLc116: '17.21',
    descricao: 'Consultoria em estatística, modelagem analítica e inteligência de negócios (BI)',
    aliquotaReferencia: 2.5
  },
  {
    codigo: '17.22.01.000',
    cTribNac: '172201',
    itemLc116: '17.22',
    descricao: 'Cobrança em geral, recuperação de créditos e call center de cobrança',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '17.23.01.000',
    cTribNac: '172301',
    itemLc116: '17.23',
    descricao: 'Assessoria de imprensa e comunicação institucional',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '17.24.01.000',
    cTribNac: '172401',
    itemLc116: '17.24',
    descricao: 'Palestras, seminários, workshops e conferências empresariais',
    aliquotaReferencia: 2.5
  },
  {
    codigo: '17.25.01.000',
    cTribNac: '172501',
    itemLc116: '17.25',
    descricao: 'Inserção de anúncios, banners e publicidade em páginas web, redes sociais e internet',
    aliquotaReferencia: 2.5
  },

  // ========================================================
  // GRUPO 18: Seguros e Sinistros
  // ========================================================
  {
    codigo: '18.01.01.000',
    cTribNac: '180101',
    itemLc116: '18.01',
    descricao: 'Regulação de sinistros e inspeção de riscos de contratos de seguros',
    aliquotaReferencia: 3.0
  },

  // ========================================================
  // GRUPO 19: Loterias e Sorteios
  // ========================================================
  {
    codigo: '19.01.01.000',
    cTribNac: '190101',
    itemLc116: '19.01',
    descricao: 'Distribuição e venda de bilhetes de loteria, apostas, bingos e títulos de capitalização',
    aliquotaReferencia: 3.0
  },

  // ========================================================
  // GRUPO 20: Portos e Aeroportos
  // ========================================================
  {
    codigo: '20.01.01.000',
    cTribNac: '200101',
    itemLc116: '20.01',
    descricao: 'Serviços portuários, praticagem, capatazia, armazenagem e apoio marítimo',
    aliquotaReferencia: 4.0
  },
  {
    codigo: '20.02.01.000',
    cTribNac: '200201',
    itemLc116: '20.02',
    descricao: 'Serviços aeroportuários e apoio operacional a aeronaves',
    aliquotaReferencia: 4.0
  },
  {
    codigo: '20.03.01.000',
    cTribNac: '200301',
    itemLc116: '20.03',
    descricao: 'Serviços de terminais rodoviários, ferroviários e metroviários',
    aliquotaReferencia: 3.5
  },

  // ========================================================
  // GRUPO 21: Cartórios e Registros Públicos
  // ========================================================
  {
    codigo: '21.01.01.000',
    cTribNac: '210101',
    itemLc116: '21.01',
    descricao: 'Serviços de registros públicos, cartorários e notariais',
    aliquotaReferencia: 4.0
  },

  // ========================================================
  // GRUPO 22: Exploração de Rodovias / Pedágio
  // ========================================================
  {
    codigo: '22.01.01.000',
    cTribNac: '220101',
    itemLc116: '22.01',
    descricao: 'Serviços de exploração de rodovia mediante pedágio',
    aliquotaReferencia: 5.0
  },

  // ========================================================
  // GRUPO 23: Comunicação Visual e Design
  // ========================================================
  {
    codigo: '23.01.01.000',
    cTribNac: '230101',
    itemLc116: '23.01',
    descricao: 'Comunicação visual, desenho industrial, design gráfico e criação de logotipos',
    aliquotaReferencia: 3.0
  },

  // ========================================================
  // GRUPO 24: Chaveiros, Carimbos e Placas
  // ========================================================
  {
    codigo: '24.01.01.000',
    cTribNac: '240101',
    itemLc116: '24.01',
    descricao: 'Chaveiros, confecção de carimbos, placas de sinalização e carimbagem',
    aliquotaReferencia: 3.0
  },

  // ========================================================
  // GRUPO 25: Serviços Funerários
  // ========================================================
  {
    codigo: '25.01.01.000',
    cTribNac: '250101',
    itemLc116: '25.01',
    descricao: 'Serviços funerários, velórios, urnas e translado fúnebre',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '25.02.01.000',
    cTribNac: '250201',
    itemLc116: '25.02',
    descricao: 'Cremação de corpos cadavéricos',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '25.03.01.000',
    cTribNac: '250301',
    itemLc116: '25.03',
    descricao: 'Planos e convênios funerários',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '25.04.01.000',
    cTribNac: '250401',
    itemLc116: '25.04',
    descricao: 'Manutenção e conservação de jazigos e cemitérios',
    aliquotaReferencia: 3.0
  },

  // ========================================================
  // GRUPO 26: Entregas Rápidas, Motoboy e Courier
  // ========================================================
  {
    codigo: '26.01.01.000',
    cTribNac: '260101',
    itemLc116: '26.01',
    descricao: 'Entrega rápida de correspondências, motoboy, encomendas e courier municipal',
    aliquotaReferencia: 3.0
  },

  // ========================================================
  // GRUPO 27: Assistência Social
  // ========================================================
  {
    codigo: '27.01.01.000',
    cTribNac: '270101',
    itemLc116: '27.01',
    descricao: 'Assistência social, centros de apoio comunitário e ONGs assistenciais',
    aliquotaReferencia: 2.0
  },

  // ========================================================
  // GRUPO 28: Avaliação de Bens
  // ========================================================
  {
    codigo: '28.01.01.000',
    cTribNac: '280101',
    itemLc116: '28.01',
    descricao: 'Avaliação de bens móveis, imóveis, veículos, máquinas e empresas',
    aliquotaReferencia: 3.0
  },

  // ========================================================
  // GRUPOS 29 a 40: Especialidades Técnicas e Outros Serviços
  // ========================================================
  {
    codigo: '29.01.01.000',
    cTribNac: '290101',
    itemLc116: '29.01',
    descricao: 'Serviços de biblioteconomia e gestão de acervos',
    aliquotaReferencia: 2.5
  },
  {
    codigo: '30.01.01.000',
    cTribNac: '300101',
    itemLc116: '30.01',
    descricao: 'Serviços de biologia, biotecnologia e química aplicada',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '31.01.01.000',
    cTribNac: '310101',
    itemLc116: '31.01',
    descricao: 'Serviços técnicos em telecomunicações, eletrônica e eletrotécnica',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '32.01.01.000',
    cTribNac: '320101',
    itemLc116: '32.01',
    descricao: 'Desenhos técnicos de engenharia, plantas e modelagens arquitetônicas (CAD)',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '33.01.01.000',
    cTribNac: '330101',
    itemLc116: '33.01',
    descricao: 'Despachantes em geral, despachantes aduaneiros e trâmites documentais',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '34.01.01.000',
    cTribNac: '340101',
    itemLc116: '34.01',
    descricao: 'Investigações particulares e perícias de detetives particulares',
    aliquotaReferencia: 4.0
  },
  {
    codigo: '35.01.01.000',
    cTribNac: '350101',
    itemLc116: '35.01',
    descricao: 'Serviços de reportagem, assessoria de imprensa e produção jornalística',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '36.01.01.000',
    cTribNac: '360101',
    itemLc116: '36.01',
    descricao: 'Serviços de meteorologia e climatologia',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '37.01.01.000',
    cTribNac: '370101',
    itemLc116: '37.01',
    descricao: 'Artistas, atletas, modelos, manequins e influenciadores digitais',
    aliquotaReferencia: 3.5
  },
  {
    codigo: '38.01.01.000',
    cTribNac: '380101',
    itemLc116: '38.01',
    descricao: 'Museologia e restauração de bens culturais',
    aliquotaReferencia: 3.0
  },
  {
    codigo: '39.01.01.000',
    cTribNac: '390101',
    itemLc116: '39.01',
    descricao: 'Ourivesaria e lapidação sob encomenda',
    aliquotaReferencia: 3.5
  },
  {
    codigo: '40.01.01.000',
    cTribNac: '400101',
    itemLc116: '40.01',
    descricao: 'Obras de arte sob encomenda e restauração de esculturas/quadros',
    aliquotaReferencia: 3.5
  }
];

// Natureza da Operação / Exigibilidade do ISS (Manual CGNFS-e)
const EXIGIBILIDADES_ISS = [
  { codigo: 1, nome: '1 - Operação Tributável (Exigível)', deducaoPermitida: true },
  { codigo: 2, nome: '2 - Imunidade', deducaoPermitida: false },
  { codigo: 3, nome: '3 - Exportação de Serviços', deducaoPermitida: false },
  { codigo: 4, nome: '4 - Não Incidência', deducaoPermitida: false },
  { codigo: 5, nome: '5 - Isenção', deducaoPermitida: false },
  { codigo: 6, nome: '6 - Exigibilidade Suspensa por Decisão Judicial', deducaoPermitida: true },
  { codigo: 7, nome: '7 - Exigibilidade Suspensa por Processo Administrativo', deducaoPermitida: true }
];

// Opção pelo Simples Nacional do Prestador (Manual DPS Oficial da Receita Federal: 1: Não Optante, 2: MEI, 3: ME/EPP, 4: Pendente)
const OPCOES_SIMPLES_NACIONAL = [
  { codigo: 1, nome: '1 - Não Optante (Regime Geral / Lucro Presumido / Lucro Real)' },
  { codigo: 2, nome: '2 - Optante - Microempreendedor Individual (MEI)' },
  { codigo: 3, nome: '3 - Optante - Microempresa ou Empresa de Pequeno Porte (ME/EPP)' },
  { codigo: 4, nome: '4 - Optante - Enquadramento Pendente' }
];

// Regime Especial de Tributação (Manual DPS)
const REGIMES_ESPECIAIS_TRIBUTACAO = [
  { codigo: 0, nome: '0 - Nenhum / Não se aplica' },
  { codigo: 1, nome: '1 - Ato Cooperado (Cooperativa)' },
  { codigo: 2, nome: '2 - Estimativa' },
  { codigo: 3, nome: '3 - Sociedade de Profissionais (Uniprofissional)' },
  { codigo: 4, nome: '4 - Microempresário Individual (MEI)' },
  { codigo: 5, nome: '5 - Microempresa Municipal' }
];

// Tipos de Retenção do ISS
const TIPOS_RETENCAO_ISS = [
  { codigo: 1, nome: '1 - Não Retido (ISS recolhido pelo Prestador)' },
  { codigo: 2, nome: '2 - Retido pelo Tomador (Responsável Tributário)' },
  { codigo: 3, nome: '3 - Retido pelo Intermediário' }
];

const REGIMES_TRIBUTARIOS = [
  { codigo: 1, nome: 'Simples Nacional - Microempresa ou EPP' },
  { codigo: 2, nome: 'Simples Nacional - MEI (Microempreendedor Individual)' },
  { codigo: 3, nome: 'Regime Geral - Lucro Presumido' },
  { codigo: 4, nome: 'Regime Geral - Lucro Real' }
];

const MUNICIPIOS_EXEMPLO = [
  { codigoIbge: '2800308', nome: 'Aracaju', uf: 'SE' },
  { codigoIbge: '3550308', nome: 'São Paulo', uf: 'SP' },
  { codigoIbge: '3304557', nome: 'Rio de Janeiro', uf: 'RJ' },
  { codigoIbge: '3106200', nome: 'Belo Horizonte', uf: 'MG' },
  { codigoIbge: '4106902', nome: 'Curitiba', uf: 'PR' },
  { codigoIbge: '4314902', nome: 'Porto Alegre', uf: 'RS' },
  { codigoIbge: '5300108', nome: 'Brasília', uf: 'DF' },
  { codigoIbge: '2927408', nome: 'Salvador', uf: 'BA' },
  { codigoIbge: '2304400', nome: 'Fortaleza', uf: 'CE' },
  { codigoIbge: '5208707', nome: 'Goiânia', uf: 'GO' },
  { codigoIbge: '2611606', nome: 'Recife', uf: 'PE' },
  { codigoIbge: '3509502', nome: 'Campinas', uf: 'SP' },
  { codigoIbge: '4205407', nome: 'Florianópolis', uf: 'SC' },
  { codigoIbge: '3205309', nome: 'Vitória', uf: 'ES' },
  { codigoIbge: '1501402', nome: 'Belém', uf: 'PA' },
  { codigoIbge: '1302603', nome: 'Manaus', uf: 'AM' },
  { codigoIbge: '2704302', nome: 'Maceió', uf: 'AL' },
  { codigoIbge: '2408102', nome: 'Natal', uf: 'RN' }
];

module.exports = {
  CODIGOS_TRIBUTACAO_NACIONAL,
  EXIGIBILIDADES_ISS,
  OPCOES_SIMPLES_NACIONAL,
  REGIMES_ESPECIAIS_TRIBUTACAO,
  TIPOS_RETENCAO_ISS,
  REGIMES_TRIBUTARIOS,
  MUNICIPIOS_EXEMPLO
};
