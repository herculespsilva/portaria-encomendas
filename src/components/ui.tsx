import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

export const cores = {
  fundo: '#F4F6F8',
  cartao: '#FFFFFF',
  texto: '#1B1F24',
  suave: '#5B6470',
  borda: '#D8DDE3',
  primaria: '#1F5FBF',
  sucesso: '#1E7F4F',
  perigo: '#B42318',
};

type BotaoProps = {
  titulo: string;
  onPress: () => void;
  variante?: 'primaria' | 'secundaria' | 'sucesso';
  carregando?: boolean;
  desabilitado?: boolean;
};

export function Botao({ titulo, onPress, variante = 'primaria', carregando, desabilitado }: BotaoProps) {
  const secundaria = variante === 'secundaria';
  const cor = variante === 'sucesso' ? cores.sucesso : cores.primaria;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={desabilitado || carregando}
      style={({ pressed }) => [
        estilos.botao,
        secundaria ? { borderColor: cor, borderWidth: 1.5 } : { backgroundColor: cor },
        (pressed || desabilitado) && { opacity: 0.6 },
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={secundaria ? cor : '#fff'} />
      ) : (
        <Text style={[estilos.botaoTexto, { color: secundaria ? cor : '#fff' }]}>{titulo}</Text>
      )}
    </Pressable>
  );
}

export function Campo({ rotulo, ...props }: TextInputProps & { rotulo: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={estilos.rotulo}>{rotulo}</Text>
      <TextInput placeholderTextColor={cores.suave} style={estilos.input} {...props} />
    </View>
  );
}

export function Cartao({ children }: { children: ReactNode }) {
  return <View style={estilos.cartao}>{children}</View>;
}

export const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: 16, gap: 12 },
  titulo: { fontSize: 20, fontWeight: '700', color: cores.texto },
  subtitulo: { fontSize: 15, fontWeight: '600', color: cores.texto },
  texto: { fontSize: 15, color: cores.texto },
  suave: { fontSize: 13, color: cores.suave },
  erro: { fontSize: 14, color: cores.perigo },
  rotulo: { fontSize: 13, fontWeight: '600', color: cores.suave },
  input: {
    backgroundColor: cores.cartao,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: cores.texto,
  },
  botao: {
    minHeight: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  botaoTexto: { fontSize: 16, fontWeight: '600' },
  cartao: {
    backgroundColor: cores.cartao,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: cores.borda,
    padding: 14,
    gap: 6,
  },
});
