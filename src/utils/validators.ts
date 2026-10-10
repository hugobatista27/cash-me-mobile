/**
 * Utilitários de validação e formatação para documentos brasileiros (CPF, CNPJ) e contatos.
 */

export const cleanDigits = (value: string): string => value.replace(/\D/g, '');

/**
 * Validação de CPF com dígitos verificadores
 */
export const isValidCPF = (cpf: string): boolean => {
  const digits = cleanDigits(cpf);
  if (digits.length !== 11) return false;

  // Rejeita padrões com todos os dígitos iguais (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(digits)) return false;

  // Validação do 1º dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i], 10) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(digits[9], 10)) return false;

  // Validação do 2º dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i], 10) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(digits[10], 10)) return false;

  return true;
};

/**
 * Validação de CNPJ com dígitos verificadores
 */
export const isValidCNPJ = (cnpj: string): boolean => {
  const digits = cleanDigits(cnpj);
  if (digits.length !== 14) return false;

  // Rejeita padrões com todos os dígitos iguais
  if (/^(\d)\1{13}$/.test(digits)) return false;

  // Validação do 1º dígito verificador
  let size = digits.length - 2;
  let numbers = digits.substring(0, size);
  const sumWeights = (length: number, weightStart: number) => {
    let sum = 0;
    let pos = weightStart;
    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i), 10) * pos--;
      if (pos < 2) pos = 9;
    }
    return sum;
  };

  let sum = sumWeights(size, 5);
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(size), 10)) return false;

  // Validação do 2º dígito verificador
  size = size + 1;
  numbers = digits.substring(0, size);
  sum = sumWeights(size, 6);
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(size), 10)) return false;

  return true;
};

/**
 * Máscaras de formatação
 */
export const formatCPF = (value: string): string => {
  const digits = cleanDigits(value).slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

export const formatCNPJ = (value: string): string => {
  const digits = cleanDigits(value).slice(0, 14);
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};

export const formatPhone = (value: string): string => {
  const digits = cleanDigits(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
};

export const formatCEP = (value: string): string => {
  const digits = cleanDigits(value).slice(0, 8);
  return digits.replace(/(\d{5})(\d{1,3})$/, '$1-$2');
};
