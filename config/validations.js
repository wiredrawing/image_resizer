import { check, validationResult } from 'express-validator'
import { setErrorsToSession} from './error_session.js';
// バリデーションルールの公開
let validationRules = {
  "show.image": [
    // fileName
    check("fileName").isLength({
      min: 2,
      max: 1024
    }).not().isEmpty(),
    // width
    check("width").isInt({
      min: 10,
      max: 10000,
    }).optional({
      nullable: true,
    }),
    // destination
    check("destinationPath").custom(function(value, obj) {
      let directories = obj.req.getDirectory();
      if ( directories.destinationPath === null || directories.sourcePath === null ) {
        return obj.req.req.redirect("/dir");
      }
      return true;
    }).optional({ nullable: true }),
  ],
  "register.directory": [
    check("sourcePath").not().isEmpty(),
    check("destinationPath").not().isEmpty(),
  ],
  "resize.image": [
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
  ],
  "check.load": [
    check("number").isInt({
      min: 100,
      max: 5000,
    }).not().isEmpty()
  ]
}

Object.keys(validationRules).forEach(function (routeName, index) {
  validationRules[routeName].push(setErrorsToSession);
});

export {
  validationRules
};
