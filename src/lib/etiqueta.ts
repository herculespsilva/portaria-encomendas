// Extrai campos do texto transcrito (OCR) de uma etiqueta de envio.
// Heurísticas simples e sem dependências: o porteiro sempre revisa o resultado.

export interface CamposEtiqueta {
  destinatario: string | null;
  endereco: string | null;
  apartamento: string | null;
  bloco: string | null;
  cep: string | null;
  produto: string | null;
  transportadora: string | null;
}

const TRANSPORTADORAS: [RegExp, string][] = [
  [/mercado\s*(livre|envios)|\bmeli\b/i, 'Mercado Livre'],
  [/shopee/i, 'Shopee'],
  [/amazon/i, 'Amazon'],
  [/\bsedex\b|\bpac\b|correios/i, 'Correios'],
  [/jadlog/i, 'Jadlog'],
  [/loggi/i, 'Loggi'],
  [/total\s*express/i, 'Total Express'],
  [/\bj\s*&\s*t\b|jt\s*express/i, 'J&T Express'],
  [/magalu|magazine\s*luiza/i, 'Magalu'],
  [/shein/i, 'Shein'],
];

const RE_CEP = /\b(\d{5})-?\s?(\d{3})\b/;
const RE_APTO = /\b(?:apartamento|apto|apt|ap)\b\.?\s*(?:n[º°o]\.?\s*)?[:\-]?\s*(\d{1,5}[A-Z]?)\b/i;
const RE_BLOCO = /\b(?:bloco|bl|torre|tr)\b\.?\s*[:\-]?\s*([A-Z0-9]{1,3})\b/i;
const RE_LOGRADOURO =
  /^(?:endere[cç]o\s*:?\s*)?(rua|r\.|av\.?|avenida|alameda|al\.|travessa|tv\.|estrada|rodovia|pra[cç]a|largo|via)\s/i;
const RE_DEST = /destinat[aá]rio|^para\s*:|^entregar\s+(?:a|para)\b/i;
const RE_REMET = /remetente|^de\s*:|devolu[cç][aã]o/i;
const RE_PRODUTO = /^(?:produto|conte[uú]do|itens?|descri[cç][aã]o|sku)\s*[:\-]\s*(.+)$/i;
const RE_ROTULO_GENERICO = /^[A-ZÀ-Ú\s]{3,30}:?$/; // linhas só com rótulo em caixa alta

function limpar(linha: string): string {
  return linha.replace(/\s+/g, ' ').trim();
}

function depoisDoRotulo(linha: string): string | null {
  const i = linha.indexOf(':');
  if (i === -1) return null;
  const resto = limpar(linha.slice(i + 1));
  return resto.length > 0 ? resto : null;
}

function pareceNome(linha: string): boolean {
  if (linha.length < 4 || linha.length > 60) return false;
  if (/\d{3,}/.test(linha)) return false; // nomes não têm números longos
  if (RE_LOGRADOURO.test(linha) || RE_CEP.test(linha)) return false;
  return linha.split(' ').filter((p) => /[a-zà-ú]{2,}/i.test(p)).length >= 2;
}

/** Linhas que pertencem ao bloco do destinatário (exclui o remetente quando possível). */
function blocoDestinatario(linhas: string[]): string[] {
  const iDest = linhas.findIndex((l) => RE_DEST.test(l));
  if (iDest === -1) return linhas;
  const resto = linhas.slice(iDest);
  const iRemet = resto.findIndex((l, i) => i > 0 && RE_REMET.test(l));
  return iRemet === -1 ? resto : resto.slice(0, iRemet);
}

export function extrairCampos(textoOcr: string): CamposEtiqueta {
  const linhas = textoOcr.split(/\r?\n/).map(limpar).filter(Boolean);
  const bloco = blocoDestinatario(linhas);
  const textoBloco = bloco.join('\n');

  // Destinatário: texto após "Destinatário:" ou a primeira linha com cara de nome logo abaixo.
  let destinatario: string | null = null;
  if (bloco.length > 0 && RE_DEST.test(bloco[0])) {
    const mesmoLinha = depoisDoRotulo(bloco[0]);
    destinatario =
      mesmoLinha && pareceNome(mesmoLinha)
        ? mesmoLinha
        : bloco.slice(1, 4).find((l) => pareceNome(l) && !RE_ROTULO_GENERICO.test(l)) ?? null;
  }

  // Endereço: linha de logradouro, juntando a linha seguinte se for complemento.
  let endereco: string | null = null;
  const iEnd = bloco.findIndex((l) => RE_LOGRADOURO.test(l));
  if (iEnd !== -1) {
    endereco = bloco[iEnd].replace(/^endere[cç]o\s*:?\s*/i, '');
    const prox = bloco[iEnd + 1];
    if (prox && (RE_APTO.test(prox) || RE_BLOCO.test(prox)) && !RE_CEP.test(prox)) {
      endereco += ' - ' + prox;
    }
  }

  const apto = textoBloco.match(RE_APTO) ?? textoOcr.match(RE_APTO);
  const blocoM = textoBloco.match(RE_BLOCO) ?? textoOcr.match(RE_BLOCO);
  const cep = textoBloco.match(RE_CEP) ?? textoOcr.match(RE_CEP);

  let produto: string | null = null;
  for (const l of linhas) {
    const m = l.match(RE_PRODUTO);
    if (m) {
      produto = limpar(m[1]);
      break;
    }
  }

  const transportadora = TRANSPORTADORAS.find(([re]) => re.test(textoOcr))?.[1] ?? null;

  return {
    destinatario,
    endereco,
    apartamento: apto ? apto[1].toUpperCase() : null,
    bloco: blocoM ? blocoM[1].toUpperCase() : null,
    cep: cep ? `${cep[1]}-${cep[2]}` : null,
    produto,
    transportadora,
  };
}
