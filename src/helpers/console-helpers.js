/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Generic template helper definitions for command-line output.
@module console-helpers.js
@license MIT. See LICENSE.md for details.
*/



const PAD   = require('string-padding');
const LO    = require('lodash');
const CHALK = require('chalk');
const _     = require('underscore');
require('../utils/string');



module.exports = {

  v( val, defaultVal, padding, style ) {
    let retVal = ( (val === null) || (val === undefined) ) ? defaultVal : val;
    let spaces = 0;
    if (String.is(padding)) {
      spaces = parseInt(padding, 10);
      if (isNaN(spaces)) { spaces = 0; }
    } else if (_.isNumber(padding)) {
      spaces = padding;
    }

    if (spaces !== 0) {
      retVal = PAD(retVal, Math.abs(spaces), null, spaces > 0 ? PAD.LEFT : PAD.RIGHT);
    }

    if (style && String.is( style )) {
      retVal = LO.get( CHALK, style )( retVal );
    }
    return retVal;
  },

  gapLength(val) {
    if (val < 35) {
      return CHALK.green.bold(val);
    } else if (val < 95) {
      return CHALK.yellow.bold(val);
    } else {
      return CHALK.red.bold(val);
    }
  },

  style( val, style ) {
    return LO.get( CHALK, style )( val );
  },

  isPlural( val, options ) {
    if (val > 1) {
      return options.fn(this);
    }
  },

  pad( val, spaces ) {
    return PAD(val, Math.abs(spaces), null, spaces > 0 ? PAD.LEFT : PAD.RIGHT);
  }
};
