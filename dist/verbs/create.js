
/**
Implementation of the 'create' verb for HackMyResume.
@module verbs/create
@license MIT. See LICENSE.md for details.
 */

(function() {
  var CreateVerb, HMEVENT, HMSTATUS, MKDIRP, PATH, Verb, _, chalk, create;

  MKDIRP = require('mkdirp');

  PATH = require('path');

  chalk = require('chalk');

  Verb = require('../verbs/verb');

  _ = require('underscore');

  HMSTATUS = require('../core/status-codes');

  HMEVENT = require('../core/event-codes');

  CreateVerb = module.exports = Verb.extend({
    init: function() {
      return this._super('new', create);
    }
  });


  /**
  Create a new empty resume in either FRESH or JRS format.
   */

  create = function(src, dst, opts) {
    if (!src || !src.length) {
      throw {
        fluenterror: HMSTATUS.createNameMissing,
        quit: true
      };
    }
    _.each(src, function(t) {
      var RezClass, safeFmt;
      safeFmt = opts.format.toUpperCase();
      this.stat(HMEVENT.beforeCreate, {
        fmt: safeFmt,
        file: t
      });
      MKDIRP.sync(PATH.dirname(t));
      RezClass = require('../core/' + safeFmt.toLowerCase() + '-resume');
      RezClass["default"]().save(t);
      return this.stat(HMEVENT.afterCreate, {
        fmt: safeFmt,
        file: t
      });
    }, this);
  };

}).call(this);
