import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { parse, parseISO, format, isValid } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function v4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Formata uma data para o padrão brasileiro (DD/MM/YYYY)
 * @param dateString String de data em diversos formatos (YYYY-MM-DD, DD/MM/YYYY, com ou sem hora)
 * @returns Data formatada no padrão brasileiro
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return '-';

  try {
    // Verificar se o formato é ISO YYYY-MM-DD (com ou sem hora)
    if (/^\d{4}-\d{2}-\d{2}(?: \d{2}:\d{2}:\d{2})?$/.test(dateString)) {
      const parsed = parseISO(dateString);
      
      // Verifica se a data é válida
      if (!isValid(parsed)) {
        console.debug('Data ISO inválida:', dateString);
        return '-';
      }
      
      // Se tem hora inclusa no formato original, mantemos na saída
      if (dateString.includes(':')) {
        return format(parsed, 'dd/MM/yyyy HH:mm:ss');
      }
      
      return format(parsed, 'dd/MM/yyyy');
    }
    
    // Verificar se o formato já é DD/MM/YYYY (com ou sem hora)
    if (/^\d{2}\/\d{2}\/\d{4}(?: \d{2}:\d{2}:\d{2})?$/.test(dateString)) {
      // Se já tem hora, parsear com o formato completo
      if (dateString.includes(':')) {
        const parsed = parse(dateString, 'dd/MM/yyyy HH:mm:ss', new Date());
        
        if (!isValid(parsed)) {
          console.debug('Data com hora inválida:', dateString);
          return '-';
        }
        
        return dateString; // Já está no formato desejado
      }
      
      // Sem hora, verificar se é uma data válida
      const parsed = parse(dateString, 'dd/MM/yyyy', new Date());
      
      if (!isValid(parsed)) {
        console.debug('Data brasileira inválida:', dateString);
        return '-';
      }
      
      return dateString; // Já está no formato correto
    }
    
    // Tentar outros formatos possíveis
    const formatos = [
      'yyyy-MM-dd',
      'yyyy-MM-dd\'T\'HH:mm:ss',
      'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'',
      'yyyy/MM/dd',
      'dd-MM-yyyy',
      'dd/MM/yyyy HH:mm',
      'dd/MM/yyyy HH:mm:ss'
    ];
    
    for (const fmt of formatos) {
      try {
        const parsed = parse(dateString, fmt, new Date());
        if (isValid(parsed)) {
          // Se o formato original tinha hora, mantemos hora na saída
          if (fmt.includes('HH:mm:ss')) {
            return format(parsed, 'dd/MM/yyyy HH:mm:ss');
          } else if (fmt.includes('HH:mm')) {
            return format(parsed, 'dd/MM/yyyy HH:mm');
          }
          return format(parsed, 'dd/MM/yyyy');
        }
      } catch (e) {
        // Continua tentando outros formatos
      }
    }
    
    // Se não for nenhum formato conhecido
    console.debug('Formato de data não reconhecido:', dateString);
    return dateString; // Retornar o texto original em vez de '-' para ser mais flexível
  } catch (err) {
    console.debug('Erro ao formatar data:', err);
    return dateString; // Retornar o texto original em vez de '-'
  }
}
