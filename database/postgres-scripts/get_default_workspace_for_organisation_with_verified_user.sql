DROP FUNCTION IF EXISTS public.get_default_workspace_for_organisation_with_verified_user;

CREATE OR REPLACE FUNCTION public.get_default_workspace_for_organisation_with_verified_user(
  p_organisation_id uuid,
  p_user_id uuid
)

  RETURNS TABLE (
    workspace_id workspaces.id%TYPE,
    tag workspaces.tag%TYPE,
    display_name workspaces.display_name%TYPE
  )
  
  LANGUAGE 'plpgsql'
  SECURITY DEFINER
AS
$$
BEGIN

  RETURN QUERY
    SELECT w.id workspace_id, w.tag, w.display_name
      FROM workspaces w
      -- TODO: Factor in user
      WHERE w.organisation_id = p_organisation_id
        AND w.default_for_org = true
      LIMIT 1;

END 
$$;


ALTER FUNCTION public.get_default_workspace_for_organisation_with_verified_user OWNER TO docspaces_website_db_function_role;

GRANT EXECUTE ON ROUTINE public.get_default_workspace_for_organisation_with_verified_user TO docspaces_website_user;


select * from get_default_workspace_for_organisation_with_verified_user('3a6faf80-abbd-11ed-8a42-d7f6de01e571', '00000000-0000-0000-0000-000000000000');

