/*
drop table pages;
drop table workspace_areas;
drop table workspace_users;
drop table organisation_users;
drop table workspaces;
drop table users;
drop table organisations;
*/

create table organisations (
  id uuid primary key not null,
  name varchar(500) not null,
  domain varchar(500) null,
  created_at timestamp default(current_timestamp)
);

drop index idx_organisations_main;
create index idx_organisations_main on organisations (domain);


create table users (
  id uuid primary key not null,
  display_name varchar(500) not null,
  email_address varchar(500) not null,
  password_digest varchar(500) not null,
  active boolean not null,
  created_at timestamp default(current_timestamp)
);

drop index idx_users_main;
create index idx_users_main on users (email_address, active);

create table organisation_users (
  organisation_id uuid not null references organisations(id),
  user_id uuid not null references users(id),
  org_role varchar(50) not null check(org_role in ('Member', 'Administrator')),
  created_at timestamp default(current_timestamp)
);

drop index idx_organisation_users_main;
create index idx_organisation_users_main on organisation_users (organisation_id, user_id);

create table workspaces (
  id uuid primary key not null,
  organisation_id uuid not null references organisations(id),
  tag varchar(500) not null,
  display_name varchar(500) not null,
  default_for_org boolean not null,
  created_at timestamp default(current_timestamp)
);

drop index idx_workspaces_main;
create index idx_workspaces_main on workspaces (organisation_id, tag, default_for_org);

create table workspace_users (
  workspace_id uuid not null references workspaces(id),
  user_id uuid not null references users(id),
  workspace_role varchar(50) not null check(workspace_role in ('Reader', 'Contributor', 'Administrator')),
  created_at timestamp default(current_timestamp)
);

drop index idx_workspace_users_main;
create index idx_workspace_users_main on workspace_users (workspace_id, user_id);

create table workspace_areas (
  id uuid primary key not null,
  workspace_id uuid not null references workspaces(id),
  tag varchar(500) not null,
  display_name varchar(500) not null,
  default_for_workspace boolean not null,
  created_at timestamp default(current_timestamp)
);

drop index idx_workspace_areas_main;
create index idx_workspace_areas_main on workspace_areas (workspace_id, tag, default_for_workspace);


create table pages (
  page_id uuid not null,
  version_id uuid primary key not null,
  
  parent_page_id uuid null, -- Actually not sure whether we want to maintain this, or just go from path... tbc.
  
  organisation_id uuid not null references organisations(id),
  workspace_id uuid not null references workspaces(id),
  area_id uuid not null references workspace_areas(id),

  slug varchar(500) not null, -- Borrowed this word from Wordpress, means the url part for this page
  calculated_path varchar(4000) not null, -- The full path to the page, not including workspace or area. Calculated because moving a parent page will update this
  
  display_name varchar(500) not null, -- For navigtation etc.
  page_data text,
  page_template varchar(250),

  page_status varchar(50) not null check(page_status in ('Draft', 'Live', 'Replaced')),

  page_created_at timestamp,
  page_created_by uuid,

  version_created_at timestamp default(current_timestamp),
  version_number int,
  version_created_by uuid
);

drop index idx_pages_main;
create index idx_pages_main on pages (page_id, organisation_id, workspace_id, area_id, page_status, calculated_path);

drop index idx_pages_version_id;
create index idx_pages_version_id on pages (version_id);


SELECT uuid_generate_v4();

CREATE USER docspaces_website_user WITH PASSWORD 'secretpassword';
CREATE USER docspaces_website_db_function_role;

/*
CREATE TABLE diagrams (
  id serial primary key, 
  name text not null, 
  data text not null, 
  type varchar(50) not null
);
*/

grant all on pages to docspaces_website_db_function_role;
grant all on workspace_areas to docspaces_website_db_function_role;
grant all on workspace_users to docspaces_website_db_function_role;
grant all on organisation_users to docspaces_website_db_function_role;
grant all on workspaces to docspaces_website_db_function_role;
grant all on users to docspaces_website_db_function_role;
grant all on organisations to docspaces_website_db_function_role;

-- revoke all on pages from docspaces_website_db_function_role;


select json_agg(pages) from pages;








