import express from "express";
import glob from "glob";
import path from "path";
import sharp from "sharp";
import fs from "fs"
import { check, validationResult, matchedData } from 'express-validator'
import { fileTypeFromBuffer } from 'file-type'
import { validationRules } from '../../config/validations.js'
const router = express.Router();

// ファイル自体の物理パス
const dirname = path.dirname(new URL(import.meta.url).pathname).replace("/C:", "")

/**
 * 指定したディレクトリ内に存在する画像ファイルすべてを指定の画像サイズに
 * リサイズして別名保存する
 */
router.get("/resize", [
  check("width").isInt({
    min: 10,
    max: 10000
  }).custom((value, { req, location, path }) => {
    let directories = req.getDirectory();
    if ( directories.destinationPath === null  || directories.sourcePath === null) {
      return Promise.reject("画像パスを正しく設定して下さい");
    }
    // customメソッドではかならずtrueを返却する必要がある
    return true
  }).not().isEmpty(),
], function(req, res, next) {
  const errors = validationResult(req);
  if ( errors.isEmpty() !== true ) {
    return res.send("error").end();
  }
  // リサイズ後のwidth
  let resizedWidth = req.query.width || "100";

  let setPath = req.getDirectory();
  // ------------------------------------------------------------------
  // 元ファイルの画像パス
  // ------------------------------------------------------------------
  let imageFilePath = null;
  if ( setPath.sourcePath === null ) {
    imageFilePath = path.resolve(dirname, "../../original_path");
  } else {
    imageFilePath = setPath.sourcePath;
  }
  // ------------------------------------------------------------------
  // リサイズ後の画像パス
  // ------------------------------------------------------------------
  let resizedFilePath = null;
  if ( setPath.destinationPath === null ) {
    resizedFilePath = path.resolve(dirname, "../../resized_path/");
  } else {
    resizedFilePath = setPath.destinationPath;
  }
  const readFiles = function() {
    return new Promise(function(resolve, reject) {
      let options = {
        // スキャンする基準のディレクトリをcwdプロパティで指定
        cwd: imageFilePath,
        // フルパスで取得したい場合は trueに
        absolute: false,
      };
      glob("*.+(jfif|jpeg|jpg|png)", options, function(error, files) {
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
      // リサイズ元の画像一覧
      let files = await readFiles();
      let number = files.length;
      let completedNumber = 0;
      // 変換完了後の画像リスト
      let filesCompletedConverting = [];
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
              filesCompletedConverting.push({
                before: fullPath,
                after: resizeFullPath,
              })
              if ( completedNumber === number ) {
                resolve(filesCompletedConverting);
              }
            }).catch(function(error) {
              console.log(error);
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
    return res.render("./image/completed", {
      data: data,
    });
  }).catch(function(error) {
    console.log(error);
    return res.send("Happened some problems.");
  })
})

/**
 * 指定したディレクトリの画像一覧を表示する
 */
router.get("/list", [
  check("destinationPath").custom((value, {req, location, res}) => {
    let directories = req.getDirectory();
    if (directories.destinationPath === null || directories.sourcePath === null) {
      return req.res.redirect("/dir");
    }
    return true;
  })
], function(req, res, next) {
  try {
    let directories = req.getDirectory();
    const imageFilePath = directories.sourcePath;

    const checkDirectory = function() {
      return new Promise(function(resolve, reject) {
        glob("*.+(jfif|jpeg|jpg|png)", {
          // globを動作させるための基準のディレクトリ
          cwd: imageFilePath,
        }, function(error, files) {
          if ( error !== null ) {
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
 * 指定したオリジナル画像を表示する
 */
router.get("/:fileName", ...[
  (req, res, next) => {
    // console.log(req.params);
    // console.log(req.params.fileName);
    console.log("1つ目のmiddleware");
    next();
  }, (req, res, next) => {
    // console.log(req.params);
    // console.log(req.params.fileName);
    console.log("2つ目のmiddleware");
    next();
  }
], ...validationRules['show.image'], function(req, res, next) {
  try {
    const requiredData = matchedData(req, { includeOptionals: false });
    console.log(requiredData);
    const errors = validationResult(req);
    if ( errors.isEmpty() !== true ) {
      console.log(errors.array());
      return res.send("error").end();
    }
    let width = req.query.width || 0;
    if ( width !== 0 ) {
      width = parseInt(width);
    }
    console.log(width);

    const directories = req.getDirectory();
    const fileName = req.params["fileName"];
    // リサイズ元
    const imageFilePath = path.resolve(directories.sourcePath, fileName);

    const readFile = function() {
      return new Promise(function(resolve, reject) {
        if ( width > 0 ) {
          sharp(imageFilePath).resize(width).toBuffer().then(function(data) {
            fileTypeFromBuffer(data).then(function(extension) {
              return resolve({
                extension: extension,
                buffer: data,
              })
            });
          }).catch(function(error) {
            return reject(error);
          });
        } else {
          fs.readFile(imageFilePath, function(error, data) {
            if ( error !== null ) {
              return reject(error)
            }
            fileTypeFromBuffer(data).then(function(extension) {
              return resolve({
                extension: extension,
                buffer: data,
              })
            })
          })
        }
      })
    }
    return readFile().then((data) => {
      res.setHeader("Content-Type", data.extension.mime);
      return res.send(data.buffer).end();
    }).catch((error) => {
      console.log(error);
      return res.send("error").end();
    });
  } catch ( error ) {
    console.log(error);
  }
});

export default router;
