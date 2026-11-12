export function formatarApto(bloco: string | null | undefined, numero: string | null | undefined): string {
  if (!numero) return 'Sem apartamento';
  return bloco ? `Bloco ${bloco} · Apto ${numero}` : `Apto ${numero}`;
}

export function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
