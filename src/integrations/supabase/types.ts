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
      consumers: {
        Row: {
          created_at: string
          id: string
          location: string
          profile_image: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          location: string
          profile_image?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string
          profile_image?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consumers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      farmers: {
        Row: {
          created_at: string
          farm_location: string
          farm_name: string
          id: string
          profile_image: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          farm_location: string
          farm_name: string
          id?: string
          profile_image?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          farm_location?: string
          farm_name?: string
          id?: string
          profile_image?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "farmers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          receiver_id: string
          sender_id: string
          timestamp: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read: boolean
          receiver_id: string
          sender_id: string
          timestamp: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id?: string
          sender_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_messages_receiver_consumers"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "consumers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_messages_receiver_farmers"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_messages_sender_consumers"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "consumers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_messages_sender_farmers"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price_per_item: number
          product_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price_per_item: number
          product_id: string
          quantity: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price_per_item?: number
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          consumer_id: string
          created_at: string
          id: string
          order_date: string
          status: string
          total_price: number
        }
        Insert: {
          consumer_id: string
          created_at?: string
          id?: string
          order_date: string
          status: string
          total_price: number
        }
        Update: {
          consumer_id?: string
          created_at?: string
          id?: string
          order_date?: string
          status?: string
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_consumer_id_fkey"
            columns: ["consumer_id"]
            isOneToOne: false
            referencedRelation: "consumers"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          order_id: string
          payment_method: string
          status: string
          transaction_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          order_id: string
          payment_method: string
          status: string
          transaction_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          order_id?: string
          payment_method?: string
          status?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          description: string
          farmer_id: string
          id: string
          image_url: string | null
          is_organic: boolean | null
          name: string
          price: number
          stock_level: number
          unit: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description: string
          farmer_id: string
          id?: string
          image_url?: string | null
          is_organic?: boolean | null
          name: string
          price: number
          stock_level: number
          unit?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string
          farmer_id?: string
          id?: string
          image_url?: string | null
          is_organic?: boolean | null
          name?: string
          price?: number
          stock_level?: number
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          contact_info: string | null
          created_at: string
          email: string
          id: string
          user_role: string
          username: string
        }
        Insert: {
          contact_info?: string | null
          created_at?: string
          email: string
          id?: string
          user_role: string
          username: string
        }
        Update: {
          contact_info?: string | null
          created_at?: string
          email?: string
          id?: string
          user_role?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_consumer_profile: {
        Args: { user_id_param: string; location_param: string }
        Returns: {
          id: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
