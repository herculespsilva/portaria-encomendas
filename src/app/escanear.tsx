import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { escanearEtiqueta } from '../lib/leitura';
import { extrairCampos } from '../lib/etiqueta';
import { formatarApto } from '../lib/formato';
import type { SugestaoMorador, Tables } from '../lib/database.types';
import { Botao, Campo, Cartao, cores, estilos } from '../components/ui';

type Apto = Tables<'apartamentos'>;

export default function Escanear() {
  const [textoOcr, setTextoOcr] = useState('');
  const [destinatario, setDestinatario] = useState('');
  const [endereco, setEndereco] = useState('');
  const [produto, setProduto] = useState('');
  const [transportadora, setTransportadora] = useState('');
  const [sugestoes, setSugestoes] = useState<SugestaoMorador[]>([]);
  const [aptosCandidatos, setAptosCandidatos] = useState<Apto[]>([]);
  const [escolhido, setEscolhido] = useState<{ apartamento: Apto; moradorId: string | null; nome: string | null } | null>(null);
  const [lendo, setLendo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Abre o scanner automaticamente ao entrar na tela (no celular).
  useEffect(() => {
    if (Platform.OS !== 'web') ler();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function ler() {
    setErro(null);
    setLendo(true);
    try {
      const r = await escanearEtiqueta();
      if (r) await interpretar(r.texto);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao ler a etiqueta.');
    } finally {
      setLendo(false);
    }
  }

  async function interpretar(texto: string) {
    setTextoOcr(texto);
    const c = extrairCampos(texto);
    setDestinatario(c.destinatario ?? '');
    setEndereco(c.endereco ?? '');
    setProduto(c.produto ?? '');
    setTransportadora(c.transportadora ?? '');
    setEscolhido(null);

    // Moradores com nome parecido com o destinatário lido.
    const [porNome, porApto] = await Promise.all([
      c.destinatario
        ? supabase.rpc('buscar_moradores', { termo: c.destinatario, limite: 5 })
        : Promise.resolve({ data: [] as SugestaoMorador[], error: null }),
      c.apartamento
        ? (() => {
            let q = supabase.from('apartamentos').select('*').eq('numero', c.apartamento);
            if (c.bloco) q = q.eq('bloco', c.bloco);
            return q;
          })()
        : Promise.resolve({ data: [] as Apto[], error: null }),
    ]);
    const nomes = porNome.data ?? [];
    const aptos = porApto.data ?? [];
    setSugestoes(nomes);
    setAptosCandidatos(aptos);

    // Pré-seleciona quando nome e apartamento concordam, ou quando só há um candidato forte.
    const combina = nomes.find((s) => aptos.some((a) => a.id === s.apartamento_id));
    const melhor = combina ?? (nomes[0]?.similaridade >= 0.5 ? nomes[0] : undefined);
    if (melhor) {
      setEscolhido({
        apartamento: { id: melhor.apartamento_id, bloco: melhor.bloco, numero: melhor.numero, criado_em: '' },
        moradorId: melhor.morador_id,
        nome: melhor.nome,
      });
    } else if (aptos.length === 1) {
      setEscolhido({ apartamento: aptos[0], moradorId: null, nome: null });
    }
  }

  async function salvar() {
    if (!escolhido) {
      setErro('Selecione o apartamento de destino.');
      return;
    }
    setSalvando(true);
    setErro(null);
    const { error } = await supabase.from('encomendas').insert({
      apartamento_id: escolhido.apartamento.id,
      morador_id: escolhido.moradorId,
      destinatario_texto: destinatario || null,
      endereco_texto: endereco || null,
      produto: produto || null,
      transportadora: transportadora || null,
      texto_ocr_bruto: textoOcr || null,
    });
    setSalvando(false);
    if (error) setErro(error.message);
    else router.back();
  }

  return (
    <ScrollView style={estilos.tela} contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
      <Botao
        titulo={textoOcr ? 'Escanear novamente' : 'Escanear etiqueta'}
        variante={textoOcr ? 'secundaria' : 'primaria'}
        onPress={ler}
        carregando={lendo}
        desabilitado={Platform.OS === 'web'}
      />

      <Campo
        rotulo="Texto lido da etiqueta (pode corrigir)"
        value={textoOcr}
        onChangeText={setTextoOcr}
        onEndEditing={() => textoOcr && interpretar(textoOcr)}
        multiline
        style={[estilos.input, { minHeight: 120, textAlignVertical: 'top', fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }) }]}
        placeholder={Platform.OS === 'web' ? 'Na web, cole aqui o texto de uma etiqueta para testar.' : undefined}
      />
      {Platform.OS === 'web' && (
        <Botao titulo="Interpretar texto" variante="secundaria" onPress={() => interpretar(textoOcr)} desabilitado={!textoOcr} />
      )}

      {textoOcr !== '' && (
        <>
          <Text style={estilos.subtitulo}>Destino</Text>
          {escolhido ? (
            <Cartao>
              <Text style={estilos.subtitulo}>
                {formatarApto(escolhido.apartamento.bloco, escolhido.apartamento.numero)}
              </Text>
              <Text style={estilos.texto}>
                {escolhido.nome ?? 'Morador não identificado'}
              </Text>
              <Pressable onPress={() => setEscolhido(null)}>
                <Text style={{ color: cores.primaria, fontWeight: '600' }}>Trocar</Text>
              </Pressable>
            </Cartao>
          ) : (
            <SeletorDestino
              sugestoes={sugestoes}
              aptos={aptosCandidatos}
              onEscolher={(apartamento, moradorId, nome) => setEscolhido({ apartamento, moradorId, nome })}
            />
          )}

          <Campo rotulo="Destinatário (como está na etiqueta)" value={destinatario} onChangeText={setDestinatario} />
          <Campo rotulo="Endereço" value={endereco} onChangeText={setEndereco} />
          <Campo rotulo="Produto" value={produto} onChangeText={setProduto} placeholder="Ex.: caixa média, envelope" />
          <Campo rotulo="Transportadora / loja" value={transportadora} onChangeText={setTransportadora} />
        </>
      )}

      {erro && <Text style={estilos.erro}>{erro}</Text>}
      {textoOcr !== '' && (
        <Botao titulo="Registrar encomenda" variante="sucesso" onPress={salvar} carregando={salvando} />
      )}
    </ScrollView>
  );
}

function SeletorDestino({
  sugestoes,
  aptos,
  onEscolher,
}: {
  sugestoes: SugestaoMorador[];
  aptos: Apto[];
  onEscolher: (apto: Apto, moradorId: string | null, nome: string | null) => void;
}) {
  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState<SugestaoMorador[]>([]);

  async function buscar(t: string) {
    setBusca(t);
    if (t.trim().length < 3) {
      setResultados([]);
      return;
    }
    const { data } = await supabase.rpc('buscar_moradores', { termo: t.trim(), limite: 8 });
    setResultados(data ?? []);
  }

  const opcoes = busca.trim().length >= 3 ? resultados : sugestoes;

  return (
    <View style={{ gap: 8 }}>
      {opcoes.map((s) => (
        <Pressable
          key={s.morador_id}
          onPress={() =>
            onEscolher({ id: s.apartamento_id, bloco: s.bloco, numero: s.numero, criado_em: '' }, s.morador_id, s.nome)
          }
        >
          <Cartao>
            <Text style={estilos.subtitulo}>{s.nome}</Text>
            <Text style={estilos.suave}>{formatarApto(s.bloco, s.numero)}</Text>
          </Cartao>
        </Pressable>
      ))}
      {busca.trim().length < 3 &&
        aptos.map((a) => (
          <Pressable key={a.id} onPress={() => onEscolher(a, null, null)}>
            <Cartao>
              <Text style={estilos.subtitulo}>{formatarApto(a.bloco, a.numero)}</Text>
              <Text style={estilos.suave}>Apartamento lido na etiqueta</Text>
            </Cartao>
          </Pressable>
        ))}
      {opcoes.length === 0 && aptos.length === 0 && (
        <Text style={estilos.suave}>Nenhum morador correspondente. Busque pelo nome:</Text>
      )}
      <Campo rotulo="Buscar morador" value={busca} onChangeText={buscar} placeholder="Digite ao menos 3 letras" />
    </View>
  );
}
