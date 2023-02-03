var file = "test.db";

const db = require('better-sqlite3')(file, {});

//db.open(file);
db.pragma('journal_mode = WAL');
db.prepare('CREATE TABLE IF NOT EXISTS diagrams (id integer primary key autoincrement, name text not null, data text not null, type varchar(50) not null)').run();
//db.run('DROP TABLE IF EXISTS pages');
db.prepare('CREATE TABLE IF NOT EXISTS pages (id integer primary key autoincrement, path text not null unique, data text not null)').run();


module.exports = (file) => { return db; }