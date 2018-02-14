/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Employment gap analysis for HackMyResume.
@license MIT. See LICENSE.md for details.
@module inspectors/gap-inspector
*/



const _ = require('underscore');
const FluentDate = require('../core/fluent-date');
const moment = require('moment');
const LO = require('lodash');



/**
Identify gaps in the candidate's employment history.
*/
module.exports = {

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

  run(rez) {

    // This is what we'll return
    const coverage = {
      gaps: [],
      overlaps: [],
      pct: '0%',
      duration: {
        total: 0,
        work: 0,
        gaps: 0
      }
    };

    // Missing employment section? Bye bye.
    const hist = LO.get(rez, 'employment.history');

    if (!hist || !hist.length) { return coverage; }

    // Convert the candidate's employment history to an array of dates,
    // where each element in the array is a start date or an end date of a
    // job -- it doesn't matter which.
    let new_e = hist.map( function( job ) {
      let obj = _.pick( job, ['start', 'end'] );
      if (obj && (obj.start || obj.end)) {
        obj = _.pairs( obj );
        obj[0][1] = FluentDate.fmt( obj[0][1] );
        if (obj.length > 1) {
          obj[1][1] = FluentDate.fmt( obj[1][1] );
        }
      }
      return obj;
    });

    // Flatten the array, remove empties, and sort
    new_e = _.filter(_.flatten( new_e, true ), v => v && v.length && v[0] && v[0].length);

    if (!new_e || !new_e.length) { return coverage; }
    new_e = _.sortBy(new_e,  elem  => elem[1].unix());

    // Iterate over elements in the array. Each time a start date is found,
    // increment a reference count. Each time an end date is found, decrement
    // the reference count. When the reference count reaches 0, we have a gap.
    // When the reference count is > 0, the candidate is employed. When the
    // reference count reaches 2, the candidate is overlapped.

    let ref_count = 0;
    let total_gap_days = 0;

    new_e.forEach(function(point) {

      const inc = point[0] === 'start' ? 1 : -1;
      ref_count += inc;

      // If the ref count just reached 0, start a new GAP
      if (ref_count === 0) {
        return coverage.gaps.push( { start: point[1], end: null });

      // If the ref count reached 1 by rising, end the last GAP
      } else if ((ref_count === 1) && (inc === 1)) {
        const lastGap = _.last( coverage.gaps );
        if (lastGap) {
          lastGap.end = point[1];
          lastGap.duration = lastGap.end.diff( lastGap.start, 'days' );
          return total_gap_days += lastGap.duration;
        }

      // If the ref count reaches 2 by rising, start a new OVERLAP
      } else if ((ref_count === 2) && (inc === 1)) {
        return coverage.overlaps.push( { start: point[1], end: null });

      // If the ref count reaches 1 by falling, end the last OVERLAP
      } else if ((ref_count === 1) && (inc === -1)) {
        const lastOver = _.last( coverage.overlaps );
        if (lastOver) {
          lastOver.end = point[1];
          lastOver.duration = lastOver.end.diff( lastOver.start, 'days' );
          if (lastOver.duration === 0) {
            return coverage.overlaps.pop();
          }
        }
      }
    });


    // It's possible that the last gap/overlap didn't have an explicit .end
    // date.If so, set the end date to the present date and compute the
    // duration normally.
    if (coverage.overlaps.length) {
      const o = _.last( coverage.overlaps );
      if (o && !o.end) {
        o.end = moment();
        o.duration = o.end.diff( o.start, 'days' );
      }
    }

    if (coverage.gaps.length) {
      const g = _.last( coverage.gaps );
      if (g && !g.end) {
        g.end = moment();
        g.duration = g.end.diff( g.start, 'days' );
      }
    }

    // Package data for return to the client
    const tdur = rez.duration('days');
    const dur = {
      total: tdur,
      work: tdur - total_gap_days,
      gaps: total_gap_days
    };

    coverage.pct = (dur.total > 0) && (dur.work > 0) ? ((((dur.total - dur.gaps) / dur.total) * 100)).toFixed(1) + '%' : '???';
    coverage.duration = dur;
    return coverage;
  }
};
