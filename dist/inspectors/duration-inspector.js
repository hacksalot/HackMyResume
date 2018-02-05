(function() {
  var FluentDate, _;

  FluentDate = require('../core/fluent-date');

  _ = require('underscore');

  module.exports = {

    /**
    Compute the total duration of the work history.
    @returns The total duration of the sheet's work history, that is, the number
    of years between the start date of the earliest job on the resume and the
    *latest end date of all jobs in the work history*. This last condition is for
    sheets that have overlapping jobs.
     */
    run: function(rez, collKey, startKey, endKey, unit) {
      var firstDate, hist, lastDate, new_e;
      unit = unit || 'years';
      hist = __.get(rez, collKey);
      if (!hist || !hist.length) {
        return 0;
      }
      new_e = hist.map(function(job) {
        var obj;
        obj = _.pick(job, [startKey, endKey]);
        if (!_.has(obj, endKey)) {
          obj[endKey] = 'current';
        }
        if (obj && (obj[startKey] || obj[endKey])) {
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
        return 0;
      }
      new_e = _.sortBy(new_e, function(elem) {
        return elem[1].unix();
      });
      firstDate = _.first(new_e)[1];
      lastDate = _.last(new_e)[1];
      return lastDate.diff(firstDate, unit);
    }
  };

}).call(this);

//# sourceMappingURL=duration-inspector.js.map
