var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var catalogRouter = require('./routes/catalog');//Our route for the project.
var compression = require('compression');//压缩发送回客户端的 HTTP 响应，从而显着减少客户端获取和加载页面所需的时间
var helmet = require('helmet');//通过设置适当的 HTTP 标头，来帮助保护您的应用，免受一些众所周知的 Web 漏洞的影响

var app = express();

//设置mongoose连接
const mongoose = require('mongoose');
const mongoDB = process.env.MONGODB_URI || 'mongodb+srv://yiqing:zyq19950727@local-library-693ur.mongodb.net/test?retryWrites=true&w=majority';
mongoose.connect(mongoDB,{ useNewUrlParser: true, useUnifiedTopology:true});
mongoose.Promise = global.Promise;
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB 连接错误：'));

// view engine setup
//__dirname总是指向被指向js文件的绝对路径
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

//将中间件库添加进请求处理链
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(compression());//Compress all routes
app.use(helmet());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/catalog', catalogRouter);
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
