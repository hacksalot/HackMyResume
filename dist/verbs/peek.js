(function() {
  /**
  Implementation of the 'peek' verb for HackMyResume.
  @module verbs/peek
  @license MIT. See LICENSE.md for details.
  */
  /** Peek at a resume, resume section, or resume field. */
  /** Peek at a single resume, resume section, or resume field. */
  var HMEVENT, HMSTATUS, PeekVerb, Verb, _, __, _peek, _peekOne, safeLoadJSON;

  Verb = require('../verbs/verb');

  _ = require('underscore');

  __ = require('lodash');

  safeLoadJSON = require('../utils/safe-json-loader');

  HMSTATUS = require('../core/status-codes');

  HMEVENT = require('../core/event-codes');

  module.exports = PeekVerb = class PeekVerb extends Verb {
    constructor() {
      super('peek', _peek);
    }

  };

  _peek = function(src, dst, opts) {
    var objPath, results;
    if (!src || !src.length) {
      this.err(HMSTATUS.resumeNotFound, {
        quit: true
      });
      return null;
    }
    objPath = (dst && dst[0]) || '';
    results = _.map(src, function(t) {
      var tgt;
      if (opts.assert && this.hasError()) {
        return {};
      }
      tgt = _peekOne.call(this, t, objPath);
      if (tgt.error) {
        this.setError(tgt.error.fluenterror, tgt.error);
      }
      //tgt.error.quit = opts.assert
      //@err tgt.error.fluenterror, tgt.error
      return tgt;
    }, this);
    if (this.hasError() && !opts.assert) {
      this.reject(this.errorCode);
    } else if (!this.hasError()) {
      this.resolve(results);
    }
    return results;
  };

  _peekOne = function(t, objPath) {
    var errCode, obj, pkgError, tgt;
    this.stat(HMEVENT.beforePeek, {
      file: t,
      target: objPath
    });
    // Load the input file JSON 1st
    obj = safeLoadJSON(t);
    // Fetch the requested object path (or the entire file)
    tgt = null;
    if (!obj.ex) {
      tgt = objPath ? __.get(obj.json, objPath) : obj.json;
    }
    //# safeLoadJSON can only return a READ error or a PARSE error
    pkgError = null;
    if (obj.ex) {
      errCode = obj.ex.op === 'parse' ? HMSTATUS.parseError : HMSTATUS.readError;
      if (errCode === HMSTATUS.readError) {
        obj.ex.quiet = true;
      }
      pkgError = {
        fluenterror: errCode,
        inner: obj.ex
      };
    }
    // Fire the 'afterPeek' event with collected info
    this.stat(HMEVENT.afterPeek, {
      file: t,
      requested: objPath,
      target: obj.ex ? void 0 : tgt,
      error: pkgError
    });
    return {
      val: obj.ex ? void 0 : tgt,
      error: pkgError
    };
  };

}).call(this);

//# sourceMappingURL=peek.js.map
