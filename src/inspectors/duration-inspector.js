/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const FluentDate = require('../core/fluent-date');
const _ = require('underscore');
const lo = require('lodash');

module.exports = {

  /**
  Compute the total duration of the work history.
  @returns The total duration of the sheet's work history, that is, the number
  of years between the start date of the earliest job on the resume and the
  *latest end date of all jobs in the work history*. This last condition is for
  sheets that have overlapping jobs.
  */
  run(rez, collKey, startKey, endKey, unit) {
    unit = unit || 'years';
    const hist = lo.get(rez, collKey);
    if (!hist || !hist.length) { return 0; }

    // BEGIN CODE DUPLICATION --> src/inspectors/gap-inspector.coffee (TODO)

    // Convert the candidate's employment history to an array of dates,
    // where each element in the array is a start date or an end date of a
    // job -- it doesn't matter which.
    let new_e = hist.map(function( job ) {
      let obj = _.pick( job, [startKey, endKey] );
      // Synthesize an end date if this is a "current" gig
      if (!_.has(obj, endKey)) { obj[endKey] = 'current'; }
      if (obj && (obj[startKey] || obj[endKey])) {
        obj = _.pairs(obj);
        obj[0][1] = FluentDate.fmt( obj[0][1] );
        if (obj.length > 1) {
          obj[1][1] = FluentDate.fmt( obj[1][1] );
        }
      }
      return obj;
    });

    // Flatten the array, remove empties, and sort
    new_e = _.filter(_.flatten( new_e, true ), v => v && v.length && v[0] && v[0].length);
    if (!new_e || !new_e.length) { return 0; }
    new_e = _.sortBy(new_e,  elem  => elem[1].unix());

    // END CODE DUPLICATION

    const firstDate = _.first( new_e )[1];
    const lastDate = _.last( new_e )[1];
    return lastDate.diff(firstDate, unit);
  }
};
