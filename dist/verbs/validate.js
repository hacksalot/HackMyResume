
/**
Implementation of the 'validate' verb for HackMyResume.
@module verbs/validate
@license MIT. See LICENSE.md for details.
 */

(function() {
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

  ValidateVerb = module.exports = Verb.extend({
    init: function() {
      return this._super('validate', _validate);
    }
  });


  /** Validate 1 to N resumes in FRESH or JSON Resume format. */

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
      fresh: require('fresca'),
      jars: require('../core/resume.json')
    };
    results = _.map(sources, function(t) {
      var r;
      if (this.hasError() && opts.assert) {
        return {};
      }
      r = _validateOne.call(this, t, validator, schemas);
      if (r.fluenterror) {
        console.log(r);
        r.quit = opts.assert;
        this.err(r.fluenterror, r);
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

  _validateOne = function(t, validator, schemas) {
    var errCode, errors, fmt, json, obj, ret, validate;
    ret = {
      file: t,
      isValid: false
    };
    obj = safeLoadJSON(t);
    if (obj.ex) {
      errCode = obj.ex.operation === 'parse' ? HMSTATUS.parseError : HMSTATUS.readError;
      if (errCode === HMSTATUS.readError) {
        obj.ex.quiet = true;
      }
      return {
        fluenterror: errCode,
        inner: obj.ex
      };
    }
    json = obj.json;
    fmt = json.basics ? 'jrs' : 'fresh';
    errors = [];
    try {
      validate = validator(schemas[fmt], {
        formats: {
          date: /^\d{4}(?:-(?:0[0-9]{1}|1[0-2]{1})(?:-[0-9]{2})?)?$/
        }
      });
      ret.isValid = validate(json);
      if (!ret.isValid) {
        errors = validate.errors;
      }
    } catch (_error) {
      ret.ex = _error;
    }
    this.stat(HMEVENT.afterValidate, {
      file: t,
      isValid: ret.isValid,
      fmt: fmt != null ? fmt.replace('jars', 'JSON Resume') : void 0,
      errors: errors
    });
    if (opts.assert && !ret.isValid) {
      return {
        fluenterror: HMSTATUS.invalid,
        errors: errors
      };
    }
    return ret;
  };

}).call(this);

//# sourceMappingURL=validate.js.map
