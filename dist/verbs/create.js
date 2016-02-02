
/**
Implementation of the 'create' verb for HackMyResume.
@module verbs/create
@license MIT. See LICENSE.md for details.
 */

(function() {
  var CreateVerb, HMEVENT, HMSTATUS, MKDIRP, PATH, Verb, _, _create, _createOne, chalk;

  MKDIRP = require('mkdirp');

  PATH = require('path');

  chalk = require('chalk');

  Verb = require('../verbs/verb');

  _ = require('underscore');

  HMSTATUS = require('../core/status-codes');

  HMEVENT = require('../core/event-codes');

  CreateVerb = module.exports = Verb.extend({
    init: function() {
      return this._super('new', _create);
    }
  });


  /** Create a new empty resume in either FRESH or JRS format. */

  _create = function(src, dst, opts) {
    var results;
    if (!src || !src.length) {
      this.err(HMSTATUS.createNameMissing, {
        quit: true
      });
      return null;
    }
    results = _.map(src, function(t) {
      var r;
      if (opts.assert && this.hasError()) {
        return {};
      }
      r = _createOne.call(this, t, opts);
      if (r.fluenterror) {
        r.quit = opts.assert;
        this.err(r.fluenterror, r);
      }
      return r;
    }, this);
    if (this.hasError() && !opts.assert) {
      this.reject(results);
    } else if (!this.hasError()) {
      this.resolve(results);
    }
    return results;
  };


  /** Create a single new resume */

  _createOne = function(t, opts) {
    var RezClass, newRez, ret, safeFmt;
    try {
      ret = null;
      safeFmt = opts.format.toUpperCase();
      this.stat(HMEVENT.beforeCreate, {
        fmt: safeFmt,
        file: t
      });
      MKDIRP.sync(PATH.dirname(t));
      RezClass = require('../core/' + safeFmt.toLowerCase() + '-resume');
      newRez = RezClass["default"]();
      newRez.save(t);
      ret = newRez;
    } catch (_error) {
      ret = {
        fluenterror: HMSTATUS.createError,
        inner: _error
      };
    } finally {
      this.stat(HMEVENT.afterCreate, {
        fmt: safeFmt,
        file: t,
        isError: ret.fluenterror
      });
      return ret;
    }
  };

}).call(this);

//# sourceMappingURL=create.js.map
