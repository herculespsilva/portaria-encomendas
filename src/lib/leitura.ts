import { Platform } from 'react-native';

/**
 * Abre o scanner de documentos nativo (recorta e endireita a etiqueta)
 * e transcreve o texto com o ML Kit, tudo no próprio aparelho.
 * Retorna null se o usuário cancelar.
 * Requer development build (não funciona no Expo Go nem na web).
 */
export async function escanearEtiqueta(): Promise<{ imagem: string; texto: string } | null> {
  if (Platform.OS === 'web') {
    throw new Error('O scanner só funciona no celular. Na web, cole o texto manualmente.');
  }
  // Import dinâmico: os módulos nativos não existem na web.
  const { default: DocumentScanner, ScanDocumentResponseStatus } = await import(
    'react-native-document-scanner-plugin'
  );
  const { default: TextRecognition } = await import('@react-native-ml-kit/text-recognition');

  const resp = await DocumentScanner.scanDocument({ maxNumDocuments: 1, croppedImageQuality: 100 });
  const imagem = resp.scannedImages?.[0];
  if (resp.status === ScanDocumentResponseStatus.Cancel || !imagem) return null;

  const resultado = await TextRecognition.recognize(imagem);
  // Reconstrói o texto linha a linha, na ordem visual dos blocos.
  const texto = resultado.blocks
    .slice()
    .sort((a, b) => (a.frame?.top ?? 0) - (b.frame?.top ?? 0))
    .flatMap((b) => b.lines.map((l) => l.text))
    .join('\n');
  return { imagem, texto: texto || resultado.text };
}
