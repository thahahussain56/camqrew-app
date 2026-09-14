-- -------------------------------------------------------------
-- CAMCREW STUDIO: Phase 1 Database Overhaul (31 Tables)
-- -------------------------------------------------------------

-- Drop old and new tables to ensure a clean slate
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS professionals CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TABLE IF EXISTS contact_messages CASCADE;
DROP TABLE IF EXISTS newsletter_subscribers CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS vault_files CASCADE;
DROP TABLE IF EXISTS vault_folders CASCADE;
DROP TABLE IF EXISTS crew_payouts CASCADE;
DROP TABLE IF EXISTS booking_milestones CASCADE;
DROP TABLE IF EXISTS escrow_payments CASCADE;
DROP TABLE IF EXISTS rental_orders CASCADE;
DROP TABLE IF EXISTS rental_equipment CASCADE;
DROP TABLE IF EXISTS verification_requests CASCADE;
DROP TABLE IF EXISTS pro_blocked_dates CASCADE;
DROP TABLE IF EXISTS professional_jobs CASCADE;
DROP TABLE IF EXISTS professional_requests CASCADE;
DROP TABLE IF EXISTS studio_bays CASCADE;
DROP TABLE IF EXISTS portfolio_items CASCADE;
DROP TABLE IF EXISTS professional_profiles CASCADE;
DROP TABLE IF EXISTS refunds CASCADE;
DROP TABLE IF EXISTS rewards CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS pro_sale_items CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;

-- -------------------------------------------------------------
-- 1. Authentication & User Management
-- -------------------------------------------------------------

CREATE TABLE users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  email VARCHAR(128) UNIQUE NOT NULL,
  phone VARCHAR(32) UNIQUE NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'customer', -- 'customer', 'professional', 'admin'
  avatar TEXT,
  gstin VARCHAR(32),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(128) UNIQUE NOT NULL,
  is_used BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(64) DEFAULT 'Home',
  line1 TEXT NOT NULL,
  line2 TEXT,
  city VARCHAR(64) NOT NULL,
  state VARCHAR(64) NOT NULL,
  pincode VARCHAR(16) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(32) NOT NULL, -- 'razorpay', 'stripe'
  card_last4 VARCHAR(4),
  card_brand VARCHAR(32),
  upi_id VARCHAR(128),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- 2. E-Commerce & Marketplace Catalog
-- -------------------------------------------------------------

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(256) NOT NULL,
  category VARCHAR(64) NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  description TEXT,
  specifications JSONB DEFAULT '{}'::jsonb,
  images TEXT[] DEFAULT '{}',
  in_stock BOOLEAN DEFAULT true,
  stock_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE RESTRICT,
  total_amount NUMERIC(10,2) NOT NULL,
  fulfillment_mode VARCHAR(32) DEFAULT 'courier',
  address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  status VARCHAR(32) DEFAULT 'pending', -- pending, paid, shipped, delivered
  tracking_number VARCHAR(64),
  courier_partner VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pro_sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(256) NOT NULL,
  category VARCHAR(64) NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  condition VARCHAR(32) NOT NULL, -- 'like new', 'good', 'heavily used'
  description TEXT,
  images TEXT[] DEFAULT '{}',
  status VARCHAR(32) DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(32) UNIQUE NOT NULL,
  discount_type VARCHAR(16) NOT NULL, -- 'percentage', 'fixed'
  discount_value NUMERIC(10,2) NOT NULL,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  referral_balance NUMERIC(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  transaction_id VARCHAR(128) NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status VARCHAR(32) DEFAULT 'processing', -- processing, completed, failed
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- 3. Creative Services & Studio Bookings
-- -------------------------------------------------------------

CREATE TABLE professional_profiles (
  id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(128) NOT NULL,
  bio TEXT,
  experience_years INTEGER DEFAULT 0,
  rate_per_day NUMERIC(10,2) NOT NULL,
  state VARCHAR(64),
  city VARCHAR(64),
  categories TEXT[] DEFAULT '{}',
  skills TEXT[] DEFAULT '{}',
  equipment TEXT[] DEFAULT '{}',
  rating NUMERIC(3,2) DEFAULT 5.0,
  review_count INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id VARCHAR(64) REFERENCES professional_profiles(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type VARCHAR(16) DEFAULT 'image', -- image, video
  title VARCHAR(128),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE studio_bays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(128) NOT NULL,
  dimensions VARCHAR(64),
  hourly_rate NUMERIC(10,2) NOT NULL,
  description TEXT,
  images TEXT[] DEFAULT '{}',
  amenities TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id VARCHAR(64) REFERENCES users(id) ON DELETE RESTRICT,
  professional_id VARCHAR(64) REFERENCES professional_profiles(id) ON DELETE RESTRICT,
  studio_id UUID REFERENCES studio_bays(id) ON DELETE SET NULL,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  status VARCHAR(32) DEFAULT 'pending', -- pending, accepted, completed, cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE professional_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(256) NOT NULL,
  description TEXT NOT NULL,
  budget NUMERIC(10,2),
  required_skills TEXT[] DEFAULT '{}',
  location VARCHAR(128),
  status VARCHAR(32) DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE professional_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES professional_requests(id) ON DELETE CASCADE,
  professional_id VARCHAR(64) REFERENCES professional_profiles(id) ON DELETE CASCADE,
  status VARCHAR(32) DEFAULT 'matched', -- matched, in-progress, completed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pro_blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id VARCHAR(64) REFERENCES professional_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id VARCHAR(64) REFERENCES professional_profiles(id) ON DELETE CASCADE,
  document_url TEXT NOT NULL,
  status VARCHAR(32) DEFAULT 'pending', -- pending, approved, rejected
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- 4. Equipment Rentals
-- -------------------------------------------------------------

CREATE TABLE rental_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(256) NOT NULL,
  category VARCHAR(64) NOT NULL,
  daily_rate NUMERIC(10,2) NOT NULL,
  security_deposit NUMERIC(10,2) NOT NULL,
  description TEXT,
  images TEXT[] DEFAULT '{}',
  status VARCHAR(32) DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rental_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id VARCHAR(64) REFERENCES users(id) ON DELETE RESTRICT,
  equipment_id UUID REFERENCES rental_equipment(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  deposit_status VARCHAR(32) DEFAULT 'pending',
  status VARCHAR(32) DEFAULT 'confirmed', -- confirmed, active, returned
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- 5. Escrow & Financial Management
-- -------------------------------------------------------------

CREATE TABLE escrow_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  status VARCHAR(32) DEFAULT 'held', -- held, released, refunded
  transaction_id VARCHAR(128),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE booking_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  title VARCHAR(128) NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status VARCHAR(32) DEFAULT 'pending', -- pending, approved, paid
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE crew_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id VARCHAR(64) REFERENCES professional_profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  status VARCHAR(32) DEFAULT 'processing', -- processing, paid, failed
  reference_id VARCHAR(128),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- 6. Media Vault, Messaging & Social
-- -------------------------------------------------------------

CREATE TABLE vault_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  name VARCHAR(128) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vault_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID REFERENCES vault_folders(id) ON DELETE CASCADE,
  uploader_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  file_name VARCHAR(256) NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  file_type VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  sender_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  receiver_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  target_user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(128) NOT NULL,
  body TEXT NOT NULL,
  action_link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- 7. Support & Marketing
-- -------------------------------------------------------------

CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(128) UNIQUE NOT NULL,
  status VARCHAR(32) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(128) NOT NULL,
  email VARCHAR(128) NOT NULL,
  subject VARCHAR(256),
  message TEXT NOT NULL,
  status VARCHAR(32) DEFAULT 'unread',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- DEFAULT ROW LEVEL SECURITY (RLS) OPEN POLICIES FOR DEVELOPMENT
-- (Note: In production, these should be strictly tailored)
-- -------------------------------------------------------------

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read on users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow update own user" ON users FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Allow public insert on professional_profiles" ON professional_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read on professional_profiles" ON professional_profiles FOR SELECT USING (true);
CREATE POLICY "Allow update own profile" ON professional_profiles FOR UPDATE USING (auth.uid()::text = id);
