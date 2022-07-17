import express from "express";
import { check, validationResult } from 'express-validator'
import { validationRules } from '../config/validations.js'
import https from "https";
import http from "http";
let router = express.Router();

/* GET home page. */
router.get('/', [
  check("filename").custom(function(value, obj) {
    return obj.req.res.redirect("/dir");
  }), function(req, res, next) {
    console.log(2);
    next();
  }, function(req, res, next) {
    console.log(3);
    console.log("ES Module 方式に移行");
    return true;
  }
]);

/**
 * 同一のパスへの処理をまとめる
 */
router.route("/dir")
  .get(function(req, res, next) {
    return res.render("./dir", {})
  })
  .post(...validationRules["register.directory"], function(req, res) {
    req.setDirectory({
      sourcePath: req.body.sourcePath,
      destinationPath: req.body.destinationPath,
    });
    return res.render("./dir_completed", {
      sourcePath: req.body.sourcePath,
      destinationPath: req.body.destinationPath,
    })
  });

/**
 * 負荷チェック
 */
router.get("/check.load", ...validationRules["check.load"], function(req, res, next) {
  try {
    // ここで指定回数分ループでGETリクエストを送信する
    let number = parseInt(req.query.number);
    console.log(req.query);
    console.log(number);
    let success = 0;
    for(let i = 0; i <= number; i++) {
      http.get("http://localhost:3000/image/list", function(response) {
        let data = "";
        response.on("data", function (chunk) {
          data += chunk;
        });
        response.on("end", function (chunk) {
          success++;
          console.log("GETリクエスト完了");
          console.log(data.length);
        });
      }).on("error", function(error) {
        console.log("Failed GET リクエスト失敗");
        console.log(error);
      })
    }
    console.log("実行成功数" + success +"回")
  } catch (error) {
    console.log("========");
    console.log(error);
  }
});

export default router;
