-- ==============================================================================
-- FIX: Validação de token standalone para usuários anônimos
-- A RLS bloqueia SELECT em reports para anon. Esta RPC bypassa RLS (SECURITY DEFINER).
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.validate_standalone_token(p_slug TEXT, p_token TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.reports
    WHERE slug = p_slug
      AND share_token = p_token
      AND standalone_public = true
      AND active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permite chamada anônima (anon key)
GRANT EXECUTE ON FUNCTION public.validate_standalone_token(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_standalone_token(TEXT, TEXT) TO authenticated;
