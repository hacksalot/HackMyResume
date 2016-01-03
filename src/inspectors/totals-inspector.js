/**
Section analysis for HackMyResume.
@license MIT. See LICENSE.md for details.
@module totals-inspector.js
*/



(function() {



  var _ = require('underscore');
  var FluentDate = require('../core/fluent-date');



  /**
  Retrieve sectional overview and summary information.
  @class totalsInspector
  */
  var totalsInspector = module.exports = {



    moniker: 'totals-inspector',



    /**
    Run the Totals Inspector on a resume.
    @method run
    @return An array of objects containing summary information for each section
    on the resume.
    */
    run: function( rez ) {

      var ret = { };
      _.each( rez, function(val, key){
        if( _.isArray( val ) && !_.isString(val) ) {
          ret[ key ] = val.length;
        }
        else if( val.history && _.isArray( val.history ) ) {
          ret[ key ] = val.history.length;
        }
        else if( val.sets && _.isArray( val.sets ) ) {
          ret[ key ] = val.sets.length;
        }
      });

      return ret;
    }


  };



}());
