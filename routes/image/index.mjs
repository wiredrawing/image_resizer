// const express = require("express");
// const router = express.Router();
// const glob = require("glob");
// const path = require("path")
// const sharp = require("sharp");
// const fs = require("fs");
// const {
//   check,
//   validationResult
// } = require("express-validator");

import express from "express";

const router = express.Router();
import glob from "glob";
import path from "path";
import sharp from "sharp";
import fs from "fs"
import { check, validationResult } from 'express-validator'
import { fileTypeFromBuffer } from 'file-type'

// 元ファイルの画像パス
const dirname = path.dirname(new URL(import.meta.url).pathname).replace("/C:", "")
const imageFilePath = path.resolve(dirname, "../../original_path");
// const imageFilePath = path.resolve(__dirname, "../../original_path");
// リサイズ後の画像パス
const resizedFilePath = path.resolve(dirname, "../../resized_path/");
// const resizedFilePath = path.resolve(__dirname, "../../resized_path/");

// アクセスの度に指定した画像サイズにリサイズさせる
router.get("/resize/:filename", [
  check("width").isInt({
    min: 10,
    max: 1000
  }).not().isEmpty(),
], function(req, res, next) {
  const errors = validationResult(req);
  if ( errors.isEmpty() !== true ) {
    console.log(errors.array());
    return res.send("error").end();
  }
  // リサイズサイズを取得
  let width = parseInt(req.query.width);
  let filename = req.params.filename;
  let targetFilePath = path.resolve(imageFilePath, filename);

  // 画像のりサイズ処理
  const resize = function() {
    return new Promise(function(resolve, reject) {
      sharp(targetFilePath).resize(width).toBuffer().then(function(data) {
        console.log(typeof data);
        resolve(data);
      }).catch(function(error) {
        reject(error);
      })
    })
  }
  /**
   * @returns {Promise<void>}
   */
  const init = async function() {
    try {
      let data = await resize();
      if ( data instanceof Buffer ) {
        // バッファ内容からファイルの拡張子を取得する
        let ext = await fileTypeFromBuffer(data);
        return {
          buffer: data,
          ext: ext,
        }
      } else {
        console.log("Data is not object made by Buffer");
        return null;
      }
    } catch ( error ) {
      console.log("Something error happened");
      return null;
    }
  }
  init().then(function(data) {
    console.log(data);
    res.setHeader("Content-Type", data["ext"].mime);
    return res.send(data["buffer"]).end();
  })
  // (async function () {
  //   let buf = await resize();
  // })();
  // sharp(targetFilePath).resize(width).toBuffer().then((data) => {
  //   console.log(data.constructor.name)
  //   fileTypeFromBuffer(data).then(function(ext) {
  //     res.setHeader("Content-Type", ext.mime);
  //     return res.send(data).end();
  //   })
  // })
})

/**
 * 指定したディレクトリ内に存在する画像ファイルすべてを指定の画像サイズに
 * リサイズして別名保存する
 */
router.get("/resize", [
    check("width").isInt({
      min: 10,
      max: 1000
    })
  ],
  function(req, res, next) {

    const errors = validationResult(req);
    if ( errors.isEmpty() !== true ) {
      // バリデーションエラーを配列で取得
      // console.log(errors.array());
      return res.send("error").end();
    }
    // リサイズ後のwidth
    let resizedWidth = req.query.width || "100";
    // console.log(resizedWidth);
    // 元ファイルの画像パス
    const imageFilePath = path.resolve(dirname, "../../original_path");
    // リサイズ後の画像パス
    const resizedFilePath = path.resolve(dirname, "../../resized_path/");

    const readFiles = function() {
      return new Promise(function(resolve, reject) {
        // console.log(imageFilePath);
        let options = {
          // スキャンする基準のディレクトリをcwdプロパティで指定
          cwd: imageFilePath,
          // フルパスで取得したい場合は trueに
          absolute: false,
        };
        glob("*.+(jpeg|jpg|png)", options, function(error, files) {
          if ( error !== null ) {
            reject(error);
            return false;
          }
          resolve(files);
          return true;
        });
      });
    }

    const resize = async function() {
      try {
        let files = await readFiles();
        let number = files.length;
        let completedNumber = 0;
        // 無名関数でawaitする
        return await (() => {
          return new Promise(function(resolve, reject) {
            files.forEach(function(file, index) {
              // オリジナルファイルのフルパス
              let fullPath = path.resolve(imageFilePath, file);
              // リサイズ後のファイル保存先
              let resizeFullPath = path.resolve(resizedFilePath, file);
              sharp(fullPath).resize(parseInt(resizedWidth, 10)).toFile(resizeFullPath).then(function(data) {
                completedNumber++;
                if ( completedNumber === number ) {
                  resolve(files);
                }
              }).catch(function(error) {
                // console.log(error);
              })
            })
          })
        })();
      } catch ( error ) {
        // console.log(error)
        return Promise.reject(error);
      }
    }
    return resize().then(function(data) {
      // console.log(data);
      res.write("completed");
      return res.end();
    }).catch(function(error) {
      // console.log(error);
    })
  })

/**
 * 指定したディレクトリの画像一覧を表示する
 */
router.get("/list", function(req, res, next) {

  try {
    const imageFilePath = path.resolve(dirname, "../../original_path");
    // リサイズ後の画像パス
    const resizedFilePath = path.resolve(dirname, "../../resized_path/");

    const checkDirectory = function() {
      return new Promise(function(resolve, reject) {
        glob("*.*", {
          cwd: imageFilePath,
        }, function(error, files) {
          if ( error !== null ) {
            console.log(error);
            return reject(error);
          }
          console.log(files);
          return resolve(files);
        })
      });
    }

    const init = async function() {
      let files = await checkDirectory()
      console.log(files);
      return files;
    }

    // async関数の実行
    return init().then(function(data) {
      return res.render("./image/list", {
        files: data,
      });
    });
  } catch ( e ) {
    console.log(e);
  }

})

/**
 * 指定したディレクトリの指定したファイルを表示させる
 */
router.get("/:fileName", [
  check("fileName").isLength({
    min: 2,
    max: 1024
  }).not().isEmpty(),
], function(req, res, next) {
  const errors = validationResult(req);
  if ( errors.isEmpty() !== true ) {
    // console.log(errors.array());
    return res.send("error").end();
  }
  const fileName = req.params.fileName
  const originalFilePath = path.resolve(dirname, "../../original_path");
  const specifiedFilePath = path.resolve(originalFilePath, fileName);
  // console.log(specifiedFilePath);
  const readFile = function() {
    return new Promise(function(resolve, reject) {
      fs.readFile(specifiedFilePath, function(error, image) {
        return resolve(image);
      })
    })
  }
  return readFile().then((data) => {
    // // console.log(data);
    res.setHeader("Content-Type", "image/jpeg");
    return res.send(data).end();
  }).catch((error) => {
    // console.log(error);
  });
});

// export default router;

export default router;
// module.exports = router