
const express = require('express');
const ejs = require('ejs');
const router = express.Router();
const u = require('uuid');
const bcrypt = require('bcryptjs');

var db = null;

router.get("/login", async (req, res) => {

    let contentForMain = null;

    let options = {};

    contentForMain = await ejs.renderFile('./templates/login/login.ejs', {}, options)

    pageData = {
        "contentForMain": contentForMain
    };

    ejs.renderFile('./templates/layouts/login_screen.ejs', pageData, options, function (err, str) {
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

router.post("/login", async (req, res) => {

    var user_to_authenticate = await this.db.get_user_for_auth(req.body.email, u.NIL); // TODO: Fix orgid if it's on a domain...

    console.log(user_to_authenticate);

/*
Example payload
{
  user_id: '8ac8d2a5-b810-40f7-bdec-5329973d6de6',
  display_name: 'Adrian OC',
  password_digest: '$2a$10$XextrTMn/n21J4tdZMJt1O0y/vt08umWgYD553QECK/fO/Yw0SwPi',
  organisation_membership_data: [
    {
      organisation_id: '3a6faf80-abbd-11ed-8a42-d7f6de01e571',
      organisation_name: 'Demo Org'
    }
  ]
}
*/
    if (bcrypt.compareSync(req.body.password, user_to_authenticate.password_digest))
    {
        if (user_to_authenticate.organisation_membership_data.length == 1)
        {
            console.log('Authenticated ' + req.body.email + '. Setting session...');
            console.log('User Id: ' + user_to_authenticate.user_id);
            console.log(' Org Id: ' + user_to_authenticate.organisation_membership_data[0].organisation_id);
            
            req.session.user_id = user_to_authenticate.user_id;
            req.session.organisation_id = user_to_authenticate.organisation_membership_data[0].organisation_id;
            
            res.redirect('/');
        }
        else {
            res.redirect('/login');
        }
    }
    else {
        res.redirect('/login');
    }
});

router.get("/logout", async (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

module.exports = (db) => {
    this.db = db;
    return router;
}