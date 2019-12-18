const Genre = require("../models/genre");
var Book = require("../models/book");
var async = require("async");
const { body, validationResult } = require("express-validator/check");
const { sanitizeBody } = require("express-validator/filter");

//显示完整的Genre列表
exports.genre_list = (req, res) => {
  Genre.find()
    .sort([["name", "ascending"]])
    .exec(function(err, list_genres) {
      if (err) {
        return next(err);
      }
      res.render("genre_list", {
        title: "Genre List",
        genre_list: list_genres
      });
    });
};

// 为每位Genre显示详细信息的页面
// Display detail page for a specific Genre.
exports.genre_detail = function(req, res, next) {
  async.parallel(
    {
      genre: function(callback) {
        Genre.findById(req.params.id).exec(callback);
      },

      genre_books: function(callback) {
        Book.find({ genre: req.params.id }).exec(callback);
      }
    },
    function(err, results) {
      if (err) {
        return next(err);
      }
      if (results.genre == null) {
        // No results.
        var err = new Error("Genre not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render
      res.render("genre_detail", {
        title: "Genre Detail",
        genre: results.genre,
        genre_books: results.genre_books
      });
    }
  );
};

// 由 GET 显示创建Genre的表单
exports.genre_create_get = (req, res) => {
  res.render("genre_form", { title: "Create Genre" });
};

// 由 POST 处理Genre创建操作
// 不是一个中间件函数,而是指定一组中间件函数
// 数组传递给路由器函数,并
exports.genre_create_post = [
  //Validate that the name field is not empty.
  body("name", "Genre name required")
    .isLength({ min: 1 })
    .trim(),

  //Sanitize(trim and escape) the name field.
  sanitizeBody("name")
    .trim()
    .escape(),

  //Process request after validation and sanitization.
  (req, res, next) => {
    //Extract the validation errors from a request.
    const errors = validationResult(req);

    //Create a genre object with escaped and trimmed data.
    var genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render("genre_form", {
        title: "Create Genre",
        genre: genre,
        errors: errors.array()
      });
      return;
    } else {
      //Data from form is valid.
      //Check if Genre with same name already exists.
      Genre.findOne({ name: req.body.name }).exec(function(err, found_genre) {
        if (err) {
          return next(err);
        }
        if (found_genre) {
          //Genre exists, redirect
          res.redirect(found_genre.url);
        } else {
          //保存
          genre.save(function(err) {
            if (err) {
              return next(err);
            }
            //Genre saved. Redirect to genre detail page.
            res.redirect(genre.url);
          });
        }
      });
    }
  }
];

// 由 GET 显示删除Genre的表单
exports.genre_delete_get = (req, res) => {
  async.parallel(
    {
      genre: function(callback) {
        Genre.findById(req.params.id).exec(callback);
      },
      genre_books: function(callback) {
        Book.find({ genre: req.params.id }).exec(callback);
      }
    },
    function(err, results) {
      if (err) {
        return next(err);
      }
      if (results.genre == null) {
        //No results.
        res.redirect("/catalog/genres");
      }
      //Successful,so render.
      res.render("genre_delete", {
        title: "Delete Genre",
        genre: results.genre,
        genre_books: results.genre_books
      });
    }
  );
};

// 由 POST 处理Genre删除操作
exports.genre_delete_post = (req, res) => {
  //和其他一样
  async.parallel(
    {
      genre: function(callback) {
        Genre.findById(req.params.id).exec(callback);
      },
      genre_books: function(callback) {
        Book.find({ genre: req.params.id }).exec(callback);
      }
    },
    function(err, results) {
      if (err) {
        return next(err);
      }
      // Success
      if (results.genre_books.length > 0) {
        // Genre has books. Render in same way as for GET route.
        res.render("genre_delete", {
          title: "Delete Genre",
          genre: results.genre,
          genre_books: results.genre_books
        });
        return;
      } else {
        // Genre has no books. Delete object and redirect to the list of genres.
        Genre.findByIdAndRemove(req.body.id, function deleteGenre(err) {
          if (err) {
            return next(err);
          }
          // Success - go to genres list.
          res.redirect("/catalog/genres");
        });
      }
    }
  );
};

// 由 GET 显示更新Genre的表单
exports.genre_update_get = (req, res, next) => {
  Genre.findById(req.params.id, function(err, genre) {
    if (err) {
      return next(err);
    }
    if (genre == null) {
      //No results
      var err = new Error("No genre found");
      err.status = 404;
      return next(err);
    }
    //Successful.
    res.render("genre_form", { title: "Update Genre", genre: genre });
  });
};

// 由 POST 处理Genre更新操作
exports.genre_update_post = [
  //Validate that the name field is not empty.
  body("name", "Genre name required")
    .isLength({ min: 1 })
    .trim(),
  //Sanitize(trim and escape) the name field.
  sanitizeBody("name")
    .trim()
    .escape(),
  (req, res, next) => {
    //Extract the validation errors from a request.
    const errors = validationResult(req);
    //Create a genre object with escaped and trimmed data.
    var genre = new Genre({ name: req.body.name,_id:req.params.id });
    
    if(!errors.isEmpty()){
      //There are errors.
      res.render("genre_form", {
        title: "Create Genre",
        genre: genre,
        errors: errors.array()
      });
      return;
    }
    //Successful.
    Genre.findByIdAndUpdate(req.params.id,genre,{},function(err,thegenre){
      if(err){
        return next(err);
      }
      //Successful, redirect.
      res.redirect(thegenre.url)
    })
  }
];
