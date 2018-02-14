/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Implementation of the 'validate' verb for HackMyResume.
@module verbs/validate
@license MIT. See LICENSE.md for details.
*/



const Verb = require('../verbs/verb');
const HMSTATUS = require('../core/status-codes');
const HMEVENT = require('../core/event-codes');
const _ = require('underscore');
const safeLoadJSON = require('../utils/safe-json-loader');



/** An invokable resume validation command. */
class ValidateVerb extends Verb {
  constructor() { super('validate', _validate); }
}



// Validate 1 to N resumes in FRESH or JSON Resume format.
var _validate = function(sources, unused, opts)  {

  if (!sources || !sources.length) {
    this.err(HMSTATUS.resumeNotFoundAlt, {quit: true});
    return null;
  }

  const validator = require('is-my-json-valid');
  const schemas = {
    fresh: require('fresh-resume-schema'),
    jars: require('../core/resume.json')
  };

  const results = _.map(sources, function(t)  {
    const r = _validateOne.call(this, t, validator, schemas, opts);
    if (r.error) { this.err(r.error.fluenterror, r.error); }
    return r;
  }
  , this);

  if (this.hasError() && !opts.assert) {
    this.reject(this.errorCode);
  } else if (!this.hasError()) {
    this.resolve(results);
  }
  return results;
};

module.exports = ValidateVerb;

/**
Validate a single resume.
@returns {
  file: <fileName>,
  isValid: <validFlag>,
  status: <validationStatus>,
  violations: <validationErrors>,
  schema: <schemaType>,
  error: <errorObject>
}
*/
var _validateOne = function(t, validator, schemas) {

  const ret = {file: t, isValid: false, status: 'unknown', schema: '-----'};

  try {

    // Read and parse the resume JSON. Won't throw.
    const obj = safeLoadJSON(t);

    // If success, validate the resume against the schema
    if (!obj.ex) {
      if (obj.json.basics) { ret.schema = 'jars'; } else { ret.schema = 'fresh'; }
      const validate = validator(schemas[ ret.schema ], // Note [1]
        {formats: { date: /^\d{4}(?:-(?:0[0-9]{1}|1[0-2]{1})(?:-[0-9]{2})?)?$/ }});
      ret.isValid = validate(obj.json);
      ret.status = ret.isValid ? 'valid' : 'invalid';
      if (!ret.isValid) { ret.violations = validate.errors; }

    // If failure, package JSON read/parse errors
    } else {
      let errCode;
      if (obj.ex.op === 'parse') {
        errCode = HMSTATUS.parseError;
        ret.status = 'broken';
      } else {
        errCode = HMSTATUS.readError;
        ret.status = 'missing';
      }
      ret.error = {
        fluenterror: errCode,
        inner: obj.ex.inner,
        quiet: errCode === HMSTATUS.readError
      };
    }

  } catch (err) {
    // Package any unexpected exceptions
    ret.error = {fluenterror: HMSTATUS.validateError, inner: err};
  }

  this.stat(HMEVENT.afterValidate, ret);
  return ret;
};
