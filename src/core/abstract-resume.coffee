###*
Definition of the AbstractResume class.
@license MIT. See LICENSE.md for details.
@module core/abstract-resume
###

_ = require 'underscore'
__ = require 'lodash'
FluentDate = require('./fluent-date')

class AbstractResume

  ###*
  Compute the total duration of the work history.
  @returns The total duration of the sheet's work history, that is, the number
  of years between the start date of the earliest job on the resume and the
  *latest end date of all jobs in the work history*. This last condition is for
  sheets that have overlapping jobs.
  ###
  duration: (collKey, startKey, endKey, unit) ->
    unit = unit || 'years'
    hist = __.get @, collKey
    return 0 if !hist or !hist.length

    # BEGIN CODE DUPLICATION --> src/inspectors/gap-inspector.coffee (TODO)

    # Convert the candidate's employment history to an array of dates,
    # where each element in the array is a start date or an end date of a
    # job -- it doesn't matter which.
    new_e = hist.map ( job ) ->
      obj = _.pick( job, [startKey, endKey] )
      # Synthesize an end date if this is a "current" gig
      obj[endKey] = 'current' if !_.has obj, endKey
      if obj && (obj[startKey] || obj[endKey])
        obj = _.pairs obj
        obj[0][1] = FluentDate.fmt( obj[0][1] )
        if obj.length > 1
          obj[1][1] = FluentDate.fmt( obj[1][1] )
      obj

    # Flatten the array, remove empties, and sort
    new_e = _.filter _.flatten( new_e, true ), (v) ->
      return v && v.length && v[0] && v[0].length
    return 0 if !new_e or !new_e.length
    new_e = _.sortBy new_e, ( elem ) -> return elem[1].unix()

    # END CODE DUPLICATION

    firstDate = _.first( new_e )[1];
    lastDate = _.last( new_e )[1];
    lastDate.diff firstDate, unit

module.exports = AbstractResume
