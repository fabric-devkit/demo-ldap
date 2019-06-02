// Run with: DEBUG=webApp:* npm start

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var passport     = require('passport'),
    exphbs = require('express-handlebars'),
    bodyParser   = require('body-parser'),
    methodOverride = require('method-override'),
    session = require('express-session'),
    LdapStrategy = require('passport-ldapauth');

var OPTS = {
  passReqToCallback: true,
  server: {
    url: 'ldap://ldap-server:389',
    bindDN: 'cn=admin,dc=example,dc=org',
    bindCredentials: 'adminpw',
    searchBase: 'dc=example,dc=org',
    searchFilter: '(cn={{username}})'
  }
};

var app = express();

passport.use(new LdapStrategy(OPTS, function(req, user, done){
  console.log(user);
  req.session.user = user;
  done(null, user);
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(methodOverride('X-HTTP-Method-Override'));
app.use(session({secret: 'supernova', saveUninitialized: true, resave: true}));
app.use(passport.initialize());
app.use(passport.session());

// Session-persisted message middleware
app.use(function(req, res, next){
  var err = req.session.error,
      msg = req.session.notice,
      success = req.session.success;

  delete req.session.error;
  delete req.session.success;
  delete req.session.notice;

  if (err) res.locals.error = err;
  if (msg) res.locals.notice = msg;
  if (success) res.locals.success = success;

  next();
});

// Configure express to use handlebars templates
var hbs = exphbs.create({
  defaultLayout: 'main', //we will be creating this layout shortly
});
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

//===============ROUTES=================
//displays our homepage
app.get('/', function(req, res){
  res.render('home', {user: req.session.user});
});

//displays our signup page
app.get('/signin', function(req, res){
  res.render('signin');
});

//sends the request through our local signup strategy, and if successful takes user to homepage, otherwise returns then to signin page
app.post('/local-reg', function(req, res) {
    console.log('connecting to websocket');
    var WebSocketClient = require('websocket').client;
    var client = new WebSocketClient();
    client.on('connect', function(connection) {
      console.log('WebSocket client connected');
      connection.on('message', function(message) {
        console.log('Received message: ', message.utf8Data);
        messageJson = JSON.parse(message.utf8Data);
        const messageType = messageJson.message;
        if(messageType === 'enrolStatus') {
          console.log('received enrolStatus: ', messageJson.status);
          if(messageJson.status === 'ok') {
            res.render('signin', {message: "User enrolled successfully"})
          }
          else {
            res.render('signin', {message: "Failed to enrol user with Hyperledger Fabric network. Please ensure that the \
            username and password are valid on the LDAP server"})
          }
        } else {
          console.log('received unexpected message type: ', messageType);
        }
        // TODO: handle success/failure of registration here
      });

      console.log(req.body);
      const message = {messageType: 'register',
                      data: req.body};
      connection.send(JSON.stringify(message));
    });

    client.connect('ws://localhost:8081/', 'ws-protocol');
    
    //res.render('home');
  }
);

app.post('/upload-file', function(req, res) {
  console.log(req);
  // TODO: refactor WS section above so that we connect when the app is initialised and only do this once.
  //TODO: open the file, pass the content over the websocket, get the result.
  res.render('home');
});

//logs user out of site, deleting them from the session, and returns to homepage
app.get('/logout', function(req, res){
  var name = req.session.user.cn;
  console.log("LOGGING OUT " + req.session.user.cn)
  req.logout();
  req.session.user = null;
  res.redirect('/');
  req.session.notice = "You have successfully been logged out " + name + "!";
});

app.post('/login', function(req, res, next) {
  passport.authenticate('ldapauth', function (err, user, info){
    if(user){
      req.session.user = user;
      res.redirect('/');
    } else {
      res.redirect('/signin');
    }
  })(req, res, next);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
