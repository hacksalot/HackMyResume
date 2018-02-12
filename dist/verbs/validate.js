(function() {
  /**
  Implementation of the 'validate' verb for HackMyResume.
  @module verbs/validate
  @license MIT. See LICENSE.md for details.
  */
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
  var FS, HMEVENT, HMSTATUS, ResumeFactory, SyntaxErrorEx, ValidateVerb, Verb, _, _validate, _validateOne, chalk, safeLoadJSON;

  FS = require('fs');

  ResumeFactory = require('../core/resume-factory');

  SyntaxErrorEx = require('../utils/syntax-error-ex');

  chalk = require('chalk');

  Verb = require('../verbs/verb');

  HMSTATUS = require('../core/status-codes');

  HMEVENT = require('../core/event-codes');

  _ = require('underscore');

  safeLoadJSON = require('../utils/safe-json-loader');

  /** An invokable resume validation command. */
  module.exports = ValidateVerb = class ValidateVerb extends Verb {
    constructor() {
      super('validate', _validate);
    }

  };

  // Validate 1 to N resumes in FRESH or JSON Resume format.
  _validate = function(sources, unused, opts) {
    var results, schemas, validator;
    if (!sources || !sources.length) {
      this.err(HMSTATUS.resumeNotFoundAlt, {
        quit: true
      });
      return null;
    }
    validator = require('is-my-json-valid');
    schemas = {
      fresh: require('fresh-resume-schema'),
      jars: require('../core/resume.json')
    };
    results = _.map(sources, function(t) {
      var r;
      r = _validateOne.call(this, t, validator, schemas, opts);
      if (r.error) {
        this.err(r.error.fluenterror, r.error);
      }
      return r;
    }, this);
    if (this.hasError() && !opts.assert) {
      this.reject(this.errorCode);
    } else if (!this.hasError()) {
      this.resolve(results);
    }
    return results;
  };

  _validateOne = function(t, validator, schemas, opts) {
    var err, errCode, obj, ret, validate;
    ret = {
      file: t,
      isValid: false,
      status: 'unknown',
      schema: '-----'
    };
    try {
      // Read and parse the resume JSON. Won't throw.
      obj = safeLoadJSON(t);
      if (!obj.ex) {
        if (obj.json.basics) {
          ret.schema = 'jars';
        } else {
          ret.schema = 'fresh';
        }
        validate = validator(schemas[ret.schema], {
          formats: {
            date: /^\d{4}(?:-(?:0[0-9]{1}|1[0-2]{1})(?:-[0-9]{2})?)?$/
          }
        });
        ret.isValid = validate(obj.json);
        ret.status = ret.isValid ? 'valid' : 'invalid';
        if (!ret.isValid) {
          ret.violations = validate.errors;
        }
      } else {
        // If failure, package JSON read/parse errors
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
    } catch (error) {
      err = error;
      // Package any unexpected exceptions
      ret.error = {
        fluenterror: HMSTATUS.validateError,
        inner: err
      };
    }
    this.stat(HMEVENT.afterValidate, ret);
    return ret;
  };

}).call(this);

//# sourceMappingURL=validate.js.map
