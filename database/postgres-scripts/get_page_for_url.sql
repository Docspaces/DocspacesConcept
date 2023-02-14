
DROP FUNCTION get_page_for_url;

CREATE OR REPLACE FUNCTION public.get_page_for_url(
    p_url pages.calculated_path%TYPE,
    p_organisation_id uuid, 
    p_workspace_id uuid, 
    p_area_id uuid, 
    p_user_id uuid
  )


  RETURNS TABLE (
    page_id uuid, 
    page_path varchar(4000),
    page_template varchar(250)
    --page_data text
  )
  -- RETURNS RECORD-- (page_id int, page_text text)
AS 
$$
BEGIN

  -- We're doing two things here -- we're joining organistion, workspace and area to the values saved in page, plus we're specifying them in the
  -- where clause using the session info captured in preflight on in the web app. This is probably excessive, we might
  -- want to refactor and simplify, but it does mean we're 100% sure the permissions are all good.

  RETURN QUERY
    SELECT p.page_id as page_id, p.calculated_path as page_path, p.page_template as page_template--, p.page_data as page_data
      FROM pages p

      INNER JOIN workspace_areas a
        ON a.id = p.area_id
      INNER JOIN workspaces w
        ON w.id = p.workspace_id
          AND w.id = a.workspace_id
          
      INNER JOIN workspace_users wu
        ON wu.workspace_id = w.id
          AND wu.user_id = p_user_id
         
      INNER JOIN organisations o
        ON o.id = p.organisation_id
          AND o.id = w.organisation_id
      
      INNER JOIN organisation_users ou
        ON ou.organisation_id = o.id
          AND ou.user_id = p_user_id
      
      INNER JOIN users u
        ON u.id = ou.user_id
          AND u.id = wu.user_id
          AND u.active = true
      
      WHERE p.calculated_path = p_url
        AND a.id = p_area_id
        AND w.id = p_workspace_id 
        AND o.id = p_organisation_id
        AND p.page_status = 'Live'
        
      LIMIT 1;

END 
$$
LANGUAGE 'plpgsql'
SECURITY DEFINER;

ALTER FUNCTION public.get_page_for_url OWNER TO docspaces_website_db_function_role;

GRANT EXECUTE ON ROUTINE public.get_page_for_url TO docspaces_website_user;

select * from get_page_for_url('/', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');


select * from get_page_for_url(
  p_url := '/',
  p_organisation_id := '3a6faf80-abbd-11ed-8a42-d7f6de01e571',
  p_workspace_id := '107ac59c-88c9-4401-b289-7c0919093fd5',
  p_area_id := '88c77813-dd06-485d-b3f5-c8b424e60ad7',
  p_user_id := '8ac8d2a5-b810-40f7-bdec-5329973d6de6'
);
