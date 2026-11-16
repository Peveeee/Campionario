
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "articoli": {
                  Row: {
                    "aggiornato_il": string,"altezza_mm": number | null,"categoria": string | null,"codice": string | null,"colore_campione": string | null,"creato_il": string,"finitura": string | null,"fornitore": string | null,"foto_path": string | null,"id": string,"larghezza_mm": number | null,"nome": string,"nota_cliente": string | null,"ordine": number,"prezzo_cliente_centesimi": number | null,"profondita_mm": number | null,"progetto_id": string,"quantita": number,"stanza_id": string,"stato": Database["public"]['Enums']["stato_articolo"],"studio_id": string,"unita": string
                  }
                  ComputedFields: never
                  Insert: {
                    "aggiornato_il"?: string,"altezza_mm"?: number | null,"categoria"?: string | null,"codice"?: string | null,"colore_campione"?: string | null,"creato_il"?: string,"finitura"?: string | null,"fornitore"?: string | null,"foto_path"?: string | null,"id"?: string,"larghezza_mm"?: number | null,"nome": string,"nota_cliente"?: string | null,"ordine"?: number,"prezzo_cliente_centesimi"?: number | null,"profondita_mm"?: number | null,"progetto_id": string,"quantita"?: number,"stanza_id": string,"stato"?: Database["public"]['Enums']["stato_articolo"],"studio_id": string,"unita"?: string
                  }
                  Update: {
                    "aggiornato_il"?: string,"altezza_mm"?: number | null,"categoria"?: string | null,"codice"?: string | null,"colore_campione"?: string | null,"creato_il"?: string,"finitura"?: string | null,"fornitore"?: string | null,"foto_path"?: string | null,"id"?: string,"larghezza_mm"?: number | null,"nome"?: string,"nota_cliente"?: string | null,"ordine"?: number,"prezzo_cliente_centesimi"?: number | null,"profondita_mm"?: number | null,"progetto_id"?: string,"quantita"?: number,"stanza_id"?: string,"stato"?: Database["public"]['Enums']["stato_articolo"],"studio_id"?: string,"unita"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "articoli_stanza_id_progetto_id_studio_id_fkey"
      columns: ["stanza_id","progetto_id","studio_id"]
isOneToOne: false
      referencedRelation: "stanze"
      referencedColumns: ["id","progetto_id","studio_id"]
    }
                  ]
                },"link_clienti": {
                  Row: {
                    "creato_da": string | null,"creato_il": string,"id": string,"progetto_id": string,"revocato_il": string | null,"scade_il": string,"studio_id": string,"token_hash": string
                  }
                  ComputedFields: never
                  Insert: {
                    "creato_da"?: string | null,"creato_il"?: string,"id"?: string,"progetto_id": string,"revocato_il"?: string | null,"scade_il"?: string,"studio_id": string,"token_hash": string
                  }
                  Update: {
                    "creato_da"?: string | null,"creato_il"?: string,"id"?: string,"progetto_id"?: string,"revocato_il"?: string | null,"scade_il"?: string,"studio_id"?: string,"token_hash"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "link_clienti_progetto_id_studio_id_fkey"
      columns: ["progetto_id","studio_id"]
isOneToOne: false
      referencedRelation: "progetti"
      referencedColumns: ["id","studio_id"]
    }
                  ]
                },"profili": {
                  Row: {
                    "creato_il": string,"email": string,"id": string,"nome": string | null,"ruolo": Database["public"]['Enums']["ruolo_profilo"],"studio_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "creato_il"?: string,"email": string,"id": string,"nome"?: string | null,"ruolo"?: Database["public"]['Enums']["ruolo_profilo"],"studio_id": string
                  }
                  Update: {
                    "creato_il"?: string,"email"?: string,"id"?: string,"nome"?: string | null,"ruolo"?: Database["public"]['Enums']["ruolo_profilo"],"studio_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profili_studio_id_fkey"
      columns: ["studio_id"]
isOneToOne: false
      referencedRelation: "studi"
      referencedColumns: ["id"]
    }
                  ]
                },"progetti": {
                  Row: {
                    "aggiornato_il": string,"budget_centesimi": number | null,"cliente_nome": string | null,"creato_il": string,"id": string,"indirizzo": string | null,"nome": string,"palette": NonNullable<Json>,"studio_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "aggiornato_il"?: string,"budget_centesimi"?: number | null,"cliente_nome"?: string | null,"creato_il"?: string,"id"?: string,"indirizzo"?: string | null,"nome": string,"palette"?: NonNullable<Json>,"studio_id": string
                  }
                  Update: {
                    "aggiornato_il"?: string,"budget_centesimi"?: number | null,"cliente_nome"?: string | null,"creato_il"?: string,"id"?: string,"indirizzo"?: string | null,"nome"?: string,"palette"?: NonNullable<Json>,"studio_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "progetti_studio_id_fkey"
      columns: ["studio_id"]
isOneToOne: false
      referencedRelation: "studi"
      referencedColumns: ["id"]
    }
                  ]
                },"risposte_cliente": {
                  Row: {
                    "articolo_id": string,"commento": string | null,"creato_il": string,"esito": Database["public"]['Enums']["esito_risposta"],"id": string,"link_id": string | null,"progetto_id": string,"studio_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "articolo_id": string,"commento"?: string | null,"creato_il"?: string,"esito": Database["public"]['Enums']["esito_risposta"],"id"?: string,"link_id"?: string | null,"progetto_id": string,"studio_id": string
                  }
                  Update: {
                    "articolo_id"?: string,"commento"?: string | null,"creato_il"?: string,"esito"?: Database["public"]['Enums']["esito_risposta"],"id"?: string,"link_id"?: string | null,"progetto_id"?: string,"studio_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "risposte_cliente_articolo_id_progetto_id_studio_id_fkey"
      columns: ["articolo_id","progetto_id","studio_id"]
isOneToOne: false
      referencedRelation: "articoli"
      referencedColumns: ["id","progetto_id","studio_id"]
    },{
      foreignKeyName: "risposte_cliente_link_id_progetto_id_studio_id_fkey"
      columns: ["link_id","progetto_id","studio_id"]
isOneToOne: false
      referencedRelation: "link_clienti"
      referencedColumns: ["id","progetto_id","studio_id"]
    }
                  ]
                },"stanze": {
                  Row: {
                    "aggiornato_il": string,"budget_centesimi": number | null,"creato_il": string,"id": string,"nome": string,"ordine": number,"progetto_id": string,"studio_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "aggiornato_il"?: string,"budget_centesimi"?: number | null,"creato_il"?: string,"id"?: string,"nome": string,"ordine"?: number,"progetto_id": string,"studio_id": string
                  }
                  Update: {
                    "aggiornato_il"?: string,"budget_centesimi"?: number | null,"creato_il"?: string,"id"?: string,"nome"?: string,"ordine"?: number,"progetto_id"?: string,"studio_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "stanze_progetto_id_studio_id_fkey"
      columns: ["progetto_id","studio_id"]
isOneToOne: false
      referencedRelation: "progetti"
      referencedColumns: ["id","studio_id"]
    }
                  ]
                },"studi": {
                  Row: {
                    "creato_il": string,"id": string,"nome": string,"studio_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "creato_il"?: string,"id"?: string,"nome": string,"studio_id"?: never
                  }
                  Update: {
                    "creato_il"?: string,"id"?: string,"nome"?: string,"studio_id"?: never
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            [_ in never]: never
          }
          Enums: {
            "esito_risposta": "approvato"|"rifiutato"|"modifiche","ruolo_profilo": "titolare"|"membro","stato_articolo": "bozza"|"da_approvare"|"approvato"|"rifiutato"|"modifiche"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "esito_risposta": ["approvato", "rifiutato", "modifiche"],"ruolo_profilo": ["titolare", "membro"],"stato_articolo": ["bozza", "da_approvare", "approvato", "rifiutato", "modifiche"]
          }
        }
} as const
