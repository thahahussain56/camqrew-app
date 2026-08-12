-- -------------------------------------------------------------
-- CAMCREW STUDIO: Production PostgreSQL Database Schema (Supabase / Render)
-- -------------------------------------------------------------

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  email VARCHAR(128) UNIQUE NOT NULL,
  phone VARCHAR(32) UNIQUE NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'customer',
  avatar TEXT,
  gstin VARCHAR(32),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Professional Profiles Table
CREATE TABLE IF NOT EXISTS professionals (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(128) NOT NULL,
  title VARCHAR(128) NOT NULL,
  avatar TEXT,
  banner_image TEXT,
  verified BOOLEAN DEFAULT false,
  rating NUMERIC(3,2) DEFAULT 5.0,
  review_count INTEGER DEFAULT 0,
  experience_years INTEGER DEFAULT 5,
  rate_per_day NUMERIC(10,2) NOT NULL,
  bio TEXT,
  state VARCHAR(64),
  district VARCHAR(64),
  city VARCHAR(64),
  locations TEXT[],
  categories TEXT[],
  equipment TEXT[],
  certifications TEXT[],
  blocked_dates TEXT[],
  international_travel BOOLEAN DEFAULT true,
  ical_export_url TEXT,
  payout_upi_vpa VARCHAR(128),
  total_earnings NUMERIC(12,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Professional Services Rate Card Table
CREATE TABLE IF NOT EXISTS services (
  id VARCHAR(64) PRIMARY KEY,
  professional_id VARCHAR(64) REFERENCES professionals(id) ON DELETE CASCADE,
  title VARCHAR(128) NOT NULL,
  category VARCHAR(64) NOT NULL,
  rate NUMERIC(10,2) NOT NULL,
  unit VARCHAR(32) NOT NULL DEFAULT 'per day',
  description TEXT
);

-- 4. Shoot Bookings Table (Escrow Protected)
CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(64) PRIMARY KEY,
  professional_id VARCHAR(64) REFERENCES professionals(id),
  professional_name VARCHAR(128) NOT NULL,
  customer_id VARCHAR(64) REFERENCES users(id),
  customer_name VARCHAR(128) NOT NULL,
  service_title VARCHAR(128) NOT NULL,
  event_type VARCHAR(64) DEFAULT 'Wedding',
  start_date VARCHAR(32) NOT NULL,
  end_date VARCHAR(32) NOT NULL,
  start_time VARCHAR(32) NOT NULL,
  end_time VARCHAR(32) NOT NULL,
  days_count INTEGER DEFAULT 1,
  location TEXT NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  contract_signature VARCHAR(128) NOT NULL,
  contract_terms_text TEXT,
  contract_signed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  milestones JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Products & Rental Equipment Catalog Table
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(256) NOT NULL,
  type VARCHAR(32) NOT NULL DEFAULT 'rental', -- 'rental' or 'sale'
  category VARCHAR(64) NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  rental_price_per_day NUMERIC(10,2),
  deposit_amount NUMERIC(10,2) DEFAULT 5000.00,
  rating NUMERIC(3,2) DEFAULT 4.9,
  review_count INTEGER DEFAULT 0,
  description TEXT,
  specifications JSONB DEFAULT '{}'::jsonb,
  included_items TEXT[],
  image TEXT NOT NULL,
  in_stock BOOLEAN DEFAULT true,
  owner_id VARCHAR(64) REFERENCES users(id),
  storage_hub VARCHAR(128) DEFAULT 'Mumbai Central Hub'
);

-- 6. Customer Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  customer_id VARCHAR(64) REFERENCES users(id),
  customer_name VARCHAR(128) NOT NULL,
  items JSONB NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  fulfillment_mode VARCHAR(32) DEFAULT 'courier',
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city VARCHAR(64) NOT NULL,
  state VARCHAR(64) NOT NULL,
  pincode VARCHAR(16) NOT NULL,
  status VARCHAR(32) DEFAULT 'confirmed',
  tracking_number VARCHAR(64),
  courier_partner VARCHAR(64) DEFAULT 'Dunzo / Shiprocket',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Payment-Unlocked Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id VARCHAR(64) PRIMARY KEY,
  thread_id VARCHAR(128) NOT NULL,
  sender_id VARCHAR(64) NOT NULL,
  sender_name VARCHAR(128) NOT NULL,
  receiver_id VARCHAR(64) NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
