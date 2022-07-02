const express = require("express");
const router = express.Router();
const glob = require("glob");
const path = require("path")
const sharp = require("sharp");
const fs = require("fs");
const {
  check,
  validationResult
} = require("express-validator");
const { inArray } = require('sharp/lib/is')

/**
 * 指定したディレクトリの指定したファイルを表示させる
 */
router.get("/:fileName", [
  check("fileName").isLength({min:2, max: 1024}).not().isEmpty(),
], function(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty() !== true) {
    console.log(errors.array());
    return res.send("error").end();
  }
  const fileName = req.params.fileName
  const originalFilePath = path.resolve(__dirname, "../../original_path");
  const specifiedFilePath = path.resolve(originalFilePath, fileName);
  console.log(specifiedFilePath);
  const readFile = function() {
    return new Promise(function(resolve, reject) {
      fs.readFile(specifiedFilePath, function (error, image) {
        return resolve(image);
      })
    })
  }
  return readFile().then((data) => {
    // console.log(data);
    res.setHeader("Content-Type", "image/jpeg");
    return res.send(data).end();
  }).catch((error) => {
    console.log(error);
  });
});
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
      console.log(errors.array());
      return res.send("error").end();
    }
    // リサイズ後のwidth
    let resizedWidth = req.query.width || "100";
    console.log(resizedWidth);
    // 元ファイルの画像パス
    const imageFilePath = path.resolve(__dirname, "../../original_path");
    // リサイズ後の画像パス
    const resizedFilePath = path.resolve(__dirname, "../../resized_path/");

    const readFiles = function() {
      return new Promise(function(resolve, reject) {
        console.log(imageFilePath);
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
                console.log(error);
              })
            })
          })
        })();
      } catch ( error ) {
        console.log(error)
        return Promise.reject(error);
      }
    }
    return resize().then(function(data) {
      console.log(data);
      res.write("completed");
      return res.end();
    }).catch(function(error) {
      console.log(error);
    })
  })

module.exports = router