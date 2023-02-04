class SqliteDatabase {
    constructor(db) {
        this.db = db;
    }

    migrate() {
        this.db.prepare('CREATE TABLE IF NOT EXISTS diagrams (id integer primary key autoincrement, name text not null, data text not null, type varchar(50) not null)').run();
        this.db.prepare('CREATE TABLE IF NOT EXISTS pages (id integer primary key autoincrement, path text not null unique, data text not null)').run();
    }

    get_page_by_id(page_id) {
        return this.db.prepare("SELECT id, path, data FROM pages WHERE id = ?").get(page_id);
    }

    get_page_for_path(path) {
        return this.db.prepare("SELECT * FROM pages WHERE path = ?").get(path);
    }

    update_page_at_path(path, page_data) {
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
}


module.exports = (file) => {
    
    let sqlite = require('better-sqlite3')(file, {});
    sqlite.pragma('journal_mode = WAL');

    let db = new SqliteDatabase(sqlite);

    db.migrate();

    return db;
}