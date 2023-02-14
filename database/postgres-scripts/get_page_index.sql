
DROP FUNCTION IF EXISTS public.get_page_index;

CREATE OR REPLACE FUNCTION public.get_page_index(p_user_id uuid, p_organisation_id uuid, p_workspace_id uuid, p_area_id uuid)
  -- RETURNS SETOF pages 
  RETURNS TABLE (page_id uuid, page_path varchar(4000), page_display_name varchar(500))
AS 
$$
BEGIN

  RETURN QUERY
    --SELECT p.*
    SELECT p.page_id, p.calculated_path, p.display_name
      FROM pages p
      
      ORDER BY p.calculated_path;

END 
$$
LANGUAGE 'plpgsql'
SECURITY DEFINER;


ALTER FUNCTION public.get_page_index(uuid, uuid, uuid) OWNER TO docspaces_website_db_function_role;

GRANT EXECUTE ON ROUTINE public.get_page_index(uuid, uuid, uuid) TO docspaces_website_user;


select * from get_page_index('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');


select * from get_page_index(
  p_user_id := '8ac8d2a5-b810-40f7-bdec-5329973d6de6',
  p_organisation_id := '3a6faf80-abbd-11ed-8a42-d7f6de01e571',
  p_workspace_id := '107ac59c-88c9-4401-b289-7c0919093fd5',
  p_area_id := '88c77813-dd06-485d-b3f5-c8b424e60ad7'
);