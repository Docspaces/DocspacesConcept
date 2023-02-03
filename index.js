/* jshint node: true */

//const sqlite3 = require('sqlite3').verbose();
const express = require("express");
const cors = require('cors');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const { application } = require('express');

//const db = new sqlite3.Database('./test.db');
const db = require('better-sqlite3')('test.db', {});
db.pragma('journal_mode = WAL');
db.prepare('CREATE TABLE IF NOT EXISTS diagrams (id integer primary key autoincrement, name text not null, data text not null, type varchar(50) not null)').run();
//db.run('DROP TABLE IF EXISTS pages');
db.prepare('CREATE TABLE IF NOT EXISTS pages (id integer primary key autoincrement, path text not null unique, data text not null)').run();

const pageRoutes = require('./routes/pages')(db);

//pageRoutes.init(db);

const app = express();

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());


app.get("/diagrams/:id/edit", (req, res) => {

  var data = {};
  var options = {};
  var template = "";
  var row = db.prepare("SELECT id, name, data, type FROM diagrams WHERE id = ?").get(req.params.id);

  data.diagram = row;
  data.diagramId = row.id;

  template = (data.diagram.type === "drawio" ?
                "./templates/drawio_editor.ejs" 
                : "./templates/mermaid_editor.ejs");

  ejs.renderFile(template, data, options, function (err, str) {
      res.status(200);
      res.send(str);
  });

});

app.get('/diagrams/:id/fetch', (req, res) => {

  var data = {}
  var options = {}

  var row = db.prepare("SELECT id, name, data, type FROM diagrams WHERE id = ?").get(req.params.id);

  res.status(200);
  res.send(row);

});

app.post('/diagrams/new', (req, res) => {

  //console.log(req);
  console.log(req.body.name);
  console.log(req.body.diagramType);

  if (req.params.name == '') {
    res.status(500);
    res.send('Missing name');
  } else {

    var defaultData = '';

    if (req.body.diagramType == 'mermaid') {
      defaultData = `sequenceDiagram`;
    }

    var row = db.prepare("INSERT INTO diagrams (name, type, data) VALUES (?, ?, ?) RETURNING id").get(req.body.name, req.body.diagramType, defaultData);

    res.status(200);
    res.send({ id: row.id });
  }

});

app.post('/diagrams/:id/update', (req, res) => {

  if (req.params.id == '') {
    res.status(500);
    res.send('Missing id');
  } else {

    db.prepare("UPDATE diagrams SET data = ? WHERE id = ?").run(req.body.data, req.params.id);

    res.status(200);
    res.send({ status: "OK" });
  }

});

app.post('/diagrams/:id/rename', (req, res) => {

  if (req.params.id == '') {
    res.status(500);
    res.send('Missing id');
  } else {

    db.prepare("UPDATE diagrams SET name = ? WHERE id = ?").run(req.body.name, req.params.id);

    res.status(200);
    res.send({ status: "OK" });
  }

});

app.get('/documents', (req, res) => {

  var data = {}
  var options = {}

  var rows = db.prepare("SELECT id, name, type FROM diagrams ORDER BY name").all();

    data.diagrams = rows

    ejs.renderFile('./templates/document_index.ejs', data, options, function (err, str) {
      if (err) {
        res.status(500);
        res.send(err.message);
      }
      else {
        res.status(200);
        res.send(str);
      }
    });

});

app.get('/pages/:id/fetch', (req, res) => {

  var data = {}
  var options = {}

  if (req.params.id != '0') {

  var row = db.prepare("SELECT id, path, data FROM pages WHERE id = ?").get(req.params.id);

    res.status(200);
    res.send(row);
  }
  else {
    res.status(200);
    res.send('');
  }
});

app.get('/index', (req, res) => {

  var data = {}
  var options = {}

  var rows = db.prepare("SELECT id, path FROM pages ORDER BY path").all();

  ejs.renderFile('./templates/page_index.ejs', { pages: rows }, options, function (err, str) {
    res.send(str)
  });

});

app.use('/', pageRoutes);

app.use('/', express.static(__dirname + '/static'));
app.listen(3000, () => console.log('App Started'));
