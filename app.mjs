// var createError = require('http-errors');
// var express = require('express');
// var path = require('path');
// var cookieParser = require('cookie-parser');
// var logger = require('morgan');
//
// var indexRouter = require('./routes/index.cjs');
// var usersRouter = require('./routes/users.cjs');
//
// let appImage = require("./app_image.mjs");
import createError from "http-errors";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";

import indexRouter from "./routes/index.cjs";
import usersRouter from "./routes/users.cjs";

import appImage from "./app_image.mjs";
var app = express();

// view engine setup
const dirname = path.dirname(new URL(import.meta.url).pathname).replace("/C:", "")
app.set('views', path.join(dirname, 'views'));
// app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// ----------------------------------------------------
// expressアプリケーションを追加でルーティング追加
// ----------------------------------------------------
app.use(appImage);

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

export  default  app;
// module.exports = app;
