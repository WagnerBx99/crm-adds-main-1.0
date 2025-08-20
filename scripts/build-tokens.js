import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lê os tokens de cor
const colorTokens = JSON.parse(fs.readFileSync('./tokens/color.json', 'utf8'));

// Função para gerar CSS variables
function generateCSSVariables(tokens, prefix = '') {
  let css = '';
  
  function traverse(obj, currentPath = []) {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        if (value.light && value.dark) {
          // É um token de cor com variantes light/dark
          const varName = `--${currentPath.concat(key).join('-')}`;
          css += `    ${varName}: ${value.light};\n`;
        } else if (!['hover', 'active', 'disabled', 'value'].includes(key)) {
          // Continua navegando na estrutura
          traverse(value, currentPath.concat(key));
        }
      }
    }
  }
  
  traverse(tokens);
  return css;
}

// Função para gerar CSS variables do tema dark
function generateDarkCSSVariables(tokens) {
  let css = '';
  
  function traverse(obj, currentPath = []) {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        if (value.light && value.dark) {
          // É um token de cor com variantes light/dark
          const varName = `--${currentPath.concat(key).join('-')}`;
          css += `    ${varName}: ${value.dark};\n`;
        } else if (!['hover', 'active', 'disabled', 'value'].includes(key)) {
          // Continua navegando na estrutura
          traverse(value, currentPath.concat(key));
        }
      }
    }
  }
  
  traverse(tokens);
  return css;
}

// Função para gerar classes Tailwind
function generateTailwindColors(tokens) {
  const colors = {};
  
  function traverse(obj, currentPath = []) {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        if (value.value) {
          // É um token de cor
          const colorPath = currentPath.concat(key);
          const colorKey = colorPath.join('-');
          
          colors[colorKey] = {
            DEFAULT: value.value,
            hover: value.hover || `color-mix(in srgb, ${value.value} 85%, white)`,
            active: value.active || `color-mix(in srgb, ${value.value} 70%, black)`,
            disabled: value.disabled || `color-mix(in srgb, ${value.value} 40%, transparent)`
          };
        } else if (!['hover', 'active', 'disabled', 'light', 'dark'].includes(key)) {
          traverse(value, currentPath.concat(key));
        }
      }
    }
  }
  
  traverse(tokens);
  return colors;
}

// Gera o arquivo CSS de tokens
const lightVars = generateCSSVariables(colorTokens.color);
const darkVars = generateDarkCSSVariables(colorTokens.color);

const cssContent = `/* Tokens de Design - Gerado automaticamente */
:root {
${lightVars}}

[data-theme="dark"] {
${darkVars}}
`;

// Salva o arquivo CSS
const outputDir = './src/styles';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(path.join(outputDir, 'tokens.css'), cssContent);

// Gera configuração para Tailwind
const tailwindColors = generateTailwindColors(colorTokens.color);

const tailwindConfig = `// Configuração de cores gerada automaticamente
export const designTokenColors = ${JSON.stringify(tailwindColors, null, 2)};
`;

fs.writeFileSync('./src/styles/tailwind-tokens.js', tailwindConfig);

console.log('✅ Design tokens gerados com sucesso!');
console.log('📄 Arquivos criados:');
console.log('  - src/styles/tokens.css');
console.log('  - src/styles/tailwind-tokens.js'); 