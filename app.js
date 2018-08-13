var express = require("express");
var http = require("http");
var path = require("path");
var logger = require("morgan");
var bodyParser = require("body-parser");
var mysql = require('mysql');
var bcrypt = require('bcrypt');
var session = require('express-session');

var app = express ();
//create sql connection
var con = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "password",
  database: "my_db"
});

app.set("views", path.resolve(__dirname, "views"));
app.set("view engine", "ejs");

var entries = [];
app.locals.entries = entries;

app.use(logger("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({secret: "kkldha8994893493jkjfkljsdklfjsdklf"}));

app.get("/", function(request, response) {
    response.render("index");
})

app.get("/new-entry", function(request, response){
    response.render("new-entry")
})

app.post("/new-entry", function(request, response){
    if (!request.body.username || !request.body.password) {
        response.status(400).send("Entries must have a title and a body.");
        return;
    }
        username = request.body.username,
        password = bcrypt.hashSync(request.body.password, 10),
        created = new Date()
        getId(username, password, created)
            .then(result => {
                request.session.userid = result
                response.redirect('/welcome');
            }).catch( e => {
                console.log(e);
            })
})

app.get("/login", function(request, response){
    response.render("login", {message: ""})
})

app.post("/login", function(request, response){
        username = request.body.username,
        password = request.body.password,

        sql = "SELECT * FROM users WHERE username = " + "'" + username + "'";
        con.query(sql, function (err, result) {
        if (err) throw err;
        var hash = result[0].password;
        var user = result[0].username;
          if (bcrypt.compareSync(password, hash) == true) {
            request.session.userid = user
            response.redirect("/welcome");
          } else {
            response.render('login', {message: "Wrong Password"})
          }
        });
})

app.get("/logout", function(request, response){
    request.session.destroy();
    console.log(request.session);
    response.redirect('/login');
})

app.get("/welcome", function(request, response){
    console.log(request.session.userid)
    if (request.session.userid) {
      response.render("welcome", {name: request.session.user})
    }
    else {
      response.redirect('/login')
    }
})

app.use(function(request, response){
    response.status(404).render("404");
})

http.createServer(app).listen(3000, function(){
    console.log("Guestbook app started on port 3000.");
});



function insertDetails(username, password, created) {
    return new Promise(function(resolve,reject) {
        var sql = "INSERT INTO users (username, password, create_date) VALUES ?";
        var values = [
        [username, password, created]
        ]
        con.query(sql, [values], function (err, result) {
            if (err) {
                reject(err);
            };
            resolve(result.insertId)
        })
    });
};

async function getId(username, password, created) {
    try {
        result = await insertDetails(username, password, created)
        return result;
    } catch (err) {
        throw err
    }
}