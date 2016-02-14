
/**
Block helper definitions for HackMyResume / FluentCV.
@license MIT. See LICENSE.md for details.
@module helpers/generic-helpers
 */

(function() {
  var BlockHelpers, HMSTATUS, LO, _, unused;

  HMSTATUS = require('../core/status-codes');

  LO = require('lodash');

  _ = require('underscore');

  unused = require('../utils/string');


  /** Block helper function definitions. */

  BlockHelpers = module.exports = {

    /**
    Emit the enclosed content if the resume has a section with
    the specified name. Otherwise, emit an empty string ''.
     */
    section: function(title, options) {
      var obj, ret;
      title = title.trim().toLowerCase();
      obj = LO.get(this.r, title);
      ret = '';
      if (obj) {
        if (_.isArray(obj)) {
          if (obj.length) {
            ret = options.fn(this);
          }
        } else if (_.isObject(obj)) {
          if ((obj.history && obj.history.length) || (obj.sets && obj.sets.length)) {
            ret = options.fn(this);
          }
        }
      }
      return ret;
    },

    /**
    Emit the enclosed content if the resume has the named
    property or subproperty.
     */
    has: function(title, options) {
      title = title && title.trim().toLowerCase();
      if (LO.get(this.r, title)) {
        return options.fn(this);
      }
    },

    /**
    Return true if either value is truthy.
    @method either
     */
    either: function(lhs, rhs, options) {
      if (lhs || rhs) {
        return options.fn(this);
      }
    }
  };

}).call(this);

//# sourceMappingURL=block-helpers.js.map
