
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

  // Need a different way to handle this, but just testing for now...

  var org_for_domain = await this.db.get_organisation_for_domain(req.hostname);

  //console.log("Organisation for domain is " + org_for_domain.organisation_id);
  //console.log("Organisation for session is " + req.session.organisation_id);

  const verified_organisation_id = org_for_domain.organisation_id; // TODO: Real code !!!
  const verified_user_id = req.session.user_id == undefined ? uuid.NIL : req.session.user_id;

  var data = {}
  var options = {}

  if (req.params.id != '0') {

    //console.log(`get_page_data(${req.params.id}, ${verified_organisation_id}, ${verified_user_id});`)
    
    var page_data = await this.db.get_page_data(req.params.id, verified_organisation_id, verified_user_id);

    console.log('*******');
    console.log(page_data);

    res.status(200);
    res.send(page_data);
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

router.get(wikiRouteRegex, async (req, res, next) => {

  const startTime = process.hrtime(); 

  let page_context = {};

  // TODO: Validate the url is valid, explicitly block double slash etc

  console.log("---");  
  console.log("Pre-flight for the page handler");

  // First, is the user logged in? If not, we'll need a domain that allows anonymous access to even continue

  console.log(req.session.user_id == undefined ? "Not logged in" : "Logged in with user id " + req.session.user_id);
  
  //console.log("Domain is "+ req.hostname);
  //console.log("Url is "+ req.url);

  // Even if a user is logged in, if there's a domain we need to know who it belongs to -- so we can check the user's
  // session is a valid match. This might be overkill, but it feels like the right thing to do.

  var org_for_domain = await this.db.get_organisation_for_domain(req.hostname);

  //console.log("Organisation for domain is " + org_for_domain.organisation_id);
  //console.log("Organisation for session is " + req.session.organisation_id);

  // Now we can validate that it's a match and abandon if something looks wrong.

  // if () // check that org is expected... but for now just cheating while we build it out...

  page_context.verified_organisation_id = org_for_domain.organisation_id; // TODO: Real code !!!

  // if the organisation allows anonymous accesss, we use a NIL uuid for user id

  page_context.verified_user_id = req.session.user_id == undefined ? uuid.NIL : req.session.user_id;

  // Finally, we can work out from the URL what workspace, area and page we're on -- and as part of this check
  // we're validating the the current user has access to the workspace and that the page exists. If the organuisation
  // allows default workspaces to provide a 'root' site, we can work it out here.

  // We handle it like this -- suppose we have a url that looks like this: /workspace/area/page
  // We need to split that and check if part 1 (workspace) exists in the organisation -- and if not, load the default
  // workspace (assuming there is one and it can be accessed)
  // If it is a match, we need to move to the next part (area) and do the same for that -- but if the first part was not
  // a match, we will look for an area named workspace instead. Again, if there's no match, we'll load the default.
  // Assuming there is a match for either, we'll work out what the page url is.

  if (req.url.match(/\/\//) != null) {
    // Need to abort here
    res.send("Something went wrong, sorry");
    res.end();
    return;
  }

  const requestedPagePath = req._parsedUrl.pathname; // This will be modified if we match a workspace/area tag in the url leaving just the page part
  let url_parts = [];
  
  const processedPagePath = requestedPagePath.replace(/(^\/|\/$)/g, ""); // Strip leading and trailing /
  
  if (processedPagePath != '') {
    url_parts = processedPagePath.split("/");
  }

  let derived_workspace_from_url = false;
  let derived_area_from_url = false;

  let workspace = undefined;
  let area = undefined;

  let base_url = '';

  if (url_parts.length >= 1) {

    const candiate_worksapce = url_parts[0];
    
    workspace = await this.db.get_workspace_for_organisation_with_verified_user(candiate_worksapce, page_context.verified_organisation_id, page_context.verified_user_id);

    if (workspace != undefined) {
      derived_workspace_from_url = true;
      base_url = `/${workspace.tag}`;
    }
  }

  if (workspace == undefined) {
    workspace = await this.db.get_default_workspace_for_organisation_with_verified_user(page_context.verified_organisation_id, page_context.verified_user_id);
  }

  // if workspace is null, abort with 404/error type thing

  if (url_parts.length >= derived_workspace_from_url ? 2 : 1) {

    const candiate_area = url_parts[derived_workspace_from_url ? 1 : 0];
    
    area = await this.db.get_area_for_workspace_with_verified_user(candiate_area, workspace.workspace_id, page_context.verified_organisation_id, page_context.verified_user_id);
  
    if (area != undefined) {
      derived_area_from_url = true;
      base_url = `${base_url}/${area.tag}`;
    }
  }

  if (area == undefined) {
    area = await this.db.get_default_area_for_workspace_with_verified_user(workspace.workspace_id, page_context.verified_organisation_id, page_context.verified_user_id);
  }

  // if area is null, abort with 404/error type thing

  page_context.workspace = workspace;
  page_context.area = area;
  page_context.base_url = base_url;

  let actual_page_path  = '';

  if (base_url != '' && requestedPagePath.startsWith(base_url)) {
    actual_page_path = requestedPagePath.substring(base_url.length);
  }

  if (actual_page_path.length > 1 && actual_page_path.endsWith("/")) {
    actual_page_path = actual_page_path.substring(0, actual_page_path.length - 1);
  }    
  
  if (actual_page_path == '') {
    actual_page_path = '/';
  }

  page_context.actual_page_path = actual_page_path;


  var page_data = await this.db.get_page_for_url(page_context.actual_page_path, page_context.verified_organisation_id, workspace.workspace_id, area.area_id, page_context.verified_user_id);

  page_context.requested_url = requestedPagePath;

  page_context.page = page_data;

  req.page_context = page_context;

  console.log("page_context:");
  console.log(page_context);

  const elapsedTime = process.hrtime(startTime);
  console.log(`Preflight completed in ${(elapsedTime[0] * 1000000 + elapsedTime[1] / 1000)/1000}ms`);
  
  console.log("---");

  return next();
});

router.get(wikiRouteRegex, async (req, res) => {

  console.log('GET ' + req._parsedUrl.pathname)

  var related = { siblings: [], children: [], parent: null } // await this.db.get_navigation_links_for_current_page(pagePath);

  if (req.query['edit'] != undefined) {

    var data = {}
    var options = {}

    console.log('EDIT');

    data.page = {}
    data.page.id = req.page_context.page.page_id;
    data.pathPath = req.page_context.page.page_path;

    ejs.renderFile('./templates/pages/markdown_editor.ejs', data, options, function (err, str) {
      res.send(str)
    });
  }
  else {

    var page_data = await this.db.get_page_data(req.page_context.page.page_id, req.page_context.verified_organisation_id, req.page_context.verified_user_id);

    var data = {}
    var options = {}

    if (page_data != '') {
      let processed = marked.parse(page_data.data); // <<-- produces an HTML string

      data.output = DOMPurify.sanitize(processed);
    }
    else {
      ejs.renderFile('./templates/pages/page_not_found.ejs', { "pagePath": req.page_context.page.page_path }, {}, function (err, str) {
        data.output = str;
        console.log(data);
      });
    }
    data.pagePath = req.page_context.page.page_path;
    data.related = related;

    if (data.pagePath.length > 1) {
      data.pageName = data.pagePath.substring(data.pagePath.lastIndexOf('/') + 1);
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