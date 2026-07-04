export function formatCurrency(value: string): string {
  if (!value) return '';

  const onlyNumbers = value.replace(/[^0-9]/g, '');
  return onlyNumbers.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function parseCurrency(value: string): number {
  if (!value) return 0;
  return Number(value.replace(/,/g, ''));
}

export function getCurrentMonthPeriod(): string {
  const now = new Date();
  return `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
}
