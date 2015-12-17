/**
Definitions of string utility functions.
@license MIT. Copyright (c) 2015 James Devlin / FluentDesk.
@module string.js
*/

/**
Determine if the string is null, empty, or whitespace.
See: http://stackoverflow.com/a/32800728/4942583
@method isNullOrWhitespace
*/

String.isNullOrWhitespace = function( input ) {
  return !input || !input.trim();
};

String.prototype.endsWith = function(suffix) {
  return this.indexOf(suffix, this.length - suffix.length) !== -1;
};
