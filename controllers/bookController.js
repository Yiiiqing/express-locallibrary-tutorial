var Book = require("../models/book");
var Author = require("../models/author");
var Genre = require("../models/genre");
var BookInstance = require("../models/bookinstance");
const { body, validationResult } = require("express-validator/check");
const { sanitizeBody } = require("express-validator/filter");
var async = require("async");

//首页
exports.index = (req, res) => {
  async.parallel(
    {
      book_count: function(callback) {
        Book.count({}, callback);
      },
      book_instance_count: function(callback) {
        BookInstance.count({}, callback);
      },
      book_instance_available_count: function(callback) {
        BookInstance.count({ status: "可供借阅" }, callback);
      },
      author_count: function(callback) {
        Author.count({}, callback);
      },
      genre_count: function(callback) {
        Genre.count({}, callback);
      }
    },
    function(err, results) {
      res.render("index", {
        title: "Local Library Home",
        error: err,
        data: results
      });
    }
  );
};

//显示完整的Book列表
exports.book_list = (req, res) => {
  Book.find({}, "title author")
    .populate("author") //将 id 替换为实际数据
    .exec(function(err, list_books) {
      if (err) {
        return next(err);
      }
      //Successful, so render
      res.render("book_list", { title: "Book List", book_list: list_books });
    });
};

// 为每个Book显示详细信息的页面
exports.book_detail = function(req, res, next) {
  async.parallel(
    {
      book: function(callback) {
        /**
          很重要!
          将id替换!
        */
        Book.findById(req.params.id)
          .populate("author")
          .populate("genre")
          .exec(callback);
      },
      book_instance: function(callback) {
        BookInstance.find({ book: req.params.id }).exec(callback);
      }
    },
    function(err, results) {
      if (err) {
        return next(err);
      }
      if (results.book == null) {
        // No results.
        var err = new Error("Book not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render.
      res.render("book_detail", {
        title: "Book Detail",
        book: results.book,
        book_instances: results.book_instance
      });
    }
  );
};

// 由 GET 显示创建Book的表单
exports.book_create_get = (req, res) => {
  // Get all authors and genres, which we can use for adding to our book.
  async.parallel(
    {
      authors: function(callback) {
        Author.find(callback);
      },
      genres: function(callback) {
        Genre.find(callback);
      }
    },
    function(err, results) {
      if (err) {
        return next(err);
      }
      res.render("book_form", {
        title: "Create Book",
        authors: results.authors,
        genres: results.genres
      });
    }
  );
};

// 由 POST 处理Book创建操作
// Handle book create on POST.
exports.book_create_post = [
  // Convert the genre to an array.
  (req, res, next) => {
    if (!(req.body.genre instanceof Array)) {
      if (typeof req.body.genre === "undefined") req.body.genre = [];
      else req.body.genre = new Array(req.body.genre);
    }
    next();
  },

  // Validate fields.
  body("title", "Title must not be empty.")
    .isLength({ min: 1 })
    .trim(),
  body("author", "Author must not be empty.")
    .isLength({ min: 1 })
    .trim(),
  body("summary", "Summary must not be empty.")
    .isLength({ min: 1 })
    .trim(),
  body("isbn", "ISBN must not be empty")
    .isLength({ min: 1 })
    .trim(),

  // Sanitize fields.
  // sanitizeBody('*').escape(),//如果用这一行,中文也将抹去!切记!!!
  sanitizeBody("genre.*").escape(),
  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a Book object with escaped and trimmed data.

    //最终没有找到方法解决数组内空字符串问题,放弃转换为直接不传genre
    if (req.body.genre.length > 0) {
      var book = new Book({
        title: req.body.title,
        author: req.body.author,
        summary: req.body.summary,
        isbn: req.body.isbn,
        genre: req.body.genre
      });
    } else {
      var book = new Book({
        title: req.body.title,
        author: req.body.author,
        summary: req.body.summary,
        isbn: req.body.isbn
      });
    }
    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      // Get all authors and genres for form.
      async.parallel(
        {
          authors: function(callback) {
            Author.find(callback);
          },
          genres: function(callback) {
            Genre.find(callback);
          }
        },
        function(err, results) {
          if (err) {
            return next(err);
          }

          // Mark our selected genres as checked.
          for (let i = 0; i < results.genres.length; i++) {
            if (book.genre.indexOf(results.genres[i]._id) > -1) {
              results.genres[i].checked = "true";
            }
          }
          res.render("book_form", {
            title: "Create Book",
            authors: results.authors,
            genres: results.genres,
            book: book,
            errors: errors.array()
          });
        }
      );
      return;
    } else {
      // Data from form is valid. Save book.
      book.save(function(err) {
        if (err) {
          return next(err);
        }
        // Successful - redirect to new book record.
        res.redirect(book.url);
      });
    }
  }
];
// 由 GET 显示删除Book的表单
exports.book_delete_get = (req, res) => {
  async.parallel(
    {
      book: function(callback) {
        Book.findById(req.params.id)
          .populate("author")
          .populate("genre")
          .exec(callback);
      },
      book_instances: function(callback) {
        BookInstance.find({ book: req.params.id }).exec(callback);
      }
    },
    function(err, results) {
      if (err) {
        return next(err);
      }
      if (results.book == null) {
        //No results.
        res.redirect("/catalog/books");
      }
      //Successful, so render.
      res.render("book_delete", {
        title: "Delete Book",
        book: results.book,
        book_instances: results.book_instances
      });
    }
  );
};

// 由 POST 处理Book删除操作
exports.book_delete_post = (req, res) => {
  async.parallel(
    {
      book: function(callback) {
        //验证是否提供id
        Book.findById(req.body.bookid).exec(callback);
      },
      book_instances: function(callback) {
        BookInstance.find({ book: req.body.bookid }).exec(callback);
      }
    },
    function(err, results) {
      if (err) {
        return next(err);
      }
      //Success
      if (results.book_instances.length > 0) {
        //book has copies
        res.render("book_delete", {
          title: "Delete Book",
          book: results.book,
          book_instances: results.book_instances
        });
        return;
      } else {
        //book has no copies. Delete
        Book.findByIdAndRemove(req.body.bookid, function deleteBook(err) {
          if (err) {
            return next(err);
          }
          //Success - go to book list
          res.redirect("/catalog/books");
        });
      }
    }
  );
};

// 由 GET 显示更新Book的表单
exports.book_update_get = (req, res, next) => {
  //Get book, authors, and genres from form.
  async.parallel(
    {
      book: function(callback) {
        Book.findById(req.params.id)
          .populate("author")
          .populate("genre")
          .exec(callback);
      },
      //先找到所有的作者和种类,然后勾选.作者的勾选在pug中完成.
      authors: function(callback) {
        Author.find(callback);
      },
      genres: function(callback) {
        Genre.find(callback);
      }
    },
    function(err, results) {
      if (err) {
        return next(err);
      }
      if (results.book == null) {
        //No results.
        var err = new Error("Book not found.");
        err.status = 404;
        return next(err);
      }
      //Success.
      //Mark our selected genres as checked.
      //循环标记图书的种类
      for (
        var all_g_iter = 0;
        all_g_iter < results.genres.length;
        all_g_iter++
      ) {
        //目标书本
        for (
          var book_g_iter = 0;
          book_g_iter < results.book.genre.length;
          book_g_iter++
        ) {
          if (
            results.genres[all_g_iter]._id.toString() ==
            results.book.genre[book_g_iter]._id.toString()
          ) {
            results.genres[all_g_iter].checked = "true";
          }
        }
      }
      res.render("book_form", {
        title: "Update Book",
        authors: results.authors,
        genres: results.genres,
        book: results.book
      });
    }
  );
};

// 由 POST 处理Book更新操作
/**
 * 这很像是创建一本书的时候，所使用的 post 路由。
 * 首先，我们验证来自表单的书本数据，并进行无害化处理，
 * 并使用它创建一个新的书本 Book 对象 (将它的 _id 值，设置给将要更新的对象的 id)。
 * 当我们验证资料，然后重新呈现表单的时候，
 * 如果存在错误，再附加显示使用者输入的资料、错误信息、以及种类和作者列表。
 * 当我们调用Book.findByIdAndUpdate() 去更新 Book ，
 * 如果没有错误，就重新导向到它的细节页面。
 */
exports.book_update_post = [
  // Convert the genre to an array.
  (req, res, next) => {
    //genre is not an array
    if (!(req.body.genre instanceof Array)) {
      if (typeof req.body.genre === "undefined") req.body.genre = [];
      else req.body.genre = new Array(req.body.genre);
    }
    next();
  },

  //Validate fields.
  body("title", "Title must not be empty.")
    .isLength({ min: 1 })
    .trim(),
  body("author", "Author must not be empty.")
    .isLength({ min: 1 })
    .trim(),
  body("summary", "Summary must not be empty.")
    .isLength({ min: 1 })
    .trim(),
  body("isbn", "ISBN must not be empty.")
    .isLength({ min: 1 })
    .trim(),

  //Sanitize fields.
  sanitizeBody("title")
    .trim()
    .escape(),
  sanitizeBody("author")
    .trim()
    .escape(),
  sanitizeBody("summary")
    .trim()
    .escape(),
  sanitizeBody("isbn")
    .trim()
    .escape(),
  sanitizeBody("genre.*")
    .trim()
    .escape(),

  //Process request after validation and sanitization.
  (req, res, next) => {
    //Extract the validation errors from a request.
    const errors = validationResult(req);

    //Create a Book object with escaped/trimmed data and old id.
    var book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: typeof req.body.genre === "undefined" ? [] : req.body.genre,
      _id: req.params.id //This is required, or a new ID will be assigned!
    });

    if (!errors.isEmpty()) {
      //There are errors.Render form again with sanitized values/error messages.

      //Get all authors and genres from form.
      async.parallel(
        {
          authors: function(callback) {
            Author.find(callback);
          },
          genres: function(callback) {
            Genre.find(callback);
          }
        },
        function(err, results) {
          if (err) {
            return next(err);
          }
          //Mark our selected genres as checked.
          //Array book.genre的 indexOf方法.
          for (let i = 0; i < results.genres.length; i++) {
            if (book.genre.indexOf(results.genres[i]._id) > -1) {
              results.genres[i].checked = "true";
            }
          }
          res.render("book_form", {
            title: "Update Book",
            authors: results.authors,
            genres: results.genres,
            book: book,
            errors: errors.array()
          });
        }
      );
      return;
    } else {
      //Data from form is valid. Update the record.
      Book.findByIdAndUpdate(req.params.id, book, {}, function(err, thebook) {
        if (err) {
          return next(err);
        }
        //Successful - redirect to book detail page.
        res.redirect(thebook.url);
      });
    }
  }
];
