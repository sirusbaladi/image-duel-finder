export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      image_comparisons: {
        Row: {
          id: string
          user_id: string
          image_a_id: string
          image_b_id: string
          winner_id: string
          timestamp: string
          user_gender: string
        }
        Insert: {
          id?: string
          user_id: string
          image_a_id: string
          image_b_id: string
          winner_id: string
          timestamp?: string
          user_gender: string
        }
        Update: {
          id?: string
          user_id?: string
          image_a_id?: string
          image_b_id?: string
          winner_id?: string
          timestamp?: string
          user_gender?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user"
            columns: ["user_id"]
            referencedRelation: "user_votes"
            referencedColumns: ["device_id"]
          },
          {
            foreignKeyName: "fk_image_a"
            columns: ["image_a_id"]
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_image_b"
            columns: ["image_b_id"]
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_winner"
            columns: ["winner_id"]
            referencedRelation: "images"
            referencedColumns: ["id"]
          }
        ]
      }
      images: {
        Row: {
          comparisons_female: number
          comparisons_male: number
          comparisons_overall: number
          created_at: string
          glicko_female_rd: number
          glicko_male_rd: number
          glicko_overall_rd: number
          glicko_rating_female: number
          glicko_rating_male: number
          glicko_rating_overall: number
          id: string
          losses_female: number
          losses_male: number
          losses_overall: number
          rating_female: number
          rating_male: number
          rating_overall: number
          url: string
          wins_female: number
          wins_male: number
          wins_overall: number
        }
        Insert: {
          comparisons_female?: number
          comparisons_male?: number
          comparisons_overall?: number
          created_at?: string
          glicko_female_rd?: number
          glicko_male_rd?: number
          glicko_overall_rd?: number
          glicko_rating_female?: number
          glicko_rating_male?: number
          glicko_rating_overall?: number
          id?: string
          losses_female?: number
          losses_male?: number
          losses_overall?: number
          rating_female?: number
          rating_male?: number
          rating_overall?: number
          url: string
          wins_female?: number
          wins_male?: number
          wins_overall?: number
        }
        Update: {
          comparisons_female?: number
          comparisons_male?: number
          comparisons_overall?: number
          created_at?: string
          glicko_female_rd?: number
          glicko_male_rd?: number
          glicko_overall_rd?: number
          glicko_rating_female?: number
          glicko_rating_male?: number
          glicko_rating_overall?: number
          id?: string
          losses_female?: number
          losses_male?: number
          losses_overall?: number
          rating_female?: number
          rating_male?: number
          rating_overall?: number
          url?: string
          wins_female?: number
          wins_male?: number
          wins_overall?: number
        }
        Relationships: []
      }
      user_votes: {
        Row: {
          created_at: string
          device_id: string
          device_type: string
          gender: string | null
          id: string
          name: string
          vote_count: number | null
        }
        Insert: {
          created_at?: string
          device_id: string
          device_type: string
          gender?: string | null
          id?: string
          name: string
          vote_count?: number | null
        }
        Update: {
          created_at?: string
          device_id?: string
          device_type?: string
          gender?: string | null
          id?: string
          name?: string
          vote_count?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
