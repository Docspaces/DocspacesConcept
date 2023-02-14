
DROP FUNCTION IF EXISTS public.get_organisation_for_domain;

CREATE OR REPLACE FUNCTION public.get_organisation_for_domain(p_domain varchar(500))

  RETURNS TABLE (organisation_id uuid, name varchar(500))
  
  LANGUAGE 'plpgsql'
  SECURITY DEFINER
AS
$$
BEGIN

  RETURN QUERY
    SELECT o.id organisation_id, o.name
      FROM organisations o
      WHERE o.domain = p_domain
      LIMIT 1;

END 
$$;


ALTER FUNCTION public.get_organisation_for_domain(varchar) OWNER TO docspaces_website_db_function_role;

GRANT EXECUTE ON ROUTINE public.get_organisation_for_domain(varchar) TO docspaces_website_user;


select * from get_organisation_for_domain(p_domain := 'd51.docspaces.local');
