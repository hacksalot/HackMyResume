
/**
Inline Markdown-to-Chalk conversion routines.
@license MIT. See LICENSE.md for details.
@module utils/md2chalk
 */

(function() {
  var CHALK, LO, MD;

  MD = require('marked');

  CHALK = require('chalk');

  LO = require('lodash');

  module.exports = function(v, style, boldStyle) {
    var temp;
    boldStyle = boldStyle || 'bold';
    temp = v.replace(/\*\*(.*?)\*\*/g, LO.get(CHALK, boldStyle)('$1'));
    if (style) {
      return LO.get(CHALK, style)(temp);
    } else {
      return temp;
    }
  };

}).call(this);

//# sourceMappingURL=md2chalk.js.map
