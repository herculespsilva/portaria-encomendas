// Gerado a partir do schema do Supabase (projeto portaria-encomendas).
// Regenerar após mudar o banco: npx supabase gen types typescript --project-id sueehlpexhtujxlbrlqh

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.18';
  };
  public: {
    Tables: {
      apartamentos: {
        Row: { bloco: string | null; criado_em: string; id: string; numero: string };
        Insert: { bloco?: string | null; criado_em?: string; id?: string; numero: string };
        Update: { bloco?: string | null; criado_em?: string; id?: string; numero?: string };
        Relationships: [];
      };
      encomendas: {
        Row: {
          apartamento_id: string | null;
          destinatario_texto: string | null;
          endereco_texto: string | null;
          foto_url: string | null;
          id: string;
          morador_id: string | null;
          produto: string | null;
          recebida_em: string;
          recebida_por: string | null;
          retirada_em: string | null;
          retirada_por: string | null;
          status: Database['public']['Enums']['status_encomenda'];
          texto_ocr_bruto: string | null;
          transportadora: string | null;
        };
        Insert: {
          apartamento_id?: string | null;
          destinatario_texto?: string | null;
          endereco_texto?: string | null;
          foto_url?: string | null;
          id?: string;
          morador_id?: string | null;
          produto?: string | null;
          recebida_em?: string;
          recebida_por?: string | null;
          retirada_em?: string | null;
          retirada_por?: string | null;
          status?: Database['public']['Enums']['status_encomenda'];
          texto_ocr_bruto?: string | null;
          transportadora?: string | null;
        };
        Update: Partial<Database['public']['Tables']['encomendas']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'encomendas_apartamento_id_fkey';
            columns: ['apartamento_id'];
            isOneToOne: false;
            referencedRelation: 'apartamentos';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'encomendas_morador_id_fkey';
            columns: ['morador_id'];
            isOneToOne: false;
            referencedRelation: 'moradores';
            referencedColumns: ['id'];
          },
        ];
      };
      moradores: {
        Row: {
          apartamento_id: string;
          ativo: boolean;
          criado_em: string;
          id: string;
          nome: string;
          telefone: string | null;
        };
        Insert: {
          apartamento_id: string;
          ativo?: boolean;
          criado_em?: string;
          id?: string;
          nome: string;
          telefone?: string | null;
        };
        Update: Partial<Database['public']['Tables']['moradores']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'moradores_apartamento_id_fkey';
            columns: ['apartamento_id'];
            isOneToOne: false;
            referencedRelation: 'apartamentos';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      buscar_moradores: {
        Args: { limite?: number; termo: string };
        Returns: {
          apartamento_id: string;
          bloco: string;
          morador_id: string;
          nome: string;
          numero: string;
          similaridade: number;
        }[];
      };
    };
    Enums: { status_encomenda: 'pendente' | 'retirada' };
    CompositeTypes: { [_ in never]: never };
  };
};

type Public = Database['public'];
export type Tables<T extends keyof Public['Tables']> = Public['Tables'][T]['Row'];
export type SugestaoMorador = Public['Functions']['buscar_moradores']['Returns'][number];
