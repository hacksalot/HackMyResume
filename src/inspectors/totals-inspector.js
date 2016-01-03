/**
Totals analysis for HackMyResume.
@license MIT. See LICENSE.md for details.
@module gap-inspector.js
*/



(function() {



  var _ = require('underscore');
  var FluentDate = require('../core/fluent-date');



  /**
  Identify gaps in the candidate's employment history.
  @class gapInspector
  */
  var gapInspector = module.exports = {



    moniker: 'totals-inspector',

    /**
    Run the Totals Analyzer on a resume.
    @method run
    @return An array of object representing gaps in the candidate's employment
    history. Each object provides the start, end, and duration of the gap:
        { <-- gap
          start: // A Moment.js date
          end: // A Moment.js date
          duration: // Gap length
        }
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
