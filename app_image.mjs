// https://localhost/image/~のルーティング処理
// const express = require("express");
// const app = express();
// const indexRouter = require("./routes/image/index.mjs");
// const path = require("path");
// const fs = require("fs");


import express from 'express'
const app = express();
import indexRouter from "./routes/image/index.mjs";
import path from "path";
import fs from "fs"
const dirname = path.dirname(new URL(import.meta.url).pathname).replace("/C:", "")
// 画像リサイズツールの事前処理
const originalFilePath = path.resolve(dirname, "./original_path");
// const originalFilePath = path.resolve(__dirname, "./original_path");
// リサイズ後のディレクト
const resizedFilePath = path.resolve(dirname, "./resized_path");
// const resizedFilePath = path.resolve(__dirname, "./resized_path");
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



export default app;
// module.exports = app;