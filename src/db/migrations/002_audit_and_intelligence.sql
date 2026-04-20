-- Migration: 002_audit_and_intelligence.sql
-- Goal: Categorized Anomaly Detection and Feedback Loop Audit

-- 1. Augment Transactions with Intelligence Flags
ALTER TABLE transactions 
ADD COLUMN is_anomaly BOOLEAN DEFAULT FALSE,
ADD COLUMN z_score DECIMAL(10,4) DEFAULT 0;

-- 2. Create Category Audit Logs for ML Training Feedback
CREATE TABLE category_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    old_category_id UUID NOT NULL REFERENCES categories(id),
    new_category_id UUID NOT NULL REFERENCES categories(id),
    correction_source VARCHAR(20) NOT NULL DEFAULT 'user', -- 'user' or 'system'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for audit and training extraction
CREATE INDEX idx_audit_user ON category_audit_logs(user_id);
CREATE INDEX idx_audit_transaction ON category_audit_logs(transaction_id);
CREATE INDEX idx_transactions_anomaly ON transactions(is_anomaly) WHERE is_anomaly IS TRUE;
