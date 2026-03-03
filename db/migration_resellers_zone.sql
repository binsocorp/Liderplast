-- Migration: Add zone column to resellers
ALTER TABLE public.resellers ADD COLUMN IF NOT EXISTS zone TEXT DEFAULT '';
