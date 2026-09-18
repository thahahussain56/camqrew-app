-- ====================================================================
-- CAMCREW PRECISION DATABASE MIGRATION SCRIPT
-- Generated: 2026-09-18T07:14:28.095Z
-- ====================================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Ensure required extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Bypass triggers and FK checks during data restore
SET session_replication_role = 'replica';

-- ====================================================================
-- 1. PUBLIC TABLES DEFINITION
-- ====================================================================

CREATE TABLE IF NOT EXISTS public."addresses" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar(64),
  "label" varchar(64) DEFAULT 'Home'::character varying,
  "line1" text NOT NULL,
  "line2" text,
  "city" varchar(64) NOT NULL,
  "state" varchar(64) NOT NULL,
  "pincode" varchar(16) NOT NULL,
  "is_default" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."booking_milestones" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "booking_id" uuid,
  "title" varchar(128) NOT NULL,
  "amount" numeric NOT NULL,
  "status" varchar(32) DEFAULT 'pending'::character varying,
  "due_date" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."bookings" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "customer_id" varchar(64),
  "professional_id" varchar(64),
  "studio_id" uuid,
  "start_datetime" timestamp with time zone NOT NULL,
  "end_datetime" timestamp with time zone NOT NULL,
  "total_amount" numeric NOT NULL,
  "status" varchar(32) DEFAULT 'pending'::character varying,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "items" jsonb,
  "location_details" jsonb,
  "payment_method" text,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."cart_items" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar(64),
  "product_id" uuid,
  "quantity" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."chat_messages" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "booking_id" uuid,
  "sender_id" varchar(64),
  "receiver_id" varchar(64),
  "text" text NOT NULL,
  "is_read" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."contact_messages" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(128) NOT NULL,
  "email" varchar(128) NOT NULL,
  "subject" varchar(256),
  "message" text NOT NULL,
  "status" varchar(32) DEFAULT 'unread'::character varying,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."coupons" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "code" varchar(32) NOT NULL,
  "discount_type" varchar(16) NOT NULL,
  "discount_value" numeric NOT NULL,
  "valid_from" timestamp with time zone,
  "valid_until" timestamp with time zone,
  "usage_limit" integer,
  "used_count" integer DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."crew_payouts" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "professional_id" varchar(64),
  "amount" numeric NOT NULL,
  "status" varchar(32) DEFAULT 'processing'::character varying,
  "reference_id" varchar(128),
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."escrow_payments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "booking_id" uuid,
  "amount" numeric NOT NULL,
  "status" varchar(32) DEFAULT 'held'::character varying,
  "transaction_id" varchar(128),
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."job_requests" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "client_id" uuid NOT NULL,
  "title" text NOT NULL,
  "requirements" text NOT NULL,
  "location" text NOT NULL,
  "budget" integer NOT NULL,
  "status" text DEFAULT 'open'::character varying NOT NULL,
  "accepted_by" uuid,
  "rejected_pros" jsonb DEFAULT '[]'::jsonb,
  "created_at" timestamp with time zone DEFAULT now(),
  "state" text,
  "district" text,
  "city" text,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."newsletter_subscribers" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar(128) NOT NULL,
  "status" varchar(32) DEFAULT 'active'::character varying,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."notifications" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar(64),
  "title" varchar(128) NOT NULL,
  "body" text NOT NULL,
  "action_link" text,
  "is_read" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "target_url" text,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."orders" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar(64),
  "total_amount" numeric NOT NULL,
  "fulfillment_mode" varchar(32) DEFAULT 'courier'::character varying,
  "address_id" uuid,
  "status" varchar(32) DEFAULT 'pending'::character varying,
  "tracking_number" varchar(64),
  "courier_partner" varchar(64),
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "items" jsonb DEFAULT '[]'::jsonb,
  "shipping_address" jsonb DEFAULT '{}'::jsonb,
  "payment_method" text,
  "subtotal" numeric,
  "tax" numeric,
  "shipping_fee" numeric,
  "discount" numeric,
  "awb_code" text,
  "courier_name" text,
  "shiprocket_order_id" text,
  "tracking_status" text,
  "order_type" text DEFAULT 'sale'::character varying,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."password_reset_tokens" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar(64),
  "token" varchar(128) NOT NULL,
  "is_used" boolean DEFAULT false,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."payment_methods" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar(64),
  "provider" varchar(32) NOT NULL,
  "card_last4" varchar(4),
  "card_brand" varchar(32),
  "upi_id" varchar(128),
  "is_default" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."portfolio_items" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "professional_id" varchar(64),
  "media_url" text NOT NULL,
  "media_type" varchar(16) DEFAULT 'image'::character varying,
  "title" varchar(128),
  "description" text,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."pro_blocked_dates" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "professional_id" varchar(64),
  "date" date NOT NULL,
  "reason" text,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."pro_sale_items" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "seller_id" varchar(64),
  "title" varchar(256) NOT NULL,
  "category" varchar(64) NOT NULL,
  "price" numeric NOT NULL,
  "condition" varchar(32) NOT NULL,
  "description" text,
  "images" text[] DEFAULT '{}'::text[],
  "status" varchar(32) DEFAULT 'available'::character varying,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "cod_enabled" boolean DEFAULT false,
  "gtin" text,
  "sku" text,
  "bullet_points" jsonb DEFAULT '[]'::jsonb,
  "sale_price" numeric,
  "item_dimensions" text,
  "package_dimensions" text,
  "item_weight" text,
  "package_weight" text,
  "search_terms" jsonb DEFAULT '[]'::jsonb,
  "browse_nodes" jsonb DEFAULT '[]'::jsonb,
  "battery_info" text,
  "country_of_origin" text,
  "safety_warnings" text,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."products" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(256) NOT NULL,
  "category" varchar(64) NOT NULL,
  "price" numeric NOT NULL,
  "description" text,
  "specifications" jsonb DEFAULT '{}'::jsonb,
  "images" text[] DEFAULT '{}'::text[],
  "in_stock" boolean DEFAULT true,
  "stock_quantity" integer DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "brand" text,
  "cod_enabled" boolean DEFAULT false,
  "gtin" text,
  "sku" text,
  "bullet_points" jsonb DEFAULT '[]'::jsonb,
  "sale_price" numeric,
  "item_dimensions" text,
  "package_dimensions" text,
  "item_weight" text,
  "package_weight" text,
  "search_terms" jsonb DEFAULT '[]'::jsonb,
  "browse_nodes" jsonb DEFAULT '[]'::jsonb,
  "battery_info" text,
  "country_of_origin" text,
  "safety_warnings" text,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."professional_jobs" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "request_id" uuid,
  "professional_id" varchar(64),
  "status" varchar(32) DEFAULT 'matched'::character varying,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."professional_profiles" (
  "id" varchar(64) NOT NULL,
  "title" varchar(128) NOT NULL,
  "bio" text,
  "experience_years" integer DEFAULT 0,
  "rate_per_day" numeric NOT NULL,
  "state" varchar(64),
  "city" varchar(64),
  "categories" text[] DEFAULT '{}'::text[],
  "skills" text[] DEFAULT '{}'::text[],
  "equipment" text[] DEFAULT '{}'::text[],
  "rating" numeric DEFAULT 5.0,
  "review_count" integer DEFAULT 0,
  "verified" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "district" text,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."professional_requests" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "client_id" varchar(64),
  "title" varchar(256) NOT NULL,
  "description" text NOT NULL,
  "budget" numeric,
  "required_skills" text[] DEFAULT '{}'::text[],
  "location" varchar(128),
  "status" varchar(32) DEFAULT 'open'::character varying,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."refunds" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid,
  "transaction_id" varchar(128) NOT NULL,
  "amount" numeric NOT NULL,
  "status" varchar(32) DEFAULT 'processing'::character varying,
  "reason" text,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."rental_equipment" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" varchar(64),
  "name" varchar(256) NOT NULL,
  "category" varchar(64) NOT NULL,
  "daily_rate" numeric NOT NULL,
  "security_deposit" numeric NOT NULL,
  "description" text,
  "images" text[] DEFAULT '{}'::text[],
  "status" varchar(32) DEFAULT 'available'::character varying,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."rental_orders" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "customer_id" varchar(64),
  "equipment_id" uuid,
  "start_date" date NOT NULL,
  "end_date" date NOT NULL,
  "total_amount" numeric NOT NULL,
  "deposit_status" varchar(32) DEFAULT 'pending'::character varying,
  "status" varchar(32) DEFAULT 'confirmed'::character varying,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."reviews" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "reviewer_id" varchar(64),
  "target_user_id" varchar(64),
  "booking_id" uuid,
  "rating" integer,
  "comment" text,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."rewards" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar(64),
  "points" integer DEFAULT 0,
  "referral_balance" numeric DEFAULT 0.00,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."studio_bays" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" varchar(64),
  "name" varchar(128) NOT NULL,
  "dimensions" varchar(64),
  "hourly_rate" numeric NOT NULL,
  "description" text,
  "images" text[] DEFAULT '{}'::text[],
  "amenities" text[] DEFAULT '{}'::text[],
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."users" (
  "id" varchar(64) NOT NULL,
  "name" varchar(128) NOT NULL,
  "email" varchar(128) NOT NULL,
  "phone" varchar(32) NOT NULL,
  "role" varchar(32) DEFAULT 'customer'::character varying NOT NULL,
  "avatar" text,
  "gstin" varchar(32),
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "push_token" text,
  "push_preferences" jsonb DEFAULT '{"chat": true, "booking": true, "marketing": true}'::jsonb,
  "subscription_tier" text DEFAULT 'free'::character varying,
  "subscription_status" text DEFAULT 'inactive'::character varying,
  "subscription_end_date" timestamp without time zone,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."vault_files" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "folder_id" uuid,
  "uploader_id" varchar(64),
  "file_name" varchar(256) NOT NULL,
  "file_url" text NOT NULL,
  "file_size_bytes" bigint,
  "file_type" varchar(64),
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."vault_folders" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" varchar(64),
  "booking_id" uuid,
  "name" varchar(128) NOT NULL,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."verification_requests" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "professional_id" varchar(64),
  "document_url" text NOT NULL,
  "status" varchar(32) DEFAULT 'pending'::character varying,
  "admin_notes" text,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

-- ====================================================================
-- 2. AUTH USERS (18 accounts)
-- ====================================================================

INSERT INTO auth.users ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES ('00000000-0000-0000-0000-000000000000', '4f04db3e-7db8-4d74-81c4-4c25ff16db4b', 'authenticated', 'authenticated', 'aishazakeeraisha@gmail.com', '$2a$10$dwJSgE7G7Fei7CsXxZ9P4./bNZsMKvtT6JaesBj8h/WasJn.jQhyG', '2026-08-13T17:02:00.726Z'::timestamptz, NULL, '', NULL, '5431c3e3c136f70ed6adc2ac77e10761ddeaa285ccccedfb40f3bade', '2026-08-14T15:46:10.126Z'::timestamptz, '', '', NULL, '2026-08-13T17:02:00.738Z'::timestamptz, '{"provider":"email","providers":["email"]}'::jsonb, '{"sub":"4f04db3e-7db8-4d74-81c4-4c25ff16db4b","email":"aishazakeeraisha@gmail.com","email_verified":true,"phone_verified":false}'::jsonb, NULL, '2026-08-13T17:02:00.677Z'::timestamptz, '2026-09-07T16:33:12.258Z'::timestamptz, NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, encrypted_password = EXCLUDED.encrypted_password;
INSERT INTO auth.users ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES ('00000000-0000-0000-0000-000000000000', 'c2c752e7-9a44-4f4b-baf7-b9a521112f7a', 'authenticated', 'authenticated', 'thaha@yenepoya.edu.in', '$2a$10$MHh3tOBMbFTRGEHet2BqJOcyl5HJpEBM7ZoC9B1vdYuKkNSbdhKBy', '2026-08-12T10:55:26.931Z'::timestamptz, NULL, '', '2026-08-12T10:55:05.398Z'::timestamptz, '', NULL, '', '', NULL, '2026-08-12T10:55:26.938Z'::timestamptz, '{"provider":"email","providers":["email"]}'::jsonb, '{"sub":"c2c752e7-9a44-4f4b-baf7-b9a521112f7a","email":"thaha@yenepoya.edu.in","email_verified":true,"phone_verified":false}'::jsonb, NULL, '2026-08-12T10:55:05.328Z'::timestamptz, '2026-08-12T10:55:26.955Z'::timestamptz, NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, encrypted_password = EXCLUDED.encrypted_password;
INSERT INTO auth.users ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES ('00000000-0000-0000-0000-000000000000', 'c02f0ee1-1541-4d42-8da5-7450929c735e', 'authenticated', 'authenticated', 'thaha@camcrew.in', '$2a$10$oNpsbyTrzQJuzzejbMPAlOc6y4bdvaI2wI4eVLxr5du2dzsfckalS', '2026-08-13T15:13:06.879Z'::timestamptz, NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-13T15:13:06.900Z'::timestamptz, '{"provider":"email","providers":["email"]}'::jsonb, '{"sub":"c02f0ee1-1541-4d42-8da5-7450929c735e","email":"thaha@camcrew.in","email_verified":true,"phone_verified":false}'::jsonb, NULL, '2026-08-13T15:13:06.822Z'::timestamptz, '2026-08-13T16:36:09.833Z'::timestamptz, NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, encrypted_password = EXCLUDED.encrypted_password;
INSERT INTO auth.users ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES ('00000000-0000-0000-0000-000000000000', 'e6f98a5e-6978-44f0-8cf4-df5f6746dbd5', 'authenticated', 'authenticated', 'example@placeholder.com', '$2a$10$xhIEVCtBN8IiLv/F.eJEIO8TxaS2PKptvlgKbt0mFUyIZlGU6mHR2', NULL, NULL, 'f8aa9fd99c6ad34663d800d770bb3c10dcb4fd9d6d7f468f75df468f', '2026-08-13T04:48:34.987Z'::timestamptz, '', NULL, '', '', NULL, NULL, '{"provider":"email","providers":["email"]}'::jsonb, '{"sub":"e6f98a5e-6978-44f0-8cf4-df5f6746dbd5","email":"example@placeholder.com","email_verified":false,"phone_verified":false}'::jsonb, NULL, '2026-08-13T04:48:34.935Z'::timestamptz, '2026-08-13T04:48:37.717Z'::timestamptz, NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, encrypted_password = EXCLUDED.encrypted_password;
INSERT INTO auth.users ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES ('00000000-0000-0000-0000-000000000000', 'c3e8c8aa-fe82-4ffc-8fb6-30a7af129630', 'authenticated', 'authenticated', 'rahzin987@gmail.com', '$2a$10$e.S5uDa95br2SbgrKn4/suxVmglYevlC8ahIq2epWew9gRanMlhi2', '2026-08-13T05:05:50.869Z'::timestamptz, NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-14T05:08:18.416Z'::timestamptz, '{"provider":"email","providers":["email"]}'::jsonb, '{"sub":"c3e8c8aa-fe82-4ffc-8fb6-30a7af129630","email":"rahzin987@gmail.com","email_verified":true,"phone_verified":false}'::jsonb, NULL, '2026-08-13T05:05:50.856Z'::timestamptz, '2026-08-14T05:08:18.428Z'::timestamptz, NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, encrypted_password = EXCLUDED.encrypted_password;
INSERT INTO auth.users ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES ('00000000-0000-0000-0000-000000000000', '7001562c-8a7a-44e6-a18a-456316f8fa8d', 'authenticated', 'authenticated', 'rahul@gmail.com', '$2a$10$AJMI8aHGuE9gTgOSDwIFMuVAQFCmPWih/nFYnIllzjPohoZkedN9e', '2026-09-15T07:39:17.491Z'::timestamptz, NULL, '', NULL, '', NULL, '', '', NULL, '2026-09-15T07:39:17.509Z'::timestamptz, '{"provider":"email","providers":["email"]}'::jsonb, '{"sub":"7001562c-8a7a-44e6-a18a-456316f8fa8d","name":"Rahul","role":"professional","email":"rahul@gmail.com","phone":"8751959526","email_verified":true,"phone_verified":false}'::jsonb, NULL, '2026-09-15T07:39:17.417Z'::timestamptz, '2026-09-16T06:18:51.271Z'::timestamptz, NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, encrypted_password = EXCLUDED.encrypted_password;
INSERT INTO auth.users ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES ('00000000-0000-0000-0000-000000000000', '07d5ef4e-037c-47e1-978a-38c26791ef0f', 'authenticated', 'authenticated', 'jondonbosco@gmail.com', '$2a$10$T5u/7wz.xunYY..URUcuo.0Y9J4VNrCoRD0ylCWjn4Pb3mzBGc9Y2', '2026-08-13T05:34:53.145Z'::timestamptz, NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-14T05:10:57.720Z'::timestamptz, '{"provider":"email","providers":["email"]}'::jsonb, '{"sub":"07d5ef4e-037c-47e1-978a-38c26791ef0f","email":"jondonbosco@gmail.com","email_verified":true,"phone_verified":false}'::jsonb, NULL, '2026-08-13T05:34:53.126Z'::timestamptz, '2026-08-14T05:10:57.777Z'::timestamptz, NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, encrypted_password = EXCLUDED.encrypted_password;
INSERT INTO auth.users ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES ('00000000-0000-0000-0000-000000000000', '7be19030-5a9f-4dd0-8baf-1c4495e34a48', 'authenticated', 'authenticated', 'asharma@gmail.com', '$2a$10$ahwVvUSSHmETG/mAl6cpFOW5sG7seUFx4gbij1jJbQ1UGmkMLepA2', '2026-08-13T09:14:29.937Z'::timestamptz, NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-14T05:11:42.865Z'::timestamptz, '{"provider":"email","providers":["email"]}'::jsonb, '{"sub":"7be19030-5a9f-4dd0-8baf-1c4495e34a48","email":"asharma@gmail.com","email_verified":true,"phone_verified":false}'::jsonb, NULL, '2026-08-13T09:14:29.906Z'::timestamptz, '2026-08-14T05:11:42.888Z'::timestamptz, NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, encrypted_password = EXCLUDED.encrypted_password;
INSERT INTO auth.users ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES ('00000000-0000-0000-0000-000000000000', 'd1d148da-6e4d-483d-9da6-7a44d6ef6088', 'authenticated', 'authenticated', 'thaha@gmail.com', '$2a$10$r78iB8t9d0zA02d6Uz7i9.TpehOJglveYljXNmqIvYfw5m9t02HiO', '2026-08-13T09:09:20.350Z'::timestamptz, NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-13T17:31:56.703Z'::timestamptz, '{"provider":"email","providers":["email"]}'::jsonb, '{"sub":"d1d148da-6e4d-483d-9da6-7a44d6ef6088","email":"thaha@gmail.com","email_verified":true,"phone_verified":false}'::jsonb, NULL, '2026-08-13T09:09:20.332Z'::timestamptz, '2026-08-14T15:20:55.206Z'::timestamptz, NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, encrypted_password = EXCLUDED.encrypted_password;
INSERT INTO auth.users ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES ('00000000-0000-0000-0000-000000000000', '41778e79-3cc9-4fa4-aec2-1257cd450ba3', 'authenticated', 'authenticated', 'shaki@gmail.com', '$2a$10$FEQnrtpWG0DEPWb/.ezPYeF/cFPMZ6FWpUWNM9uFh38keCSSq1Dza', '2026-08-14T15:54:15.359Z'::timestamptz, NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-14T15:54:15.366Z'::timestamptz, '{"provider":"email","providers":["email"]}'::jsonb, '{"sub":"41778e79-3cc9-4fa4-aec2-1257cd450ba3","email":"shaki@gmail.com","email_verified":true,"phone_verified":false}'::jsonb, NULL, '2026-08-14T15:54:15.320Z'::timestamptz, '2026-08-18T06:46:58.615Z'::timestamptz, NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, encrypted_password = EXCLUDED.encrypted_password;
INSERT INTO auth.users ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES ('00000000-0000-0000-0000-000000000000', '5d7c4512-257a-491a-acd0-049304c4f861', 'authenticated', 'authenticated', 'thahahussain56@gmail.com', '$2a$10$C8k9zXcVAbG7e211i75MPO6gXLmCePDFeov7pYd5Sf796whWw0CJa', '2026-08-18T10:33:06.554Z'::timestamptz, NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-18T10:33:06.560Z'::timestamptz, '{"provider":"email","providers":["email"]}'::jsonb, '{"sub":"5d7c4512-257a-491a-acd0-049304c4f861","email":"thahahussain56@gmail.com","email_verified":true,"phone_verified":false}'::jsonb, NULL, '2026-08-18T10:33:06.505Z'::timestamptz, '2026-08-18T10:33:06.564Z'::timestamptz, NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, encrypted_password = EXCLUDED.encrypted_password;
INSERT INTO auth.users ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES ('00000000-0000-0000-0000-000000000000', '96c8cf13-5b87-4cf4-8ea6-cc2f41d100b4', 'authenticated', 'authenticated', 'shakira.irfana@gmail.com', '$2a$10$UIGwn8B/2PuRbCHcb5k7QecXJAETvbBfEVVvKkV4FhNM4ztNjcXAm', '2026-08-18T10:21:59.604Z'::timestamptz, NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-18T10:38:55.954Z'::timestamptz, '{"provider":"email","providers":["email"]}'::jsonb, '{"sub":"96c8cf13-5b87-4cf4-8ea6-cc2f41d100b4","email":"shakira.irfana@gmail.com","email_verified":true,"phone_verified":false}'::jsonb, NULL, '2026-08-18T10:21:59.537Z'::timestamptz, '2026-08-19T16:25:53.139Z'::timestamptz, NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, encrypted_password = EXCLUDED.encrypted_password;
INSERT INTO auth.users ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES ('00000000-0000-0000-0000-000000000000', '614e8a78-a5f9-4d25-95f7-e42f91eb7167', 'authenticated', 'authenticated', 'aarav@studio.com', '$2a$10$EXPLuJ8e4whGhqP57uWN3uVhpyafofeNDWX2kAzW99kVmDvfm0tZK', '2026-08-13T06:01:41.687Z'::timestamptz, NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-13T06:01:41.692Z'::timestamptz, '{"provider":"email","providers":["email"]}'::jsonb, '{"sub":"614e8a78-a5f9-4d25-95f7-e42f91eb7167","email":"aarav@studio.com","email_verified":true,"phone_verified":false}'::jsonb, NULL, '2026-08-13T06:01:41.660Z'::timestamptz, '2026-08-13T09:09:01.006Z'::timestamptz, NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, encrypted_password = EXCLUDED.encrypted_password;
INSERT INTO auth.users ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES ('00000000-0000-0000-0000-000000000000', '1afd0cfe-5b96-4db2-98c4-5f0d18a44636', 'authenticated', 'authenticated', 'admin@camcrew.in', '$2a$06$PvkyiZFtp5igSh3bYnZZ6uanaz/TIzw/WCe95XvdH15CXGAGu7ltC', '2026-08-17T15:08:17.986Z'::timestamptz, NULL, '', NULL, '', NULL, '', '', NULL, '2026-09-13T11:07:50.566Z'::timestamptz, '{"provider":"email","providers":["email"]}'::jsonb, '{"sub":"1afd0cfe-5b96-4db2-98c4-5f0d18a44636","email":"admin@camcrew.in","email_verified":true,"phone_verified":false}'::jsonb, NULL, '2026-08-17T15:08:17.909Z'::timestamptz, '2026-09-13T11:07:50.621Z'::timestamptz, NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, encrypted_password = EXCLUDED.encrypted_password;
INSERT INTO auth.users ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES ('00000000-0000-0000-0000-000000000000', 'eb8b925d-8b2f-4293-b189-2f67001f26d6', 'authenticated', 'authenticated', 'thahazakir@gmail.com', '$2a$10$pRu4HLroR96NIIerHBWxXuhG6KW8Lu0IsRhqDDlHbTILZNCfjx28i', '2026-08-20T09:57:30.307Z'::timestamptz, NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-20T10:12:18.357Z'::timestamptz, '{"provider":"email","providers":["email"]}'::jsonb, '{"sub":"eb8b925d-8b2f-4293-b189-2f67001f26d6","name":"Thaha Zakir","role":"customer","email":"thahazakir@gmail.com","phone":"9731627661","email_verified":true,"phone_verified":false}'::jsonb, NULL, '2026-08-20T09:57:30.277Z'::timestamptz, '2026-09-07T14:14:59.125Z'::timestamptz, NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, encrypted_password = EXCLUDED.encrypted_password;
INSERT INTO auth.users ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES ('00000000-0000-0000-0000-000000000000', '1d5ea775-b7be-46bc-b50f-7dddcce6cbc7', 'authenticated', 'authenticated', 'thahapro@gmail.con', '$2a$10$pQnehfPGxeD8dVzIYJv/Quq5pMvYAsK5iz6t9Oxt1.pvMolzWKInC', '2026-08-19T16:34:51.544Z'::timestamptz, NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-19T16:34:51.551Z'::timestamptz, '{"provider":"email","providers":["email"]}'::jsonb, '{"sub":"1d5ea775-b7be-46bc-b50f-7dddcce6cbc7","name":"Thaha Hussain Mohammad","role":"professional","email":"thahapro@gmail.con","phone":"8112395565","email_verified":true,"phone_verified":false}'::jsonb, NULL, '2026-08-19T16:34:51.503Z'::timestamptz, '2026-08-21T05:48:17.355Z'::timestamptz, NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, encrypted_password = EXCLUDED.encrypted_password;
INSERT INTO auth.users ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES ('00000000-0000-0000-0000-000000000000', '492811d4-e984-4554-95bd-0f1648eaa1b5', 'authenticated', 'authenticated', 'mohammadthahahussain@gmail.com', '$2a$10$d02rt0/Y7Ljul9VgL7rI6.FJTUWGqR3FLBO4CFtsEIMohFxH3pEQG', '2026-09-07T09:03:29.614Z'::timestamptz, NULL, '', NULL, '', NULL, '', '', NULL, '2026-09-13T11:12:44.825Z'::timestamptz, '{"provider":"email","providers":["email"]}'::jsonb, '{"sub":"492811d4-e984-4554-95bd-0f1648eaa1b5","name":"Mohammad Thaha Hussain","role":"customer","email":"mohammadthahahussain@gmail.com","phone":"8113935203","email_verified":true,"phone_verified":false}'::jsonb, NULL, '2026-09-07T09:03:29.554Z'::timestamptz, '2026-09-16T17:44:41.227Z'::timestamptz, NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, encrypted_password = EXCLUDED.encrypted_password;
INSERT INTO auth.users ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES ('00000000-0000-0000-0000-000000000000', '7002ae1a-1816-453d-afb3-efd6a40150ca', 'authenticated', 'authenticated', 'thaha@pro.in', '$2a$10$qrV6O9hGOoNGxbCcoXFNX.XRZaOkrswpnQ51X8LbQUS1Ntfsvk35i', '2026-09-16T18:05:51.197Z'::timestamptz, NULL, '', NULL, '', NULL, '', '', NULL, '2026-09-16T18:06:36.145Z'::timestamptz, '{"provider":"email","providers":["email"]}'::jsonb, '{"sub":"7002ae1a-1816-453d-afb3-efd6a40150ca","name":"Thaha","role":"professional","email":"thaha@pro.in","phone":"9856412378","email_verified":true,"phone_verified":false}'::jsonb, NULL, '2026-09-16T18:05:51.159Z'::timestamptz, '2026-09-16T18:06:36.153Z'::timestamptz, NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, encrypted_password = EXCLUDED.encrypted_password;

-- ====================================================================
-- 3. AUTH IDENTITIES (18 records)
-- ====================================================================

INSERT INTO auth.identities ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES ('c2c752e7-9a44-4f4b-baf7-b9a521112f7a', 'c2c752e7-9a44-4f4b-baf7-b9a521112f7a', '{"sub":"c2c752e7-9a44-4f4b-baf7-b9a521112f7a","email":"thaha@yenepoya.edu.in","email_verified":true,"phone_verified":false}'::jsonb, 'email', '2026-08-12T10:55:05.384Z'::timestamptz, '2026-08-12T10:55:05.384Z'::timestamptz, '2026-08-12T10:55:05.384Z'::timestamptz, 'aff44996-a34d-48ad-add1-36b96148c298') ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES ('e6f98a5e-6978-44f0-8cf4-df5f6746dbd5', 'e6f98a5e-6978-44f0-8cf4-df5f6746dbd5', '{"sub":"e6f98a5e-6978-44f0-8cf4-df5f6746dbd5","email":"example@placeholder.com","email_verified":false,"phone_verified":false}'::jsonb, 'email', '2026-08-13T04:48:34.975Z'::timestamptz, '2026-08-13T04:48:34.975Z'::timestamptz, '2026-08-13T04:48:34.975Z'::timestamptz, 'b66c1405-0b3e-46cb-9b85-14ff0c9a6ce4') ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES ('c3e8c8aa-fe82-4ffc-8fb6-30a7af129630', 'c3e8c8aa-fe82-4ffc-8fb6-30a7af129630', '{"sub":"c3e8c8aa-fe82-4ffc-8fb6-30a7af129630","email":"rahzin987@gmail.com","email_verified":false,"phone_verified":false}'::jsonb, 'email', '2026-08-13T05:05:50.866Z'::timestamptz, '2026-08-13T05:05:50.866Z'::timestamptz, '2026-08-13T05:05:50.866Z'::timestamptz, '8961c72a-2348-498d-9716-3b2b7637a752') ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES ('07d5ef4e-037c-47e1-978a-38c26791ef0f', '07d5ef4e-037c-47e1-978a-38c26791ef0f', '{"sub":"07d5ef4e-037c-47e1-978a-38c26791ef0f","email":"jondonbosco@gmail.com","email_verified":false,"phone_verified":false}'::jsonb, 'email', '2026-08-13T05:34:53.136Z'::timestamptz, '2026-08-13T05:34:53.136Z'::timestamptz, '2026-08-13T05:34:53.136Z'::timestamptz, 'f458de4c-c6f2-4c92-9b4c-31e03b99b9e0') ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES ('614e8a78-a5f9-4d25-95f7-e42f91eb7167', '614e8a78-a5f9-4d25-95f7-e42f91eb7167', '{"sub":"614e8a78-a5f9-4d25-95f7-e42f91eb7167","email":"aarav@studio.com","email_verified":false,"phone_verified":false}'::jsonb, 'email', '2026-08-13T06:01:41.682Z'::timestamptz, '2026-08-13T06:01:41.682Z'::timestamptz, '2026-08-13T06:01:41.682Z'::timestamptz, 'c45e56d1-bc08-482f-bbe4-384d5bcac577') ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES ('d1d148da-6e4d-483d-9da6-7a44d6ef6088', 'd1d148da-6e4d-483d-9da6-7a44d6ef6088', '{"sub":"d1d148da-6e4d-483d-9da6-7a44d6ef6088","email":"thaha@gmail.com","email_verified":false,"phone_verified":false}'::jsonb, 'email', '2026-08-13T09:09:20.346Z'::timestamptz, '2026-08-13T09:09:20.346Z'::timestamptz, '2026-08-13T09:09:20.346Z'::timestamptz, '38b5b267-7ca7-4c80-af3f-d8601bb0d1e6') ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES ('7be19030-5a9f-4dd0-8baf-1c4495e34a48', '7be19030-5a9f-4dd0-8baf-1c4495e34a48', '{"sub":"7be19030-5a9f-4dd0-8baf-1c4495e34a48","email":"asharma@gmail.com","email_verified":false,"phone_verified":false}'::jsonb, 'email', '2026-08-13T09:14:29.932Z'::timestamptz, '2026-08-13T09:14:29.932Z'::timestamptz, '2026-08-13T09:14:29.932Z'::timestamptz, '3761e62f-98b2-43f7-9038-fd21ac0d13f8') ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES ('c02f0ee1-1541-4d42-8da5-7450929c735e', 'c02f0ee1-1541-4d42-8da5-7450929c735e', '{"sub":"c02f0ee1-1541-4d42-8da5-7450929c735e","email":"thaha@camcrew.in","email_verified":false,"phone_verified":false}'::jsonb, 'email', '2026-08-13T15:13:06.860Z'::timestamptz, '2026-08-13T15:13:06.860Z'::timestamptz, '2026-08-13T15:13:06.860Z'::timestamptz, '79b96af2-40cd-479f-94e6-55acc5d8acb8') ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES ('4f04db3e-7db8-4d74-81c4-4c25ff16db4b', '4f04db3e-7db8-4d74-81c4-4c25ff16db4b', '{"sub":"4f04db3e-7db8-4d74-81c4-4c25ff16db4b","email":"aishazakeeraisha@gmail.com","email_verified":false,"phone_verified":false}'::jsonb, 'email', '2026-08-13T17:02:00.710Z'::timestamptz, '2026-08-13T17:02:00.711Z'::timestamptz, '2026-08-13T17:02:00.711Z'::timestamptz, '7c383107-825d-41af-afe7-813dffac0e5b') ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES ('41778e79-3cc9-4fa4-aec2-1257cd450ba3', '41778e79-3cc9-4fa4-aec2-1257cd450ba3', '{"sub":"41778e79-3cc9-4fa4-aec2-1257cd450ba3","email":"shaki@gmail.com","email_verified":false,"phone_verified":false}'::jsonb, 'email', '2026-08-14T15:54:15.348Z'::timestamptz, '2026-08-14T15:54:15.348Z'::timestamptz, '2026-08-14T15:54:15.348Z'::timestamptz, '790eeb16-ae9c-4a74-bb84-3a000afc8740') ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES ('1afd0cfe-5b96-4db2-98c4-5f0d18a44636', '1afd0cfe-5b96-4db2-98c4-5f0d18a44636', '{"sub":"1afd0cfe-5b96-4db2-98c4-5f0d18a44636","email":"admin@camcrew.in","email_verified":false,"phone_verified":false}'::jsonb, 'email', '2026-08-17T15:08:17.966Z'::timestamptz, '2026-08-17T15:08:17.966Z'::timestamptz, '2026-08-17T15:08:17.966Z'::timestamptz, '1de9a669-08cd-4f24-aae1-6bf1f65b10f1') ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES ('96c8cf13-5b87-4cf4-8ea6-cc2f41d100b4', '96c8cf13-5b87-4cf4-8ea6-cc2f41d100b4', '{"sub":"96c8cf13-5b87-4cf4-8ea6-cc2f41d100b4","email":"shakira.irfana@gmail.com","email_verified":false,"phone_verified":false}'::jsonb, 'email', '2026-08-18T10:21:59.591Z'::timestamptz, '2026-08-18T10:21:59.591Z'::timestamptz, '2026-08-18T10:21:59.591Z'::timestamptz, '0a934a87-82b1-4e15-84cd-c14b06c4bdbf') ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES ('5d7c4512-257a-491a-acd0-049304c4f861', '5d7c4512-257a-491a-acd0-049304c4f861', '{"sub":"5d7c4512-257a-491a-acd0-049304c4f861","email":"thahahussain56@gmail.com","email_verified":false,"phone_verified":false}'::jsonb, 'email', '2026-08-18T10:33:06.545Z'::timestamptz, '2026-08-18T10:33:06.545Z'::timestamptz, '2026-08-18T10:33:06.545Z'::timestamptz, '74a03c79-afbf-4bc6-98b8-8a6222352d74') ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES ('1d5ea775-b7be-46bc-b50f-7dddcce6cbc7', '1d5ea775-b7be-46bc-b50f-7dddcce6cbc7', '{"sub":"1d5ea775-b7be-46bc-b50f-7dddcce6cbc7","name":"Thaha Hussain Mohammad","role":"professional","email":"thahapro@gmail.con","phone":"8112395565","email_verified":false,"phone_verified":false}'::jsonb, 'email', '2026-08-19T16:34:51.534Z'::timestamptz, '2026-08-19T16:34:51.534Z'::timestamptz, '2026-08-19T16:34:51.534Z'::timestamptz, '41edf2b5-0583-47df-9d19-7d2550dffcb2') ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES ('eb8b925d-8b2f-4293-b189-2f67001f26d6', 'eb8b925d-8b2f-4293-b189-2f67001f26d6', '{"sub":"eb8b925d-8b2f-4293-b189-2f67001f26d6","name":"Thaha Zakir","role":"customer","email":"thahazakir@gmail.com","phone":"9731627661","email_verified":false,"phone_verified":false}'::jsonb, 'email', '2026-08-20T09:57:30.299Z'::timestamptz, '2026-08-20T09:57:30.299Z'::timestamptz, '2026-08-20T09:57:30.299Z'::timestamptz, '49b43658-f2db-49fe-b89a-ddf24da7b228') ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES ('492811d4-e984-4554-95bd-0f1648eaa1b5', '492811d4-e984-4554-95bd-0f1648eaa1b5', '{"sub":"492811d4-e984-4554-95bd-0f1648eaa1b5","name":"Mohammad Thaha Hussain","role":"customer","email":"mohammadthahahussain@gmail.com","phone":"8113935203","email_verified":false,"phone_verified":false}'::jsonb, 'email', '2026-09-07T09:03:29.602Z'::timestamptz, '2026-09-07T09:03:29.602Z'::timestamptz, '2026-09-07T09:03:29.602Z'::timestamptz, '2c699431-7f8d-4815-b863-77bd02d2e695') ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES ('7001562c-8a7a-44e6-a18a-456316f8fa8d', '7001562c-8a7a-44e6-a18a-456316f8fa8d', '{"sub":"7001562c-8a7a-44e6-a18a-456316f8fa8d","name":"Rahul","role":"professional","email":"rahul@gmail.com","phone":"8751959526","email_verified":false,"phone_verified":false}'::jsonb, 'email', '2026-09-15T07:39:17.480Z'::timestamptz, '2026-09-15T07:39:17.480Z'::timestamptz, '2026-09-15T07:39:17.480Z'::timestamptz, '928591d3-69f0-457d-9156-8e274bfc8b08') ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES ('7002ae1a-1816-453d-afb3-efd6a40150ca', '7002ae1a-1816-453d-afb3-efd6a40150ca', '{"sub":"7002ae1a-1816-453d-afb3-efd6a40150ca","name":"Thaha","role":"professional","email":"thaha@pro.in","phone":"9856412378","email_verified":false,"phone_verified":false}'::jsonb, 'email', '2026-09-16T18:05:51.187Z'::timestamptz, '2026-09-16T18:05:51.187Z'::timestamptz, '2026-09-16T18:05:51.187Z'::timestamptz, '11b08b7d-57ae-457b-bfd7-ea055a19e16d') ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- 4. PUBLIC DATA ROWS
-- ====================================================================

-- Table: public.booking_milestones (15 rows)
INSERT INTO public."booking_milestones" ("id", "booking_id", "title", "amount", "status", "due_date", "created_at") VALUES ('d3adbb1e-87bc-4e17-b171-91947338da83', 'c0000000-0000-0000-0000-000000000001', 'Advance Escrow (30%)', 15000.00, 'paid', NULL, '2026-08-13T09:18:06.517Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."booking_milestones" ("id", "booking_id", "title", "amount", "status", "due_date", "created_at") VALUES ('ff7a98fb-bed9-4ea2-86b7-f13738f2174c', 'c0000000-0000-0000-0000-000000000001', 'Shoot Wrap Escrow (40%)', 20000.00, 'pending', NULL, '2026-08-13T09:18:06.517Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."booking_milestones" ("id", "booking_id", "title", "amount", "status", "due_date", "created_at") VALUES ('c1b0d05d-5377-41f9-8616-72e6522a2751', 'c0000000-0000-0000-0000-000000000001', 'Final Deliverables Escrow (30%)', 15000.00, 'pending', NULL, '2026-08-13T09:18:06.517Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."booking_milestones" ("id", "booking_id", "title", "amount", "status", "due_date", "created_at") VALUES ('0f105c86-dbf6-4ed2-8b32-666c0d6f62ba', 'f279a819-2f29-4268-99e7-07536c18595e', 'Shoot Wrap Escrow (40%)', 9676.00, 'pending', NULL, '2026-08-21T05:02:40.627Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."booking_milestones" ("id", "booking_id", "title", "amount", "status", "due_date", "created_at") VALUES ('34f959dc-217c-43d9-b5c8-fc972d685a46', 'f279a819-2f29-4268-99e7-07536c18595e', 'Final Deliverables Escrow (30%)', 7256.00, 'pending', NULL, '2026-08-21T05:02:40.627Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."booking_milestones" ("id", "booking_id", "title", "amount", "status", "due_date", "created_at") VALUES ('c43c04cb-96b9-4467-9fc0-1ee61f3f0156', 'f279a819-2f29-4268-99e7-07536c18595e', 'Advance Escrow (30%)', 7257.00, 'paid', NULL, '2026-08-21T05:02:40.627Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."booking_milestones" ("id", "booking_id", "title", "amount", "status", "due_date", "created_at") VALUES ('a62e0fb9-5023-4624-a58b-7f4d08282501', 'f279a819-2f29-4268-99e7-07536c18595e', 'Advance Escrow (30%)', 7257.00, 'pending', NULL, '2026-08-21T05:03:49.638Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."booking_milestones" ("id", "booking_id", "title", "amount", "status", "due_date", "created_at") VALUES ('747030b8-3495-4833-a4e0-ca45a577fd02', 'f279a819-2f29-4268-99e7-07536c18595e', 'Shoot Wrap Escrow (40%)', 9676.00, 'pending', NULL, '2026-08-21T05:03:49.638Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."booking_milestones" ("id", "booking_id", "title", "amount", "status", "due_date", "created_at") VALUES ('d1c2579a-e559-4ca9-a4be-bb86ee9c2378', 'f279a819-2f29-4268-99e7-07536c18595e', 'Final Deliverables Escrow (30%)', 7256.00, 'pending', NULL, '2026-08-21T05:03:49.638Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."booking_milestones" ("id", "booking_id", "title", "amount", "status", "due_date", "created_at") VALUES ('760125eb-41f2-49fd-a7e4-3725e756b923', 'e191bc37-4971-4d10-922b-1488493054a2', 'Advance Escrow (30%)', 88677.00, 'paid', NULL, '2026-09-07T13:22:29.955Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."booking_milestones" ("id", "booking_id", "title", "amount", "status", "due_date", "created_at") VALUES ('7a23a7af-c196-4583-b387-f629e920b29e', 'e191bc37-4971-4d10-922b-1488493054a2', 'Final Deliverables Escrow (30%)', 88676.00, 'pending', NULL, '2026-09-07T13:22:29.955Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."booking_milestones" ("id", "booking_id", "title", "amount", "status", "due_date", "created_at") VALUES ('42e413bb-914b-4984-8612-3de67725aef2', 'e191bc37-4971-4d10-922b-1488493054a2', 'Shoot Wrap Escrow (40%)', 118236.00, 'paid', NULL, '2026-09-07T13:22:29.955Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."booking_milestones" ("id", "booking_id", "title", "amount", "status", "due_date", "created_at") VALUES ('e8811eec-b172-4268-9378-d84c725f0bc7', '6a9d54f1-355a-46ea-9c91-1a0158fd4704', 'Advance Escrow (30%)', 4425.00, 'paid', NULL, '2026-09-07T16:50:36.850Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."booking_milestones" ("id", "booking_id", "title", "amount", "status", "due_date", "created_at") VALUES ('1030de97-9733-45c8-b9f2-d8864c26abb7', '6a9d54f1-355a-46ea-9c91-1a0158fd4704', 'Shoot Wrap Escrow (40%)', 5900.00, 'pending', NULL, '2026-09-07T16:50:36.850Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."booking_milestones" ("id", "booking_id", "title", "amount", "status", "due_date", "created_at") VALUES ('cbb3788a-3d15-4086-8f79-b498945e43d8', '6a9d54f1-355a-46ea-9c91-1a0158fd4704', 'Final Deliverables Escrow (30%)', 4424.00, 'pending', NULL, '2026-09-07T16:50:36.850Z'::timestamptz) ON CONFLICT DO NOTHING;

-- Table: public.bookings (8 rows)
INSERT INTO public."bookings" ("id", "customer_id", "professional_id", "studio_id", "start_datetime", "end_datetime", "total_amount", "status", "created_at", "items", "location_details", "payment_method") VALUES ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', NULL, '2026-09-01T09:00:00.000Z'::timestamptz, '2026-09-02T18:00:00.000Z'::timestamptz, 50000.00, 'accepted', '2026-08-13T09:18:06.517Z'::timestamptz, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public."bookings" ("id", "customer_id", "professional_id", "studio_id", "start_datetime", "end_datetime", "total_amount", "status", "created_at", "items", "location_details", "payment_method") VALUES ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', NULL, '2026-09-15T09:00:00.000Z'::timestamptz, '2026-09-15T18:00:00.000Z'::timestamptz, 25000.00, 'pending', '2026-08-13T09:18:06.517Z'::timestamptz, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public."bookings" ("id", "customer_id", "professional_id", "studio_id", "start_datetime", "end_datetime", "total_amount", "status", "created_at", "items", "location_details", "payment_method") VALUES ('eae19b01-8ca7-4fc0-9b3e-2b951aff6804', 'c2e008ff-dc85-4bc5-a131-ab7cb4a70b6d', NULL, NULL, '2026-08-17T16:20:33.886Z'::timestamptz, '2026-08-17T16:20:33.887Z'::timestamptz, 100.00, 'pending', '2026-08-17T16:20:33.984Z'::timestamptz, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public."bookings" ("id", "customer_id", "professional_id", "studio_id", "start_datetime", "end_datetime", "total_amount", "status", "created_at", "items", "location_details", "payment_method") VALUES ('9cbb3f24-a58d-42c5-953e-b92ca7997069', 'c2e008ff-dc85-4bc5-a131-ab7cb4a70b6d', 'b0000000-0000-0000-0000-000000000002', NULL, '2026-08-17T16:31:17.772Z'::timestamptz, '2026-08-17T16:31:17.774Z'::timestamptz, 100.00, 'pending', '2026-08-17T16:31:17.889Z'::timestamptz, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public."bookings" ("id", "customer_id", "professional_id", "studio_id", "start_datetime", "end_datetime", "total_amount", "status", "created_at", "items", "location_details", "payment_method") VALUES ('e2154671-4ca8-4648-bf18-c7e6c09a9bca', 'eb8b925d-8b2f-4293-b189-2f67001f26d6', 'b0000000-0000-0000-0000-000000000002', NULL, '2026-08-22T00:00:00.000Z'::timestamptz, '2026-08-22T00:00:00.000Z'::timestamptz, 30089.00, 'pending', '2026-08-21T03:30:33.278Z'::timestamptz, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public."bookings" ("id", "customer_id", "professional_id", "studio_id", "start_datetime", "end_datetime", "total_amount", "status", "created_at", "items", "location_details", "payment_method") VALUES ('f279a819-2f29-4268-99e7-07536c18595e', 'eb8b925d-8b2f-4293-b189-2f67001f26d6', '1d5ea775-b7be-46bc-b50f-7dddcce6cbc7', NULL, '2026-08-22T00:00:00.000Z'::timestamptz, '2026-08-22T00:00:00.000Z'::timestamptz, 24189.00, 'confirmed', '2026-08-21T05:01:58.252Z'::timestamptz, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public."bookings" ("id", "customer_id", "professional_id", "studio_id", "start_datetime", "end_datetime", "total_amount", "status", "created_at", "items", "location_details", "payment_method") VALUES ('e191bc37-4971-4d10-922b-1488493054a2', '492811d4-e984-4554-95bd-0f1648eaa1b5', '4f04db3e-7db8-4d74-81c4-4c25ff16db4b', NULL, '2026-09-08T00:00:00.000Z'::timestamptz, '2026-09-08T00:00:00.000Z'::timestamptz, 295589.00, 'confirmed', '2026-09-07T13:21:29.262Z'::timestamptz, '{"daysCount":1,"serviceTitle":"Creative Service","contractSignature":"Mohammad Thaha Hussain"}'::jsonb, '{"address":"Mangalore"}'::jsonb, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public."bookings" ("id", "customer_id", "professional_id", "studio_id", "start_datetime", "end_datetime", "total_amount", "status", "created_at", "items", "location_details", "payment_method") VALUES ('6a9d54f1-355a-46ea-9c91-1a0158fd4704', '492811d4-e984-4554-95bd-0f1648eaa1b5', '4f04db3e-7db8-4d74-81c4-4c25ff16db4b', NULL, '2026-09-08T00:00:00.000Z'::timestamptz, '2026-09-08T00:00:00.000Z'::timestamptz, 14749.00, 'confirmed', '2026-09-07T16:49:55.928Z'::timestamptz, '{"daysCount":1,"serviceTitle":"Photography","contractSignature":"Mohammad Thaha Hussain"}'::jsonb, '{"address":"Mangaluru, Mumbai Suburban, Karnataka"}'::jsonb, NULL) ON CONFLICT DO NOTHING;

-- Table: public.chat_messages (32 rows)
INSERT INTO public."chat_messages" ("id", "booking_id", "sender_id", "receiver_id", "text", "is_read", "created_at") VALUES ('c75890b9-cc5c-429f-a920-69e7a2f20f26', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Hi Bob! Looking forward to the shoot next month.', true, '2026-08-13T09:18:06.517Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."chat_messages" ("id", "booking_id", "sender_id", "receiver_id", "text", "is_read", "created_at") VALUES ('f82867ca-47f8-4ec6-b4f5-b638770dad42', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Hey Alice, same here! I have prepared the gear.', false, '2026-08-13T09:18:06.517Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."chat_messages" ("id", "booking_id", "sender_id", "receiver_id", "text", "is_read", "created_at") VALUES ('dfc79f77-7cb1-4994-8721-a14749a5c150', NULL, 'd1d148da-6e4d-483d-9da6-7a44d6ef6088', 'b0000000-0000-0000-0000-000000000002', 'Hi', false, '2026-08-13T12:25:08.106Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."chat_messages" ("id", "booking_id", "sender_id", "receiver_id", "text", "is_read", "created_at") VALUES ('9d741373-d9e4-4778-9ed0-d502b04678db', NULL, 'd1d148da-6e4d-483d-9da6-7a44d6ef6088', 'b0000000-0000-0000-0000-000000000002', 'Hlloo', false, '2026-08-13T14:38:28.309Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."chat_messages" ("id", "booking_id", "sender_id", "receiver_id", "text", "is_read", "created_at") VALUES ('dbd62aea-fa83-416b-adb2-6a67b7d392b6', NULL, 'd1d148da-6e4d-483d-9da6-7a44d6ef6088', '4f04db3e-7db8-4d74-81c4-4c25ff16db4b', 'Hi', true, '2026-08-13T17:08:23.790Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."chat_messages" ("id", "booking_id", "sender_id", "receiver_id", "text", "is_read", "created_at") VALUES ('3cc0686c-cfd9-427d-bb05-2f20768ff019', NULL, '4f04db3e-7db8-4d74-81c4-4c25ff16db4b', 'd1d148da-6e4d-483d-9da6-7a44d6ef6088', 'Hello', true, '2026-08-13T17:08:36.064Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."chat_messages" ("id", "booking_id", "sender_id", "receiver_id", "text", "is_read", "created_at") VALUES ('6e6fba11-811d-4d22-b261-10e2d451013c', 'f279a819-2f29-4268-99e7-07536c18595e', 'eb8b925d-8b2f-4293-b189-2f67001f26d6', '1d5ea775-b7be-46bc-b50f-7dddcce6cbc7', 'hi', true, '2026-08-21T05:03:59.133Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."chat_messages" ("id", "booking_id", "sender_id", "receiver_id", "text", "is_read", "created_at") VALUES ('f2fbb7d6-7719-4dd3-9398-19e3cd825a35', 'f279a819-2f29-4268-99e7-07536c18595e', '1d5ea775-b7be-46bc-b50f-7dddcce6cbc7', 'eb8b925d-8b2f-4293-b189-2f67001f26d6', 'Hi', true, '2026-08-21T05:04:20.105Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."chat_messages" ("id", "booking_id", "sender_id", "receiver_id", "text", "is_read", "created_at") VALUES ('711b3754-d0e1-4aa3-bb54-ac75b3d87dfb', 'f279a819-2f29-4268-99e7-07536c18595e', 'eb8b925d-8b2f-4293-b189-2f67001f26d6', '1d5ea775-b7be-46bc-b50f-7dddcce6cbc7', 'Hello how are you', true, '2026-08-21T05:04:46.040Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."chat_messages" ("id", "booking_id", "sender_id", "receiver_id", "text", "is_read", "created_at") VALUES ('875a6d32-c484-4b36-b6e3-9553b0db9935', 'f279a819-2f29-4268-99e7-07536c18595e', 'eb8b925d-8b2f-4293-b189-2f67001f26d6', '1d5ea775-b7be-46bc-b50f-7dddcce6cbc7', 'Hi', true, '2026-08-21T05:20:02.313Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."chat_messages" ("id", "booking_id", "sender_id", "receiver_id", "text", "is_read", "created_at") VALUES ('b0459174-e2a0-41e8-8d2e-2ee783334ac6', 'f279a819-2f29-4268-99e7-07536c18595e', 'eb8b925d-8b2f-4293-b189-2f67001f26d6', '1d5ea775-b7be-46bc-b50f-7dddcce6cbc7', 'Hi', true, '2026-08-21T05:20:31.715Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."chat_messages" ("id", "booking_id", "sender_id", "receiver_id", "text", "is_read", "created_at") VALUES ('c0e278dc-770c-4054-8bc5-3d406198bf4e', 'f279a819-2f29-4268-99e7-07536c18595e', '1d5ea775-b7be-46bc-b50f-7dddcce6cbc7', 'eb8b925d-8b2f-4293-b189-2f67001f26d6', 'Hi', true, '2026-08-21T05:19:45.137Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."chat_messages" ("id", "booking_id", "sender_id", "receiver_id", "text", "is_read", "created_at") VALUES ('804034bb-961d-493e-9379-36b658deca58', 'f279a819-2f29-4268-99e7-07536c18595e', '1d5ea775-b7be-46bc-b50f-7dddcce6cbc7', 'eb8b925d-8b2f-4293-b189-2f67001f26d6', 'Hi', true, '2026-08-21T05:22:19.354Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."chat_messages" ("id", "booking_id", "sender_id", "receiver_id", "text", "is_read", "created_at") VALUES ('20606973-966a-4443-a25d-707e22f1fd77', 'f279a819-2f29-4268-99e7-07536c18595e', 'eb8b925d-8b2f-4293-b189-2f67001f26d6', '1d5ea775-b7be-46bc-b50f-7dddcce6cbc7', 'Sunday booking', true, '2026-08-21T05:27:08.261Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."chat_messages" ("id", "booking_id", "sender_id", "receiver_id", "text", "is_read", "created_at") VALUES ('d3940993-ec92-46c3-b4bc-9976d6eb5503', 'f279a819-2f29-4268-99e7-07536c18595e', 'eb8b925d-8b2f-4293-b189-2f67001f26d6', '1d5ea775-b7be-46bc-b50f-7dddcce6cbc7', 'Not available', true, '2026-08-21T05:28:06.543Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."chat_messages" ("id", "booking_id", "sender_id", "receiver_id", "text", "is_read", "created_at") VALUES ('865fe5d8-a7e9-4831-92be-dce15124319b', 'f279a819-2f29-4268-99e7-07536c18595e', '1d5ea775-b7be-46bc-b50f-7dddcce6cbc7', 'eb8b925d-8b2f-4293-b189-2f67001f26d6', 'Hi', true, '2026-08-21T05:26:50.575Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."chat_messages" ("id", "booking_id", "sender_id", "receiver_id", "text", "is_read", "created_at") VALUES ('d310a59f-7014-49c9-9f54-ea9f286b9d13', 'f279a819-2f29-4268-99e7-07536c18595e', '1d5ea775-b7be-46bc-b50f-7dddcce6cbc7', 'eb8b925d-8b2f-4293-b189-2f67001f26d6', 'Helloo', true, '2026-08-21T05:28:22.213Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."chat_messages" ("id", "booking_id", "sender_id", "receiver_id", "text", "is_read", "created_at") VALUES ('d70738af-8a9a-4839-b5e1-2aae16da461d', 'f279a819-2f29-4268-99e7-07536c18595e', '1d5ea775-b7be-46bc-b50f-7dddcce6cbc7', 'eb8b925d-8b2f-4293-b189-2f67001f26d6', 'Ll h jcuvuvvu', true, '2026-08-21T05:28:53.181Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."chat_messages" ("id", "booking_id", "sender_id", "receiver_id", "text", "is_read", "created_at") VALUES ('351f7b69-84cf-4417-b60b-50acf4214499', 'f279a819-2f29-4268-99e7-07536c18595e', 'eb8b925d-8b2f-4293-b189-2f67001f26d6', '1d5ea775-b7be-46bc-b50f-7dddcce6cbc7', 'Hivghc', true, '2026-08-21T05:36:06.742Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."chat_messages" ("id", "booking_id", "sender_id", "receiver_id", "text", "is_read", "created_at") VALUES ('f1628dc8-9e83-46db-9c32-9385e3279c3c', 'f279a819-2f29-4268-99e7-07536c18595e', '1d5ea775-b7be-46bc-b50f-7dddcce6cbc7', 'eb8b925d-8b2f-4293-b189-2f67001f26d6', 'Bigjb', true, '2026-08-21T05:36:12.880Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."chat_messages" ("id", "booking_id", "sender_id", "receiver_id", "text", "is_read", "created_at") VALUES ('337e1e3d-7613-471a-be4d-ddfb2cecb1a6', 'f279a819-2f29-4268-99e7-07536c18595e', 'eb8b925d-8b2f-4293-b189-2f67001f26d6', '1d5ea775-b7be-46bc-b50f-7dddcce6cbc7', 'Hi hi', true, '2026-08-21T05:40:16.473Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."chat_messages" ("id", "booking_id", "sender_id", "receiver_id", "text", "is_read", "created_at") VALUES ('86d52b01-23ab-4535-ba87-6ee1fc1c08c6', 'f279a819-2f29-4268-99e7-07536c18595e', 'eb8b925d-8b2f-4293-b189-2f67001f26d6', '1d5ea775-b7be-46bc-b50f-7dddcce6cbc7', 'hiiii', true, '2026-08-21T05:40:50.111Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."chat_messages" ("id", "booking_id", "sender_id", "receiver_id", "text", "is_read", "created_at") VALUES ('d54af7fe-ddb7-43c9-86ce-992e33ab6bbc', 'f279a819-2f29-4268-99e7-07536c18595e', '1d5ea775-b7be-46bc-b50f-7dddcce6cbc7', 'eb8b925d-8b2f-4293-b189-2f67001f26d6', 'Hi', true, '2026-08-21T05:40:22.501Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."chat_messages" ("id", "booking_id", "sender_id", "receiver_id", "text", "is_read", "created_at") VALUES ('01ed113b-3eea-499e-aacd-fd099b7a935e', 'f279a819-2f29-4268-99e7-07536c18595e', 'eb8b925d-8b2f-4293-b189-2f67001f26d6', '1d5ea775-b7be-46bc-b50f-7dddcce6cbc7', 'Hiii', true, '2026-08-21T05:41:10.193Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."chat_messages" ("id", "booking_id", "sender_id", "receiver_id", "text", "is_read", "created_at") VALUES ('464c6c42-281e-4401-b7d4-fd635d229a13', 'f279a819-2f29-4268-99e7-07536c18595e', 'eb8b925d-8b2f-4293-b189-2f67001f26d6', '1d5ea775-b7be-46bc-b50f-7dddcce6cbc7', 'Hi', true, '2026-08-21T05:46:03.722Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."chat_messages" ("id", "booking_id", "sender_id", "receiver_id", "text", "is_read", "created_at") VALUES ('90f85731-a0f4-4f20-b635-a73bda78b083', 'f279a819-2f29-4268-99e7-07536c18595e', '1d5ea775-b7be-46bc-b50f-7dddcce6cbc7', 'eb8b925d-8b2f-4293-b189-2f67001f26d6', 'Hii', true, '2026-08-21T05:46:17.368Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."chat_messages" ("id", "booking_id", "sender_id", "receiver_id", "text", "is_read", "created_at") VALUES ('6ea6ce07-7c1d-44a4-9a84-451941e0f386', 'f279a819-2f29-4268-99e7-07536c18595e', '1d5ea775-b7be-46bc-b50f-7dddcce6cbc7', 'eb8b925d-8b2f-4293-b189-2f67001f26d6', 'Hi', true, '2026-08-21T06:41:57.423Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."chat_messages" ("id", "booking_id", "sender_id", "receiver_id", "text", "is_read", "created_at") VALUES ('3ed1faf8-758d-4239-a2ad-dc9acfdcefeb', 'e191bc37-4971-4d10-922b-1488493054a2', '492811d4-e984-4554-95bd-0f1648eaa1b5', '4f04db3e-7db8-4d74-81c4-4c25ff16db4b', 'Hi', true, '2026-09-07T13:23:45.628Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."chat_messages" ("id", "booking_id", "sender_id", "receiver_id", "text", "is_read", "created_at") VALUES ('44c6e86f-52d4-400b-b1bc-298e4e237a9f', 'e191bc37-4971-4d10-922b-1488493054a2', '4f04db3e-7db8-4d74-81c4-4c25ff16db4b', '492811d4-e984-4554-95bd-0f1648eaa1b5', 'Hi', true, '2026-09-07T13:23:52.852Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."chat_messages" ("id", "booking_id", "sender_id", "receiver_id", "text", "is_read", "created_at") VALUES ('b98bfa14-8446-4ce1-bef2-7ab07b3a6458', 'e191bc37-4971-4d10-922b-1488493054a2', '4f04db3e-7db8-4d74-81c4-4c25ff16db4b', '492811d4-e984-4554-95bd-0f1648eaa1b5', 'Hlo', false, '2026-09-07T16:51:15.423Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."chat_messages" ("id", "booking_id", "sender_id", "receiver_id", "text", "is_read", "created_at") VALUES ('b4e0277f-f9ad-4d31-aa32-8cf30f67b739', 'e191bc37-4971-4d10-922b-1488493054a2', '492811d4-e984-4554-95bd-0f1648eaa1b5', '4f04db3e-7db8-4d74-81c4-4c25ff16db4b', 'Giyhgh', false, '2026-09-07T16:51:20.684Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."chat_messages" ("id", "booking_id", "sender_id", "receiver_id", "text", "is_read", "created_at") VALUES ('71f6c712-db16-4992-b6a8-5684d59ec6df', 'e191bc37-4971-4d10-922b-1488493054a2', '492811d4-e984-4554-95bd-0f1648eaa1b5', '4f04db3e-7db8-4d74-81c4-4c25ff16db4b', 'hi', false, '2026-09-11T10:43:04.443Z'::timestamptz) ON CONFLICT DO NOTHING;

-- Table: public.job_requests (6 rows)
INSERT INTO public."job_requests" ("id", "client_id", "title", "requirements", "location", "budget", "status", "accepted_by", "rejected_pros", "created_at", "state", "district", "city") VALUES ('c7d34bac-1f5a-4d18-861b-df70b63b0039', 'eb8b925d-8b2f-4293-b189-2f67001f26d6', 'Drone Photographer', 'uhucerurdh', 'Mumbai', 10000, 'open', NULL, '[]'::jsonb, '2026-08-21T05:48:48.065Z'::timestamptz, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public."job_requests" ("id", "client_id", "title", "requirements", "location", "budget", "status", "accepted_by", "rejected_pros", "created_at", "state", "district", "city") VALUES ('6eb5d84e-462c-46bc-a0e0-a7ae6a984449', 'eb8b925d-8b2f-4293-b189-2f67001f26d6', 'Drone', 'dxd', 'Mangaluru', 10000, 'open', NULL, '[]'::jsonb, '2026-08-21T05:49:20.809Z'::timestamptz, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public."job_requests" ("id", "client_id", "title", "requirements", "location", "budget", "status", "accepted_by", "rejected_pros", "created_at", "state", "district", "city") VALUES ('f595b32c-a586-4f47-950e-2894aee63179', '492811d4-e984-4554-95bd-0f1648eaa1b5', 'Photographer', 'Photos
', 'Mangaluru', 12000, 'open', NULL, '[]'::jsonb, '2026-09-07T13:25:03.004Z'::timestamptz, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public."job_requests" ("id", "client_id", "title", "requirements", "location", "budget", "status", "accepted_by", "rejected_pros", "created_at", "state", "district", "city") VALUES ('8ae77631-e8a5-4272-874d-ef31c2441b91', 'a0000000-0000-0000-0000-000000000001', 'Fashion Portfolio Shoot - Sunset Beach', 'Need 4K gimbal video and 50 edited portraits at Panambur beach.', 'Surathkal, Dakshina Kannada, Karnataka', 28000, 'reviewing', 'b0000000-0000-0000-0000-000000000002', '[]'::jsonb, '2026-09-07T16:47:44.670Z'::timestamptz, 'Karnataka', 'Dakshina Kannada', 'Surathkal') ON CONFLICT DO NOTHING;
INSERT INTO public."job_requests" ("id", "client_id", "title", "requirements", "location", "budget", "status", "accepted_by", "rejected_pros", "created_at", "state", "district", "city") VALUES ('5f860750-a133-410d-b906-8490d97c90c6', '492811d4-e984-4554-95bd-0f1648eaa1b5', 'Photography', 'Photos', 'Mangaluru, Mumbai Suburban, Karnataka', 12000, 'booked', '4f04db3e-7db8-4d74-81c4-4c25ff16db4b', '[]'::jsonb, '2026-09-07T16:34:06.382Z'::timestamptz, 'Karnataka', 'Mumbai Suburban', 'Mangaluru') ON CONFLICT DO NOTHING;
INSERT INTO public."job_requests" ("id", "client_id", "title", "requirements", "location", "budget", "status", "accepted_by", "rejected_pros", "created_at", "state", "district", "city") VALUES ('45142b68-85e0-46aa-ad1d-9e8b452f7265', '492811d4-e984-4554-95bd-0f1648eaa1b5', 'Mehendi', 'Bb', 'Bandra, Mumbai Suburban, Maharashtra', 10000, 'open', NULL, '["7001562c-8a7a-44e6-a18a-456316f8fa8d"]'::jsonb, '2026-09-15T07:41:08.546Z'::timestamptz, 'Maharashtra', 'Mumbai Suburban', 'Bandra') ON CONFLICT DO NOTHING;

-- Table: public.notifications (2 rows)
INSERT INTO public."notifications" ("id", "user_id", "title", "body", "action_link", "is_read", "created_at", "target_url") VALUES ('ad211209-95d3-46dd-bda0-419a1554d295', 'b0000000-0000-0000-0000-000000000002', '📢 New Job in Bandra, Mumbai Suburban!', 'Mehendi • Budget: ₹10,000', NULL, false, '2026-09-15T07:41:08.864Z'::timestamptz, 'camcrew://job_board') ON CONFLICT DO NOTHING;
INSERT INTO public."notifications" ("id", "user_id", "title", "body", "action_link", "is_read", "created_at", "target_url") VALUES ('2644ba62-c6d1-4bab-8bcd-2553e560cf9d', '7001562c-8a7a-44e6-a18a-456316f8fa8d', '📢 New Job in Bandra, Mumbai Suburban!', 'Mehendi • Budget: ₹10,000', NULL, false, '2026-09-15T07:41:08.864Z'::timestamptz, 'camcrew://job_board') ON CONFLICT DO NOTHING;

-- Table: public.orders (7 rows)
INSERT INTO public."orders" ("id", "user_id", "total_amount", "fulfillment_mode", "address_id", "status", "tracking_number", "courier_partner", "created_at", "items", "shipping_address", "payment_method", "subtotal", "tax", "shipping_fee", "discount", "awb_code", "courier_name", "shiprocket_order_id", "tracking_status", "order_type") VALUES ('b76b4ed3-6617-4d16-88fd-853a3867007f', 'd1d148da-6e4d-483d-9da6-7a44d6ef6088', 705640.00, 'courier', NULL, 'pending', NULL, NULL, '2026-08-13T11:59:42.132Z'::timestamptz, '[]'::jsonb, '{}'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'sale') ON CONFLICT DO NOTHING;
INSERT INTO public."orders" ("id", "user_id", "total_amount", "fulfillment_mode", "address_id", "status", "tracking_number", "courier_partner", "created_at", "items", "shipping_address", "payment_method", "subtotal", "tax", "shipping_fee", "discount", "awb_code", "courier_name", "shiprocket_order_id", "tracking_status", "order_type") VALUES ('6b955439-f139-4ae3-b47c-e7c19f3760a1', '41778e79-3cc9-4fa4-aec2-1257cd450ba3', 88500.00, 'courier', NULL, 'pending', NULL, NULL, '2026-08-15T15:48:28.239Z'::timestamptz, '[]'::jsonb, '{}'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'sale') ON CONFLICT DO NOTHING;
INSERT INTO public."orders" ("id", "user_id", "total_amount", "fulfillment_mode", "address_id", "status", "tracking_number", "courier_partner", "created_at", "items", "shipping_address", "payment_method", "subtotal", "tax", "shipping_fee", "discount", "awb_code", "courier_name", "shiprocket_order_id", "tracking_status", "order_type") VALUES ('e451bae5-20e4-48b6-b202-1e5653c920fe', '41778e79-3cc9-4fa4-aec2-1257cd450ba3', 352820.00, 'courier', NULL, 'pending', NULL, NULL, '2026-08-16T12:47:06.882Z'::timestamptz, '[{"product":{"id":"76eaaa44-c816-4521-b835-34c77deb09a9","sku":"5","name":"Sony FX3","type":"sale","brand":"Sony","image":"https://lwvmtjraqvniknstcvpk.supabase.co/storage/v1/object/public/gear/gear/1786884383618_vezs24dht18.png","price":299000,"specs":{},"rating":5,"gallery":["https://lwvmtjraqvniknstcvpk.supabase.co/storage/v1/object/public/gear/gear/1786884383618_vezs24dht18.png"],"inStock":true,"category":"Cameras","condition":"New","salePrice":271000,"codEnabled":true,"isOfficial":true,"itemWeight":"1000","batteryInfo":"Lithium","browseNodes":["Gear Store > Camera"],"description":"Full Pack","searchTerms":["DSLR","Mirrorless"],"bulletPoints":["Box Piece"],"packageWeight":"1200","itemDimensions":"10x5x6","safetyWarnings":"Handle with care","countryOfOrigin":"India","packageDimensions":"12x6x10"},"quantity":1,"daysCount":1}]'::jsonb, '{"city":"Mumbai","phone":"+91 9876543210","state":"Maharashtra","pincode":"400050","district":"Mumbai Suburban","fullName":"Thaha Hussain","addressLine1":"Vish"}'::jsonb, 'cod', 299000, 53820, 150, 150, NULL, NULL, NULL, NULL, 'sale') ON CONFLICT DO NOTHING;
INSERT INTO public."orders" ("id", "user_id", "total_amount", "fulfillment_mode", "address_id", "status", "tracking_number", "courier_partner", "created_at", "items", "shipping_address", "payment_method", "subtotal", "tax", "shipping_fee", "discount", "awb_code", "courier_name", "shiprocket_order_id", "tracking_status", "order_type") VALUES ('ca0e62d3-c777-4f09-9c1f-93e178ec6311', '41778e79-3cc9-4fa4-aec2-1257cd450ba3', 705640.00, 'courier', NULL, 'shipped', NULL, NULL, '2026-08-16T16:09:18.605Z'::timestamptz, '[{"product":{"id":"76eaaa44-c816-4521-b835-34c77deb09a9","sku":"5","name":"Sony FX3","type":"sale","brand":"Sony","image":"https://lwvmtjraqvniknstcvpk.supabase.co/storage/v1/object/public/gear/gear/1786884383618_vezs24dht18.png","price":299000,"specs":{},"rating":5,"gallery":["https://lwvmtjraqvniknstcvpk.supabase.co/storage/v1/object/public/gear/gear/1786884383618_vezs24dht18.png"],"inStock":true,"category":"Cameras","condition":"New","salePrice":271000,"codEnabled":true,"isOfficial":true,"itemWeight":"1000","batteryInfo":"Lithium","browseNodes":["Gear Store > Camera"],"description":"Full Pack","searchTerms":["DSLR","Mirrorless"],"bulletPoints":["Box Piece"],"packageWeight":"1200","itemDimensions":"10x5x6","safetyWarnings":"Handle with care","countryOfOrigin":"India","packageDimensions":"12x6x10"},"quantity":2,"daysCount":1}]'::jsonb, '{"city":"Mumbai","phone":"+91 9876543210","state":"Maharashtra","pincode":"400050","district":"Mumbai Suburban","fullName":"Thaha Hussain","addressLine1":"Jj"}'::jsonb, 'cod', 598000, 107640, 150, 150, 'AWB3420022098', 'Ecom Express', 'SR-9410366', NULL, 'sale') ON CONFLICT DO NOTHING;
INSERT INTO public."orders" ("id", "user_id", "total_amount", "fulfillment_mode", "address_id", "status", "tracking_number", "courier_partner", "created_at", "items", "shipping_address", "payment_method", "subtotal", "tax", "shipping_fee", "discount", "awb_code", "courier_name", "shiprocket_order_id", "tracking_status", "order_type") VALUES ('2077ddf2-abaa-4db2-9520-74af8f0669cd', '41778e79-3cc9-4fa4-aec2-1257cd450ba3', 0.00, 'courier', NULL, 'pending', NULL, NULL, '2026-08-17T15:29:44.123Z'::timestamptz, '[]'::jsonb, '{"city":"Mumbai","phone":"+91 9876543210","state":"Maharashtra","pincode":"400050","district":"Mumbai Suburban","fullName":"Thaha Hussain","addressLine1":"Hhu"}'::jsonb, 'cod', 0, 0, 150, 150, NULL, NULL, NULL, NULL, 'sale') ON CONFLICT DO NOTHING;
INSERT INTO public."orders" ("id", "user_id", "total_amount", "fulfillment_mode", "address_id", "status", "tracking_number", "courier_partner", "created_at", "items", "shipping_address", "payment_method", "subtotal", "tax", "shipping_fee", "discount", "awb_code", "courier_name", "shiprocket_order_id", "tracking_status", "order_type") VALUES ('7b972d1b-557d-4b65-961a-a814fadae1ed', '41778e79-3cc9-4fa4-aec2-1257cd450ba3', 352820.00, 'courier', NULL, 'shipped', NULL, NULL, '2026-08-17T15:29:40.190Z'::timestamptz, '[{"product":{"id":"76eaaa44-c816-4521-b835-34c77deb09a9","sku":"5","name":"Sony FX3","type":"sale","brand":"Sony","image":"https://lwvmtjraqvniknstcvpk.supabase.co/storage/v1/object/public/gear/gear/1786884383618_vezs24dht18.png","price":299000,"specs":{},"rating":5,"gallery":["https://lwvmtjraqvniknstcvpk.supabase.co/storage/v1/object/public/gear/gear/1786884383618_vezs24dht18.png"],"inStock":true,"category":"Cameras","condition":"New","salePrice":271000,"codEnabled":true,"isOfficial":true,"itemWeight":"1000","batteryInfo":"Lithium","browseNodes":["Gear Store > Camera"],"description":"Full Pack","searchTerms":["DSLR","Mirrorless"],"bulletPoints":["Box Piece"],"packageWeight":"1200","itemDimensions":"10x5x6","safetyWarnings":"Handle with care","countryOfOrigin":"India","packageDimensions":"12x6x10"},"quantity":1,"daysCount":1}]'::jsonb, '{"city":"Mumbai","phone":"+91 9876543210","state":"Maharashtra","pincode":"400050","district":"Mumbai Suburban","fullName":"Thaha Hussain","addressLine1":"Hhu"}'::jsonb, 'cod', 299000, 53820, 150, 150, 'AWB9874618107', 'XpressBees', 'SR-6126505', NULL, 'sale') ON CONFLICT DO NOTHING;
INSERT INTO public."orders" ("id", "user_id", "total_amount", "fulfillment_mode", "address_id", "status", "tracking_number", "courier_partner", "created_at", "items", "shipping_address", "payment_method", "subtotal", "tax", "shipping_fee", "discount", "awb_code", "courier_name", "shiprocket_order_id", "tracking_status", "order_type") VALUES ('016e99f2-bc6e-476c-87c3-e6fbf79e16e1', '492811d4-e984-4554-95bd-0f1648eaa1b5', 88650.00, 'courier', NULL, 'pending', NULL, NULL, '2026-09-08T14:26:43.472Z'::timestamptz, '[{"product":{"id":"8b37dae6-fcde-4f1f-a75b-212a1dcf0aec","name":"DJI Ronin RS 3 Pro","type":"sale","brand":"DJI","image":"https://lwvmtjraqvniknstcvpk.supabase.co/storage/v1/object/public/gear/gear/1786807526820_fstf2ye1c8.png","price":75000,"specs":{"Battery":"12 hours","Payload":"4.5kg"},"rating":5,"gallery":["https://lwvmtjraqvniknstcvpk.supabase.co/storage/v1/object/public/gear/gear/1786807526820_fstf2ye1c8.png"],"inStock":true,"category":"Gimbals","condition":"New","codEnabled":false,"isOfficial":true,"browseNodes":[],"description":"Professional camera stabilizer.","searchTerms":[],"bulletPoints":[]},"quantity":1,"daysCount":1}]'::jsonb, '{"city":"Marine Drive","phone":"8113935203","state":"Maharashtra","pincode":"400001","district":"Mumbai City","fullName":"Mohammad Thaha Hussain","addressLine1":"x","addressLine2":"x"}'::jsonb, 'upi', 75000, 13500, 150, 0, NULL, NULL, NULL, NULL, 'sale') ON CONFLICT DO NOTHING;

-- Table: public.portfolio_items (2 rows)
INSERT INTO public."portfolio_items" ("id", "professional_id", "media_url", "media_type", "title", "description", "created_at") VALUES ('fd5ea7ca-f38d-46f2-9a37-1d52258a332e', 'b0000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1601506521937-0121a7fc2a6b?q=80&w=800', 'image', 'Cinematic Wedding', NULL, '2026-08-13T09:18:06.517Z'::timestamptz) ON CONFLICT DO NOTHING;
INSERT INTO public."portfolio_items" ("id", "professional_id", "media_url", "media_type", "title", "description", "created_at") VALUES ('67225177-2f89-4937-88d5-e6304e5d4f34', 'b0000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1518131672697-613becd4fab5?q=80&w=800', 'image', 'Commercial Shoot', NULL, '2026-08-13T09:18:06.517Z'::timestamptz) ON CONFLICT DO NOTHING;

-- Table: public.pro_sale_items (2 rows)
INSERT INTO public."pro_sale_items" ("id", "seller_id", "title", "category", "price", "condition", "description", "images", "status", "created_at", "cod_enabled", "gtin", "sku", "bullet_points", "sale_price", "item_dimensions", "package_dimensions", "item_weight", "package_weight", "search_terms", "browse_nodes", "battery_info", "country_of_origin", "safety_warnings") VALUES ('32020b2c-e7fb-45de-bee8-3fbb4a64e32e', 'b0000000-0000-0000-0000-000000000002', 'Used Sigma 35mm f/1.4 Art Lens', 'Lenses', 45000.00, 'Like New', 'Barely used, mint condition.', ARRAY['https://images.unsplash.com/photo-1616423640778-28d1b53229bd?q=80&w=800']::text[], 'active', '2026-08-13T09:18:06.517Z'::timestamptz, false, NULL, NULL, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public."pro_sale_items" ("id", "seller_id", "title", "category", "price", "condition", "description", "images", "status", "created_at", "cod_enabled", "gtin", "sku", "bullet_points", "sale_price", "item_dimensions", "package_dimensions", "item_weight", "package_weight", "search_terms", "browse_nodes", "battery_info", "country_of_origin", "safety_warnings") VALUES ('63fec355-a768-47c9-a567-6f4c67103ba5', '7002ae1a-1816-453d-afb3-efd6a40150ca', 'Sony Alpha M4', 'Cameras', 35000.00, 'Like New', '', ARRAY['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800']::text[], 'active', '2026-09-16T18:49:52.374Z'::timestamptz, false, NULL, NULL, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL) ON CONFLICT DO NOTHING;

-- Table: public.products (2 rows)
INSERT INTO public."products" ("id", "name", "category", "price", "description", "specifications", "images", "in_stock", "stock_quantity", "created_at", "brand", "cod_enabled", "gtin", "sku", "bullet_points", "sale_price", "item_dimensions", "package_dimensions", "item_weight", "package_weight", "search_terms", "browse_nodes", "battery_info", "country_of_origin", "safety_warnings") VALUES ('8b37dae6-fcde-4f1f-a75b-212a1dcf0aec', 'DJI Ronin RS 3 Pro', 'Gimbals', 75000.00, 'Professional camera stabilizer.', '{"Battery":"12 hours","Payload":"4.5kg"}'::jsonb, ARRAY['https://lwvmtjraqvniknstcvpk.supabase.co/storage/v1/object/public/gear/gear/1786807526820_fstf2ye1c8.png']::text[], true, 5, '2026-08-13T09:18:06.517Z'::timestamptz, 'DJI', false, NULL, NULL, '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public."products" ("id", "name", "category", "price", "description", "specifications", "images", "in_stock", "stock_quantity", "created_at", "brand", "cod_enabled", "gtin", "sku", "bullet_points", "sale_price", "item_dimensions", "package_dimensions", "item_weight", "package_weight", "search_terms", "browse_nodes", "battery_info", "country_of_origin", "safety_warnings") VALUES ('76eaaa44-c816-4521-b835-34c77deb09a9', 'Sony FX3', 'Cameras', 299000.00, 'Full Pack', '{}'::jsonb, ARRAY['https://lwvmtjraqvniknstcvpk.supabase.co/storage/v1/object/public/gear/gear/1786884383618_vezs24dht18.png']::text[], true, 0, '2026-08-16T12:46:25.634Z'::timestamptz, 'Sony', true, '', '5', '["Box Piece"]'::jsonb, 271000, '10x5x6', '12x6x10', '1000', '1200', '["DSLR","Mirrorless"]'::jsonb, '["Gear Store > Camera"]'::jsonb, 'Lithium', 'India', 'Handle with care') ON CONFLICT DO NOTHING;

-- Table: public.professional_profiles (5 rows)
INSERT INTO public."professional_profiles" ("id", "title", "bio", "experience_years", "rate_per_day", "state", "city", "categories", "skills", "equipment", "rating", "review_count", "verified", "created_at", "district") VALUES ('b0000000-0000-0000-0000-000000000002', 'Senior Cinematographer & Drone Pilot', 'Award-winning cinematographer with 10 years of experience in commercial and cinematic video production.', 0, 25000.00, 'Maharashtra', 'Mumbai', '{}'::text[], '{}'::text[], ARRAY['RED Komodo', 'DJI Mavic 3 Cine', 'Sony FX3']::text[], 4.90, 0, true, '2026-08-13T09:18:06.517Z'::timestamptz, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public."professional_profiles" ("id", "title", "bio", "experience_years", "rate_per_day", "state", "city", "categories", "skills", "equipment", "rating", "review_count", "verified", "created_at", "district") VALUES ('4f04db3e-7db8-4d74-81c4-4c25ff16db4b', 'Wedding Photography', 'Nothing Nothing To Do The The The The The', 1, 250000.00, 'Karnataka', 'Mangalore', '{}'::text[], '{}'::text[], '{}'::text[], 5.00, 0, false, '2026-08-13T17:02:01.350Z'::timestamptz, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public."professional_profiles" ("id", "title", "bio", "experience_years", "rate_per_day", "state", "city", "categories", "skills", "equipment", "rating", "review_count", "verified", "created_at", "district") VALUES ('1d5ea775-b7be-46bc-b50f-7dddcce6cbc7', 'Photographer', 'Nog No jbfgf Try edjgsg Gf dnxg', 5, 20000.00, 'Karnataka', 'Mangaluru', '{}'::text[], '{}'::text[], '{}'::text[], 5.00, 0, false, '2026-08-19T16:34:52.036Z'::timestamptz, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public."professional_profiles" ("id", "title", "bio", "experience_years", "rate_per_day", "state", "city", "categories", "skills", "equipment", "rating", "review_count", "verified", "created_at", "district") VALUES ('7001562c-8a7a-44e6-a18a-456316f8fa8d', 'Cinematographer & Drone Pilot', 'Experienced creative professional available for shoots across India.', NULL, 15000.00, 'Maharashtra', 'Bandra', ARRAY['Photographers', 'Videographers']::text[], '{}'::text[], '{}'::text[], 5.00, 1, false, '2026-09-15T07:39:17.910Z'::timestamptz, 'Mumbai Suburban') ON CONFLICT DO NOTHING;
INSERT INTO public."professional_profiles" ("id", "title", "bio", "experience_years", "rate_per_day", "state", "city", "categories", "skills", "equipment", "rating", "review_count", "verified", "created_at", "district") VALUES ('7002ae1a-1816-453d-afb3-efd6a40150ca', 'Cinematographer & Drone Pilot', 'Experienced creative professional available for shoots across India.', NULL, 15000.00, 'Karnataka', 'Mangalore', ARRAY['Photographers', 'Videographers']::text[], '{}'::text[], '{}'::text[], 5.00, 0, false, '2026-09-16T18:05:51.451Z'::timestamptz, 'Dakshina Kannada') ON CONFLICT DO NOTHING;

-- Table: public.rental_equipment (1 rows)
INSERT INTO public."rental_equipment" ("id", "owner_id", "name", "category", "daily_rate", "security_deposit", "description", "images", "status", "created_at") VALUES ('511cb07a-073d-4f7e-9f67-a20edac8c2c3', 'b0000000-0000-0000-0000-000000000002', 'RED Komodo 6K Cinema Camera', 'Cameras', 15000.00, 150000.00, 'Full cinematic rig available for rent.', ARRAY['https://images.unsplash.com/photo-1589801258579-18e091f4ca26?q=80&w=800']::text[], 'available', '2026-08-13T09:18:06.517Z'::timestamptz) ON CONFLICT DO NOTHING;

-- Table: public.rental_orders (1 rows)
INSERT INTO public."rental_orders" ("id", "customer_id", "equipment_id", "start_date", "end_date", "total_amount", "deposit_status", "status", "created_at") VALUES ('3dde791f-1164-41d8-9e28-5d792809bc1c', 'd1d148da-6e4d-483d-9da6-7a44d6ef6088', '511cb07a-073d-4f7e-9f67-a20edac8c2c3', '2026-08-23T18:30:00.000Z'::date, '2026-08-26T18:30:00.000Z'::date, 58100.00, 'pending', 'confirmed', '2026-08-13T12:00:55.551Z'::timestamptz) ON CONFLICT DO NOTHING;

-- Table: public.reviews (1 rows)
INSERT INTO public."reviews" ("id", "reviewer_id", "target_user_id", "booking_id", "rating", "comment", "created_at") VALUES ('ba031a85-9aa5-46b7-9234-36d33710d3ad', '7001562c-8a7a-44e6-a18a-456316f8fa8d', '7001562c-8a7a-44e6-a18a-456316f8fa8d', NULL, 5, 'Very bad', '2026-09-15T07:42:48.204Z'::timestamptz) ON CONFLICT DO NOTHING;

-- Table: public.users (14 rows)
INSERT INTO public."users" ("id", "name", "email", "phone", "role", "avatar", "gstin", "created_at", "push_token", "push_preferences", "subscription_tier", "subscription_status", "subscription_end_date") VALUES ('7be19030-5a9f-4dd0-8baf-1c4495e34a48', 'Arav Sharma', 'asharma@gmail.com', '7306266762', 'professional', 'file:///var/mobile/Containers/Data/Application/0E0CA5C3-F653-418F-A4BD-D873CE37F081/Library/Caches/ExponentExperienceData/@camcrewapp/camcrew-app/ImagePicker/E4A92405-5F6D-4A7A-8D25-710C703E811B.jpg', NULL, '2026-08-13T09:14:30.307Z'::timestamptz, NULL, '{"chat":true,"booking":true,"marketing":true}'::jsonb, 'free', 'inactive', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public."users" ("id", "name", "email", "phone", "role", "avatar", "gstin", "created_at", "push_token", "push_preferences", "subscription_tier", "subscription_status", "subscription_end_date") VALUES ('a0000000-0000-0000-0000-000000000001', 'Alice Customer', 'alice@example.com', '1234567890', 'customer', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200', NULL, '2026-08-13T09:18:06.517Z'::timestamptz, NULL, '{"chat":true,"booking":true,"marketing":true}'::jsonb, 'free', 'inactive', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public."users" ("id", "name", "email", "phone", "role", "avatar", "gstin", "created_at", "push_token", "push_preferences", "subscription_tier", "subscription_status", "subscription_end_date") VALUES ('b0000000-0000-0000-0000-000000000002', 'Bob Professional', 'bob@example.com', '0987654321', 'professional', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200', NULL, '2026-08-13T09:18:06.517Z'::timestamptz, NULL, '{"chat":true,"booking":true,"marketing":true}'::jsonb, 'free', 'inactive', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public."users" ("id", "name", "email", "phone", "role", "avatar", "gstin", "created_at", "push_token", "push_preferences", "subscription_tier", "subscription_status", "subscription_end_date") VALUES ('96c8cf13-5b87-4cf4-8ea6-cc2f41d100b4', 'Shakira Irfana', 'shakira.irfana@gmail.com', '9731627660', 'customer', NULL, NULL, '2026-08-18T10:22:00.336Z'::timestamptz, 'ExponentPushToken[-kApDALs5L16zcpE-Xpcbh]', '{"chat":true,"booking":true,"marketing":true}'::jsonb, 'prime', 'active', '2026-09-17T04:52:20.754Z'::timestamp) ON CONFLICT DO NOTHING;
INSERT INTO public."users" ("id", "name", "email", "phone", "role", "avatar", "gstin", "created_at", "push_token", "push_preferences", "subscription_tier", "subscription_status", "subscription_end_date") VALUES ('d1d148da-6e4d-483d-9da6-7a44d6ef6088', 'Thaha', 'thaha@gmail.com', '8113935202', 'customer', 'https://lwvmtjraqvniknstcvpk.supabase.co/storage/v1/object/public/avatars/avatars/1786628248926_kkqx2a41q2.jpg', NULL, '2026-08-13T09:09:20.495Z'::timestamptz, NULL, '{"chat":false,"booking":false,"marketing":false}'::jsonb, 'free', 'inactive', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public."users" ("id", "name", "email", "phone", "role", "avatar", "gstin", "created_at", "push_token", "push_preferences", "subscription_tier", "subscription_status", "subscription_end_date") VALUES ('c2e008ff-dc85-4bc5-a131-ab7cb4a70b6d', 'Customer', '', '0000000000', 'customer', NULL, NULL, '2026-08-17T16:20:33.848Z'::timestamptz, NULL, '{"chat":true,"booking":true,"marketing":true}'::jsonb, 'free', 'inactive', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public."users" ("id", "name", "email", "phone", "role", "avatar", "gstin", "created_at", "push_token", "push_preferences", "subscription_tier", "subscription_status", "subscription_end_date") VALUES ('41778e79-3cc9-4fa4-aec2-1257cd450ba3', 'Thaha Hussain', 'shaki@gmail.com', '+91 9876543210', 'customer', NULL, NULL, '2026-08-15T15:48:28.140Z'::timestamptz, 'ExponentPushToken[-kApDALs5L16zcpE-Xpcbh]', '{"chat":true,"booking":true,"marketing":true}'::jsonb, 'free', 'inactive', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public."users" ("id", "name", "email", "phone", "role", "avatar", "gstin", "created_at", "push_token", "push_preferences", "subscription_tier", "subscription_status", "subscription_end_date") VALUES ('eb8b925d-8b2f-4293-b189-2f67001f26d6', 'Thaha Zakir', 'thahazakir@gmail.com', '9731627661', 'customer', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400', NULL, '2026-08-20T09:57:30.276Z'::timestamptz, NULL, '{"chat":true,"booking":true,"marketing":true}'::jsonb, 'free', 'inactive', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public."users" ("id", "name", "email", "phone", "role", "avatar", "gstin", "created_at", "push_token", "push_preferences", "subscription_tier", "subscription_status", "subscription_end_date") VALUES ('4f04db3e-7db8-4d74-81c4-4c25ff16db4b', 'Aisha Zakir', 'aishazakeeraisha@gmail.com', '9591098050', 'professional', NULL, NULL, '2026-08-13T17:02:01.198Z'::timestamptz, NULL, '{"chat":true,"booking":true,"marketing":true}'::jsonb, 'pro', 'active', '2026-10-07T07:50:51.639Z'::timestamp) ON CONFLICT DO NOTHING;
INSERT INTO public."users" ("id", "name", "email", "phone", "role", "avatar", "gstin", "created_at", "push_token", "push_preferences", "subscription_tier", "subscription_status", "subscription_end_date") VALUES ('492811d4-e984-4554-95bd-0f1648eaa1b5', 'Mohammad Thaha Hussain', 'mohammadthahahussain@gmail.com', '8113935203', 'customer', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400', NULL, '2026-09-07T09:03:29.553Z'::timestamptz, 'ExponentPushToken[-kApDALs5L16zcpE-Xpcbh]', '{"chat":true,"booking":true,"marketing":true}'::jsonb, 'prime', 'active', '2026-10-07T07:33:28.445Z'::timestamp) ON CONFLICT DO NOTHING;
INSERT INTO public."users" ("id", "name", "email", "phone", "role", "avatar", "gstin", "created_at", "push_token", "push_preferences", "subscription_tier", "subscription_status", "subscription_end_date") VALUES ('1afd0cfe-5b96-4db2-98c4-5f0d18a44636', 'Camcrew Admin', 'admin@camcrew.in', '9999999999', 'admin', NULL, NULL, '2026-09-13T11:07:50.265Z'::timestamptz, NULL, '{"chat":true,"booking":true,"marketing":true}'::jsonb, 'free', 'inactive', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public."users" ("id", "name", "email", "phone", "role", "avatar", "gstin", "created_at", "push_token", "push_preferences", "subscription_tier", "subscription_status", "subscription_end_date") VALUES ('1d5ea775-b7be-46bc-b50f-7dddcce6cbc7', 'Thaha Hussain Mohammad', 'thahapro@gmail.con', '8112395565', 'professional', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400', NULL, '2026-08-19T16:34:51.503Z'::timestamptz, 'ExponentPushToken[-kApDALs5L16zcpE-Xpcbh]', '{"chat":true,"booking":true,"marketing":true}'::jsonb, 'pro', 'active', '2026-09-18T11:04:59.974Z'::timestamp) ON CONFLICT DO NOTHING;
INSERT INTO public."users" ("id", "name", "email", "phone", "role", "avatar", "gstin", "created_at", "push_token", "push_preferences", "subscription_tier", "subscription_status", "subscription_end_date") VALUES ('7001562c-8a7a-44e6-a18a-456316f8fa8d', 'Rahul', 'rahul@gmail.com', '8751959526', 'professional', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400', NULL, '2026-09-15T07:39:17.415Z'::timestamptz, NULL, '{"chat":true,"booking":true,"marketing":true}'::jsonb, 'free', 'inactive', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public."users" ("id", "name", "email", "phone", "role", "avatar", "gstin", "created_at", "push_token", "push_preferences", "subscription_tier", "subscription_status", "subscription_end_date") VALUES ('7002ae1a-1816-453d-afb3-efd6a40150ca', 'Thaha', 'thaha@pro.in', '9856412378', 'professional', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400', NULL, '2026-09-16T18:05:51.158Z'::timestamptz, NULL, '{"chat":true,"booking":true,"marketing":true}'::jsonb, 'free', 'inactive', NULL) ON CONFLICT DO NOTHING;

-- ====================================================================
-- 5. RE-ENABLE CONSTRAINTS & TRIGGERS
-- ====================================================================
SET session_replication_role = 'origin';

-- ====================================================================
-- 6. REALTIME TRIGGERS & PUBLICATIONS
-- ====================================================================

-- ==============================================================================
-- CAMCREW NOTIFICATIONS, SUPABASE REALTIME & PUSH TRIGGERS
-- ==============================================================================
-- Run this script in the Supabase SQL Editor to enable full realtime notifications,
-- Expo push token storage, and database triggers for Chat, Job Broadcasts, and Bookings.

-- 1. Ensure extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Add Push Notification columns to public.users if not present
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS push_token TEXT,
  ADD COLUMN IF NOT EXISTS push_preferences JSONB DEFAULT '{"chat": true, "booking": true, "job_broadcast": true}'::jsonb;

-- 3. Create or update public.notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target_url TEXT,
  type TEXT DEFAULT 'general',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance indexes for fast querying and filtering
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications (user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications (created_at DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies for notifications table
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" 
  ON public.notifications FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" 
  ON public.notifications FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications" 
  ON public.notifications FOR DELETE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications" 
  ON public.notifications FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- ==============================================================================
-- 5. DATABASE TRIGGER: CHAT MESSAGES -> NOTIFICATIONS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_chat_message()
RETURNS TRIGGER AS $$
DECLARE
  sender_name TEXT;
  msg_body TEXT;
BEGIN
  -- Check if notification already created by client in the last 2 seconds to avoid duplicates
  IF EXISTS (
    SELECT 1 FROM public.notifications 
    WHERE user_id = NEW.receiver_id 
      AND target_url = 'camcrew://chat/' || NEW.sender_id 
      AND created_at > (NOW() - INTERVAL '2 seconds')
  ) THEN
    RETURN NEW;
  END IF;

  -- Fetch sender name
  SELECT name INTO sender_name FROM public.users WHERE id = NEW.sender_id;
  IF sender_name IS NULL OR sender_name = '' THEN
    sender_name := 'Someone';
  END IF;

  -- Format display body
  IF NEW.text LIKE '%[IMAGE]%' THEN
    msg_body := '📸 Sent an image';
  ELSE
    msg_body := LEFT(NEW.text, 80);
  END IF;

  INSERT INTO public.notifications (user_id, title, body, target_url, type, is_read, created_at)
  VALUES (
    NEW.receiver_id,
    '💬 ' || sender_name,
    msg_body,
    'camcrew://chat/' || NEW.sender_id,
    'chat',
    FALSE,
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_chat_message_notification ON public.chat_messages;
CREATE TRIGGER trg_chat_message_notification
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_chat_message();

-- ==============================================================================
-- 6. DATABASE TRIGGER: JOB REQUESTS -> BROADCAST NOTIFICATIONS TO LOCAL CREATORS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_broadcast_job()
RETURNS TRIGGER AS $$
DECLARE
  loc_display TEXT;
  pro_rec RECORD;
BEGIN
  -- Only broadcast if open
  IF NEW.status != 'open' THEN
    RETURN NEW;
  END IF;

  loc_display := COALESCE(NEW.city, NEW.district, NEW.state, 'your region');

  -- Find matching professionals whose city, district, or state matches the job's location
  FOR pro_rec IN
    SELECT p.id 
    FROM public.professional_profiles p
    WHERE p.id != NEW.client_id
      AND (
        (NEW.city IS NOT NULL AND p.city ILIKE '%' || NEW.city || '%')
        OR (NEW.district IS NOT NULL AND (p.district ILIKE '%' || NEW.district || '%' OR p.city ILIKE '%' || NEW.district || '%'))
        OR (NEW.state IS NOT NULL AND p.state ILIKE '%' || NEW.state || '%')
        OR (NEW.location IS NOT NULL AND (
          (p.city IS NOT NULL AND NEW.location ILIKE '%' || p.city || '%') OR
          (p.district IS NOT NULL AND NEW.location ILIKE '%' || p.district || '%')
        ))
      )
    LIMIT 200
  LOOP
    INSERT INTO public.notifications (user_id, title, body, target_url, type, is_read, created_at)
    VALUES (
      pro_rec.id,
      '📢 New Shoot in ' || loc_display || '!',
      NEW.title || ' • Budget: ₹' || TO_CHAR(NEW.budget, 'FM99,99,999'),
      'camcrew://job_board',
      'job_broadcast',
      FALSE,
      NOW()
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_broadcast_job_notification ON public.job_requests;
CREATE TRIGGER trg_broadcast_job_notification
  AFTER INSERT ON public.job_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_broadcast_job();

-- ==============================================================================
-- 7. DATABASE TRIGGER: BOOKING STATUS UPDATES -> NOTIFICATIONS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_booking_status_change()
RETURNS TRIGGER AS $$
DECLARE
  customer_name TEXT;
  pro_name TEXT;
  service_title TEXT;
BEGIN
  -- Service title from items JSON or fallback
  service_title := COALESCE(NEW.items->>'serviceTitle', 'Shoot Booking');

  -- Case A: New Booking Created (status = 'pending') -> Notify Professional
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    SELECT name INTO customer_name FROM public.users WHERE id = NEW.customer_id;
    
    IF NEW.professional_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, body, target_url, type, is_read, created_at)
      VALUES (
        NEW.professional_id,
        '📅 New Booking Request!',
        COALESCE(customer_name, 'A client') || ' requested to book you for ' || service_title || ' (₹' || TO_CHAR(NEW.total_amount, 'FM99,99,999') || ').',
        'camcrew://booking/' || NEW.id,
        'booking',
        FALSE,
        NOW()
      );
    END IF;
  END IF;

  -- Case B: Booking Status changed to 'accepted' -> Notify Customer
  IF TG_OP = 'UPDATE' AND OLD.status != 'accepted' AND NEW.status = 'accepted' THEN
    SELECT name INTO pro_name FROM public.users WHERE id = NEW.professional_id;
    
    INSERT INTO public.notifications (user_id, title, body, target_url, type, is_read, created_at)
    VALUES (
      NEW.customer_id,
      '🎉 Booking Accepted!',
      COALESCE(pro_name, 'Your creator') || ' accepted your booking request! Pay the advance escrow to secure your shoot dates.',
      'camcrew://booking/' || NEW.id,
      'booking',
      FALSE,
      NOW()
    );
  END IF;

  -- Case C: Booking Status changed to 'confirmed' -> Notify Professional
  IF TG_OP = 'UPDATE' AND OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
    IF NEW.professional_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, body, target_url, type, is_read, created_at)
      VALUES (
        NEW.professional_id,
        '✅ Advance Escrow Paid & Booking Confirmed!',
        'The client has funded the advance escrow. Your shoot dates are officially confirmed!',
        'camcrew://booking/' || NEW.id,
        'booking',
        FALSE,
        NOW()
      );
    END IF;
  END IF;

  -- Case D: Booking Status changed to 'cancelled' -> Notify the other party
  IF TG_OP = 'UPDATE' AND OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    INSERT INTO public.notifications (user_id, title, body, target_url, type, is_read, created_at)
    VALUES (
      NEW.customer_id,
      'Booking Cancelled',
      'The booking for "' || service_title || '" has been cancelled.',
      'camcrew://booking/' || NEW.id,
      'booking',
      FALSE,
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_booking_status_notification ON public.bookings;
CREATE TRIGGER trg_booking_status_notification
  AFTER INSERT OR UPDATE OF status ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_booking_status_change();

-- ==============================================================================
-- 8. REALTIME REPLICATION CONFIGURATION
-- ==============================================================================
-- Enable publication to Supabase Realtime so connected clients receive live events
DO $$
BEGIN
  -- Add notifications
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;

  -- Add chat_messages
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  END IF;

  -- Add job_requests
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'job_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.job_requests;
  END IF;

  -- Add bookings
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'bookings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
  END IF;
END $$;


-- ====================================================================
-- 7. VIDEO REELS COLUMN & INDEX
-- ====================================================================

-- ==============================================================================
-- MIGRATION: ADD VIDEO REELS AND SHOWREELS TO PROFESSIONAL PROFILES
-- ==============================================================================

-- 1. Add video_reels column if not already present
ALTER TABLE public.professional_profiles 
  ADD COLUMN IF NOT EXISTS video_reels JSONB DEFAULT '[]'::jsonb;

-- 2. Add comment describing schema
COMMENT ON COLUMN public.professional_profiles.video_reels IS 
  'Structured list of video reels and showreels [{ id, title, url, type, embedUrl, thumbnailUrl, category, isShort }]';

-- 3. Create index for fast JSON queries if needed
CREATE INDEX IF NOT EXISTS idx_pro_video_reels ON public.professional_profiles USING gin (video_reels);


