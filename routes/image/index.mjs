import express from "express";
import glob from "glob";
import path from "path";
import sharp from "sharp";
import fs from "fs"
import { check, validationResult, matchedData } from 'express-validator'
import { fileTypeFromBuffer } from 'file-type'

const router = express.Router();

// ファイル自体の物理パス
const dirname = path.dirname(new URL(import.meta.url).pathname).replace("/C:", "")

// アクセスの度に指定した画像サイズにリサイズさせる
router.get("/resize/:filename", [
  check("width").isInt({
    min: 10,
    max: 10000
  }).not().isEmpty()
], function(req, res, next) {
  const errors = validationResult(req);
  if ( errors.isEmpty() !== true ) {
    return res.send("error").end();
  }
  let directories = req.getDirectory();
  // リサイズサイズを取得
  let width = parseInt(req.query.width);
  let filename = req.params.filename;
  let targetFilePath = path.resolve(directories.sourcePath, filename);

  // 画像のリサイズ処理
  const resize = function() {
    return new Promise(function(resolve, reject) {
      sharp(targetFilePath).resize(width).toBuffer().then(function(data) {
        resolve(data);
      }).catch(function(error) {
        reject(error);
      })
    })
  }
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
      }
      return null;
    } catch ( error ) {
      console.log(error, "Something error happened");
      return null;
    }
  }
  init().then(function(data) {
    console.log(data);
    res.setHeader("Content-Type", data["ext"].mime);
    return res.send(data["buffer"]).end();
  })
})

/**
 * 指定したディレクトリ内に存在する画像ファイルすべてを指定の画像サイズに
 * リサイズして別名保存する
 */
router.get("/resize", [
  check("width").isInt({
    min: 10,
    max: 10000
  }).custom((value, {
    req,
    location,
    path
  }) => {
    let directories = req.getDirectory();
    if ( directories.destinationPath === null ) {
      return Promise.reject("画像パスを正しく設定して下さい");
    }
    // customメソッドではかならずtrueを返却する必要がある
    return true
  }).custom((value, {
    req,
    location,
    path
  }) => {
    let directories = req.getDirectory();
    console.log(directories);
    if ( directories.sourcePath === null ) {
      return Promise.reject("画像パスを正しく設定して下さい");
    }
    // customメソッドではかならずtrueを返却する必要がある
    return true;
  }).not().isEmpty()
], function(req, res, next) {
  const errors = validationResult(req);
  if ( errors.isEmpty() !== true ) {
    console.log(errors.array());
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
router.get("/list", function(req, res, next) {
  try {
    console.log(":start");
    let directories = req.getDirectory();
    const imageFilePath = directories.sourcePath;
    const resizedFilePath = directories.destinationPath;

    const checkDirectory = function() {
      return new Promise(function(resolve, reject) {
        glob("*.+(jfif|jpeg|jpg|png)", {
          // globを動作させるための基準のディレクトリ
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
 * 指定したオリジナル画像を表示する
 */
router.get("/:fileName", [
  check("fileName").isLength({
    min: 2,
    max: 1024
  }).not().isEmpty(),
  check("width").isInt({
    min: 10,
    max: 10000,
  }).optional({
    nullable: true,
  })
], function(req, res, next) {
  try {
    const requiredData = matchedData(req, {includeOptionals: false});
    console.log(requiredData);
    const errors = validationResult(req);
    if ( errors.isEmpty() !== true ) {
      console.log(errors.array());
      return res.send("error").end();
    }
    let width = req.query.width || 0;
    if (width !== 0 ) {
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
            console.log(data);
            return resolve(data);
          }).catch(function(error) {
            console.log(error);
            return reject(error);
          });
        } else {
          fs.readFile(imageFilePath, function(error, image) {
            if ( error !== null ) {
              console.log(error);
              return reject(error)
            }
            return resolve(image);
          })
        }
      })
    }
    return readFile().then((data) => {
      res.setHeader("Content-Type", "image/jpeg");
      return res.send(data).end();
    }).catch((error) => {
      console.log(error);
      return res.send("error").end();
    });
  } catch ( error ) {
    console.log(error);
  }
});

export default router;
