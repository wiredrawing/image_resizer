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
router.post("/dir", [
  check("sourcePath").not().isEmpty(),
  check("destinationPath").not().isEmpty(),
], function(req, res, next) {

  const errors = validationResult(req);
  if (errors.isEmpty() !== true) {
    console.log("// ---------------------------------------- //");
    return res.send("error").end();
  }
  req.setDirectory({
    sourcePath: req.body.sourcePath,
    destinationPath: req.body.destinationPath,
  });
  return res.render("./dir_completed", {
    sourcePath: req.body.sourcePath,
    destinationPath: req.body.destinationPath,
  })
})


export default router;
