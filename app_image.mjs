// https://localhost/image/~のルーティング処理

import express from 'express'
import indexRouter from "./routes/image/index.mjs";
import path from "path";
import fs from "fs"
const app = express();
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