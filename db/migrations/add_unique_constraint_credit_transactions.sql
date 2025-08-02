-- Migration: Add unique constraint to prevent duplicate credit transactions for the same order
-- This prevents race conditions between webhook and API endpoints

-- Add unique constraint to prevent duplicate top_up transactions for the same order
-- Only applies to transactions with order_id (top_up transactions)
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_credit_transactions_unique_order_topup 
ON credit_transactions (order_id, business_user_id, type) 
WHERE order_id IS NOT NULL AND type = 'top_up';