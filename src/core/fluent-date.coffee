###*
The HackMyResume date representation.
@license MIT. See LICENSE.md for details.
@module core/fluent-date
###



moment = require 'moment'
require('../utils/string')

###*
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
###

class FluentDate

  constructor: (dt) ->
    @rep = this.fmt dt

  @isCurrent: (dt) ->
    !dt || (String.is(dt) and /^(present|now|current)$/.test(dt))

months = {}
abbr = {}
moment.months().forEach((m,idx) -> months[m.toLowerCase()] = idx+1 )
moment.monthsShort().forEach((m,idx) -> abbr[m.toLowerCase()]=idx+1 )
abbr.sept = 9
module.exports = FluentDate

FluentDate.fmt = ( dt, throws ) ->

  throws = (throws == undefined || throws == null) || throws

  if typeof dt == 'string' or dt instanceof String
    dt = dt.toLowerCase().trim()
    if /^(present|now|current)$/.test(dt) # "Present", "Now"
      return moment()
    else if /^\D+\s+\d{4}$/.test(dt) # "Mar 2015"
      parts = dt.split(' ');
      month = (months[parts[0]] || abbr[parts[0]]);
      temp = parts[1] + '-' + (month < 10 ? '0' + month : month.toString());
      return moment temp, 'YYYY-MM'
    else if /^\d{4}-\d{1,2}$/.test(dt) # "2015-03", "1998-4"
      return moment dt, 'YYYY-MM'
    else if /^\s*\d{4}\s*$/.test(dt) # "2015"
      return moment dt, 'YYYY'
    else if /^\s*$/.test(dt) # "", " "
      return moment()
    else
      mt = moment dt
      if mt.isValid()
        return mt
      if throws
        throw 'Invalid date format encountered.'
      return null
  else
    if !dt
      return moment()
    else if dt.isValid and dt.isValid()
      return dt
    if throws
      throw 'Unknown date object encountered.'
    return null
