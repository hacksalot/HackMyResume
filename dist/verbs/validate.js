
/**
Implementation of the 'validate' verb for HackMyResume.
@module verbs/validate
@license MIT. See LICENSE.md for details.
 */

(function() {
  var FS, HMEVENT, HMSTATUS, ResumeFactory, SyntaxErrorEx, ValidateVerb, Verb, _, _validate, _validateOne, chalk, safeLoadJSON,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

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

  module.exports = ValidateVerb = (function(superClass) {
    extend(ValidateVerb, superClass);

    function ValidateVerb() {
      ValidateVerb.__super__.constructor.call(this, 'validate', _validate);
    }

    return ValidateVerb;

  })(Verb);


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
      r = _validateOne.call(this, t, validator, schemas, opts);
      if (r.fluenterror) {
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

  _validateOne = function(t, validator, schemas, opts) {
    var errCode, errors, fmt, obj, ret, validate;
    ret = {
      file: t,
      isValid: false,
      status: 'unknown'
    };
    fmt = '------';
    try {
      obj = safeLoadJSON(t);
      if (obj.ex) {
        if (obj.ex.operation === 'parse') {
          errCode = HMSTATUS.parseError;
          ret.status = 'broken';
        } else {
          errCode = HMSTATUS.readError;
          ret.status = 'missing';
        }
        throw {
          fluenterror: errCode,
          inner: obj.ex.inner
        };
      }
      if (obj.json.basics) {
        fmt = 'jars';
      } else {
        fmt = 'fresh';
      }
      errors = [];
      validate = validator(schemas[fmt], {
        formats: {
          date: /^\d{4}(?:-(?:0[0-9]{1}|1[0-2]{1})(?:-[0-9]{2})?)?$/
        }
      });
      ret.isValid = validate(obj.json);
      ret.status = ret.isValid ? 'valid' : 'invalid';
      if (!ret.isValid) {
        errors = validate.errors;
      }
    } catch (_error) {
      ret.ex = _error;
    }
    this.stat(HMEVENT.afterValidate, {
      file: t,
      status: ret.status,
      fmt: fmt.replace('jars', 'JSON Resume'),
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
