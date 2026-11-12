import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extrairCampos } from './etiqueta.ts';

test('etiqueta estilo Mercado Livre com destinatário em linha própria', () => {
  const texto = `Mercado Envios
DESTINATÁRIO
Maria Aparecida Souza
Rua das Flores, 120
Apto 52 Bloco B
Jardim Paulista - São Paulo/SP
CEP: 01415-001
REMETENTE
Loja Exemplo LTDA
Av. Industrial, 900
CEP 06000-000`;
  const c = extrairCampos(texto);
  assert.equal(c.destinatario, 'Maria Aparecida Souza');
  assert.equal(c.endereco, 'Rua das Flores, 120 - Apto 52 Bloco B');
  assert.equal(c.apartamento, '52');
  assert.equal(c.bloco, 'B');
  assert.equal(c.cep, '01415-001');
  assert.equal(c.transportadora, 'Mercado Livre');
});

test('etiqueta estilo Shopee com rótulos na mesma linha', () => {
  const texto = `Shopee Xpress
Remetente: Vendedor Teste
Destinatário: João Pedro Lima
Endereço: Avenida Brasil 1500 ap 1203 torre 2
Centro, Campinas - SP 13010-100
Conteúdo: Fone de ouvido bluetooth`;
  const c = extrairCampos(texto);
  assert.equal(c.destinatario, 'João Pedro Lima');
  assert.equal(c.endereco, 'Avenida Brasil 1500 ap 1203 torre 2');
  assert.equal(c.apartamento, '1203');
  assert.equal(c.bloco, '2');
  assert.equal(c.cep, '13010-100');
  assert.equal(c.produto, 'Fone de ouvido bluetooth');
  assert.equal(c.transportadora, 'Shopee');
});

test('texto sem rótulos devolve campos nulos sem quebrar', () => {
  const c = extrairCampos('texto ilegível\n12 34');
  assert.equal(c.destinatario, null);
  assert.equal(c.endereco, null);
  assert.equal(c.apartamento, null);
  assert.equal(c.transportadora, null);
});

test('apartamento com "nº" e CEP sem hífen', () => {
  const c = extrairCampos('DESTINATARIO\nCarlos Alberto Nunes\nRua Um 10 Apto nº 301\nCEP 04567890\nCorreios SEDEX');
  assert.equal(c.apartamento, '301');
  assert.equal(c.cep, '04567-890');
  assert.equal(c.transportadora, 'Correios');
});
