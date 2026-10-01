/**
 * Converte cor HEX (#RRGGBB ou #RGB) para objeto RGB { r, g, b }
 */
export function hexToRgb(hex, fallback = { r: 0, g: 200, b: 255 }) {
  if (!hex || typeof hex !== 'string') return fallback;
  
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  
  if (cleanHex.length !== 6) return fallback;
  
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return fallback;
  
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

/**
 * Escurece ou clareia uma cor HEX por uma porcentagem (-100 a 100)
 */
export function adjustColorBrightness(hex, percent) {
  const { r, g, b } = hexToRgb(hex);
  const factor = 1 + percent / 100;
  const newR = Math.min(255, Math.max(0, Math.round(r * factor)));
  const newG = Math.min(255, Math.max(0, Math.round(g * factor)));
  const newB = Math.min(255, Math.max(0, Math.round(b * factor)));
  
  return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`;
}

/**
 * Paletas pré-definidas para seleção rápida
 */
export const PALETAS_PREDEFINIDAS = [
  {
    id: 'zeu-cyan',
    nome: 'Ciano Elétrico (Zeu-Tech)',
    corPrimaria: '#00c8ff',
    corSidebar: '#060d30',
    descricao: 'Padrão tecnológico e futurista'
  },
  {
    id: 'navy-blue',
    nome: 'Azul Corporativo',
    corPrimaria: '#2563eb',
    corSidebar: '#0f172a',
    descricao: 'Profissional, sério e elegante'
  },
  {
    id: 'emerald-green',
    nome: 'Verde Esmeralda',
    corPrimaria: '#10b981',
    corSidebar: '#064e3b',
    descricao: 'Moderno, sustentável e revigorante'
  },
  {
    id: 'amber-orange',
    nome: 'Laranja / Âmbar',
    corPrimaria: '#f97316',
    corSidebar: '#1c1917',
    descricao: 'Enérgico, caloroso e dinâmico'
  },
  {
    id: 'purple-tech',
    nome: 'Roxo Moderno',
    corPrimaria: '#8b5cf6',
    corSidebar: '#1e1b4b',
    descricao: 'Inovador, criativo e sofisticado'
  },
  {
    id: 'ruby-red',
    nome: 'Vermelho Rubi',
    corPrimaria: '#ef4444',
    corSidebar: '#18181b',
    descricao: 'Forte, imponente e marcante'
  },
  {
    id: 'slate-dark',
    nome: 'Chumbo / Grafite',
    corPrimaria: '#38bdf8',
    corSidebar: '#111827',
    descricao: 'Clean, minimalista e neutro'
  }
];
