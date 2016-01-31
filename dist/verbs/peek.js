
/**
Implementation of the 'peek' verb for HackMyResume.
@module verbs/peek
@license MIT. See LICENSE.md for details.
 */

(function() {
  var HMEVENT, HMSTATUS, PeekVerb, Verb, _, __, peek, safeLoadJSON;

  Verb = require('../verbs/verb');

  _ = require('underscore');

  __ = require('lodash');

  safeLoadJSON = require('../utils/safe-json-loader');

  HMSTATUS = require('../core/status-codes');

  HMEVENT = require('../core/event-codes');

  PeekVerb = module.exports = Verb.extend({
    init: function() {
      return this._super('peek', peek);
    }
  });


  /** Peek at a resume, resume section, or resume field. */

  peek = function(src, dst, opts) {
    var objPath;
    if (!src || !src.length) {
      ({
        "throw": {
          fluenterror: HMSTATUS.resumeNotFound
        }
      });
    }
    objPath = (dst && dst[0]) || '';
    _.each(src, function(t) {
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
        this.setError(errCode, obj.ex);
        return this.err(errCode, obj.ex);
      }
    }, this);
  };

}).call(this);
