
/**
Definition of the AbstractResume class.
@license MIT. See LICENSE.md for details.
@module core/abstract-resume
 */

(function() {
  var AbstractResume, FluentDate, _, __;

  _ = require('underscore');

  __ = require('lodash');

  FluentDate = require('./fluent-date');

  AbstractResume = (function() {
    function AbstractResume() {}


    /**
    Compute the total duration of the work history.
    @returns The total duration of the sheet's work history, that is, the number
    of years between the start date of the earliest job on the resume and the
    *latest end date of all jobs in the work history*. This last condition is for
    sheets that have overlapping jobs.
     */

    AbstractResume.prototype.duration = function(collKey, startKey, endKey, unit) {
      var firstDate, hist, lastDate, new_e;
      unit = unit || 'years';
      hist = __.get(this, collKey);
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
    };


    /**
    Removes ignored or private fields from a resume object
    @returns an object with the following structure:
    {
      scrubbed: the processed resume object
      ignoreList: an array of ignored nodes that were removed
      privateList: an array of private nodes that were removed
    }
     */

    AbstractResume.prototype.scrubResume = function(rep, opts) {
      var ignoreList, includePrivates, privateList, scrubbed, traverse;
      traverse = require('traverse');
      ignoreList = [];
      privateList = [];
      includePrivates = (opts != null ? opts["private"] : void 0) == null ? true : opts != null ? opts["private"] : void 0;
      scrubbed = traverse(rep).map(function(x) {
        if (!this.isLeaf) {
          if (this.node.ignore === true || this.node.ignore === 'true') {
            ignoreList.push(this.node);
            return this.remove();
          } else if ((this.node["private"] === true || this.node["private"] === 'true') && !includePrivates) {
            privateList.push(this.node);
            return this.remove();
          }
        }
      });
      return {
        scrubbed: scrubbed,
        ingoreList: ignoreList,
        privateList: privateList
      };
    };

    return AbstractResume;

  })();

  module.exports = AbstractResume;

}).call(this);

//# sourceMappingURL=abstract-resume.js.map
