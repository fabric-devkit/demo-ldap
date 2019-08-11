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
    bindDN: 'cn=admin,dc=example,dc=com',
    bindCredentials: 'adminpw',
    searchBase: 'dc=example,dc=com',
    searchFilter: '(cn={{username}})'
  }
};

var app = express();

passport.use(new LdapStrategy(OPTS));

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
app.get('/', async function(req, res){
  
  let username = undefined;
  let userEnrolled = false;
  let userChaincodeState = undefined;
  if(req.session.user) {
    username = req.session.user.cn;
    
    var fabricClient = require('./FabricClient');
    await fabricClient.initCredentialStores();
    await fabricClient.getCertificateAuthority();
    let user = await fabricClient.getUserContext(username, true);
    if(user) {
      userEnrolled = true;
      
      // query the chaincode with this user
      const fcn = "query";
      const args = [username];
      const queryChaincode = require('./invoke.js').queryChaincode;
      const chaincodeContent = await queryChaincode(fabricClient, fcn, args);

      console.log("Setting userChaincodeState to ", chaincodeContent.payload.responses[0]);
      userChaincodeState = chaincodeContent.payload.responses[0];
    }
  }
  res.render('home', {user: username, userEnrolled: userEnrolled, userChaincodeState: userChaincodeState});

});

//displays our signup page
app.get('/signin', function(req, res){
  res.render('signin');
});

//sends the request through our local signup strategy, and if successful takes user to homepage, otherwise returns then to signin page
app.post('/local-reg', async function(req, res) {
    const username = req.body.username;
    const password = req.body.password;
    const enrolUser = require('./enrolUser').enrolUser;
    const result = await enrolUser(username, password);
    if(result === 'ok') {
      res.render('signin', {message: "User enrolled successfully"})
    }
    else {
      res.render('signin', {message: "Failed to enrol user with Hyperledger Fabric network. The \
      username and password may not be valid on the LDAP server, or the user may already be installed."})
    }
  }
);

//logs user out of site, deleting them from the session, and returns to homepage
app.get('/logout', function(req, res){
  var name = req.session.user.cn;
  console.log("LOGGING OUT " + req.session.user.cn)
  req.logout();
  req.session.user = null;
  res.redirect('/');
  req.session.notice = "You have successfully been logged out " + name + "!";
});

app.post('/login', async function(req, res, next) {
  passport.authenticate('ldapauth', async function (err, user, info){
    if(user){
      console.log("successfully authenticated user:", user);
      req.session.secret = req.body.password;
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
