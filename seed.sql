-- Clean up existing mock data if any
DELETE FROM public.chat_messages;
DELETE FROM public.booking_milestones;
DELETE FROM public.bookings;
DELETE FROM public.portfolio_items;
DELETE FROM public.rental_equipment;
DELETE FROM public.pro_sale_items;
DELETE FROM public.products;
DELETE FROM public.professional_profiles;
-- We won't delete users to avoid deleting the user's actual login account

-- Create a mock professional user (UUID: b0000000-0000-0000-0000-000000000002)
-- Create a mock customer user (UUID: a0000000-0000-0000-0000-000000000001)
INSERT INTO public.users (id, name, email, phone, role, avatar)
VALUES 
('a0000000-0000-0000-0000-000000000001', 'Alice Customer', 'alice@example.com', '1234567890', 'customer', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200'),
('b0000000-0000-0000-0000-000000000002', 'Bob Professional', 'bob@example.com', '0987654321', 'professional', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200')
ON CONFLICT (id) DO NOTHING;

-- Create professional profile
INSERT INTO public.professional_profiles (id, title, bio, city, state, rate_per_day, equipment, verified, rating)
VALUES 
('b0000000-0000-0000-0000-000000000002', 'Senior Cinematographer & Drone Pilot', 'Award-winning cinematographer with 10 years of experience in commercial and cinematic video production.', 'Mumbai', 'Maharashtra', 25000, ARRAY['RED Komodo', 'DJI Mavic 3 Cine', 'Sony FX3'], true, 4.9)
ON CONFLICT (id) DO NOTHING;

-- Create Portfolio Items
INSERT INTO public.portfolio_items (professional_id, media_url, media_type, title)
VALUES
('b0000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1601506521937-0121a7fc2a6b?q=80&w=800', 'image', 'Cinematic Wedding'),
('b0000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1518131672697-613becd4fab5?q=80&w=800', 'image', 'Commercial Shoot')
ON CONFLICT DO NOTHING;

-- Create Official Products
INSERT INTO public.products (name, category, price, description, specifications, images, in_stock, stock_quantity)
VALUES
('Sony A7S III Camera Body', 'Cameras', 299000, 'Full-frame mirrorless camera optimized for video.', '{"Resolution": "4K 120p", "Sensor": "Full-Frame"}', ARRAY['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800'], true, 10),
('DJI Ronin RS 3 Pro', 'Gimbals', 75000, 'Professional camera stabilizer.', '{"Payload": "4.5kg", "Battery": "12 hours"}', ARRAY['https://images.unsplash.com/photo-1620215715238-66236b28bd4e?q=80&w=800'], true, 5);

-- Create Pro Sale Items
INSERT INTO public.pro_sale_items (seller_id, title, category, price, condition, description, images, status)
VALUES
('b0000000-0000-0000-0000-000000000002', 'Used Sigma 35mm f/1.4 Art Lens', 'Lenses', 45000, 'Like New', 'Barely used, mint condition.', ARRAY['https://images.unsplash.com/photo-1616423640778-28d1b53229bd?q=80&w=800'], 'active');

-- Create Rental Equipment
INSERT INTO public.rental_equipment (owner_id, name, category, daily_rate, security_deposit, description, images, status)
VALUES
('b0000000-0000-0000-0000-000000000002', 'RED Komodo 6K Cinema Camera', 'Cameras', 15000, 150000, 'Full cinematic rig available for rent.', ARRAY['https://images.unsplash.com/photo-1589801258579-18e091f4ca26?q=80&w=800'], 'available');

-- Create Bookings
INSERT INTO public.bookings (id, customer_id, professional_id, start_datetime, end_datetime, total_amount, status)
VALUES
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', '2026-09-01T09:00:00Z', '2026-09-02T18:00:00Z', 50000, 'accepted'),
('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', '2026-09-15T09:00:00Z', '2026-09-15T18:00:00Z', 25000, 'pending');

-- Create Booking Milestones for the accepted booking
INSERT INTO public.booking_milestones (booking_id, title, amount, status)
VALUES
('c0000000-0000-0000-0000-000000000001', 'Advance Escrow (30%)', 15000, 'paid'),
('c0000000-0000-0000-0000-000000000001', 'Shoot Wrap Escrow (40%)', 20000, 'pending'),
('c0000000-0000-0000-0000-000000000001', 'Final Deliverables Escrow (30%)', 15000, 'pending');

-- Create Chat Messages for the accepted booking
INSERT INTO public.chat_messages (booking_id, sender_id, receiver_id, text, is_read)
VALUES
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Hi Bob! Looking forward to the shoot next month.', true),
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Hey Alice, same here! I have prepared the gear.', false);
