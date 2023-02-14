delete from pages;
delete from workspace_users;
delete from organisation_users;
delete from users;
delete from workspace_areas;
delete from workspaces;
delete from organisations;

select * from organisations;

insert into organisations (id, name, domain)
  values ('3a6faf80-abbd-11ed-8a42-d7f6de01e571', 'Demo Org', 'd51.docspaces.local');
  
  
select * from workspaces;

insert into workspaces (id, organisation_id, tag, display_name, default_for_org)
  values ('107ac59c-88c9-4401-b289-7c0919093fd5', '3a6faf80-abbd-11ed-8a42-d7f6de01e571', 'default', 'Default', true);
  
  
select * from workspace_areas;

insert into workspace_areas (id, workspace_id, tag, display_name, default_for_workspace)
  values ('88c77813-dd06-485d-b3f5-c8b424e60ad7', '107ac59c-88c9-4401-b289-7c0919093fd5', 'default', 'Default', true);
  
select * from users;

insert into users (id, display_name, email_address, password_digest, active)
  values ('8ac8d2a5-b810-40f7-bdec-5329973d6de6', 'Adrian OC', 'adrian.oconnor@arctus.co.uk', '$2a$10$XextrTMn/n21J4tdZMJt1O0y/vt08umWgYD553QECK/fO/Yw0SwPi', true); -- test
  
insert into organisation_users 
  values ('3a6faf80-abbd-11ed-8a42-d7f6de01e571', '8ac8d2a5-b810-40f7-bdec-5329973d6de6', 'Administrator');
  
insert into workspace_users 
  values ('107ac59c-88c9-4401-b289-7c0919093fd5', '8ac8d2a5-b810-40f7-bdec-5329973d6de6', 'Contributor');

select * from pages;

insert into pages (page_id, version_id, parent_page_id, organisation_id, workspace_id, area_id, slug, calculated_path, display_name, page_data, page_template, page_status)
  values (
    '3df098e0-abbd-11ed-8a42-d7f6de01e571',
    '3f5f6b20-abbd-11ed-8a42-d7f6de01e571',
    null,
    '3a6faf80-abbd-11ed-8a42-d7f6de01e571',
    '107ac59c-88c9-4401-b289-7c0919093fd5',
    '88c77813-dd06-485d-b3f5-c8b424e60ad7',
    '/',
    '/',
    'Home',
    '# Homepage!',
    'markdown',
    'Live'
  );
  
select * from get_page_navigation_data_for_workspace_area(
  p_user_id := '8ac8d2a5-b810-40f7-bdec-5329973d6de6',
  p_organisation_id := '3a6faf80-abbd-11ed-8a42-d7f6de01e571',
  p_workspace_id := '107ac59c-88c9-4401-b289-7c0919093fd5',
  p_area_id := '88c77813-dd06-485d-b3f5-c8b424e60ad7'
);

select * from get_page_at_path(
  p_user_id := '8ac8d2a5-b810-40f7-bdec-5329973d6de6',
  p_organisation_id := '3a6faf80-abbd-11ed-8a42-d7f6de01e571',
  p_workspace_id := '107ac59c-88c9-4401-b289-7c0919093fd5',
  p_area_id := '88c77813-dd06-485d-b3f5-c8b424e60ad7',
  p_path := '/'
);

