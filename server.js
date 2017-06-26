var express = require('express');
var request = require('request');
var session = require("express-session");
var mongoose= require('mongoose');
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
    res.render('home', {movies: body.results, page: 'home'});
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
            res.render('home', {movies: movies, page: 'review'});
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