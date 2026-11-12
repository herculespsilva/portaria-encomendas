import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { Link, router, useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { formatarApto, formatarDataHora } from '../lib/formato';
import { Botao, Cartao, cores, estilos } from '../components/ui';

type Item = {
  id: string;
  destinatario_texto: string | null;
  produto: string | null;
  transportadora: string | null;
  recebida_em: string;
  status: 'pendente' | 'retirada';
  apartamentos: { bloco: string | null; numero: string } | null;
  moradores: { nome: string } | null;
};

export default function Encomendas() {
  const [itens, setItens] = useState<Item[]>([]);
  const [filtro, setFiltro] = useState<'pendente' | 'retirada'>('pendente');
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const { data, error } = await supabase
      .from('encomendas')
      .select(
        'id, destinatario_texto, produto, transportadora, recebida_em, status, apartamentos(bloco, numero), moradores(nome)',
      )
      .eq('status', filtro)
      .order('recebida_em', { ascending: false })
      .limit(200);
    setCarregando(false);
    setErro(error ? error.message : null);
    setItens((data as Item[] | null) ?? []);
  }, [filtro]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  const termo = busca.trim().toLowerCase();
  const visiveis = termo
    ? itens.filter((i) =>
        [i.moradores?.nome, i.destinatario_texto, i.apartamentos?.numero, i.apartamentos?.bloco, i.produto]
          .filter(Boolean)
          .some((v) => v!.toLowerCase().includes(termo)),
      )
    : itens;

  return (
    <View style={estilos.tela}>
      <View style={[estilos.conteudo, { paddingBottom: 0 }]}>
        <Botao titulo="Escanear etiqueta" onPress={() => router.push('/escanear')} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['pendente', 'retirada'] as const).map((s) => (
            <Pressable
              key={s}
              onPress={() => setFiltro(s)}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 8,
                alignItems: 'center',
                backgroundColor: filtro === s ? cores.primaria : cores.cartao,
                borderWidth: 1,
                borderColor: filtro === s ? cores.primaria : cores.borda,
              }}
            >
              <Text style={{ color: filtro === s ? '#fff' : cores.texto, fontWeight: '600' }}>
                {s === 'pendente' ? 'Aguardando retirada' : 'Retiradas'}
              </Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          placeholder="Buscar por nome, apto, bloco ou produto"
          placeholderTextColor={cores.suave}
          value={busca}
          onChangeText={setBusca}
          style={estilos.input}
        />
        {erro && <Text style={estilos.erro}>{erro}</Text>}
      </View>
      <FlatList
        data={visiveis}
        keyExtractor={(i) => i.id}
        contentContainerStyle={estilos.conteudo}
        refreshControl={<RefreshControl refreshing={carregando} onRefresh={carregar} />}
        ListEmptyComponent={
          !carregando ? (
            <Text style={[estilos.suave, { textAlign: 'center', marginTop: 24 }]}>
              Nenhuma encomenda {filtro === 'pendente' ? 'aguardando retirada' : 'retirada'}.
            </Text>
          ) : undefined
        }
        renderItem={({ item }) => (
          <Link href={`/encomenda/${item.id}`} asChild>
            <Pressable>
              <Cartao>
                <Text style={estilos.subtitulo}>
                  {formatarApto(item.apartamentos?.bloco, item.apartamentos?.numero)}
                </Text>
                <Text style={estilos.texto}>
                  {item.moradores?.nome ?? item.destinatario_texto ?? 'Destinatário não identificado'}
                </Text>
                {item.produto && <Text style={estilos.suave}>{item.produto}</Text>}
                <Text style={estilos.suave}>
                  {[item.transportadora, `Recebida ${formatarDataHora(item.recebida_em)}`]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </Cartao>
            </Pressable>
          </Link>
        )}
        ListFooterComponent={
          <View style={{ gap: 8, marginTop: 8 }}>
            <Botao titulo="Apartamentos e moradores" variante="secundaria" onPress={() => router.push('/cadastros')} />
            <Botao titulo="Sair" variante="secundaria" onPress={() => supabase.auth.signOut()} />
          </View>
        }
      />
    </View>
  );
}
