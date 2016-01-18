/**
Employment gap analysis for HackMyResume.
@license MIT. See LICENSE.md for details.
@module inspectors/gap-inspector
*/



(function() {



  var _ = require('underscore');
  var FluentDate = require('../core/fluent-date');
  var moment = require('moment');
  var LO = require('lodash');



  /**
  Identify gaps in the candidate's employment history.
  */
  var gapInspector = module.exports = {



    moniker: 'gap-inspector',



    /**
    Run the Gap Analyzer on a resume.
    @method run
    @return {Array} An array of object representing gaps in the candidate's
    employment history. Each object provides the start, end, and duration of the
    gap:
        { <-- gap
          start: // A Moment.js date
          end: // A Moment.js date
          duration: // Gap length
        }
    */
    run: function( rez ) {

      // This is what we'll return
      var coverage = {
        gaps: [],
        overlaps: [],
        duration: {
          total: 0,
          work: 0,
          gaps: 0
        },
        pct: '0%'
      };

      // Missing employment section? Bye bye.
      var hist = LO.get( rez, 'employment.history' );
      if( !hist || !hist.length ) { return coverage; }

      // Convert the candidate's employment history to an array of dates,
      // where each element in the array is a start date or an end date of a
      // job -- it doesn't matter which.
      var new_e = hist.map( function( job ){
        var obj = _.pick( job, ['start', 'end'] );
        if( obj && (obj.start || obj.end)) {
          obj = _.pairs( obj );
          obj[0][1] = FluentDate.fmt( obj[0][1] );
          if( obj.length > 1 )
            obj[1][1] = FluentDate.fmt( obj[1][1] );
        }
        return obj;
      });


      // Flatten the array, remove empties, and sort
      new_e = _.filter( _.flatten( new_e, true ), function(v) {
        return ( v && v.length && v[0] && v[0].length );
      });
      if( !new_e || !new_e.length ) return coverage;
      new_e = _.sortBy( new_e, function( elem ) { return elem[1].unix(); });

      // Iterate over elements in the array. Each time a start date is found,
      // increment a reference count. Each time an end date is found, decrement
      // the reference count. When the reference count reaches 0, we have a gap.
      // When the reference count is > 0, the candidate is employed. When the
      // reference count reaches 2, the candidate is overlapped.

      var num_gaps = 0, ref_count = 0, total_gap_days = 0, gap_start;

      new_e.forEach( function(point) {

        var inc = point[0] === 'start' ? 1 : -1;
        ref_count += inc;

        // If the ref count just reached 0, start a new GAP
        if( ref_count === 0 ) {
          coverage.gaps.push( { start: point[1], end: null });
        }

        // If the ref count reached 1 by rising, end the last GAP
        else if( ref_count === 1 && inc === 1 ) {
          var lastGap = _.last( coverage.gaps );
          if( lastGap ) {
            lastGap.end = point[1];
            lastGap.duration = lastGap.end.diff( lastGap.start, 'days' );
            total_gap_days += lastGap.duration;
          }
        }

        // If the ref count reaches 2 by rising, start a new OVERLAP
        else if( ref_count === 2 && inc === 1 ) {
          coverage.overlaps.push( { start: point[1], end: null });
        }

        // If the ref count reaches 1 by falling, end the last OVERLAP
        else if( ref_count === 1 && inc === -1 ) {
          var lastOver = _.last( coverage.overlaps );
          if( lastOver ) {
            lastOver.end = point[1];
            lastOver.duration = lastOver.end.diff( lastOver.start, 'days' );
            if( lastOver.duration === 0 ) {
              coverage.overlaps.pop();
            }
          }
        }
      });

      // It's possible that the last gap/overlap didn't have an explicit .end
      // date.If so, set the end date to the present date and compute the
      // duration normally.
      if( coverage.overlaps.length ) {
        var o = _.last( coverage.overlaps );
        if( o && !o.end ) {
          o.end = moment();
          o.duration = o.end.diff( o.start, 'days' );
        }
      }
      if( coverage.gaps.length ) {
        var g = _.last( coverage.gaps );
        if( g && !g.end ) {
          g.end = moment();
          g.duration = g.end.diff( g.start, 'days' );
        }
      }

      // Package data for return to the client
      var tdur = rez.duration('days');
      var dur = {
        total: tdur,
        work: tdur - total_gap_days,
        gaps: total_gap_days
      };
      coverage.pct = ( dur.total > 0 && dur.work > 0 ) ?
        ((((dur.total - dur.gaps) / dur.total) * 100)).toFixed(1) + '%' :
        '???';
      coverage.duration = dur;
      return coverage;
    }


  };



}());
