

DROP FUNCTION IF EXISTS public.get_area_for_workspace_with_verified_user;

CREATE OR REPLACE FUNCTION public.get_area_for_workspace_with_verified_user(
  p_tag varchar(500),
  p_workspace_id uuid,
  p_organisation_id uuid,
  p_user_id uuid
)

  RETURNS TABLE (
    area_id workspace_areas.id%TYPE,
    tag workspace_areas.tag%TYPE,
    display_name workspace_areas.display_name%TYPE
  )
  
  LANGUAGE 'plpgsql'
  SECURITY DEFINER
AS
$$
BEGIN

  RETURN QUERY
    SELECT a.id workspace_id, a.tag, a.display_name
      FROM workspace_areas a
      -- TODO: Factor in user
      WHERE a.workspace_id = p_workspace_id
        AND a.tag = p_tag
      LIMIT 1;

END 
$$;


ALTER FUNCTION public.get_area_for_workspace_with_verified_user OWNER TO docspaces_website_db_function_role;

GRANT EXECUTE ON ROUTINE public.get_area_for_workspace_with_verified_user TO docspaces_website_user;


select * from get_area_for_workspace_with_verified_user('default', '107ac59c-88c9-4401-b289-7c0919093fd5', '3a6faf80-abbd-11ed-8a42-d7f6de01e571', '00000000-0000-0000-0000-000000000000');

