import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { formatarApto } from '../lib/formato';
import type { Tables } from '../lib/database.types';
import { Botao, Campo, Cartao, cores, estilos } from '../components/ui';

type Apto = Tables<'apartamentos'> & { moradores: Pick<Tables<'moradores'>, 'id' | 'nome' | 'ativo'>[] };

export default function Cadastros() {
  const [aptos, setAptos] = useState<Apto[]>([]);
  const [bloco, setBloco] = useState('');
  const [numero, setNumero] = useState('');
  const [aberto, setAberto] = useState<string | null>(null);
  const [nomeMorador, setNomeMorador] = useState('');
  const [telefone, setTelefone] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const { data, error } = await supabase
      .from('apartamentos')
      .select('*, moradores(id, nome, ativo)')
      .order('bloco')
      .order('numero');
    setErro(error?.message ?? null);
    setAptos((data as Apto[] | null) ?? []);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function addApto() {
    const { error } = await supabase
      .from('apartamentos')
      .insert({ bloco: bloco.trim().toUpperCase() || null, numero: numero.trim().toUpperCase() });
    if (error) {
      setErro(error.code === '23505' ? 'Esse apartamento já está cadastrado.' : error.message);
      return;
    }
    setBloco('');
    setNumero('');
    carregar();
  }

  async function addMorador(apartamentoId: string) {
    const { error } = await supabase
      .from('moradores')
      .insert({ apartamento_id: apartamentoId, nome: nomeMorador.trim(), telefone: telefone.trim() || null });
    if (error) {
      setErro(error.message);
      return;
    }
    setNomeMorador('');
    setTelefone('');
    carregar();
  }

  async function alternarAtivo(id: string, ativo: boolean) {
    await supabase.from('moradores').update({ ativo: !ativo }).eq('id', id);
    carregar();
  }

  return (
    <ScrollView style={estilos.tela} contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
      <Text style={estilos.subtitulo}>Novo apartamento</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Campo rotulo="Bloco (opcional)" value={bloco} onChangeText={setBloco} autoCapitalize="characters" />
        </View>
        <View style={{ flex: 1 }}>
          <Campo rotulo="Número" value={numero} onChangeText={setNumero} autoCapitalize="characters" />
        </View>
      </View>
      <Botao titulo="Adicionar apartamento" onPress={addApto} desabilitado={!numero.trim()} />
      {erro && <Text style={estilos.erro}>{erro}</Text>}

      <Text style={[estilos.subtitulo, { marginTop: 8 }]}>Apartamentos ({aptos.length})</Text>
      {aptos.map((a) => (
        <Cartao key={a.id}>
          <Pressable onPress={() => setAberto(aberto === a.id ? null : a.id)}>
            <Text style={estilos.subtitulo}>{formatarApto(a.bloco, a.numero)}</Text>
            <Text style={estilos.suave}>
              {a.moradores.filter((m) => m.ativo).map((m) => m.nome).join(', ') || 'Sem moradores'}
            </Text>
          </Pressable>
          {aberto === a.id && (
            <View style={{ gap: 8, marginTop: 8 }}>
              {a.moradores.map((m) => (
                <Pressable key={m.id} onPress={() => alternarAtivo(m.id, m.ativo)}>
                  <Text style={[estilos.texto, !m.ativo && { color: cores.suave, textDecorationLine: 'line-through' }]}>
                    {m.nome} {m.ativo ? '' : '(inativo)'} · toque para {m.ativo ? 'desativar' : 'reativar'}
                  </Text>
                </Pressable>
              ))}
              <Campo rotulo="Nome do morador" value={nomeMorador} onChangeText={setNomeMorador} />
              <Campo rotulo="Telefone (opcional)" value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" />
              <Botao
                titulo="Adicionar morador"
                variante="secundaria"
                onPress={() => addMorador(a.id)}
                desabilitado={!nomeMorador.trim()}
              />
            </View>
          )}
        </Cartao>
      ))}
    </ScrollView>
  );
}
