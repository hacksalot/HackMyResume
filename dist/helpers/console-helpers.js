
/**
Generic template helper definitions for command-line output.
@module console-helpers.js
@license MIT. See LICENSE.md for details.
 */

(function() {
  var CHALK, LO, PAD, _, consoleFormatHelpers;

  PAD = require('string-padding');

  LO = require('lodash');

  CHALK = require('chalk');

  _ = require('underscore');

  require('../utils/string');

  consoleFormatHelpers = module.exports = {
    v: function(val, defaultVal, padding, style) {
      var retVal, spaces;
      retVal = val === null || val === void 0 ? defaultVal : val;
      spaces = 0;
      if (String.is(padding)) {
        spaces = parseInt(padding, 10);
        if (isNaN(spaces)) {
          spaces = 0;
        }
      } else if (_.isNumber(padding)) {
        spaces = padding;
      }
      if (spaces !== 0) {
        retVal = PAD(retVal, Math.abs(spaces), null, spaces > 0 ? PAD.LEFT : PAD.RIGHT);
      }
      if (style && String.is(style)) {
        retVal = LO.get(CHALK, style)(retVal);
      }
      return retVal;
    },
    gapLength: function(val) {
      if (val < 35) {
        return CHALK.green.bold(val);
      } else if (val < 95) {
        return CHALK.yellow.bold(val);
      } else {
        return CHALK.red.bold(val);
      }
    },
    style: function(val, style) {
      return LO.get(CHALK, style)(val);
    },
    isPlural: function(val, options) {
      if (val > 1) {
        return options.fn(this);
      }
    },
    pad: function(val, spaces) {
      return PAD(val, Math.abs(spaces), null, spaces > 0 ? PAD.LEFT : PAD.RIGHT);
    }
  };

}).call(this);

//# sourceMappingURL=console-helpers.js.map
