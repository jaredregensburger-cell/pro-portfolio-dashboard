export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// ─── Enum Types ───────────────────────────────────────────────────────────────

export type AssetClassEnum = 'equity' | 'crypto' | 'etf' | 'bond' | 'commodity' | 'cash'
export type TransactionTypeEnum = 'buy' | 'sell' | 'dividend' | 'transfer_in' | 'transfer_out' | 'fee' | 'split' | 'interest'
export type TransactionStatusEnum = 'completed' | 'pending' | 'failed' | 'cancelled'
export type SnapshotIntervalEnum = 'daily' | 'weekly' | 'monthly'

// ─── Database Schema ──────────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {

      users: {
        Row: {
          id:           string
          email:        string
          display_name: string
          avatar_url:   string | null
          currency:     string
          timezone:     string
          created_at:   string
          updated_at:   string
        }
        Insert: {
          id:           string
          email:        string
          display_name?: string
          avatar_url?:  string | null
          currency?:    string
          timezone?:    string
          created_at?:  string
          updated_at?:  string
        }
        Update: {
          email?:        string
          display_name?: string
          avatar_url?:   string | null
          currency?:     string
          timezone?:     string
          updated_at?:   string
        }
      }

      portfolios: {
        Row: {
          id:          string
          user_id:     string
          name:        string
          description: string | null
          currency:    string
          is_default:  boolean
          created_at:  string
          updated_at:  string
        }
        Insert: {
          id?:          string
          user_id:      string
          name:         string
          description?: string | null
          currency?:    string
          is_default?:  boolean
          created_at?:  string
          updated_at?:  string
        }
        Update: {
          name?:        string
          description?: string | null
          currency?:    string
          is_default?:  boolean
          updated_at?:  string
        }
      }

      assets: {
        Row: {
          id:             string
          portfolio_id:   string
          ticker:         string
          name:           string
          asset_class:    AssetClassEnum
          quantity:       number
          avg_cost_basis: number
          current_price:  number
          currency:       string
          logo_url:       string | null
          is_active:      boolean
          added_at:       string
          updated_at:     string
        }
        Insert: {
          id?:            string
          portfolio_id:   string
          ticker:         string
          name:           string
          asset_class:    AssetClassEnum
          quantity?:      number
          avg_cost_basis?: number
          current_price?: number
          currency?:      string
          logo_url?:      string | null
          is_active?:     boolean
          added_at?:      string
          updated_at?:    string
        }
        Update: {
          name?:          string
          asset_class?:   AssetClassEnum
          current_price?: number
          currency?:      string
          logo_url?:      string | null
          is_active?:     boolean
          updated_at?:    string
          // NOTE: quantity and avg_cost_basis are managed by trigger, not updated directly
        }
      }

      transactions: {
        Row: {
          id:           string
          portfolio_id: string
          asset_id:     string | null
          type:         TransactionTypeEnum
          status:       TransactionStatusEnum
          quantity:     number | null
          price:        number | null
          total_amount: number
          fee:          number
          currency:     string
          note:         string | null
          external_id:  string | null
          executed_at:  string
          created_at:   string
          updated_at:   string
        }
        Insert: {
          id?:          string
          portfolio_id: string
          asset_id?:    string | null
          type:         TransactionTypeEnum
          status?:      TransactionStatusEnum
          quantity?:    number | null
          price?:       number | null
          total_amount: number
          fee?:         number
          currency?:    string
          note?:        string | null
          external_id?: string | null
          executed_at:  string
          created_at?:  string
          updated_at?:  string
        }
        Update: {
          status?:      TransactionStatusEnum
          note?:        string | null
          updated_at?:  string
        }
      }

      portfolio_snapshots: {
        Row: {
          id:            string
          portfolio_id:  string
          total_value:   number
          total_cost:    number
          currency:      string
          interval:      SnapshotIntervalEnum
          snapshot_date: string
          created_at:    string
        }
        Insert: {
          id?:           string
          portfolio_id:  string
          total_value:   number
          total_cost:    number
          currency?:     string
          interval?:     SnapshotIntervalEnum
          snapshot_date: string
          created_at?:   string
        }
        Update: {
          total_value?:  number
          total_cost?:   number
        }
      }
    }

    Views: {
      v_portfolio_summary: {
        Row: {
          portfolio_id:          string
          user_id:               string
          portfolio_name:        string
          currency:              string
          asset_count:           number
          total_value:           number
          total_cost:            number
          total_sell_proceeds:   number
          total_dividend_income: number
          total_fees_paid:       number
        }
      }
      v_asset_performance: {
        Row: {
          asset_id:           string
          portfolio_id:       string
          ticker:             string
          name:               string
          asset_class:        AssetClassEnum
          quantity:           number
          avg_cost_basis:     number
          current_price:      number
          currency:           string
          is_active:          boolean
          current_value:      number
          cost_basis:         number
          unrealized_gain:    number
          unrealized_gain_pct: number
          realized_gain:      number
          dividend_income:    number
          transaction_count:  number
        }
      }
    }

    Functions: {
      get_portfolio_summary: {
        Args: { p_portfolio_id: string }
        Returns: {
          portfolio_id:          string
          portfolio_name:        string
          currency:              string
          asset_count:           number
          total_value:           number
          total_cost:            number
          unrealized_gain:       number
          unrealized_gain_pct:   number
          total_sell_proceeds:   number
          total_dividend_income: number
          total_fees_paid:       number
        }[]
      }
      get_portfolio_chart_data: {
        Args: {
          p_portfolio_id: string
          p_from?:        string
          p_to?:          string
        }
        Returns: {
          snapshot_date: string
          total_value:   number
          total_cost:    number
          gain:          number
          gain_pct:      number
        }[]
      }
    }

    Enums: {
      asset_class:          AssetClassEnum
      transaction_type:     TransactionTypeEnum
      transaction_status:   TransactionStatusEnum
      snapshot_interval:    SnapshotIntervalEnum
    }
  }
}

// ─── Convenience Row Types ────────────────────────────────────────────────────

export type UserRow               = Database['public']['Tables']['users']['Row']
export type PortfolioRow          = Database['public']['Tables']['portfolios']['Row']
export type AssetRow              = Database['public']['Tables']['assets']['Row']
export type TransactionRow        = Database['public']['Tables']['transactions']['Row']
export type SnapshotRow           = Database['public']['Tables']['portfolio_snapshots']['Row']
export type PortfolioSummaryView  = Database['public']['Views']['v_portfolio_summary']['Row']
export type AssetPerformanceView  = Database['public']['Views']['v_asset_performance']['Row']
