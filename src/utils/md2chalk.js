/**
Inline Markdown-to-Chalk conversion routines.
@license MIT. See LICENSE.md for details.
@module md2chalk.js
*/

(function(){

  var MD = require('marked');
  var CHALK = require('chalk');
  var LO = require('lodash');

  module.exports = function( v, style ) {
    var temp = v.replace(/\*\*(.*?)\*\*/g, CHALK.bold('$1'));
    return style ? LO.get(CHALK, style)(temp) : temp;
  };

}());
