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
  ]
}

Object.keys(validationRules).forEach(function (routeName, index) {
  validationRules[routeName].push(setErrorsToSession);
});

export {
  validationRules
};
