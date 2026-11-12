import { useEffect, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { formatarApto, formatarDataHora } from '../../lib/formato';
import type { Tables } from '../../lib/database.types';
import { Botao, Campo, Cartao, estilos } from '../../components/ui';

type Detalhe = Tables<'encomendas'> & {
  apartamentos: { bloco: string | null; numero: string } | null;
  moradores: { nome: string; telefone: string | null } | null;
};

export default function DetalheEncomenda() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [enc, setEnc] = useState<Detalhe | null>(null);
  const [retiradoPor, setRetiradoPor] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('encomendas')
      .select('*, apartamentos(bloco, numero), moradores(nome, telefone)')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error) setErro(error.message);
        const d = data as Detalhe | null;
        setEnc(d);
        if (d?.moradores?.nome) setRetiradoPor(d.moradores.nome);
      });
  }, [id]);

  async function registrarRetirada() {
    setSalvando(true);
    const { error } = await supabase
      .from('encomendas')
      .update({ status: 'retirada', retirada_em: new Date().toISOString(), retirada_por: retiradoPor.trim() })
      .eq('id', id);
    setSalvando(false);
    if (error) setErro(error.message);
    else router.back();
  }

  if (!enc) {
    return (
      <ScrollView style={estilos.tela} contentContainerStyle={estilos.conteudo}>
        <Text style={erro ? estilos.erro : estilos.suave}>{erro ?? 'Carregando…'}</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={estilos.tela} contentContainerStyle={estilos.conteudo}>
      <Cartao>
        <Text style={estilos.titulo}>{formatarApto(enc.apartamentos?.bloco, enc.apartamentos?.numero)}</Text>
        <Text style={estilos.texto}>{enc.moradores?.nome ?? 'Morador não identificado'}</Text>
        {enc.moradores?.telefone && <Text style={estilos.suave}>{enc.moradores.telefone}</Text>}
      </Cartao>

      <Cartao>
        <Linha rotulo="Destinatário na etiqueta" valor={enc.destinatario_texto} />
        <Linha rotulo="Endereço" valor={enc.endereco_texto} />
        <Linha rotulo="Produto" valor={enc.produto} />
        <Linha rotulo="Transportadora" valor={enc.transportadora} />
        <Linha rotulo="Recebida em" valor={formatarDataHora(enc.recebida_em)} />
        {enc.status === 'retirada' && (
          <>
            <Linha rotulo="Retirada em" valor={enc.retirada_em && formatarDataHora(enc.retirada_em)} />
            <Linha rotulo="Retirada por" valor={enc.retirada_por} />
          </>
        )}
      </Cartao>

      {enc.status === 'pendente' && (
        <>
          <Campo rotulo="Quem está retirando" value={retiradoPor} onChangeText={setRetiradoPor} />
          <Botao
            titulo="Registrar retirada"
            variante="sucesso"
            onPress={registrarRetirada}
            carregando={salvando}
            desabilitado={!retiradoPor.trim()}
          />
        </>
      )}

      {enc.texto_ocr_bruto && (
        <Cartao>
          <Text style={estilos.rotulo}>Texto original da etiqueta</Text>
          <Text selectable style={estilos.suave}>{enc.texto_ocr_bruto}</Text>
        </Cartao>
      )}
      {erro && <Text style={estilos.erro}>{erro}</Text>}
    </ScrollView>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string | null | undefined }) {
  if (!valor) return null;
  return (
    <Text style={estilos.texto}>
      <Text style={estilos.rotulo}>{rotulo}: </Text>
      {valor}
    </Text>
  );
}
