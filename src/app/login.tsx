import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { Botao, Campo, estilos } from '../components/ui';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    setErro(null);
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    setCarregando(false);
    if (error) setErro('E-mail ou senha inválidos.');
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[estilos.tela, { justifyContent: 'center' }]}
    >
      <View style={[estilos.conteudo, { width: '100%', maxWidth: 420, alignSelf: 'center' }]}>
        <Text style={[estilos.titulo, { fontSize: 26 }]}>Portaria · Encomendas</Text>
        <Text style={estilos.suave}>Entre com o usuário da portaria.</Text>
        <Campo
          rotulo="E-mail"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <Campo rotulo="Senha" value={senha} onChangeText={setSenha} secureTextEntry autoComplete="password" />
        {erro && <Text style={estilos.erro}>{erro}</Text>}
        <Botao titulo="Entrar" onPress={entrar} carregando={carregando} desabilitado={!email || !senha} />
      </View>
    </KeyboardAvoidingView>
  );
}
