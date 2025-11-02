// Portuguese translations for the application

export const translations = {
  // Common
  common: {
    loading: "Carregando...",
    save: "Salvar",
    cancel: "Cancelar",
    delete: "Excluir",
    edit: "Editar",
    create: "Criar",
    search: "Pesquisar",
    filter: "Filtrar",
    back: "Voltar",
    next: "Próximo",
    previous: "Anterior",
    submit: "Enviar",
    confirm: "Confirmar",
    close: "Fechar",
  },

  // Authentication
  auth: {
    login: "Entrar",
    logout: "Sair",
    signUp: "Cadastrar",
    email: "E-mail",
    password: "Senha",
    repeatPassword: "Repetir Senha",
    forgotPassword: "Esqueceu a senha?",
    dontHaveAccount: "Não tem uma conta?",
    alreadyHaveAccount: "Já tem uma conta?",
    loginTitle: "Entrar na Plataforma",
    signUpTitle: "Criar Conta",
    loginDescription: "Digite seu e-mail e senha para acessar",
    signUpDescription: "Crie sua conta para começar",
    signUpSuccess: "Cadastro realizado com sucesso!",
    checkEmail: "Verifique seu e-mail para confirmar sua conta",
    loggingIn: "Entrando...",
    signingUp: "Cadastrando...",
    passwordsDontMatch: "As senhas não coincidem",
  },

  // Dashboard
  dashboard: {
    title: "Painel de Controle",
    welcome: "Bem-vindo",
    activeCustomers: "Clientes Ativos",
    totalPoints: "Pontos Distribuídos",
    totalRedemptions: "Resgates Realizados",
    recentTransactions: "Transações Recentes",
    customerList: "Lista de Clientes",
    reports: "Relatórios",
  },

  // Establishment
  establishment: {
    name: "Nome do Estabelecimento",
    category: "Categoria",
    address: "Endereço",
    responsibleName: "Nome do Responsável",
    status: "Status",
    configuration: "Configuração",
    programType: "Tipo de Programa",
    valuePerPoint: "Valor por Ponto (R$)",
    stampsForReward: "Carimbos para Resgate",
    categories: {
      barbearia: "Barbearia",
      salao: "Salão de Beleza",
      estetica: "Estética",
      outro: "Outro",
    },
    programTypes: {
      pontuacao: "Pontuação",
      carimbo: "Carimbo",
    },
  },

  // Customer
  customer: {
    name: "Nome",
    whatsapp: "WhatsApp",
    email: "E-mail",
    birthDate: "Data de Nascimento",
    cpf: "CPF",
    balance: "Saldo",
    addCustomer: "Adicionar Cliente",
    editCustomer: "Editar Cliente",
    customerDetails: "Detalhes do Cliente",
    loyaltyBalance: "Saldo de Fidelidade",
    transactionHistory: "Histórico de Transações",
  },

  // Transaction
  transaction: {
    type: "Tipo",
    value: "Valor",
    points: "Pontos",
    description: "Descrição",
    date: "Data",
    balanceAfter: "Saldo Após",
    addTransaction: "Registrar Transação",
    redeem: "Resgatar",
    types: {
      compra: "Compra",
      ganho: "Ganho",
      resgate: "Resgate",
      ajuste: "Ajuste",
    },
  },

  // Admin
  admin: {
    title: "Painel Administrativo",
    establishments: "Estabelecimentos",
    addEstablishment: "Adicionar Estabelecimento",
    editEstablishment: "Editar Estabelecimento",
    viewEstablishments: "Ver Estabelecimentos",
    totalEstablishments: "Total de Estabelecimentos",
    activeEstablishments: "Estabelecimentos Ativos",
  },

  // B2C
  b2c: {
    title: "Seu Saldo de Fidelidade",
    yourBalance: "Seu Saldo",
    points: "pontos",
    stamps: "carimbos",
    establishment: "Estabelecimento",
    nextReward: "Próxima Recompensa",
    stampsNeeded: "carimbos necessários",
    pointsNeeded: "pontos necessários",
  },

  // Errors
  errors: {
    generic: "Ocorreu um erro. Tente novamente.",
    notFound: "Não encontrado",
    unauthorized: "Não autorizado",
    invalidCredentials: "Credenciais inválidas",
    requiredField: "Campo obrigatório",
    invalidEmail: "E-mail inválido",
    invalidWhatsApp: "WhatsApp inválido (formato: +55DDNNNNNNNNN)",
    insufficientBalance: "Saldo insuficiente",
  },

  // Success messages
  success: {
    saved: "Salvo com sucesso!",
    created: "Criado com sucesso!",
    updated: "Atualizado com sucesso!",
    deleted: "Excluído com sucesso!",
    transactionRecorded: "Transação registrada com sucesso!",
    redeemed: "Resgate realizado com sucesso!",
  },
} as const

export type TranslationKey = keyof typeof translations
