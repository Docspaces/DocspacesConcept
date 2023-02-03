/* jshint node: true */

const express = require("express");
const cors = require('cors');
const bodyParser = require('body-parser');

const db = require("./database/sqlite_database")('test.db');
const pageRoutes = require('./routes/pages')(db);
const documentRoutes = require('./routes/documents')(db);

const app = express();

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use('/', documentRoutes);
app.use('/', pageRoutes);

app.use('/', express.static(__dirname + '/static'));
app.listen(3000, () => console.log('App Started'));
