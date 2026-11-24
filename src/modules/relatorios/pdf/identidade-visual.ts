// Identidade visual dos relatórios: a mesma logo do sistema (app/icon.svg do
// front — patinha branca sobre quadrado laranja em degradê) e a capa.

export const CORES_MARCA = {
  claro: '#E07040',
  escuro: '#8F3E18',
  primaria: '#C2410C',
};

// Patinha em uma caixa de 64x64 (mesmas formas do ícone do front).
const PATINHA = `
  <circle cx="17.9" cy="25.6" r="5.6"/>
  <circle cx="27.5" cy="18.6" r="6.1"/>
  <circle cx="36.5" cy="18.6" r="6.1"/>
  <circle cx="46.1" cy="25.6" r="5.6"/>
  <ellipse cx="32" cy="42.2" rx="12.8" ry="10.9"/>`;

const DEGRADE = `
  <linearGradient id="marca" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${CORES_MARCA.claro}"/>
    <stop offset="1" stop-color="${CORES_MARCA.escuro}"/>
  </linearGradient>`;

export function logoSvg(tamanho: number, invertida = false): string {
  const fundo = invertida ? '#FFFFFF' : 'url(#marca)';
  const patinha = invertida ? CORES_MARCA.primaria : '#FFFFFF';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${tamanho}" height="${tamanho}" viewBox="0 0 64 64">` +
    `<defs>${DEGRADE}</defs>` +
    `<rect width="64" height="64" rx="14" fill="${fundo}"/>` +
    `<g fill="${patinha}">${PATINHA}</g></svg>`
  );
}

function patinhaDecorativa(
  x: number,
  y: number,
  escala: number,
  rotacao: number,
  opacidade: number,
) {
  return `<g transform="translate(${x} ${y}) rotate(${rotacao}) scale(${escala}) translate(-32 -34)" fill="#FFFFFF" fill-opacity="${opacidade}">${PATINHA}</g>`;
}

// Fundo da capa: faixa em degradê com borda curva e patinhas decorativas.
export function fundoCapaSvg(largura: number, altura: number): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${altura}" viewBox="0 0 ${largura} ${altura}">` +
    `<defs>${DEGRADE}</defs>` +
    `<rect width="${largura}" height="${altura}" fill="#FFFFFF"/>` +
    `<path d="M0,0 H${largura} V500 C${largura * 0.72},560 ${largura * 0.35},470 0,535 Z" fill="url(#marca)"/>` +
    patinhaDecorativa(largura - 110, 380, 4.2, 18, 0.1) +
    patinhaDecorativa(largura - 70, 150, 1.5, -15, 0.08) +
    patinhaDecorativa(largura - 205, 215, 1, 10, 0.07) +
    patinhaDecorativa(70, 470, 1.2, -25, 0.06) +
    `<rect x="40" y="${altura - 66}" width="${largura - 80}" height="0.8" fill="#F1E4DA"/>` +
    // Fica no fundo (e não no conteúdo) para não ser empurrado à página seguinte.
    `<text x="40" y="${altura - 50}" font-family="Roboto" font-size="8" fill="#64748B">Documento gerado pelo sistema SOS Bicho Solto para gestão interna e prestação de contas à sociedade.</text>` +
    `</svg>`
  );
}
