import express from "express";
import { check, validationResult } from 'express-validator'

let router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log("ES Module 方式に移行");
  return res.render('index', { title: 'Express' });
});

/**
 * 画像リサイズをおこなうファイルが含まれているディレクトリを指定
 */
router.get("/dir", function(req, res, next) {
  return res.render("./dir", {})
})

/**
 * 画像ディレクトリの確定処理をする
 */
router.post("/dir", [
  check("path").not().isEmpty(),
], function(req, res, next) {
  // ディレクトリを指定
  req.setDirectory(req.body.path);
  return res.redirect("/dir");
})
export default router;
