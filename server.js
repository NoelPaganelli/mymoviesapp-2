var express   = require('express');
var request   = require('request');
var session   = require("express-session");
var mongoose  = require('mongoose');
var Mailchimp = require('mailchimp-api-v3')
var mailchimp = new Mailchimp('720a3dbe2a0d3d7e9c4a0accd2593887-us14');
var Trello    = require("node-trello");
var t         = new Trello("568526dad1bd8f7874fadea91a432cdd", "9c9e7a6ae080cbae8e968160491ddbd78a8c56d30be1e4ea7f954ad53f0e98be");

mongoose.connect('mongodb://noel:toto75@ds129342.mlab.com:29342/moviesapp' , function(err) {
  
});
var movieSchema = mongoose.Schema({
    title: String,
    overview: String,
    poster_path: String,
    user_id: String
});
var MovieModel = mongoose.model('movie', movieSchema);

var userSchema = mongoose.Schema({
    email: String,
    password: String
});
var UserModel = mongoose.model('user', userSchema);


var app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(
 session({ 
  secret: 'a4f8071f-c873-4447-8ee2',
  resave: false,
  saveUninitialized: false,
 })
);

app.get('/', function (req, res) {

  request("https://api.themoviedb.org/3/discover/movie?api_key=1ca44169216245030924859d77648835&language=fr-FR&sort_by=popularity.desc&include_adult=false&include_video=false&page=1", function(error, response, body) {
    body = JSON.parse(body);
 
    MovieModel.find( { user_id: req.session.user_id} , function (err, moviesLike) {
      res.render('home', {movies: body.results, mymovies: moviesLike,  page: 'home'});
    })
   
  });
});

app.get('/review', function (req, res) {
  if(req.session.isLog  != true) {
    res.redirect('/login');
  } 
  
  if(req.session.isLog  == true) {
    if(req.query.id != undefined) {
      request("https://api.themoviedb.org/3/movie/"+req.query.id+"?api_key=1ca44169216245030924859d77648835&language=fr-FR", function(error, response, body) {
        body = JSON.parse(body);
        
        var movie = new MovieModel ({
          title: body.title,
          overview: body.overview,
          poster_path: body.poster_path,
          user_id : req.session.user_id
        });
        movie.save(function (error, movie) {
          MovieModel.find( { user_id: req.session.user_id} , function (err, movies) {
            res.render('home', {movies: movies, mymovies: [],  page: 'review'});
          }) 
        });
      });
    } else {
      MovieModel.find({ user_id: req.session.user_id}, function (err, movies) {
        res.render('home', {movies: movies, page: 'review'});
      });
    }
  }
});
app.get('/contact', function (req, res) {
  res.render('contact');
});

app.get('/contact-save', function (req, res) {

  mailchimp.post('/lists/70545c35c6/members', 
  {
    email_address : req.query.email,
    status: 'subscribed',
    merge_fields: {
      FNAME: req.query.firstName,
      LNAME: req.query.lastName
    }
  })
  
  t.post("/1/cards", 
  { 
   idList : "5952666113615c1425206f66",
   name : req.query.firstName+' '+req.query.lastName+' '+req.query.email
  }, function(err, data) {
    console.log(err);
  });
 

  res.redirect('/');
});



app.get('/login', function (req, res) {
  
  if(req.query.email != undefined && req.query.password != undefined) {
    UserModel.findOne( { email: req.query.email, password: req.query.password} , function (err, user) {
      if(user != null) {
        req.session.isLog    = true;
        req.session.email    = req.query.email;
        req.session.password = req.query.password;
        req.session.user_id   = user.id;
        res.redirect('/');
      } else {
        res.render('login', {action : 'login', error: 'email ou mot de passe invalide'});
      }
    })
  } else {
    res.render('login', {action : 'login', error: null});
  }
 
});

app.get('/signup', function (req, res) {
   if(req.query.email != undefined && req.query.password != undefined) {
     var user = new UserModel ({
        email: req.query.email,
        password: req.query.password 
      });
      user.save(function (error, user) {
        req.session.isLog    = true;
        req.session.email    = req.query.email;
        req.session.password = req.query.password;
        req.session.userId   = user.id;
        res.redirect('/');
      });
   } else {
     res.render('login', {action : 'signup', error: null});
   }
  
  
});


app.listen(80, function () {
  console.log("Server listening on port 80");
});