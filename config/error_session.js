import {check, validationResult} from 'express-validator'

/**
 * Store error messages with session to output.
 *
 * @param req
 * @param res
 * @param next
 */
export function setErrorsToSession(req, res, next) {
  let errors = validationResult(req);
  let session = req.session;
  if (errors.isEmpty() !== true) {
    session.validationErrors = errors.array();
    return res.redirect("/");
  }
  return next();
}