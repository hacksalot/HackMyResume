/**
Inline Markdown-to-Chalk conversion routines.
@license MIT. See LICENSE.md for details.
@module md2chalk.js
*/

(function(){

  var MD = require('marked');
  var CHALK = require('chalk');
  var LO = require('lodash');

  module.exports = function( v, style, boldStyle ) {
    boldStyle = boldStyle || 'bold';
    var temp = v.replace(/\*\*(.*?)\*\*/g, LO.get( CHALK, boldStyle )('$1'));
    return style ? LO.get( CHALK, style )(temp) : temp;
  };

}());
