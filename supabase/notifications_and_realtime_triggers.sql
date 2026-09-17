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
