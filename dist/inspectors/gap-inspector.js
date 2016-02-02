
/**
Employment gap analysis for HackMyResume.
@license MIT. See LICENSE.md for details.
@module inspectors/gap-inspector
 */

(function() {
  var FluentDate, LO, _, gapInspector, moment;

  _ = require('underscore');

  FluentDate = require('../core/fluent-date');

  moment = require('moment');

  LO = require('lodash');


  /**
  Identify gaps in the candidate's employment history.
   */

  gapInspector = module.exports = {
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
    run: function(rez) {
      var coverage, dur, g, gap_start, hist, new_e, num_gaps, o, ref_count, tdur, total_gap_days;
      coverage = {
        gaps: [],
        overlaps: [],
        pct: '0%',
        duration: {
          total: 0,
          work: 0,
          gaps: 0
        }
      };
      hist = LO.get(rez, 'employment.history');
      if (!hist || !hist.length) {
        return coverage;
      }
      new_e = hist.map(function(job) {
        var obj;
        obj = _.pick(job, ['start', 'end']);
        if (obj && (obj.start || obj.end)) {
          obj = _.pairs(obj);
          obj[0][1] = FluentDate.fmt(obj[0][1]);
          if (obj.length > 1) {
            obj[1][1] = FluentDate.fmt(obj[1][1]);
          }
        }
        return obj;
      });
      new_e = _.filter(_.flatten(new_e, true), function(v) {
        return v && v.length && v[0] && v[0].length;
      });
      if (!new_e || !new_e.length) {
        return coverage;
      }
      new_e = _.sortBy(new_e, function(elem) {
        return elem[1].unix();
      });
      num_gaps = 0;
      ref_count = 0;
      total_gap_days = 0;
      gap_start = null;
      new_e.forEach(function(point) {
        var inc, lastGap, lastOver;
        inc = point[0] === 'start' ? 1 : -1;
        ref_count += inc;
        if (ref_count === 0) {
          return coverage.gaps.push({
            start: point[1],
            end: null
          });
        } else if (ref_count === 1 && inc === 1) {
          lastGap = _.last(coverage.gaps);
          if (lastGap) {
            lastGap.end = point[1];
            lastGap.duration = lastGap.end.diff(lastGap.start, 'days');
            return total_gap_days += lastGap.duration;
          }
        } else if (ref_count === 2 && inc === 1) {
          return coverage.overlaps.push({
            start: point[1],
            end: null
          });
        } else if (ref_count === 1 && inc === -1) {
          lastOver = _.last(coverage.overlaps);
          if (lastOver) {
            lastOver.end = point[1];
            lastOver.duration = lastOver.end.diff(lastOver.start, 'days');
            if (lastOver.duration === 0) {
              return coverage.overlaps.pop();
            }
          }
        }
      });
      if (coverage.overlaps.length) {
        o = _.last(coverage.overlaps);
        if (o && !o.end) {
          o.end = moment();
          o.duration = o.end.diff(o.start, 'days');
        }
      }
      if (coverage.gaps.length) {
        g = _.last(coverage.gaps);
        if (g && !g.end) {
          g.end = moment();
          g.duration = g.end.diff(g.start, 'days');
        }
      }
      tdur = rez.duration('days');
      dur = {
        total: tdur,
        work: tdur - total_gap_days,
        gaps: total_gap_days
      };
      coverage.pct = dur.total > 0 && dur.work > 0 ? (((dur.total - dur.gaps) / dur.total) * 100).toFixed(1) + '%' : '???';
      coverage.duration = dur;
      return coverage;
    }
  };

}).call(this);

//# sourceMappingURL=gap-inspector.js.map
