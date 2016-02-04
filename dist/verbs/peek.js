
/**
Implementation of the 'peek' verb for HackMyResume.
@module verbs/peek
@license MIT. See LICENSE.md for details.
 */

(function() {
  var HMEVENT, HMSTATUS, PeekVerb, Verb, _, __, _peek, _peekOne, safeLoadJSON,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Verb = require('../verbs/verb');

  _ = require('underscore');

  __ = require('lodash');

  safeLoadJSON = require('../utils/safe-json-loader');

  HMSTATUS = require('../core/status-codes');

  HMEVENT = require('../core/event-codes');

  module.exports = PeekVerb = (function(superClass) {
    extend(PeekVerb, superClass);

    function PeekVerb() {
      PeekVerb.__super__.constructor.call(this, 'peek', _peek);
    }

    return PeekVerb;

  })(Verb);


  /** Peek at a resume, resume section, or resume field. */

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
      return tgt;
    }, this);
    if (this.hasError() && !opts.assert) {
      this.reject(this.errorCode);
    } else if (!this.hasError()) {
      this.resolve(results);
    }
    return results;
  };


  /** Peek at a single resume, resume section, or resume field. */

  _peekOne = function(t, objPath) {
    var errCode, obj, pkgError, tgt;
    this.stat(HMEVENT.beforePeek, {
      file: t,
      target: objPath
    });
    obj = safeLoadJSON(t);
    tgt = null;
    if (!obj.ex) {
      tgt = objPath ? __.get(obj.json, objPath) : obj.json;
    }
    pkgError = null;
    if (obj.ex) {
      errCode = obj.ex.operation === 'parse' ? HMSTATUS.parseError : HMSTATUS.readError;
      if (errCode === HMSTATUS.readError) {
        obj.ex.quiet = true;
      }
      pkgError = {
        fluenterror: errCode,
        inner: obj.ex
      };
    }
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
