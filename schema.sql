-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. GYMS TABLE
CREATE TABLE gyms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    address TEXT,
    phone TEXT,
    upi_id TEXT,
    upi_qr_url TEXT,
    owner_id UUID NOT NULL,
    description TEXT,
    operating_hours TEXT,
    instagram_url TEXT,
    youtube_url TEXT,
    gallery_photo1 TEXT,
    gallery_photo2 TEXT,
    gallery_photo3 TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index on slug for fast lookup
CREATE INDEX idx_gyms_slug ON gyms(slug);

-- 2. PLANS TABLE
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    duration_days INTEGER NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Index on gym_id
CREATE INDEX idx_plans_gym_id ON plans(gym_id);

-- 3. MEMBERS TABLE
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'pending')) DEFAULT 'pending'
);

-- Index on gym_id and status
CREATE INDEX idx_members_gym_id ON members(gym_id);
CREATE INDEX idx_members_status ON members(status);

-- 4. MEMBERSHIPS TABLE
CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'pending')) DEFAULT 'pending'
);

-- Index on member_id
CREATE INDEX idx_memberships_member_id ON memberships(member_id);

-- 5. PAYMENTS TABLE
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    utr TEXT,
    screenshot_url TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index on member_id and status
CREATE INDEX idx_payments_member_id ON payments(member_id);
CREATE INDEX idx_payments_status ON payments(status);
