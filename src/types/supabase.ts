
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string
          contact_info: string | null
          user_role: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          username: string
          contact_info?: string | null
          user_role: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          contact_info?: string | null
          user_role?: string
          created_at?: string
        }
      }
      farmers: {
        Row: {
          id: string
          user_id: string
          farm_name: string
          farm_location: string
          profile_image: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          farm_name: string
          farm_location: string
          profile_image?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          farm_name?: string
          farm_location?: string
          profile_image?: string | null
          created_at?: string
        }
      }
      consumers: {
        Row: {
          id: string
          user_id: string
          location: string
          profile_image: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          location: string
          profile_image?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          location?: string
          profile_image?: string | null
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string
          price: number
          stock_level: number
          farmer_id: string
          image_url: string | null
          created_at: string
          category: string | null
          is_organic: boolean | null
          unit: string | null
        }
        Insert: {
          id?: string
          name: string
          description: string
          price: number
          stock_level: number
          farmer_id: string
          image_url?: string | null
          created_at?: string
          category?: string | null
          is_organic?: boolean | null
          unit?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string
          price?: number
          stock_level?: number
          farmer_id?: string
          image_url?: string | null
          created_at?: string
          category?: string | null
          is_organic?: boolean | null
          unit?: string | null
        }
      }
      orders: {
        Row: {
          id: string
          consumer_id: string
          order_date: string
          total_price: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          consumer_id: string
          order_date: string
          total_price: number
          status: string
          created_at?: string
        }
        Update: {
          id?: string
          consumer_id?: string
          order_date?: string
          total_price?: number
          status?: string
          created_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          price_per_item: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          price_per_item: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          price_per_item?: number
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          order_id: string
          transaction_id: string
          amount: number
          payment_method: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          transaction_id: string
          amount: number
          payment_method: string
          status: string
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          transaction_id?: string
          amount?: number
          payment_method?: string
          status?: string
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          content: string
          timestamp: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          content: string
          timestamp: string
          is_read: boolean
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          content?: string
          timestamp?: string
          is_read?: boolean
          created_at?: string
        }
      }
    }
  }
}
