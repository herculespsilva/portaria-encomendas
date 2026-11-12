# Portaria · Encomendas

App mobile (Expo / React Native) para a portaria registrar encomendas:
fotografa a etiqueta (Mercado Livre, Shopee, Correios…), transcreve o texto
no próprio celular, identifica destinatário e apartamento e salva no Supabase.

## Fluxo

1. **Escanear etiqueta** – scanner de documentos nativo recorta e endireita a etiqueta.
2. **OCR** – Google ML Kit transcreve o texto no aparelho (offline, sem custo).
3. **Extração** – `src/lib/etiqueta.ts` separa destinatário, endereço, apto/bloco, CEP, produto e transportadora.
4. **Cruzamento** – a função `buscar_moradores` (busca aproximada, `pg_trgm`) sugere o morador e o apartamento.
5. O porteiro confere, corrige se preciso e **registra**. Depois, **registra a retirada**.

## Estrutura

```
src/app/            telas (Expo Router)
  login.tsx         login do porteiro (Supabase Auth)
  index.tsx         encomendas aguardando retirada / retiradas, busca
  escanear.tsx      scanner → OCR → extração → sugestão de destino → salvar
  encomenda/[id]    detalhes e registro de retirada
  cadastros.tsx     apartamentos e moradores
src/lib/
  etiqueta.ts       extração de campos do texto (com testes)
  leitura.ts        scanner + OCR (módulos nativos)
  supabase.ts       cliente Supabase
supabase/migrations schema do banco
```

## Rodando

```bash
npm install
cp .env.example .env.local
```

O scanner e o OCR usam módulos nativos, então **não funcionam no Expo Go**.
É preciso um *development build* (uma vez):

```bash
npx eas-cli@latest build --profile development --platform android
```

Instale o APK gerado no celular e depois:

```bash
npx expo start --dev-client
```

Sem celular, `npx expo start --web` abre a versão web: o scanner fica
desativado, mas dá para colar o texto de uma etiqueta e testar o restante do fluxo.

## Primeiro acesso

1. No painel do Supabase → **Authentication → Users → Add user**, crie o usuário da portaria (e-mail e senha).
2. Entre no app e cadastre apartamentos e moradores em **Apartamentos e moradores**.

## Scripts

- `npm test` – testes do extrator de etiquetas
- `npm run typecheck` – verificação de tipos

## Privacidade (LGPD)

Etiquetas têm nome e endereço. O OCR roda no aparelho e os dados ficam só no
Supabase do condomínio, acessíveis apenas a usuários autenticados (RLS).
