const express = require("express");
const session = require("express-session");
const cors = require("cors");
const bodyParser = require("body-parser");
const responseTime = require("response-time");

const db = require("./database/postgres_database")();
//const db = require("./database/sqlite_database")("test.db");

const pageRoutes = require("./routes/pages")(db);
const documentRoutes = require("./routes/documents")(db);
const adminRoutes = require("./routes/admin")(db);
const loginRoutes = require("./routes/login")(db);

const app = express();

app.use(responseTime(function (req, res, time) {
  console.log(`Response time: ${time} - ${req.url}`);
}))

app.use(bodyParser.json({ limit: "5mb" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
/*app.use(session({
    secret: "Just testing for development",
    name: "__session_id",
 //   cookie: {
   //     secure: true,
     //   httpOnly: true,
//        domain: 'docspaces.local',
//        path: 'foo/bar',
//        expires: expiryDate
     // }
}));*/

app.use(session({
    store: new (require('connect-pg-simple')(session))({
      pool : db.get_pool_object(),
      tableName : 'session_data'
    }),
    secret: "Just testing for development", // process.env.SESSION_COOKIE_SECRET,
    resave: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days
  }));

app.use("/", loginRoutes);
app.use("/", adminRoutes);
app.use("/", documentRoutes);
app.use("/", pageRoutes);
app.use("/", express.static(__dirname + "/static"));


app.listen(3000, () => console.log("Docspaces server started on port 3000"));
