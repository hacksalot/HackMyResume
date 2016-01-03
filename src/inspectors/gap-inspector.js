/**
Employment gap analysis for HackMyResume.
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



    moniker: 'gap-inspector',

    /**
    Run the Gap Analyzer on a resume.
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

      // Convert the candidate's employment history to an array of dates,
      // where each element in the array is a start date or an end date of a
      // job -- it doesn't matter which.
      var new_e = rez.employment.history.map( function( job ){
        var obj = _.pairs( _.pick( job, ['start', 'end'] ) );
        obj[0][1] = FluentDate.fmt( obj[0][1] );
        if( obj.length > 1 )
          obj[1][1] = FluentDate.fmt( obj[1][1] );
        return obj;
      });

      // Flatten the array.
      new_e = _.flatten( new_e, true );

      // Sort the array, mixing start dates and end dates together
      new_e = _.sortBy( new_e, function( elem ) { return elem[1].unix(); });

      // Iterative over elements in the array. Each time a start date is found,
      // increment a reference count. Each time an end date is found, decrement
      // the reference count. When the reference count reaches 0, we have a gap.
      // When the reference count is > 0, the candidate is employed.
      var num_gaps = 0, ref_count = 0, gap_start, total_days = 0, total_work_days = 0,
        coverage = { gaps: [], overlaps: [] };
      new_e.forEach( function(point) {
        var inc = point[0] === 'start' ? 1 : -1;
        ref_count += inc;
        if( ref_count === 0 ) {
          coverage.gaps.push( { start: point[1], end: null });
        }
        else if( ref_count === 1 && inc === 1 ) {
          var lastGap = _.last( coverage.gaps );
          if( lastGap ) {
            lastGap.end = point[1];
            lastGap.duration = lastGap.end.diff( lastGap.start, 'days' );
            total_days += lastGap.duration;
          }
        }
        else if( ref_count === 2 && inc === 1 ) {
          coverage.overlaps.push( { start: point[1], end: null });
        }
        else if( ref_count === 1 && inc === -1 ) {
          var lastOverlap = _.last( coverage.overlaps );
          if( lastOverlap ) {
            lastOverlap.end = point[1];
            lastOverlap.duration = lastOverlap.end.diff( lastOverlap.start, 'days' );
            if( lastOverlap.duration === 0 ) {
              coverage.overlaps.pop();
            }
            total_work_days += lastOverlap.duration;
          }
        }
      });

      // var now = moment();
      // _.each( coverage.overlaps, function(ol) {
      //   return ol.end = ol.end || now;
      // });
      if( !_.last( coverage.overlaps ).end ) {
        var l = _.last( coverage.overlaps );
        l.end = moment();
        l.duration = l.end.diff( l.start, 'days' );
      }

      coverage.duration = total_days;
      coverage.pct = ( total_days > 0 ) ?
        (100.0 - ( total_days / rez.duration('days') * 100)).toFixed(1) + '%' :
        '???';


      return coverage;
    }


  };



}());
