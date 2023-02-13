const express = require("express");
const session = require("express-session");
const cors = require("cors");
const bodyParser = require("body-parser");


const a = require("./middleware/auth");

const db = require("./database/postgres_database")();

//const db = require("./database/sqlite_database")("test.db");
const pageRoutes = require("./routes/pages")(db, a.authorize);
const documentRoutes = require("./routes/documents")(db);
const adminRoutes = require("./routes/admin")(db);
const loginRoutes = require("./routes/login")(db);

const app = express();

app.use(bodyParser.json({ limit: "5mb" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(session({
    secret: "Just testing for development",
    name: "__session_id",
 //   cookie: {
   //     secure: true,
     //   httpOnly: true,
//        domain: 'docspaces.local',
//        path: 'foo/bar',
//        expires: expiryDate
     // }
}));


const myLogger = function (req, res, next) {
    console.log(Date.now() + ': ' + req.host);
    req.moo = '123';
    next();
}
//app.use(a.authorize);

app.use("/", loginRoutes);
app.use("/", adminRoutes);
app.use("/", documentRoutes);
app.use("/", pageRoutes);
app.use("/", express.static(__dirname + "/static"));

app.listen(3000, () => console.log("Docspaces server started on port 3000"));
