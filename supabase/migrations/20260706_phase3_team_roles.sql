-- ====================================================================
-- Phase 3: Team Management & Secure RPC
-- ====================================================================

-- 1. Function to securely add an assistant by email
CREATE OR REPLACE FUNCTION public.add_assistant_by_email(target_email TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_user_id UUID;
    v_workspace_id UUID;
    v_role TEXT;
BEGIN
    -- Ensure caller is authenticated
    IF auth.uid() IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'No autorizado.');
    END IF;

    -- 1. Verify caller is an owner of a workspace
    SELECT w.id INTO v_workspace_id 
    FROM public.workspaces w 
    WHERE w.owner_id = auth.uid() 
    LIMIT 1;

    IF v_workspace_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'No tienes permisos de propietario.');
    END IF;

    -- 2. Find target user by email in auth.users
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = target_email 
    LIMIT 1;

    IF target_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Usuario no encontrado. Asegúrate de que se haya registrado en la app primero.');
    END IF;

    -- Prevent adding oneself
    IF target_user_id = auth.uid() THEN
        RETURN json_build_object('success', false, 'error', 'Ya eres el propietario de este espacio.');
    END IF;

    -- 3. Check if already a member
    SELECT role INTO v_role 
    FROM public.workspace_members 
    WHERE workspace_id = v_workspace_id AND user_id = target_user_id;

    IF v_role IS NOT NULL THEN
        RETURN json_build_object('success', false, 'error', 'El usuario ya pertenece a tu equipo.');
    END IF;

    -- 4. Insert into workspace_members
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (v_workspace_id, target_user_id, 'assistant');

    RETURN json_build_object('success', true, 'message', 'Asistente agregado exitosamente.');
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.add_assistant_by_email(TEXT) TO authenticated;


-- 2. Secure View to list team members with their emails
-- By default in Postgres, a VIEW executes with the privileges of its creator (postgres), 
-- allowing it to securely read auth.users while filtering based on the caller's auth.uid().
CREATE OR REPLACE VIEW public.workspace_team_view AS
SELECT 
    wm.id AS member_record_id,
    wm.workspace_id,
    wm.user_id,
    wm.role,
    wm.created_at,
    u.email
FROM public.workspace_members wm
JOIN auth.users u ON wm.user_id = u.id
WHERE wm.workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
);

-- Grant select permission to authenticated users
GRANT SELECT ON public.workspace_team_view TO authenticated;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
