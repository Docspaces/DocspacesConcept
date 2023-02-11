
const express = require('express');
const ejs = require('ejs');
const router = express.Router();

var db = null;

// For everything in here we must check that the logged in user is an Organisation Admin

router.get("/admin/users", (req, res) => {

    let contentForNav = null;
    let contentForMain = null;

    let options = {};

    // This is dumb, we might need to do something different for this...

    ejs.renderFile('./templates/admin/admin_nav.ejs', {}, options, function (err, str) {
        contentForNav = str;
    });

    ejs.renderFile('./templates/admin/users.ejs', {}, options, function (err, str) {
        contentForMain = str;
    });

    pageData = {
        "contentForNav": contentForNav,
        "contentForMain": contentForMain
    };

    ejs.renderFile('./templates/layouts/admin_screens.ejs', pageData, options, function (err, str) {
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

module.exports = (db) => {
    this.db = db;
    return router;
}