//const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const cors = require('cors');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const { application } = require('express');
const hljs = require('highlight.js');

//const db = new sqlite3.Database('./test.db');
const db = require('better-sqlite3')('test.db', {});
db.pragma('journal_mode = WAL');


db.prepare('CREATE TABLE IF NOT EXISTS diagrams (id integer primary key autoincrement, name text not null, data text not null, type varchar(50) not null)').run();
//db.run('DROP TABLE IF EXISTS pages');

db.prepare('CREATE TABLE IF NOT EXISTS pages (id integer primary key autoincrement, path text not null unique, data text not null)').run();

// Markdown rendering library
const marked = require('marked')

marked.setOptions({
  highlight: function (code, lang) {
    console.log(`lang = '${lang}'`);
    if (lang !== '') {
      return hljs.highlight(code, { language: lang }).value;
    }
    else {
      return hljs.highlightAuto(code).value;
    }
  }
});

const wikiLinks = {
  name: 'wikiLink',
  level: 'inline',                                 // Is this a block-level or inline-level tokenizer?
  start(src) { return src.match(/\[/)?.index; },    // Hint to Marked.js to stop and check for a match
  tokenizer(src, tokens) {
    const rule = /\[\[([A-Za-z0-9\/]+[A-Za-z0-9\-\/_!()£$~]*?)\]\]/;  // Regex for the complete token, anchor to string start
    const match = rule.exec(src);
    if (match) {
      return {                                         // Token to generate
        type: 'wikiLink',                           // Should match "name" above
        raw: match[0],                                 // Text to consume from the source
        linkText: this.lexer.inlineTokens(match[1].trim()),  // Custom property
      };
    }
  },
  renderer(token) {
    return `<a href="${this.parser.parseInline(token.linkText)}">${this.parser.parseInline(token.linkText)}</a>`;
  },
  childTokens: ['linkText'], // Any child tokens to be visited by walkTokens
};

marked.use({ extensions: [wikiLinks] });

// Libraries to sanitise HTML
const createDOMPurify = require('dompurify')
const { JSDOM } = require('jsdom');
const { redirect } = require('express/lib/response');
const e = require('express');
const window = new JSDOM('').window
const DOMPurify = createDOMPurify(window)


const app = express();

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());


app.get('/diagrams/:id/edit', (req, res) => {

  var data = {}
  var options = {}

  var row = db.prepare("SELECT id, name, data, type FROM diagrams WHERE id = ?").get(req.params.id);

  data.diagram = row;

  var template = data.diagram.type == 'drawio' ? './templates/edit_drawio.ejs' : './templates/edit_mermaid.ejs';

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

app.get('/diagrams', (req, res) => {

  var data = {}
  var options = {}

  var rows = db.prepare("SELECT id, name, type FROM diagrams ORDER BY name").all();

    data.diagrams = rows

    ejs.renderFile('./templates/index.ejs', data, options, function (err, str) {
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
    res.send('');
  }
});

let wikiRouteRegex = /^\/[a-zA-Z0-9%\/\-]*$/

app.get(wikiRouteRegex, (req, res) => {
  console.log('GET ' + req._parsedUrl.pathname)

  var pagePath = req._parsedUrl.pathname.toLowerCase();
  if (pagePath.length > 1 && pagePath.endsWith('/')) {
    pagePath = pagePath.substring(0, pagePath.length - 1);
  }

  var row = db.prepare("SELECT * FROM pages WHERE path = ?").get(pagePath);

    var pageData = '';
    var pageId = 0;


    if (row) {
      console.log('Loaded page ' + row.id + ": " + row.path)
      pageData = row.data;
      pageId = row.id;
    }

    if (req.query['edit'] != undefined) {

      var data = {}
      var options = {}

      console.log('EDIT');

      data.page = {}
      data.page.id = pageId;

      console.log(data);

      ejs.renderFile('./templates/page_editor.ejs', data, options, function (err, str) {
        res.send(str)
      });
    }
    else {
      var data = {}
      var options = {}

      let processed = marked.parse(pageData); // <<-- produces an HTML string

      data.output = DOMPurify.sanitize(processed);

      ejs.renderFile('./templates/page_render.ejs', data, options, function (err, str) {
        res.send(str)
      });
    }

});

// This processes the same URLs as the .get method, but this is for post-back only, so when the user is trying to update
app.post(wikiRouteRegex, (req, res) => {

  console.log('POST ' + req._parsedUrl.pathname)

  var pagePath = req._parsedUrl.pathname.toLowerCase();
  if (pagePath.length > 1 && pagePath.endsWith('/')) {
    pagePath = pagePath.substring(0, pagePath.length - 1);
  }

  // This is a funny Sqlite specific way to update-or-insert in a single statement, just for simplicity
  db.prepare("INSERT INTO pages (path, data) \
            VALUES(?, ?) \
            ON CONFLICT(path) DO UPDATE SET \
              data = ?").run(pagePath, req.body.content, req.body.content);

  res.redirect(req._parsedUrl.pathname);

});

app.use('/', express.static(__dirname + '/static'));
app.listen(3000, () => console.log('App Started'));
