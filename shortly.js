var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();
app.use(session({
  secret: 'keyboard cat'/*,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true }
*/}));


app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

var restrict = function(req, res, next) {
  console.log('restrict: req.session: ', req.session);
  if (req.session.user) {
    console.log("restrict: ok for user, ", req.session.user);
    next();
  } else {
    console.log("restrict: denied for user, ", req.session.user);
    req.session.error = 'Access denied!';
    res.redirect('/login');
  }
}


app.get('/', restrict,  
function(req, res) {
  res.render('index');
});

// app.get('/create', 
app.get('/signup', 
function(req, res) {
  res.render('signup');
});

app.get('/links', restrict,
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.get('/login', function(req, res){
  res.render('login');
});

app.post('/links', restrict,
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

var initSession = function(req, res, username) {
  req.session.regenerate(function(){
    console.log("initSession: session regenerate for ", username);
    req.session.user = username;
    console.log('initSess, after setting req.sess.user: ',req.session)
    res.redirect('/');
  });
  console.log("initSession: req.session: ", req.session);
};


app.post('/signup', 
  function(req, res) {
    var username = req.body.username;
    var password = req.body.password;


    // check to see if username already exists; if yes, error
    new User({'username': username}, {'clearpass': password}).fetch().then(function(found) {
      console.log('Signup POST: ', username, password);
      if (found) {
        console.log('Signup: username already exists.');
        // res.set('location','/');
        res.location('/');
        console.log('Signup: res.headers is: ', res.headers);
        res.status(302).send();
      } else {
        var user = new User({'username': username}, {'clearpass':password});
        // var user = new User({'username': username, 'passwordhash': password});
        console.log('Signup: new username');
        // console.log('Signup: res is: ', res);
        console.log("user before save: ",user.attributes);
        user.save().then(function(newUser) {
          console.log('newUser: ',newUser.attributes);
          Users.add(newUser);
          // res.set('location','/');

          initSession(req, res, username);
          // res.location('/');
          // console.log('Signup: res.headers is: ', res.headers);
          // res.status(302).send();
        })
      }

    });

    // new User({ username: username, password: password})

  });

app.post('/login',
  function(req, res){
    var username = req.body.username;
    var password = req.body.password;
    new User({'username': username}, {'clearpass': password}).fetch().then(function(model){
      if(!model){
        res.location('/login');
        res.status(302).send();
      } else {
        console.log("POST/login Model found, attributes: "+JSON.stringify(model)+"\n\n");
        return model.checkPassword(password).then(function(correct){
          console.log('checkPassword then statement correct: '+correct);
          if(!correct){
            res.location('/login');
            res.status(302).send();
          } else {
            console.log("Password correct! ");
            initSession(req, res, username);
            // res.location('/');
            // res.status(302).send();
          }
        })
        .catch(function(err){console.log("check password error")});
      }
    }); 
  }
);

    //fetch the user if it exists
    // fetch the salt and hash 

    // hash the input password with the salt
    // compare the hashed input with the table
       // if it matches, redirect to '/'
       // if not, throw some error page
/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
