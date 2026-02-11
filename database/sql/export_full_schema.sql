-- ==============================================================================
-- EXPORTAR SCHEMA COMPLETO DO SUPABASE EM JSON
-- Copia o resultado e cola aqui
-- ==============================================================================

SELECT json_build_object(
  -- 1. TABELAS + COLUNAS
  'tables', (
    SELECT json_agg(json_build_object(
      'schema', t.table_schema,
      'name', t.table_name,
      'columns', (
        SELECT json_agg(json_build_object(
          'name', c.column_name,
          'type', c.data_type,
          'udt_type', c.udt_name,
          'nullable', c.is_nullable,
          'default', c.column_default,
          'max_length', c.character_maximum_length
        ) ORDER BY c.ordinal_position)
        FROM information_schema.columns c
        WHERE c.table_schema = t.table_schema AND c.table_name = t.table_name
      )
    ))
    FROM information_schema.tables t
    WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
  ),

  -- 2. PRIMARY KEYS
  'primary_keys', (
    SELECT json_agg(json_build_object(
      'table', tc.table_name,
      'constraint', tc.constraint_name,
      'columns', (
        SELECT json_agg(kcu.column_name ORDER BY kcu.ordinal_position)
        FROM information_schema.key_column_usage kcu
        WHERE kcu.constraint_name = tc.constraint_name AND kcu.table_schema = tc.table_schema
      )
    ))
    FROM information_schema.table_constraints tc
    WHERE tc.table_schema = 'public' AND tc.constraint_type = 'PRIMARY KEY'
  ),

  -- 3. FOREIGN KEYS
  'foreign_keys', (
    SELECT json_agg(json_build_object(
      'table', tc.table_name,
      'constraint', tc.constraint_name,
      'column', kcu.column_name,
      'references_table', ccu.table_name,
      'references_column', ccu.column_name
    ))
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
    WHERE tc.table_schema = 'public' AND tc.constraint_type = 'FOREIGN KEY'
  ),

  -- 4. UNIQUE CONSTRAINTS
  'unique_constraints', (
    SELECT json_agg(json_build_object(
      'table', tc.table_name,
      'constraint', tc.constraint_name,
      'columns', (
        SELECT json_agg(kcu.column_name)
        FROM information_schema.key_column_usage kcu
        WHERE kcu.constraint_name = tc.constraint_name AND kcu.table_schema = tc.table_schema
      )
    ))
    FROM information_schema.table_constraints tc
    WHERE tc.table_schema = 'public' AND tc.constraint_type = 'UNIQUE'
  ),

  -- 5. CHECK CONSTRAINTS
  'check_constraints', (
    SELECT json_agg(json_build_object(
      'table', tc.table_name,
      'constraint', tc.constraint_name,
      'definition', cc.check_clause
    ))
    FROM information_schema.table_constraints tc
    JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name AND tc.constraint_schema = cc.constraint_schema
    WHERE tc.table_schema = 'public' AND tc.constraint_type = 'CHECK'
  ),

  -- 6. INDEXES
  'indexes', (
    SELECT json_agg(json_build_object(
      'name', indexname,
      'table', tablename,
      'definition', indexdef
    ))
    FROM pg_indexes
    WHERE schemaname = 'public'
  ),

  -- 7. RLS POLICIES
  'rls_policies', (
    SELECT json_agg(json_build_object(
      'table', tablename,
      'policy', policyname,
      'permissive', permissive,
      'roles', roles,
      'command', cmd,
      'using', qual,
      'with_check', with_check
    ))
    FROM pg_policies
    WHERE schemaname = 'public'
  ),

  -- 8. RLS ENABLED TABLES
  'rls_enabled', (
    SELECT json_agg(json_build_object(
      'table', relname,
      'rls_enabled', relrowsecurity,
      'rls_forced', relforcerowsecurity
    ))
    FROM pg_class
    WHERE relnamespace = 'public'::regnamespace AND relkind = 'r' AND relrowsecurity = true
  ),

  -- 9. VIEWS
  'views', (
    SELECT json_agg(json_build_object(
      'name', table_name,
      'definition', view_definition
    ))
    FROM information_schema.views
    WHERE table_schema = 'public'
  ),

  -- 10. FUNCTIONS
  'functions', (
    SELECT json_agg(json_build_object(
      'name', p.proname,
      'return_type', pg_get_function_result(p.oid),
      'arguments', pg_get_function_arguments(p.oid),
      'language', l.lanname,
      'security', CASE WHEN p.prosecdef THEN 'DEFINER' ELSE 'INVOKER' END,
      'definition', pg_get_functiondef(p.oid)
    ))
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    JOIN pg_language l ON p.prolang = l.oid
    WHERE n.nspname = 'public' AND p.prokind = 'f'
  ),

  -- 11. TRIGGERS
  'triggers', (
    SELECT json_agg(json_build_object(
      'name', trigger_name,
      'table', event_object_table,
      'event', event_manipulation,
      'timing', action_timing,
      'statement', action_statement
    ))
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    OR (event_object_schema = 'auth')
  ),

  -- 12. ROW COUNTS
  'row_counts', (
    SELECT json_agg(json_build_object(
      'table', relname,
      'estimated_rows', reltuples::bigint
    ))
    FROM pg_class
    WHERE relnamespace = 'public'::regnamespace AND relkind = 'r'
  ),

  -- 13. AUTH USERS (apenas emails e metadata, sem senhas)
  'auth_users', (
    SELECT json_agg(json_build_object(
      'id', id,
      'email', email,
      'email_confirmed', email_confirmed_at IS NOT NULL,
      'created_at', created_at,
      'last_sign_in', last_sign_in_at,
      'role', role,
      'metadata', raw_user_meta_data
    ))
    FROM auth.users
  )

) AS full_schema;
