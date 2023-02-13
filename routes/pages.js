
const express = require("express");
const router = express.Router();
const uuid = require("uuid");
const ejs = require("ejs");
const hljs = require("highlight.js");

var db = null;
var middleware = null;

// Markdown rendering library
const marked = require("marked")

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
  level: 'inline',  // Is this a block-level or inline-level tokenizer?
  start(src) { return src.match(/\[/)?.index; }, // Hint to Marked.js to stop and check for a match
  tokenizer(src, tokens) {
    const rule = /\[\[([A-Za-z0-9\/]+[A-Za-z0-9\-\/_!()£$~]*?)\]\]/; // Regex for the complete token, anchor to string start
    const match = rule.exec(src);
    if (match) {
      return { // Token to generate
        type: 'wikiLink', // Should match "name" above
        raw: match[0], // Text to consume from the source
        linkText: this.lexer.inlineTokens(match[1].trim()), // Custom property
      };
    }
  },
  renderer(token) {
    let linkText = this.parser.parseInline(token.linkText);
    return `<a href="${linkText.startsWith('/') ? linkText : linkText}">${this.parser.parseInline(token.linkText)}</a>`;
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

/////

router.get('/pages/:id/fetch', async (req, res) => {

  var data = {}
  var options = {}

  if (req.params.id != '0') {

    var row = await this.db.get_page_by_id(req.params.id);

    res.status(200);
    res.send(row);
  }
  else {
    res.status(200);
    res.send('');
  }
});

router.get('/index', async (req, res) => {

  var data = {}
  var options = {}

  var pagePath = req._parsedUrl.pathname.toLowerCase();
  if (pagePath.length > 1 && pagePath.endsWith('/')) {
    pagePath = pagePath.substring(0, pagePath.length - 1);
  }

  try {
    var rows = await this.db.get_all_pages_for_index();

    ejs.renderFile('./templates/page_index.ejs', { pages: rows }, options, function (err, str) {
      if (err) {
        console.log("ERROR: " + err);
      }
      res.send(str);
    });
  }
  catch (e) {
    console.log("ERROR!!! " + e);
    ejs.renderFile('./templates/error.ejs', {}, {}, function (err, str) {
      res.send(str);
    });
  }

});

let wikiRouteRegex = /^\/[a-zA-Z0-9%\/\-]*$/

router.get(wikiRouteRegex, (req, res, next) => {

  console.log("---");  
  console.log("Pre-flight for the page handler");  
  console.log(req.session.userId == undefined ? "Not logged in" : "Logged in with user id " + req.session.userId);
  console.log("Domain is "+ req.hostname);
  console.log("Url is "+ req.url);

  console.log("Organisation is ");
  console.log("Worksapce is ");
  console.log("Area is ");
  console.log("Page is ");

  let page_context = {
    organisation_id: uuid.NIL
  };

  console.log("---");

//  req.session.userId = 123;

  //res.status = 401;
  return next();// "DENIED");

});

router.get(wikiRouteRegex, async (req, res) => {

  console.log('GET ' + req._parsedUrl.pathname)

  var pagePath = req._parsedUrl.pathname.toLowerCase();
  if (pagePath.length > 1 && pagePath.endsWith('/')) {
    pagePath = pagePath.substring(0, pagePath.length - 1);
  }

  var row = await this.db.get_page_for_path(pagePath);

  var related = { siblings: [], children: [], parent: null } // await this.db.get_navigation_links_for_current_page(pagePath);

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
    data.pathPath = pagePath;

    console.log(data);

    ejs.renderFile('./templates/pages/markdown_editor.ejs', data, options, function (err, str) {
      res.send(str)
    });
  }
  else {
    var data = {}
    var options = {}

    if (pageData != '') {
      let processed = marked.parse(pageData); // <<-- produces an HTML string

      data.output = DOMPurify.sanitize(processed);
    }
    else {
      ejs.renderFile('./templates/pages/page_not_found.ejs', { "pagePath": pagePath }, {}, function (err, str) {
        data.output = str;
        console.log(data);
      });
    }
    data.pagePath = pagePath;
    data.related = related;

    if (pagePath.length > 1) {
      data.pageName = pagePath.substring(pagePath.lastIndexOf('/') + 1);
    }
    else {
      data.pageName = 'Home';
    }

    ejs.renderFile('./templates/pages/markdown_render.ejs', data, options, function (err, str) {
      res.send(str)
    });
  }

});

// This processes the same URLs as the .get method, but this is for post-back only, so when the user is trying to update
router.post(wikiRouteRegex, async (req, res) => {

  console.log('POST ' + req._parsedUrl.pathname)

  var pagePath = req._parsedUrl.pathname.toLowerCase();
  if (pagePath.length > 1 && pagePath.endsWith('/')) {
    pagePath = pagePath.substring(0, pagePath.length - 1);
  }

  await this.db.update_page_at_path(pagePath, req.body.content);

  res.redirect(req._parsedUrl.pathname);

});

module.exports = (db, middleware) => {
  this.db = db;
  this.middleware = middleware;
  return router;
}