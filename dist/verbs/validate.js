
/**
Implementation of the 'validate' verb for HackMyResume.
@module verbs/validate
@license MIT. See LICENSE.md for details.
 */

(function() {
  var FS, HMEVENT, HMSTATUS, ResumeFactory, SyntaxErrorEx, ValidateVerb, Verb, _, chalk, safeLoadJSON, validate;

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
      return this._super('validate');
    },
    invoke: function() {
      var ret;
      this.stat(HMEVENT.begin, {
        cmd: 'validate'
      });
      ret = validate.apply(this, arguments);
      this.stat(HMEVENT.end);
      return ret;
    }
  });


  /** Validate 1 to N resumes in FRESH or JSON Resume format. */

  validate = function(sources, unused, opts) {
    var schemas, validator;
    if (!sources || !sources.length) {
      throw {
        fluenterror: HMSTATUS.resumeNotFoundAlt,
        quit: true
      };
    }
    validator = require('is-my-json-valid');
    schemas = {
      fresh: require('fresca'),
      jars: require('../core/resume.json')
    };
    return _.map(sources, function(t) {
      var errCode, errors, fmt, json, obj, ret;
      ret = {
        file: t,
        isValid: false
      };
      obj = safeLoadJSON(t);
      if (!obj.ex) {
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
      } else {
        errCode = obj.ex.operation === 'parse' ? HMSTATUS.parseError : HMSTATUS.readError;
        if (errCode === HMSTATUS.readError) {
          obj.ex.quiet = true;
        }
        this.setError(errCode, obj.ex);
        this.err(errCode, obj.ex);
      }
      this.stat(HMEVENT.afterValidate, {
        file: t,
        isValid: ret.isValid,
        fmt: fmt != null ? fmt.replace('jars', 'JSON Resume') : void 0,
        errors: errors
      });
      if (opts.assert && !ret.isValid) {
        throw {
          fluenterror: HMSTATUS.invalid,
          shouldExit: true
        };
      }
      console.log('1111');
      return ret;
    }, this);
  };

}).call(this);
