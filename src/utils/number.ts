export const formatAmount = (amount: number) => Intl.NumberFormat('fr', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
}).format(amount)