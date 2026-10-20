import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

const FORMATO_CPF_CNPJ_REGEX =
  /^(?:\d{11}|\d{3}\.\d{3}\.\d{3}-\d{2}|\d{14}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})$/;

export function normalizarCpfCnpj(valor: string): string {
  return valor.replace(/\D/g, '');
}

export function validarCpf(cpf: string): boolean {
  const numeros = normalizarCpfCnpj(cpf);

  if (numeros.length !== 11 || /^(\d)\1{10}$/.test(numeros)) {
    return false;
  }

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += Number(numeros[i]) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) {
    resto = 0;
  }
  if (resto !== Number(numeros[9])) {
    return false;
  }

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += Number(numeros[i]) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) {
    resto = 0;
  }

  return resto === Number(numeros[10]);
}

export function validarCnpj(cnpj: string): boolean {
  const numeros = normalizarCpfCnpj(cnpj);

  if (numeros.length !== 14 || /^(\d)\1{13}$/.test(numeros)) {
    return false;
  }

  const pesosPrimeiroDigito = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesosSegundoDigito = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let soma = 0;
  for (let i = 0; i < 12; i++) {
    soma += Number(numeros[i]) * pesosPrimeiroDigito[i];
  }
  let resto = soma % 11;
  const primeiroDigito = resto < 2 ? 0 : 11 - resto;
  if (primeiroDigito !== Number(numeros[12])) {
    return false;
  }

  soma = 0;
  for (let i = 0; i < 13; i++) {
    soma += Number(numeros[i]) * pesosSegundoDigito[i];
  }
  resto = soma % 11;
  const segundoDigito = resto < 2 ? 0 : 11 - resto;

  return segundoDigito === Number(numeros[13]);
}

export function validarCpfCnpj(valor: string): boolean {
  if (typeof valor !== 'string' || !FORMATO_CPF_CNPJ_REGEX.test(valor.trim())) {
    return false;
  }

  const numeros = normalizarCpfCnpj(valor);
  if (numeros.length === 11) {
    return validarCpf(numeros);
  }
  if (numeros.length === 14) {
    return validarCnpj(numeros);
  }

  return false;
}

export function IsCpfCnpj(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isCpfCnpj',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return typeof value === 'string' && validarCpfCnpj(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `O campo ${args.property} deve conter um CPF ou CNPJ válido.`;
        },
      },
    });
  };
}
