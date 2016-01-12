/**
Object string transformation.
@module string-transformer.js
@license MIT. See LICENSE.md for details.
*/



(function() {



  var _ = require('underscore');
  var moment = require('moment');



  /**
  Create a copy of this object in which all string fields have been run through
  a transformation function (such as a Markdown filter or XML encoder).
  */
  module.exports = function( ret, filt, transformer ) {

    var that = this;

    // TODO: refactor recursion
    function transformStringsInObject( obj, filters ) {

      if( !obj ) return;
      if( moment.isMoment( obj ) ) return;

      if( _.isArray( obj ) ) {
        obj.forEach( function(elem, idx, ar) {
          if( typeof elem === 'string' || elem instanceof String )
            ar[idx] = transformer( null, elem );
          else if (_.isObject(elem))
            transformStringsInObject( elem, filters );
        });
      }
      else if (_.isObject( obj )) {
        Object.keys( obj ).forEach(function(k) {
          if( filters.length && _.contains(filters, k) )
            return;
          var sub = obj[k];
          if( typeof sub === 'string' || sub instanceof String ) {
            obj[k] = transformer( k, sub );
          }
          else if (_.isObject( sub ))
            transformStringsInObject( sub, filters );
        });
      }

    }

    Object.keys( ret ).forEach(function(member){
      if( !filt || !filt.length || !_.contains(filt, member) )
        transformStringsInObject( ret[ member ], filt || [] );
    });

    return ret;
  };



}());
