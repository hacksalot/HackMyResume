
/**
Implementation of the 'validate' verb for HackMyResume.
@module verbs/validate
@license MIT. See LICENSE.md for details.
 */

(function() {
  var FS, HMEVENT, HMSTATUS, ResumeFactory, SyntaxErrorEx, ValidateVerb, Verb, _, chalk, validate;

  FS = require('fs');

  ResumeFactory = require('../core/resume-factory');

  SyntaxErrorEx = require('../utils/syntax-error-ex');

  chalk = require('chalk');

  Verb = require('../verbs/verb');

  HMSTATUS = require('../core/status-codes');

  HMEVENT = require('../core/event-codes');

  _ = require('underscore');


  /** An invokable resume validation command. */

  ValidateVerb = module.exports = Verb.extend({
    init: function() {
      return this._super('validate');
    },
    invoke: function() {
      this.stat(HMEVENT.begin, {
        cmd: 'validate'
      });
      validate.apply(this, arguments);
      this.stat(HMEVENT.end);
    }
  });


  /** Validate 1 to N resumes in FRESH or JSON Resume format. */

  validate = function(sources, unused, opts) {
    var resumes, schemas, validator;
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
    resumes = ResumeFactory.load(sources, {
      format: null,
      objectify: false
    }, this);
    return resumes.map(function(src) {
      var errors, exc, fmt, json, ret;
      ret = {
        file: src,
        isValid: false
      };
      if (src.fluenterror) {
        if (opts.assert) {
          throw src;
        }
        this.setError(src.fluenterror, src);
        return ret;
      }
      json = src.json;
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
        exc = _error;
        return ret;
      }
      this.stat(HMEVENT.afterValidate, {
        file: src.file,
        isValid: ret.isValid,
        fmt: fmt.replace('jars', 'JSON Resume'),
        errors: errors
      });
      if (opts.assert && !ret.isValid) {
        throw {
          fluenterror: HMSTATUS.invalid({
            shouldExit: true
          })
        };
      }
      return ret;
    }, this);
  };

}).call(this);
