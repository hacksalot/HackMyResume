###*
Section analysis for HackMyResume.
@license MIT. See LICENSE.md for details.
@module inspectors/totals-inspector
###

_ = require 'underscore'
FluentDate = require '../core/fluent-date'

###*
Retrieve sectional overview and summary information.
@class totalsInspector
###
totalsInspector = module.exports =

  moniker: 'totals-inspector'

  ###*
  Run the Totals Inspector on a resume.
  @method run
  @return An object containing summary information for each section on the
  resume.
  ###
  run: ( rez ) ->

    sectionTotals = { }
    _.each rez, (val, key) ->
      if _.isArray( val ) && !_.isString(val)
        sectionTotals[ key ] = val.length
      else if val.history && _.isArray( val.history )
        sectionTotals[ key ] = val.history.length;
      else if val.sets && _.isArray( val.sets )
        sectionTotals[ key ] = val.sets.length;

    totals: sectionTotals,
    numSections: Object.keys( sectionTotals ).length
