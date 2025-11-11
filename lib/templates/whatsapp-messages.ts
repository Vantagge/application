export const whatsappTemplates = {
  stampProgress: (params: {
    customerName: string
    establishmentName: string
    currentStamps: number
    totalStamps: number
    cardImageUrl: string
  }) => ({
    to: params.customerName,
    body: `Olá! 🎉\n\nVocê acabou de ganhar mais um carimbo na *${params.establishmentName}*!\n\n📊 Progresso: *${params.currentStamps} de ${params.totalStamps} carimbos*\n\nFalta pouco para o seu serviço grátis! 💜`,
    mediaUrl: params.cardImageUrl,
  }),

  rewardCompleted: (params: {
    customerName: string
    establishmentName: string
    validityDays: number
    cardImageUrl: string
  }) => ({
    to: params.customerName,
    body: `🎊 *PARABÉNS!* 🎊\n\nSeu Cartão Fidelidade está *COMPLETO*!\n\nVocê tem direito a um *SERVIÇO GRÁTIS* na *${params.establishmentName}*! 🎁\n\n⏰ Você tem *${params.validityDays} dias* para resgatar.\n\nAgende seu próximo atendimento! 💜`,
    mediaUrl: params.cardImageUrl,
  }),

  rewardExpiring: (params: {
    customerName: string
    establishmentName: string
    daysLeft: number
  }) => ({
    to: params.customerName,
    body: `⚠️ *ATENÇÃO!*\n\nSeu serviço grátis na *${params.establishmentName}* expira em *${params.daysLeft} dias*!\n\nNão perca essa oportunidade! Agende agora! 📅`,
  }),
}
