/**
 * Carrega uma imagem de uma URL pública e retorna como base64
 */
export async function getImageBase64(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Falha ao carregar: ${url}`);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn('[pdfImageHelper] Não foi possível carregar imagem:', url, e);
    return null;
  }
}

/**
 * Pré-carrega imagens do cabeçalho PDF (suporta logo personalizada)
 */
export async function precarregarImagensPDF(customLogo = null) {
  let logoPromise;

  if (customLogo) {
    if (typeof customLogo === 'string' && customLogo.startsWith('data:image/')) {
      // Já é Base64
      logoPromise = Promise.resolve(customLogo);
    } else {
      // URL de imagem externa ou local
      logoPromise = getImageBase64(customLogo);
    }
  } else {
    logoPromise = getImageBase64('/logo.png');
  }

  const [mascote, logoCarregada] = await Promise.all([
    getImageBase64('/mascote.png'),
    logoPromise
  ]);

  // Se a logo customizada falhar, faz fallback para a logo padrão
  const logo = logoCarregada || (customLogo ? await getImageBase64('/logo.png') : null);

  return { mascote, logo };
}

/**
 * Prepara qualquer imagem de produto para inclusão no PDF:
 * 1. Obtém as dimensões reais (naturalWidth / naturalHeight) para calcular a proporção exata e não achatar
 * 2. Composição com fundo branco sólido (#FFFFFF) para eliminar definitivamente o bug de fundo preto em PNGs transparentes
 * 3. Preserva 100% dos pixels e detalhes do produto (lentes, viseiras pretas, conectores) sem qualquer alteração destrutiva
 */
export async function prepararImagemProdutoParaPDF(base64OrUrl) {
  if (!base64OrUrl) return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const origW = img.naturalWidth || img.width || 400;
        const origH = img.naturalHeight || img.height || 400;
        const aspect = origW / (origH || 1);

        // Limita a resolução máxima para otimizar o PDF sem perder nitidez
        const MAX = 600;
        let w = origW;
        let h = origH;
        if (w > MAX || h > MAX) {
          if (w > h) {
            h = Math.round((h * MAX) / w);
            w = MAX;
          } else {
            w = Math.round((w * MAX) / h);
            h = MAX;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        // 1. Sempre preenche o fundo com branco puro
        // Isso resolve o bug do jsPDF que renderiza transparências de PNGs como preto
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);

        // 2. Desenha a imagem por cima mantendo seus pixels originais
        ctx.drawImage(img, 0, 0, w, h);

        // 3. Exporta como JPEG com fundo branco garantido
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

        resolve({
          dataUrl,
          width: origW,
          height: origH,
          aspect,
          format: 'JPEG'
        });
      } catch (err) {
        console.warn('[pdfImageHelper] Erro ao preparar imagem para PDF:', err);
        resolve({
          dataUrl: base64OrUrl,
          width: 1,
          height: 1,
          aspect: 1,
          format: 'JPEG'
        });
      }
    };

    img.onerror = () => {
      console.warn('[pdfImageHelper] Falha ao carregar imagem do produto:', base64OrUrl);
      resolve(null);
    };

    img.src = base64OrUrl;
  });
}
