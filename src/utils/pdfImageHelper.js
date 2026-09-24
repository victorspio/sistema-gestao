/**
 * Carrega uma imagem de uma URL pública e retorna como base64
 * Suporta PNG com transparência (retorna como PNG para preservar o canal alpha)
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
 * Pré-carrega todas as imagens do cabeçalho PDF de uma vez
 */
export async function precarregarImagensPDF() {
  const [mascote, logo] = await Promise.all([
    getImageBase64('/mascote.png'),
    getImageBase64('/logo.png'),
  ]);
  return { mascote, logo };
}
