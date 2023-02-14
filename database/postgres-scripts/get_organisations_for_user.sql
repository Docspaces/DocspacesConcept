
DROP FUNCTION IF EXISTS public.get_organisations_for_user;

CREATE OR REPLACE FUNCTION public.get_organisations_for_user(p_user_id uuid)

  RETURNS TABLE (organisation_id uuid, name varchar(500))
  
  LANGUAGE 'plpgsql'
  SECURITY DEFINER
AS
$$
BEGIN

  RETURN QUERY
    SELECT o.id organisation_id, o.name
      FROM organisations o
      INNER JOIN organisation_users ou
        ON ou.organisation_id = o.id
      WHERE ou.user_id = p_user_id
      ORDER BY o.name;

END 
$$;


ALTER FUNCTION public.get_organisations_for_user(uuid) OWNER TO docspaces_website_db_function_role;

GRANT EXECUTE ON ROUTINE public.get_organisations_for_user(uuid) TO docspaces_website_user;


select * from get_organisations_for_user(p_user_id := '8ac8d2a5-b810-40f7-bdec-5329973d6de6');
