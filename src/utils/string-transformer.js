/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Object string transformation.
@module utils/string-transformer
@license MIT. See LICENSE.md for details.
*/

const _ = require('underscore');
const moment = require('moment');

/**
Create a copy of this object in which all string fields have been run through
a transformation function (such as a Markdown filter or XML encoder).
*/

module.exports = function( ret, filt, transformer ) {

  // TODO: refactor recursion
  var transformStringsInObject = function( obj, filters ) {
    if (!obj) { return; }
    if (moment.isMoment(obj)) { return; }

    if (_.isArray( obj )) {
      return obj.forEach(function(elem, idx, ar) {
        if ((typeof elem === 'string') || elem instanceof String) {
          return ar[idx] = transformer( null, elem );
        } else if (_.isObject(elem)) {
          return transformStringsInObject( elem, filters );
        }
      });
    } else if (_.isObject( obj )) {
      return Object.keys( obj ).forEach(function(k) {
        if (filters.length && _.contains(filters, k)) {
          return;
        }
        const sub = obj[k];
        if ((typeof sub === 'string') || sub instanceof String) {
          return obj[k] = transformer( k, sub );
        } else if (_.isObject( sub )) {
          return transformStringsInObject( sub, filters );
        }
      });
    }
  };

  Object.keys( ret ).forEach(function(member) {
    if (!filt || !filt.length || !_.contains(filt, member)) {
      return transformStringsInObject( ret[ member ], filt || [] );
    }
  });
  return ret;
};
