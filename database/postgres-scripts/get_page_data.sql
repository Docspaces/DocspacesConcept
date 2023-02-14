
DROP FUNCTION IF EXISTS public.get_page_data;

CREATE OR REPLACE FUNCTION public.get_page_data(p_page_id uuid, p_organisation_id uuid, p_user_id uuid)

  RETURNS json
  
  LANGUAGE 'plpgsql'
  SECURITY DEFINER
AS
$$
DECLARE

  l_page_data text;
  
BEGIN
 
  SELECT page_data
    INTO l_page_data
    FROM pages
    WHERE page_id = p_page_id;
  
  RETURN json_build_object('data', l_page_data);

END 
$$;


ALTER FUNCTION public.get_page_data(varchar) OWNER TO docspaces_website_db_function_role;

GRANT EXECUTE ON ROUTINE public.get_page_data(varchar) TO docspaces_website_user;


select * from get_page_data('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');

select * from get_page_data('3df098e0-abbd-11ed-8a42-d7f6de01e571', '3a6faf80-abbd-11ed-8a42-d7f6de01e571', '8ac8d2a5-b810-40f7-bdec-5329973d6de6');