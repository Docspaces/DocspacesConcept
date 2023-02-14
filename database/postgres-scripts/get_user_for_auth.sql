
DROP FUNCTION IF EXISTS public.get_user_for_auth;

CREATE OR REPLACE FUNCTION public.get_user_for_auth(p_email varchar(500), p_organisation_id uuid)

  RETURNS TABLE (
    user_id users.id%TYPE,
    display_name users.display_name%TYPE,
    password_digest users.password_digest%TYPE,
    organisation_membership_data json
  )
  
  LANGUAGE 'plpgsql'
  SECURITY DEFINER
AS
$$
BEGIN
  /*
  Description:
  This function takes an email address and optionally an organisation_id (based on the domain name)
  and returns a user record that has the matching email address for the specified organisation (or the non-domain
  multitenancy organisation if no domain is provided, including the password digest in the response (for authorisation).
  
  The rules around organisation are:
  
  If no organisation is provided, we will only match non-domain based (multi-tenancy) organisations that the user with matching email address
  belongs to.
   
  If an organisation is provided, we'll only match users that belong to the org (and are active).
  
  
  */
  


  RETURN QUERY
  	SELECT u.id as user_id, u.display_name, u.password_digest,
  	    (SELECT json_agg(json_build_object('organisation_id', o.id, 'organisation_name', o.name))
  	       FROM organisations o
  	       INNER JOIN organisation_users ou
  	         ON ou.organisation_id = o.id
  	       WHERE ou.user_id = u.id
  	       AND (
  	     	 p_organisation_id = '00000000-0000-0000-0000-000000000000'
  	     	 OR o.id = p_organisation_id -- Just restrict to the single org if we're coming through a domain name
           )) organisation_membership_data
  	  FROM users u
  	  LEFT OUTER JOIN organisation_users ou
  	    ON ou.user_id = u.id
  	      AND ou.organisation_id = p_organisation_id
  	  WHERE u.email_address = p_email
  	    AND (
  	      p_organisation_id = '00000000-0000-0000-0000-000000000000'
  	      OR ou.organisation_id IS NOT NULL
        );

END 
$$;


ALTER FUNCTION public.get_user_for_auth(varchar) OWNER TO docspaces_website_db_function_role;

GRANT EXECUTE ON ROUTINE public.get_user_for_auth(varchar) TO docspaces_website_user;


select * from get_user_for_auth('adrian.oconnor@arctus.co.uk', '00000000-0000-0000-0000-000000000000');

