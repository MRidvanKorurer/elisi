export const compactIban = (iban = '') => String(iban || '').replace(/\s+/g, '').toUpperCase();

export const isValidIbanTr = (iban = '') => /^TR\d{24}$/.test(compactIban(iban));

export const hasBankAccount = (account) => isValidIbanTr(account?.iban);
