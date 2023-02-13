
const express = require('express');
const router = express.Router();

const ejs = require('ejs');

var db = null;



router.get("/diagrams/:id/edit", (req, res) => {

    var data = {};
    var options = {};
    var template = "";
    var row = this.db.get_document_by_id(req.params.id);
  
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
  
  router.get('/diagrams/:id/fetch', (req, res) => {
  
    var data = {}
    var options = {}
  
    var row = this.db.get_document_by_id(req.params.id);
  
    res.status(200);
    res.send(row);
  
  });
  
  router.post('/diagrams/new', (req, res) => {
  
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
  
      var row = this.db.create_diagram(req.body.name, req.body.diagramType, defaultData);
  
      res.status(200);
      res.send({ id: row.id });
    }
  
  });
  
  router.post('/diagrams/:id/update', (req, res) => {
  
    if (req.params.id == '') {
      res.status(500);
      res.send('Missing id');
    } else {
  
      this.db.update_document_data(req.params.id, req.body.data);
  
      res.status(200);
      res.send({ status: "OK" });
    }
  
  });
  
  router.post('/diagrams/:id/rename', (req, res) => {
  
    if (req.params.id == '') {
      res.status(500);
      res.send('Missing id');
    } else {
  
      this.db.rename_document_with_id(req.params.id, req.body.name);
  
      res.status(200);
      res.send({ status: "OK" });
    }
  
  });
  
  router.get('/documents', (req, res) => {
  
    var data = {}
    var options = {}
  
    var rows = this.db.get_documents_for_index();
  
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
  

module.exports = (db) => {
    this.db = db;
    return router;
}