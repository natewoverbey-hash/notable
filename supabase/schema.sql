-- ============================================
-- NOTABLE DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS & WORKSPACES
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    plan VARCHAR(20) DEFAULT 'free',
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    subscription_status VARCHAR(20) DEFAULT 'inactive',
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    current_period_ends_at TIMESTAMP WITH TIME ZONE,
    
    max_agents INTEGER DEFAULT 1,
    max_competitors_per_agent INTEGER DEFAULT 2,
    max_custom_prompts INTEGER DEFAULT 5,
    scan_frequency VARCHAR(20) DEFAULT 'weekly',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member',
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    joined_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(workspace_id, user_id)
);

-- ============================================
-- AGENTS
-- ============================================

CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    brokerage VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    neighborhoods TEXT[],
    zip_codes TEXT[],
    
    website_url TEXT,
    zillow_url TEXT,
    realtor_com_url TEXT,
    linkedin_url TEXT,
    
    is_primary BOOLEAN DEFAULT TRUE,
    parent_agent_id UUID REFERENCES agents(id),
    
    visibility_score INTEGER,
    last_scanned_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_agents_workspace ON agents(workspace_id);
CREATE INDEX idx_agents_primary ON agents(workspace_id, is_primary);

-- ============================================
-- PROMPTS
-- ============================================

CREATE TABLE prompt_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INTEGER,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES prompt_categories(id),
    template TEXT NOT NULL,
    variables TEXT[] DEFAULT ARRAY['city'],
    intent_level VARCHAR(20) DEFAULT 'medium',
    buyer_stage VARCHAR(20),
    is_system BOOLEAN DEFAULT TRUE,
    created_by_workspace_id UUID REFERENCES workspaces(id),
    use_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_prompts_system ON prompts(is_system, is_active);
CREATE INDEX idx_prompts_workspace ON prompts(created_by_workspace_id);

CREATE TABLE workspace_prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT TRUE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workspace_id, prompt_id)
);

-- ============================================
-- SCANS & RESULTS
-- ============================================

CREATE TABLE scan_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    prompts_total INTEGER,
    prompts_completed INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID REFERENCES scan_batches(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    prompt_id INTEGER,
    prompt_rendered TEXT NOT NULL,
    llm_provider VARCHAR(20) NOT NULL,
    llm_model VARCHAR(50),
    response_raw TEXT,
    response_tokens INTEGER,
    mentioned BOOLEAN DEFAULT FALSE,
    mention_rank INTEGER,
    mention_context TEXT,
    sentiment VARCHAR(20),
    competitors_mentioned JSONB,
    latency_ms INTEGER,
    error_message TEXT,
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scans_agent ON scans(agent_id, scanned_at DESC);
CREATE INDEX idx_scans_batch ON scans(batch_id);
CREATE INDEX idx_scans_mentioned ON scans(agent_id, mentioned, scanned_at DESC);

-- ============================================
-- VISIBILITY SCORES
-- ============================================

CREATE TABLE visibility_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    overall_score INTEGER,
    chatgpt_score INTEGER,
    claude_score INTEGER,
    gemini_score INTEGER,
    perplexity_score INTEGER,
    google_aio_score INTEGER,
    prompts_checked INTEGER,
    prompts_mentioned INTEGER,
    avg_rank DECIMAL(3,1),
    score_change INTEGER,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_visibility_agent ON visibility_scores(agent_id, calculated_at DESC);

-- ============================================
-- REPORTS
-- ============================================

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    report_type VARCHAR(20) DEFAULT 'standard',
    title VARCHAR(255),
    summary_json JSONB,
    pdf_url TEXT,
    pdf_generated_at TIMESTAMP WITH TIME ZONE,
    custom_logo_url TEXT,
    custom_colors JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- AUDIT LEADS
-- ============================================

CREATE TABLE audit_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(50),
    agent_name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    brokerage VARCHAR(255),
    audit_completed BOOLEAN DEFAULT FALSE,
    visibility_score INTEGER,
    report_id UUID REFERENCES reports(id),
    converted_to_user_id UUID REFERENCES users(id),
    converted_at TIMESTAMP WITH TIME ZONE,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_leads_email ON audit_leads(email);

-- ============================================
-- PLAN LIMITS
-- ============================================

CREATE TABLE plan_limits (
    plan VARCHAR(20) PRIMARY KEY,
    max_agents INTEGER NOT NULL,
    max_competitors_per_agent INTEGER NOT NULL,
    max_custom_prompts INTEGER NOT NULL,
    scan_frequency VARCHAR(20) NOT NULL,
    llm_providers TEXT[] NOT NULL,
    pdf_reports_per_month INTEGER,
    has_recommendations BOOLEAN DEFAULT FALSE,
    has_email_alerts BOOLEAN DEFAULT FALSE,
    has_api_access BOOLEAN DEFAULT FALSE,
    has_branded_reports BOOLEAN DEFAULT FALSE
);

INSERT INTO plan_limits VALUES
('free', 1, 0, 0, 'once', ARRAY['chatgpt'], 1, FALSE, FALSE, FALSE, FALSE),
('starter', 1, 2, 5, 'weekly', ARRAY['chatgpt', 'google_aio'], 1, FALSE, FALSE, FALSE, FALSE),
('pro', 3, 5, 20, 'daily', ARRAY['chatgpt', 'claude', 'gemini', 'perplexity', 'google_aio'], NULL, TRUE, TRUE, FALSE, FALSE),
('agency', 10, 15, 50, 'daily', ARRAY['chatgpt', 'claude', 'gemini', 'perplexity', 'google_aio'], NULL, TRUE, TRUE, TRUE, TRUE),
('enterprise', 999, 999, 999, 'realtime', ARRAY['chatgpt', 'claude', 'gemini', 'perplexity', 'google_aio'], NULL, TRUE, TRUE, TRUE, TRUE);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE visibility_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_leads ENABLE ROW LEVEL SECURITY;
