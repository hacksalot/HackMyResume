
/**
The HackMyResume date representation.
@license MIT. See LICENSE.md for details.
@module core/fluent-date
 */

(function() {
  var FluentDate, abbr, moment, months;

  moment = require('moment');

  require('../utils/string');


  /**
  Create a FluentDate from a string or Moment date object. There are a few date
  formats to be aware of here.
  1. The words "Present" and "Now", referring to the current date
  2. The default "YYYY-MM-DD" format used in JSON Resume ("2015-02-10")
  3. Year-and-month only ("2015-04")
  4. Year-only "YYYY" ("2015")
  5. The friendly HackMyResume "mmm YYYY" format ("Mar 2015" or "Dec 2008")
  6. Empty dates ("", " ")
  7. Any other date format that Moment.js can parse from
  Note: Moment can transparently parse all or most of these, without requiring us
  to specify a date format...but for maximum parsing safety and to avoid Moment
  deprecation warnings, it's recommended to either a) explicitly specify the date
  format or b) use an ISO format. For clarity, we handle these cases explicitly.
  @class FluentDate
   */

  FluentDate = (function() {
    function FluentDate(dt) {
      this.rep = this.fmt(dt);
    }

    FluentDate.isCurrent = function(dt) {
      return !dt || (String.is(dt) && /^(present|now|current)$/.test(dt));
    };

    return FluentDate;

  })();

  months = {};

  abbr = {};

  moment.months().forEach(function(m, idx) {
    return months[m.toLowerCase()] = idx + 1;
  });

  moment.monthsShort().forEach(function(m, idx) {
    return abbr[m.toLowerCase()] = idx + 1;
  });

  abbr.sept = 9;

  module.exports = FluentDate;

  FluentDate.fmt = function(dt, throws) {
    var month, mt, parts, ref, temp;
    throws = (throws === void 0 || throws === null) || throws;
    if (typeof dt === 'string' || dt instanceof String) {
      dt = dt.toLowerCase().trim();
      if (/^(present|now|current)$/.test(dt)) {
        return moment();
      } else if (/^\D+\s+\d{4}$/.test(dt)) {
        parts = dt.split(' ');
        month = months[parts[0]] || abbr[parts[0]];
        temp = parts[1] + '-' + ((ref = month < 10) != null ? ref : '0' + {
          month: month.toString()
        });
        return moment(temp, 'YYYY-MM');
      } else if (/^\d{4}-\d{1,2}$/.test(dt)) {
        return moment(dt, 'YYYY-MM');
      } else if (/^\s*\d{4}\s*$/.test(dt)) {
        return moment(dt, 'YYYY');
      } else if (/^\s*$/.test(dt)) {
        return moment();
      } else {
        mt = moment(dt);
        if (mt.isValid()) {
          return mt;
        }
        if (throws) {
          throw 'Invalid date format encountered.';
        }
        return null;
      }
    } else {
      if (!dt) {
        return moment();
      } else if (dt.isValid && dt.isValid()) {
        return dt;
      }
      if (throws) {
        throw 'Unknown date object encountered.';
      }
      return null;
    }
  };

}).call(this);

//# sourceMappingURL=fluent-date.js.map
