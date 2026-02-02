// ============================================
// TIPOS DO BANCO DE DADOS SUPABASE
// Baseado no esquema SQL oficial
// ============================================

// ============================================
// TABELAS PRINCIPAIS
// ============================================

// Tabela hubspot_owners (Proprietários/Vendedores)
export interface HubspotOwner {
  id: string; // uuid
  hubspot_id: string; // text NOT NULL UNIQUE
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  user_id: string | null;
  team_id: string | null;
  created_at: string | null; // timestamp with time zone
  updated_at: string | null;
  archived: boolean; // DEFAULT false
  _extracted_at: string; // NOT NULL DEFAULT now()
  _source_system: string; // NOT NULL DEFAULT 'HubSpot'
}

// Tabela hubspot_pipelines
export interface HubspotPipeline {
  id: string; // uuid
  hubspot_id: string; // text NOT NULL UNIQUE
  label: string | null;
  display_order: number | null; // integer
  object_type: string | null;
  created_at: string | null;
  updated_at: string | null;
  archived: boolean; // DEFAULT false
  _extracted_at: string;
  _source_system: string;
}

// Tabela hubspot_pipeline_stages
export interface HubspotPipelineStage {
  id: string; // uuid
  stage_id: string; // text NOT NULL UNIQUE
  pipeline_id: string | null; // FK -> hubspot_pipelines(hubspot_id)
  label: string | null;
  display_order: number | null; // integer
  probability: number | null; // numeric
  is_closed: boolean; // DEFAULT false
  is_won: boolean; // DEFAULT false
  created_at: string | null;
  updated_at: string | null;
  archived: boolean; // DEFAULT false
  _extracted_at: string;
  _source_system: string;
}

// Tabela hubspot_contacts
export interface HubspotContact {
  id: string; // uuid
  hubspot_id: string; // text NOT NULL UNIQUE
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  mobile_phone: string | null;
  job_title: string | null;
  company_id: string | null;
  lifecycle_stage: string | null;
  lead_status: string | null;
  owner_id: string | null; // FK -> hubspot_owners(hubspot_id)
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  created_at: string | null;
  updated_at: string | null;
  archived: boolean; // DEFAULT false
  _extracted_at: string;
  _source_system: string;
}

// Tabela hubspot_deals (Negócios)
export interface HubspotDeal {
  id: string; // uuid
  hubspot_id: string; // text NOT NULL UNIQUE
  deal_name: string | null;
  amount: number | null; // numeric
  currency: string; // DEFAULT 'BRL'
  close_date: string | null; // date
  create_date: string | null; // timestamp with time zone
  pipeline_id: string | null; // FK -> hubspot_pipelines(hubspot_id)
  pipeline_stage_id: string | null; // FK -> hubspot_pipeline_stages(stage_id)
  deal_stage: string | null;
  deal_type: string | null;
  owner_id: string | null; // FK -> hubspot_owners(hubspot_id)
  contact_id: string | null; // FK -> hubspot_contacts(hubspot_id)
  company_id: string | null;
  probability: number | null; // numeric
  forecast_category: string | null;
  next_step: string | null;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
  archived: boolean; // DEFAULT false
  raw_data: Record<string, unknown> | null; // jsonb
  _extracted_at: string;
  _source_system: string;
}

// Tabela hubspot_line_items
export interface HubspotLineItem {
  id: string; // uuid
  hubspot_id: string; // text NOT NULL UNIQUE
  deal_id: string | null; // FK -> hubspot_deals(hubspot_id)
  product_id: string | null;
  name: string | null;
  sku: string | null;
  quantity: number | null; // numeric
  unit_price: number | null; // numeric
  amount: number | null; // numeric
  discount: number | null; // numeric
  discount_percentage: number | null; // numeric
  currency: string; // DEFAULT 'BRL'
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
  archived: boolean; // DEFAULT false
  _extracted_at: string;
  _source_system: string;
}

// Tabela hubspot_commissions_obj (Comissões - objeto customizado)
export interface HubspotCommission {
  id: string; // uuid
  hubspot_id: string; // text NOT NULL UNIQUE
  object_type_id: string; // DEFAULT '2-45314755'
  name: string | null;
  deal_id: string | null;
  owner_id: string | null; // FK -> hubspot_owners(hubspot_id)
  commission_amount: number | null; // numeric
  commission_percentage: number | null; // numeric
  commission_type: string | null;
  payment_status: string | null;
  payment_date: string | null; // date
  associated_deal_id: string | null;
  associated_contact_id: string | null;
  created_at: string | null; // timestamp with time zone
  updated_at: string | null;
  archived: boolean; // DEFAULT false
  raw_properties: Record<string, unknown> | null; // jsonb
  _extracted_at: string;
  _source_system: string;
}

// ============================================
// SCHEMA DO BANCO PARA SUPABASE CLIENT
// ============================================

export interface Database {
  public: {
    Tables: {
      hubspot_owners: {
        Row: HubspotOwner;
        Insert: Partial<HubspotOwner> & Pick<HubspotOwner, 'hubspot_id'>;
        Update: Partial<HubspotOwner>;
      };
      hubspot_pipelines: {
        Row: HubspotPipeline;
        Insert: Partial<HubspotPipeline> & Pick<HubspotPipeline, 'hubspot_id'>;
        Update: Partial<HubspotPipeline>;
      };
      hubspot_pipeline_stages: {
        Row: HubspotPipelineStage;
        Insert: Partial<HubspotPipelineStage> & Pick<HubspotPipelineStage, 'stage_id'>;
        Update: Partial<HubspotPipelineStage>;
      };
      hubspot_contacts: {
        Row: HubspotContact;
        Insert: Partial<HubspotContact> & Pick<HubspotContact, 'hubspot_id'>;
        Update: Partial<HubspotContact>;
      };
      hubspot_deals: {
        Row: HubspotDeal;
        Insert: Partial<HubspotDeal> & Pick<HubspotDeal, 'hubspot_id'>;
        Update: Partial<HubspotDeal>;
      };
      hubspot_line_items: {
        Row: HubspotLineItem;
        Insert: Partial<HubspotLineItem> & Pick<HubspotLineItem, 'hubspot_id'>;
        Update: Partial<HubspotLineItem>;
      };
      hubspot_commissions_obj: {
        Row: HubspotCommission;
        Insert: Partial<HubspotCommission> & Pick<HubspotCommission, 'hubspot_id'>;
        Update: Partial<HubspotCommission>;
      };
    };
  };
}
