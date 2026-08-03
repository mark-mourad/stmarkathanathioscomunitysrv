export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          role: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          role?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      individuals: {
        Row: {
          id: string;
          full_name: string;
          nickname: string | null;
          mother_name: string | null;
          gender: string | null;
          national_id: string | null;
          birth_date: string | null;
          birth_governorate: string | null;
          job: string | null;
          salary: number | null;
          phone: string | null;
          mobile: string | null;
          landline: string | null;
          confession_father: string | null;
          saint_family: string | null;
          address: string | null;
          household_count: number | null;
          housing_type: string | null;
          rooms: number | null;
          has_washing_machine: boolean | null;
          has_fridge: boolean | null;
          has_stove: boolean | null;
          has_mattress: boolean | null;
          has_computer: boolean | null;
          has_sofa: boolean | null;
          has_dining: boolean | null;
          has_tv: boolean | null;
          has_wardrobe: boolean | null;
          has_alt_address: boolean | null;
          alt_address: string | null;
          alt_governorate: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          nickname?: string | null;
          mother_name?: string | null;
          gender?: string | null;
          national_id?: string | null;
          birth_date?: string | null;
          birth_governorate?: string | null;
          job?: string | null;
          salary?: number | null;
          phone?: string | null;
          mobile?: string | null;
          landline?: string | null;
          confession_father?: string | null;
          saint_family?: string | null;
          address?: string | null;
          household_count?: number | null;
          housing_type?: string | null;
          rooms?: number | null;
          has_washing_machine?: boolean | null;
          has_fridge?: boolean | null;
          has_stove?: boolean | null;
          has_mattress?: boolean | null;
          has_computer?: boolean | null;
          has_sofa?: boolean | null;
          has_dining?: boolean | null;
          has_tv?: boolean | null;
          has_wardrobe?: boolean | null;
          has_alt_address?: boolean | null;
          alt_address?: string | null;
          alt_governorate?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          nickname?: string | null;
          mother_name?: string | null;
          gender?: string | null;
          national_id?: string | null;
          birth_date?: string | null;
          birth_governorate?: string | null;
          job?: string | null;
          salary?: number | null;
          phone?: string | null;
          mobile?: string | null;
          landline?: string | null;
          confession_father?: string | null;
          saint_family?: string | null;
          address?: string | null;
          household_count?: number | null;
          housing_type?: string | null;
          rooms?: number | null;
          has_washing_machine?: boolean | null;
          has_fridge?: boolean | null;
          has_stove?: boolean | null;
          has_mattress?: boolean | null;
          has_computer?: boolean | null;
          has_sofa?: boolean | null;
          has_dining?: boolean | null;
          has_tv?: boolean | null;
          has_wardrobe?: boolean | null;
          has_alt_address?: boolean | null;
          alt_address?: string | null;
          alt_governorate?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      family_members: {
        Row: {
          id: string;
          individual_id: string;
          seq: number | null;
          full_name: string;
          national_id: string | null;
          relation: string | null;
          insurance_number: string | null;
          marital_status: string | null;
          confession_father: string | null;
          school_or_job: string | null;
          income: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          individual_id: string;
          seq?: number | null;
          full_name: string;
          national_id?: string | null;
          relation?: string | null;
          insurance_number?: string | null;
          marital_status?: string | null;
          confession_father?: string | null;
          school_or_job?: string | null;
          income?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          individual_id?: string;
          seq?: number | null;
          full_name?: string;
          national_id?: string | null;
          relation?: string | null;
          insurance_number?: string | null;
          marital_status?: string | null;
          confession_father?: string | null;
          school_or_job?: string | null;
          income?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "family_members_individual_id_fkey";
            columns: ["individual_id"];
            isOneToOne: false;
            referencedRelation: "individuals";
            referencedColumns: ["id"];
          }
        ];
      };
      financials: {
        Row: {
          id: string;
          individual_id: string;
          church_monthly: number | null;
          therapeutic_aid: number | null;
          study_aid: number | null;
          basic_salary: number | null;
          extra_income: number | null;
          electricity_gas_water: number | null;
          phone_bill: number | null;
          rent: number | null;
          treatment_cost: number | null;
          education_cost: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          individual_id: string;
          church_monthly?: number | null;
          therapeutic_aid?: number | null;
          study_aid?: number | null;
          basic_salary?: number | null;
          extra_income?: number | null;
          electricity_gas_water?: number | null;
          phone_bill?: number | null;
          rent?: number | null;
          treatment_cost?: number | null;
          education_cost?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          individual_id?: string;
          church_monthly?: number | null;
          therapeutic_aid?: number | null;
          study_aid?: number | null;
          basic_salary?: number | null;
          extra_income?: number | null;
          electricity_gas_water?: number | null;
          phone_bill?: number | null;
          rent?: number | null;
          treatment_cost?: number | null;
          education_cost?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "financials_individual_id_fkey";
            columns: ["individual_id"];
            isOneToOne: false;
            referencedRelation: "individuals";
            referencedColumns: ["id"];
          }
        ];
      };
      monthly_church_support: {
        Row: {
          id: string;
          individual_id: string;
          church_name: string;
          amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          individual_id: string;
          church_name: string;
          amount: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          individual_id?: string;
          church_name?: string;
          amount?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "monthly_church_support_individual_id_fkey";
            columns: ["individual_id"];
            isOneToOne: false;
            referencedRelation: "individuals";
            referencedColumns: ["id"];
          }
        ];
      };
      dashboard_metrics: {
        Row: {
          id: string;
          sector: string;
          monthly: number;
          study: number;
          therapeutic: number;
          display_order: number;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          sector: string;
          monthly: number;
          study: number;
          therapeutic: number;
          display_order: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          sector?: string;
          monthly?: number;
          study?: number;
          therapeutic?: number;
          display_order?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      inventory: {
        Row: {
          id: string;
          weekly_total: number;
          details: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          weekly_total: number;
          details?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          weekly_total?: number;
          details?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      blessing_distribution: {
        Row: {
          id: string;
          saint_family: string;
          individual_id: string;
          received: boolean;
          distribution_date: string;
          distributed_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          saint_family: string;
          individual_id: string;
          received: boolean;
          distribution_date: string;
          distributed_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          saint_family?: string;
          individual_id?: string;
          received?: boolean;
          distribution_date?: string;
          distributed_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "blessing_distribution_individual_id_fkey";
            columns: ["individual_id"];
            isOneToOne: false;
            referencedRelation: "individuals";
            referencedColumns: ["id"];
          }
        ];
      };
      assistance_logs: {
        Row: {
          id: string;
          individual_id: string;
          family_member_id: string | null;
          assistance_type: string;
          total_amount: number | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          individual_id: string;
          family_member_id?: string | null;
          assistance_type: string;
          total_amount?: number | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          individual_id?: string;
          family_member_id?: string | null;
          assistance_type?: string;
          total_amount?: number | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assistance_logs_individual_id_fkey";
            columns: ["individual_id"];
            isOneToOne: false;
            referencedRelation: "individuals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assistance_logs_family_member_id_fkey";
            columns: ["family_member_id"];
            isOneToOne: false;
            referencedRelation: "family_members";
            referencedColumns: ["id"];
          }
        ];
      };
      bridal_prep_details: {
        Row: {
          id: string;
          assistance_log_id: string;
          category: string;
          item_type: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          assistance_log_id: string;
          category: string;
          item_type: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          assistance_log_id?: string;
          category?: string;
          item_type?: string;
          quantity?: number;
          unit_price?: number;
          total_price?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bridal_prep_details_assistance_log_id_fkey";
            columns: ["assistance_log_id"];
            isOneToOne: false;
            referencedRelation: "assistance_logs";
            referencedColumns: ["id"];
          }
        ];
      };
      medical_aid_details: {
        Row: {
          id: string;
          assistance_log_id: string;
          category: string;
          service_name: string;
          total_price: number;
          church_percentage: number;
          church_amount: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          assistance_log_id: string;
          category: string;
          service_name: string;
          total_price: number;
          church_percentage: number;
          church_amount?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          assistance_log_id?: string;
          category?: string;
          service_name?: string;
          total_price?: number;
          church_percentage?: number;
          church_amount?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "medical_aid_details_assistance_log_id_fkey";
            columns: ["assistance_log_id"];
            isOneToOne: false;
            referencedRelation: "assistance_logs";
            referencedColumns: ["id"];
          }
        ];
      };
      clothes_requests: {
        Row: {
          id: string;
          individual_id: string;
          family_member_id: string | null;
          saint_family: string;
          request_category: string;
          school_name: string | null;
          t_shirt_size: string | null;
          pants_size: string | null;
          shoe_size: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          individual_id: string;
          family_member_id?: string | null;
          saint_family: string;
          request_category: string;
          school_name?: string | null;
          t_shirt_size?: string | null;
          pants_size?: string | null;
          shoe_size?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          individual_id?: string;
          family_member_id?: string | null;
          saint_family?: string;
          request_category?: string;
          school_name?: string | null;
          t_shirt_size?: string | null;
          pants_size?: string | null;
          shoe_size?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clothes_requests_individual_id_fkey";
            columns: ["individual_id"];
            isOneToOne: false;
            referencedRelation: "individuals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "clothes_requests_family_member_id_fkey";
            columns: ["family_member_id"];
            isOneToOne: false;
            referencedRelation: "family_members";
            referencedColumns: ["id"];
          }
        ];
      };
      audit_log: {
        Row: {
          id: string;
          user_id: string | null;
          user_email: string;
          action: string;
          table_name: string;
          record_id: string | null;
          changes: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          user_email: string;
          action: string;
          table_name: string;
          record_id?: string | null;
          changes?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          user_email?: string;
          action?: string;
          table_name?: string;
          record_id?: string | null;
          changes?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      furniture_inventory: {
        Row: {
          id: string;
          created_at: string;
          category: string;
          item_name: string;
          quantity: number;
          details: string | null;
          created_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          category: string;
          item_name: string;
          quantity?: number;
          details?: string | null;
          created_by?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          category?: string;
          item_name?: string;
          quantity?: number;
          details?: string | null;
          created_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      furniture_requests: {
        Row: {
          id: string;
          created_at: string;
          family_name: string;
          beneficiary_id: string | null;
          beneficiary_name: string;
          category: string;
          item_name: string;
          quantity: number;
          details: string | null;
          status: string;
          requested_by: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          family_name: string;
          beneficiary_id?: string | null;
          beneficiary_name: string;
          category: string;
          item_name: string;
          quantity?: number;
          details?: string | null;
          status?: string;
          requested_by?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          family_name?: string;
          beneficiary_id?: string | null;
          beneficiary_name?: string;
          category?: string;
          item_name?: string;
          quantity?: number;
          details?: string | null;
          status?: string;
          requested_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "furniture_requests_beneficiary_id_fkey";
            columns: ["beneficiary_id"];
            isOneToOne: false;
            referencedRelation: "individuals";
            referencedColumns: ["id"];
          }
        ];
      };
      supplies_inventory: {
        Row: {
          id: string;
          created_at: string;
          category: string;
          item_name: string;
          quantity: number;
          weight: string | null;
          details: string | null;
          created_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          category: string;
          item_name: string;
          quantity: number;
          weight?: string | null;
          details?: string | null;
          created_by?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          category?: string;
          item_name?: string;
          quantity?: number;
          weight?: string | null;
          details?: string | null;
          created_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      pharmacy_inventory: {
        Row: {
          id: string;
          created_at: string;
          disease_category: string;
          custom_disease_name: string | null;
          medicine_name: string;
          quantity: number;
          unit_type: string;
          details: string | null;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          disease_category: string;
          custom_disease_name?: string | null;
          medicine_name: string;
          quantity?: number;
          unit_type: string;
          details?: string | null;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          disease_category?: string;
          custom_disease_name?: string | null;
          medicine_name?: string;
          quantity?: number;
          unit_type?: string;
          details?: string | null;
          created_by?: string | null;
        };
        Relationships: [];
      };
      pharmacy_requests: {
        Row: {
          id: string;
          created_at: string;
          family_name: string;
          beneficiary_id: string | null;
          beneficiary_name: string;
          disease_category: string;
          custom_disease_name: string | null;
          medicine_name: string;
          requested_quantity: number;
          status: string;
          details: string | null;
          requested_by: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          family_name: string;
          beneficiary_id?: string | null;
          beneficiary_name: string;
          disease_category: string;
          custom_disease_name?: string | null;
          medicine_name: string;
          requested_quantity?: number;
          status?: string;
          details?: string | null;
          requested_by?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          family_name?: string;
          beneficiary_id?: string | null;
          beneficiary_name?: string;
          disease_category?: string;
          custom_disease_name?: string | null;
          medicine_name?: string;
          requested_quantity?: number;
          status?: string;
          details?: string | null;
          requested_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "pharmacy_requests_beneficiary_id_fkey";
            columns: ["beneficiary_id"];
            isOneToOne: false;
            referencedRelation: "individuals";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
