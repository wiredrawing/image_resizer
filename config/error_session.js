import { check, validationResult } from 'express-validator'

/**
 * Store error messages with session to output.
 *
 * @param req
 * @param res
 * @param next
 */
export function setErrorsToSession(req, res, next) {
  try {
    let errors = validationResult(req);
    let session = req.session;
    if ( errors.isEmpty() !== true ) {
      console.log("Happened validation errors!!!");
      console.log(errors.array());
      session.validationErrors = errors.array();
      res.redirect("/");
      return res.end();
    }
    return next();
  } catch ( exception ) {
    console.log(exception);
  }
}