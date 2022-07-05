// https://localhost/image/~のルーティング処理
const express = require("express");
const app = express();
const indexRouter = require("./routes/image/index.js");
const path = require("path");
const fs = require("fs");
// 画像リサイズツールの事前処理
const originalFilePath = path.resolve(__dirname, "./original_path");
// リサイズ後のディレクト
const resizedFilePath = path.resolve(__dirname, "./resized_path");
if (fs.existsSync(originalFilePath) !== true) {
  fs.mkdir(originalFilePath, (error) => {
    if (error !== null) {
      console.log(error);
    }
  })
}
if (fs.existsSync(resizedFilePath) !== true) {
  fs.mkdir(resizedFilePath, (error) => {
    if (error !== null) {}
    console.log(error);
  })
}
app.use("/image", indexRouter);



module.exports = app;