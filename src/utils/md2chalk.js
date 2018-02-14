/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Inline Markdown-to-Chalk conversion routines.
@license MIT. See LICENSE.md for details.
@module utils/md2chalk
*/


const CHALK = require('chalk');
const LO = require('lodash');

module.exports = function( v, style, boldStyle ) {
  boldStyle = boldStyle || 'bold';
  const temp = v.replace(/\*\*(.*?)\*\*/g, LO.get( CHALK, boldStyle )('$1'));
  if (style) { return LO.get( CHALK, style )(temp); } else { return temp; }
};
