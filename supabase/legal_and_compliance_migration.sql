-- ====================================================================
-- CAMCREW LEGAL & COMPLIANCE MIGRATION: ACCOUNT DELETION & CONTRACTS
-- ====================================================================

-- 1. SECURE ACCOUNT DELETION RPC (Compliant with Apple Guideline 5.1.1(v) & DPDP Act 2023)
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID;
  v_active_escrow_count INT;
BEGIN
  -- Validate authenticated caller
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated. Only the account owner can request account deletion.';
  END IF;

  -- Safety Check: Prevent deletion if active escrow funds or active shoots exist
  SELECT COUNT(*) INTO v_active_escrow_count
  FROM public.bookings
  WHERE (customer_id = v_user_id OR professional_id = v_user_id)
    AND status IN ('confirmed', 'escrow_held');

  IF v_active_escrow_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete account with % active booking(s) under escrow. Please complete shoots and release or refund escrow funds before deleting your account.', v_active_escrow_count;
  END IF;

  -- 1. Clean up user notifications
  DELETE FROM public.notifications WHERE user_id = v_user_id;

  -- 2. Disassociate or clean up reviews
  DELETE FROM public.reviews WHERE customer_id = v_user_id OR professional_id = v_user_id;

  -- 3. Clean up portfolio items if creator
  DELETE FROM public.portfolio_items WHERE user_id = v_user_id;

  -- 4. Clean up professional profile
  DELETE FROM public.professional_profiles WHERE id = v_user_id;

  -- 5. Delete public user profile
  DELETE FROM public.users WHERE id = v_user_id;

  -- 6. Delete from Supabase Auth Engine (cascades session tokens)
  DELETE FROM auth.users WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'User account and associated personal data successfully deleted in compliance with DPDP 2023.'
  );
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;

-- 2. ENSURE CONTRACT METADATA INDEX ON BOOKINGS
CREATE INDEX IF NOT EXISTS idx_bookings_contract_status
ON public.bookings ((items->>'contractSignature'));

-- Done
COMMENT ON FUNCTION public.delete_user_account() IS 'Secure self-service account deletion for App Store & DPDP Act compliance.';
