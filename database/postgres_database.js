class PostgresDatabase {

    constructor(db) {
        this.db = db;
        this.uuid = require("uuid");
    }

    get_pool_object() {
        return this.db;
    }

    get_page_by_id(page_id) {
        return this.db.prepare("SELECT id, path, data FROM pages WHERE id = ?").get(page_id);
    }

    async get_page_for_url(url, organisation_id, workspace_id, area_id, user_id) {
        var result = await this.db.query(`
          select * from 
            get_page_for_url(
              $1::varchar,
              $2::uuid,
              $3::uuid,
              $4::uuid,
              $5::uuid
            )
        `,
          [
            url,
            organisation_id,
            workspace_id,
            area_id,
            user_id
          ]
        );

        return result.rows[0];
    }

    async update_page_at_path(path, page_data) {
        this.db.prepare("INSERT INTO pages (path, data) \
            VALUES(?, ?) \
            ON CONFLICT(path) DO UPDATE SET \
              data = ?").run(path, page_data, page_data);
    }

    get_document_by_id(document_id) {
        return this.db.prepare("SELECT id, name, data, type FROM diagrams WHERE id = ?").get(document_id);
    }

    get_documents_for_index() {
        return this.db.prepare("SELECT id, name, type FROM diagrams ORDER BY name").all();
    }

    rename_document_with_id(document_id, new_name) {
        this.db.prepare("UPDATE diagrams SET name = ? WHERE id = ?").run(new_name, document_id);
    }

    update_document_data(document_id, data) {
        this.db.prepare("UPDATE diagrams SET data = ? WHERE id = ?").run(data, document_id);
    }

    create_diagram(name, type, data) {
        return this.db.prepare("INSERT INTO diagrams (name, type, data) VALUES (?, ?, ?) RETURNING id").get(name, type, data);
    }

    get_navigation_links_for_current_page(current_page) {

        var results = {}
        results.siblings = [];
        results.children = [];

        if (current_page.length > 1) {
            var parentPage = current_page.substring(0, current_page.lastIndexOf('/'));
            
            if (parentPage != "/" && parentPage != "") {
                results.parentPage = parentPage;
            }

            console.log('parentPage = ' + parentPage);

            results.siblings = this.db.prepare("SELECT id, path FROM pages WHERE path not like '/' and path like ? and path not like ? ORDER BY path")
                .all(`${parentPage}/%`,
                     `${parentPage}/%/%`);

            results.children = this.db.prepare("SELECT id, path FROM pages WHERE path like ? and path not like ? ORDER BY path")
                 .all(`${current_page == "/" ? "" : current_page}/%`, 
                      `${current_page == "/" ? "" : current_page}/%/%`);
        }
        else {

            results.parentPage = null;

            results.siblings = this.db.prepare("SELECT id, path FROM pages WHERE path not like '/' and path like ? and path not like ? ORDER BY path")
                .all("/%", "/%/%");
        }



        return results;
    }

    async get_all_pages_for_index(user_id, organisation_id, workspace_id, area_id) {
        var result = await this.db.query("select * from get_page_index($1::uuid, $2::uuid, $3::uuid)", [this.uuid.NIL, this.uuid.NIL, this.uuid.NIL]);

        return result.rows;
    }


    async get_page_data(page_id, organisation_id, user_id) {
        var result = await this.db.query("select * from get_page_data($1::uuid, $2::uuid, $3::uuid)",
            [page_id, organisation_id, user_id]);

        return result.rows[0].get_page_data;
    }

    async admin_get_users(organisation) {
        var result = await this.db.query("SELECT id, email, name FROM users ORDER BY name");

        return result.rows;
    }

    async get_user_for_auth(email, organisation_id) {
        var result = await this.db.query("select * from get_user_for_auth($1::text, $2::uuid)",
            [email, organisation_id]);

        if (result.rows.length == 1) {
            return result.rows[0];
        }
        else {
            return {};
        }
    }

    async get_organisation_for_domain(domain) {
        var result = await this.db.query("select * from get_organisation_for_domain(p_domain := $1::text)", [domain]);

        if (result.rows.length == 1) {
            return result.rows[0];
        }
        else {
            return {};
        }
    }

    async get_workspace_area_and_page_for_url_in_organisation(url, organisation_id) {

        var result = await this.db.query("select * from get_workspace_area_and_page_for_url_in_organisation(p_domain := $1::text)", [domain]);

        if (result.rows.length == 1) {
            return result.rows[0];
        }
        else {
            return {};
        }
    }

    async get_workspace_for_organisation_with_verified_user(tag, organisation_id, user_id) {

        var result = await this.db.query(`
          select * from 
            get_workspace_for_organisation_with_verified_user (
              p_tag := $1::text,
              p_organisation_id := $2::uuid, 
              p_user_id := $3::uuid
            )
        `,
            [
                tag,
                organisation_id, 
                user_id
            ]
        );

        if (result.rows.length == 1) {
            return result.rows[0];
        }
        else {
            return undefined;
        }
    }

    async get_default_workspace_for_organisation_with_verified_user(organisation_id, user_id) {

        var result = await this.db.query(`
          select * from 
            get_default_workspace_for_organisation_with_verified_user (
              p_organisation_id := $1::uuid, 
              p_user_id := $2::uuid
            )
        `,
            [
                organisation_id, 
                user_id
            ]
        );

        if (result.rows.length == 1) {
            return result.rows[0];
        }
        else {
            return undefined;
        }
    }
    


    async get_area_for_workspace_with_verified_user(tag, workspace_id, organisation_id, user_id) {

        var result = await this.db.query(`
          select * from 
            get_area_for_workspace_with_verified_user (
              p_tag := $1::text,
              p_workspace_id := $2::uuid,
              p_organisation_id := $3::uuid, 
              p_user_id := $4::uuid
            )
        `,
            [
                tag,
                workspace_id,
                organisation_id, 
                user_id
            ]
        );

        if (result.rows.length == 1) {
            return result.rows[0];
        }
        else {
            return undefined;
        }
    }

    async get_default_area_for_workspace_with_verified_user(workspace_id, organisation_id, user_id) {

        var result = await this.db.query(`
          select * from 
            get_default_area_for_workspace_with_verified_user (
              p_workspace_id := $1::uuid,
              p_organisation_id := $2::uuid, 
              p_user_id := $3::uuid
            )
        `,
            [
                workspace_id,
                organisation_id, 
                user_id
            ]
        );

        if (result.rows.length == 1) {
            return result.rows[0];
        }
        else {
            return undefined;
        }
    }
    

}


module.exports = () => {
    
    let { Pool } = require('pg')
 
    const pool = new Pool({
        user: 'docspaces_website_user',
        host: 'localhost',
        database: 'docspaces_dev',
        password: 'secretpassword',
        port: 5432,
    })
 /*
    console.log('db code 1');

    pool.query('SELECT NOW()', (err, res) => {
        console.log(err, res)
        pool.end()
    })

    console.log('db code 2');
*/
    let db = new PostgresDatabase(pool);

    return db;
}