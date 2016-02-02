
/**
Implementation of the 'peek' verb for HackMyResume.
@module verbs/peek
@license MIT. See LICENSE.md for details.
 */

(function() {
  var HMEVENT, HMSTATUS, PeekVerb, Verb, _, __, _peek, _peekOne, safeLoadJSON;

  Verb = require('../verbs/verb');

  _ = require('underscore');

  __ = require('lodash');

  safeLoadJSON = require('../utils/safe-json-loader');

  HMSTATUS = require('../core/status-codes');

  HMEVENT = require('../core/event-codes');

  PeekVerb = module.exports = Verb.extend({
    init: function() {
      return this._super('peek', _peek);
    }
  });


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
      if (tgt.fluenterror) {
        tgt.quit = opts.assert;
        return this.err(tgt.fluenterror, tgt);
      }
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
    var errCode, obj, tgt;
    this.stat(HMEVENT.beforePeek, {
      file: t,
      target: objPath
    });
    obj = safeLoadJSON(t);
    tgt = null;
    if (!obj.ex) {
      tgt = objPath ? __.get(obj.json, objPath) : obj.json;
    }
    this.stat(HMEVENT.afterPeek, {
      file: t,
      requested: objPath,
      target: tgt,
      error: obj.ex
    });
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
    return tgt;
  };

}).call(this);

//# sourceMappingURL=peek.js.map
