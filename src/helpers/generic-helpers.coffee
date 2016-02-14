###*
Generic template helper definitions for HackMyResume / FluentCV.
@license MIT. See LICENSE.md for details.
@module helpers/generic-helpers
###



MD = require 'marked'
H2W = require '../utils/html-to-wpml'
XML = require 'xml-escape'
FluentDate = require '../core/fluent-date'
HMSTATUS = require '../core/status-codes'
moment = require 'moment'
FS = require 'fs'
LO = require 'lodash'
PATH = require 'path'
printf = require 'printf'
_ = require 'underscore'
unused = require '../utils/string'



###* Generic template helper function definitions. ###
GenericHelpers = module.exports =



  ###*
  Emit a formatted string representing the specified datetime.
  Convert the input date to the specified format through Moment.js. If date is
  valid, return the formatted date string. If date is null, undefined, or other
  falsy value, return the value of the 'fallback' parameter, if specified, or
  null if no fallback was specified. If date is invalid, but not null/undefined/
  falsy, return it as-is.
  @param {string|Moment} datetime A date value.
  @param {string} [dtFormat='YYYY-MM'] The desired datetime format. Must be a
  Moment.js-compatible datetime format.
  @param {string|Moment} fallback A fallback value to use if the specified date
  is null, undefined, or falsy.
  ###
  formatDate: (datetime, dtFormat, fallback) ->

    datetime ?= undefined
    dtFormat ?= 'YYYY-MM'

    # If a Moment.js object was passed in, just call format on it
    if datetime and moment.isMoment datetime
      return datetime.format dtFormat

    if String.is datetime
      # If a string was passed in, convert to Moment using the 2-paramter
      # constructor with an explicit format string.
      momentDate = moment datetime, dtFormat
      return momentDate.format(dtFormat) if momentDate.isValid()

      # If that didn't work, try again with the single-parameter constructor
      # but this may throw a deprecation warning
      momentDate = moment datetime
      return momentDate.format(dtFormat) if momentDate.isValid()

    # We weren't able to format the provided datetime. Now do one of three
    # things.
    #   1. If datetime is non-null/non-falsy, return it. For this helper,
    # string date values that we can't parse are assumed to be display dates.
    #   2. If datetime IS null or falsy, use the value from the fallback.
    #   3. If the fallback value is specifically 'true', emit 'Present'.
    datetime ||
      if typeof fallback == 'string'
      then fallback
      else (if fallback == true then 'Present' else '')



  ###*
  Emit a formatted string representing the specified datetime.
  @param {string} dateValue A raw date value from the FRESH or JRS resume.
  @param {string} [dateFormat='YYYY-MM'] The desired datetime format. Must be
  compatible with Moment.js datetime formats.
  @param {string} [dateDefault=null] The default date value to use if the dateValue
  parameter is null, undefined, or falsy.
  ###
  date: (dateValue, dateFormat, dateDefault) ->

    dateDefault = 'Current' if !dateDefault or !String.is dateDefault
    dateFormat = 'YYYY-MM' if !dateFormat or !String.is dateFormat
    dateValue = null if !dateValue or !String.is dateValue
    return dateDefault if !dateValue

    reserved = ['current', 'present', 'now']
    dateValueSafe = dateValue.trim().toLowerCase();
    return dateValue if _.contains reserved, dateValueSafe

    dateValueMoment = moment dateValue, dateFormat
    return dateValueMoment.format dateFormat if dateValueMoment.isValid()
    dateValue



  ###*
  Given a resume sub-object with a start/end date, format a representation of
  the date range.
  ###
  dateRange: ( obj, fmt, sep, fallback ) ->
    return '' if !obj
    _fromTo obj.start, obj.end, fmt, sep, fallback



  ###*
  Format a from/to date range for display.
  @method toFrom
  ###
  fromTo: () -> _fromTo.apply this, arguments



  ###*
  Return a named color value as an RRGGBB string.
  @method toFrom
  ###
  color: ( colorName, colorDefault ) ->
    # Key must be specified
    if !(colorName and colorName.trim())
      _reportError HMSTATUS.invalidHelperUse,
        helper: 'fontList', error: HMSTATUS.missingParam, expected: 'name'
    else
      return colorDefault if !GenericHelpers.theme.colors
      ret = GenericHelpers.theme.colors[ colorName ]
      if !(ret && ret.trim())
        return colorDefault
      ret



  ###*
  Emit the size of the specified named font.
  @param key {String} A named style from the "fonts" section of the theme's
  theme.json file. For example: 'default' or 'heading1'.
  ###
  fontSize: ( key, defSize, units ) ->

    ret = ''
    hasDef = defSize && ( String.is( defSize ) || _.isNumber( defSize ))

    # Key must be specified
    if !(key && key.trim())
      _reportError( HMSTATUS.invalidHelperUse, {
        helper: 'fontSize', error: HMSTATUS.missingParam, expected: 'key'
      })
      return ret

    else if GenericHelpers.theme.fonts
      fontSpec = LO.get( GenericHelpers.theme.fonts, this.format + '.' + key )
      if !fontSpec
        # Check for an "all" format
        if GenericHelpers.theme.fonts.all
          fontSpec = GenericHelpers.theme.fonts.all[ key ]
      if( fontSpec )
        # fontSpec can be a string, an array, or an object
        if( String.is( fontSpec ))
          # No font size was specified, only a font family.
        else if( _.isArray( fontSpec ))
          # An array of fonts were specified. Each one could be a string
          # or an object
          if( !String.is( fontSpec[0] ))
            ret = fontSpec[0].size
        else
          # A font description object.
          ret = fontSpec.size

    # We weren't able to lookup the specified key. Default to defFont.
    if !ret
      if hasDef
        ret = defSize
      else
        _reportError( HMSTATUS.invalidHelperUse, {
          helper: 'fontSize', error: HMSTATUS.missingParam,
          expected: 'defSize'})
        ret = ''

    ret



  ###*
  Emit the font face (such as 'Helvetica' or 'Calibri') associated with the
  provided key.
  @param key {String} A named style from the "fonts" section of the theme's
  theme.json file. For example: 'default' or 'heading1'.
  @param defFont {String} The font to use if the specified key isn't present.
  Can be any valid font-face name such as 'Helvetica Neue' or 'Calibri'.
  ###
  fontFace: ( key, defFont ) ->

    ret = ''
    hasDef = defFont && String.is( defFont )

    # Key must be specified
    if !( key && key.trim())
      _reportError( HMSTATUS.invalidHelperUse, {
        helper: 'fontFace', error: HMSTATUS.missingParam, expected: 'key'
      })
      return ret

    # If the theme has a "fonts" section, lookup the font face.
    else if( GenericHelpers.theme.fonts )
      fontSpec = LO.get( GenericHelpers.theme.fonts, this.format + '.' + key)
      if !fontSpec
        # Check for an "all" format
        if GenericHelpers.theme.fonts.all
          fontSpec = GenericHelpers.theme.fonts.all[ key ]

      if fontSpec
        # fontSpec can be a string, an array, or an object
        if String.is fontSpec
          ret = fontSpec
        else if _.isArray fontSpec
          # An array of fonts were specified. Each one could be a string
          # or an object
          ret = if String.is( fontSpec[0] ) then fontSpec[0] else fontSpec[0].name
        else
          # A font description object.
          ret = fontSpec.name;


    # We weren't able to lookup the specified key. Default to defFont.
    if !(ret && ret.trim())
      ret = defFont
      if !hasDef
        _reportError( HMSTATUS.invalidHelperUse, {
          helper: 'fontFace', error: HMSTATUS.missingParam,
          expected: 'defFont'});
        ret = '';

    return ret;



  ###*
  Emit a comma-delimited list of font names suitable associated with the
  provided key.
  @param key {String} A named style from the "fonts" section of the theme's
  theme.json file. For example: 'default' or 'heading1'.
  @param defFontList {Array} The font list to use if the specified key isn't
  present. Can be an array of valid font-face name such as 'Helvetica Neue'
  or 'Calibri'.
  @param sep {String} The default separator to use in the rendered output.
  Defaults to ", " (comma with a space).
  ###
  fontList: ( key, defFontList, sep ) ->

    ret = ''
    hasDef = defFontList && String.is( defFontList )

    # Key must be specified
    if !( key && key.trim())
      _reportError( HMSTATUS.invalidHelperUse, {
        helper: 'fontList', error: HMSTATUS.missingParam, expected: 'key'
      });

    # If the theme has a "fonts" section, lookup the font list.
    else if GenericHelpers.theme.fonts
      fontSpec = LO.get GenericHelpers.theme.fonts, this.format + '.' + key
      if !fontSpec
        if GenericHelpers.theme.fonts.all
          fontSpec = GenericHelpers.theme.fonts.all[ key ]

      if fontSpec
        # fontSpec can be a string, an array, or an object
        if String.is fontSpec
          ret = fontSpec
        else if _.isArray fontSpec
          # An array of fonts were specified. Each one could be a string
          # or an object
          fontSpec = fontSpec.map ( ff ) ->
            "'" + (if String.is( ff ) then ff else ff.name) + "'"
          ret = fontSpec.join( if sep == undefined then ', ' else (sep || '') )
        else
          # A font description object.
          ret = fontSpec.name

    # The key wasn't found in the "fonts" section. Default to defFont.
    if !(ret && ret.trim())
      if !hasDef
        _reportError( HMSTATUS.invalidHelperUse, {
          helper: 'fontList', error: HMSTATUS.missingParam,
          expected: 'defFontList'})
        ret = ''
      else
        ret = defFontList

    return ret;



  ###*
  Capitalize the first letter of the word. TODO: Rename
  @method section
  ###
  camelCase: (val) ->
    val = (val && val.trim()) || ''
    return if val then (val.charAt(0).toUpperCase() + val.slice(1)) else val



  ###*
  Display a user-overridable section title for a FRESH resume theme. Use this in
  lieue of hard-coding section titles.

  Usage:

      {{sectionTitle "sectionName"}}
      {{sectionTitle "sectionName" "sectionTitle"}}

  Example:

      {{sectionTitle "Education"}}
      {{sectionTitle "Employment" "Project History"}}

  @param sect_name The name of the section being title. Must be one of the
  top-level FRESH resume sections ("info", "education", "employment", etc.).
  @param sect_title The theme-specified section title. May be replaced by the
  user.
  @method sectionTitle
  ###
  sectionTitle: ( sname, stitle ) ->

    # If not provided by the user, stitle should default to sname. ps.
    # Handlebars silently passes in the options object to the last param,
    # where in Underscore stitle will be null/undefined, so we check both.
    stitle = (stitle && String.is(stitle) && stitle) || sname

    # If there's a section title override, use it.
    ( this.opts.stitles &&
      this.opts.stitles[ sname.toLowerCase().trim() ] ) ||
      stitle;



  ###* Convert inline Markdown to inline WordProcessingML. ###
  wpml: ( txt, inline ) ->
    return '' if !txt
    inline = (inline && !inline.hash) || false
    txt = XML(txt.trim())
    txt = if inline then MD(txt).replace(/^\s*<p>|<\/p>\s*$/gi, '') else MD(txt)
    txt = H2W( txt )
    return txt



  ###*
  Emit a conditional link.
  @method link
  ###
  link: ( text, url ) ->
    return if url && url.trim() then ('<a href="' + url + '">' + text + '</a>') else text



  ###*
  Return the last word of the specified text.
  @method lastWord
  ###
  lastWord: ( txt ) ->
    return if txt && txt.trim() then _.last( txt.split(' ') ) else ''



  ###*
  Convert a skill level to an RGB color triplet. TODO: refactor
  @method skillColor
  @param lvl Input skill level. Skill level can be expressed as a string
  ("beginner", "intermediate", etc.), as an integer (1,5,etc), as a string
  integer ("1", "5", etc.), or as an RRGGBB color triplet ('#C00000',
  '#FFFFAA').
  ###
  skillColor: ( lvl ) ->
    idx = skillLevelToIndex lvl
    skillColors = (this.theme && this.theme.palette &&
      this.theme.palette.skillLevels) ||
      [ '#FFFFFF', '#5CB85C', '#F1C40F', '#428BCA', '#C00000' ]
    return skillColors[idx]



  ###*
  Return an appropriate height. TODO: refactor
  @method lastWord
  ###
  skillHeight: ( lvl ) ->
    idx = skillLevelToIndex lvl
    ['38.25', '30', '16', '8', '0'][idx]



  ###*
  Return all but the last word of the input text.
  @method initialWords
  ###
  initialWords: ( txt ) ->
    if txt && txt.trim() then _.initial( txt.split(' ') ).join(' ') else ''



  ###*
  Trim the protocol (http or https) from a URL/
  @method trimURL
  ###
  trimURL: ( url ) ->
    if url && url.trim() then url.trim().replace(/^https?:\/\//i, '') else ''



  ###*
  Convert text to lowercase.
  @method toLower
  ###
  toLower: ( txt ) -> if txt && txt.trim() then txt.toLowerCase() else ''



  ###*
  Convert text to lowercase.
  @method toLower
  ###
  toUpper: ( txt ) -> if txt && txt.trim() then txt.toUpperCase() else ''



  ###*
  Conditional stylesheet link. Creates a link to the specified stylesheet with
  <link> or embeds the styles inline with <style></style>, depending on the
  theme author's and user's preferences.
  @param url {String} The path to the CSS file.
  @param linkage {String} The default link method. Can be either `embed` or
  `link`. If omitted, defaults to `embed`. Can be overridden by the `--css`
  command-line switch.
  ###
  styleSheet: ( url, linkage ) ->

    # Establish the linkage style
    linkage = this.opts.css || linkage || 'embed';

    # Create the <link> or <style> tag
    ret = ''
    if linkage == 'link'
      ret = printf('<link href="%s" rel="stylesheet" type="text/css">', url)
    else
      rawCss = FS.readFileSync(
        PATH.join( this.opts.themeObj.folder, '/src/', url ), 'utf8' )
      renderedCss = this.engine.generateSimple( this, rawCss )
      ret = printf('<style>%s</style>', renderedCss )

    # If the currently-executing template is inherited, append styles
    if this.opts.themeObj.inherits && this.opts.themeObj.inherits.html && this.format == 'html'
      ret +=
      if (linkage == 'link')
      then '<link href="' + this.opts.themeObj.overrides.path + '" rel="stylesheet" type="text/css">'
      else '<style>' + this.opts.themeObj.overrides.data + '</style>'

    # TODO: It would be nice to use Handlebar.SafeString here, but these
    # are supposed to be generic helpers. Provide an equivalent, or expose
    # it when Handlebars is the chosen engine, which is most of the time.
    ret



  ###*
  Perform a generic comparison.
  See: http://doginthehat.com.au/2012/02/comparison-block-helper-for-handlebars-templates
  @method compare
  ###
  compare: (lvalue, rvalue, options) ->
    if arguments.length < 3
      throw new Error "Template helper 'compare' needs 2 parameters"
    operator = options.hash.operator || "=="
    operators =
        '==':       (l,r) -> l == r
        '===':      (l,r) -> l == r
        '!=':       (l,r) -> l != r
        '<':        (l,r) -> l < r
        '>':        (l,r) -> l > r
        '<=':       (l,r) -> l <= r
        '>=':       (l,r) -> l >= r
        'typeof':   (l,r) -> typeof l == r
    if !operators[operator]
      throw new Error("Helper 'compare' doesn't know the operator "+operator)
    result = operators[operator]( lvalue, rvalue )
    return if result then options.fn(this) else options.inverse(this)



  pad: (stringOrArray, padAmount, unused ) ->
    stringOrArray = stringOrArray || ''
    padAmount = padAmount || 0
    ret = ''
    PAD = require 'string-padding'
    if !String.is stringOrArray
      ret = stringOrArray
        .map (line) -> PAD line, line.length + Math.abs(padAmount), null, if padAmount < 0 then PAD.LEFT else PAD.RIGHT
        .join '\n'
    else
      ret = PAD stringOrArray, stringOrArray.length + Math.abs(padAmount), null, if padAmount < 0 then PAD.LEFT else PAD.RIGHT
    ret



###*
Report an error to the outside world without throwing an exception. Currently
relies on kludging the running verb into. opts.
###
_reportError = ( code, params ) ->
  GenericHelpers.opts.errHandler.err( code, params )



###*
Format a from/to date range for display.
###
_fromTo = ( dateA, dateB, fmt, sep, fallback ) ->
  # Prevent accidental use of safe.start, safe.end, safe.date
  # The dateRange helper is for raw dates only
  if moment.isMoment( dateA ) || moment.isMoment( dateB )
    _reportError( HMSTATUS.invalidHelperUse, { helper: 'dateRange' } )
    return ''

  dateFrom = null
  dateTo = null
  dateTemp = null

  # Check for 'current', 'present', 'now', '', null, and undefined
  dateA = dateA || ''
  dateB = dateB || ''
  dateATrim = dateA.trim().toLowerCase()
  dateBTrim = dateB.trim().toLowerCase()
  reserved = ['current','present','now', '']

  fmt = (fmt && String.is(fmt) && fmt) || 'YYYY-MM'
  sep = (sep && String.is(sep) && sep) || ' — '

  if _.contains( reserved, dateATrim )
    dateFrom = fallback || '???'
  else
    dateTemp = FluentDate.fmt( dateA )
    dateFrom = dateTemp.format( fmt )

  if _.contains( reserved, dateBTrim )
    dateTo = fallback || 'Present'
  else
    dateTemp = FluentDate.fmt( dateB )
    dateTo = dateTemp.format( fmt )

  if dateFrom && dateTo
    return dateFrom + sep + dateTo
  else if dateFrom || dateTo
    return dateFrom || dateTo
  return ''



skillLevelToIndex = ( lvl ) ->
  idx = 0
  if String.is( lvl )
    lvl = lvl.trim().toLowerCase()
    intVal = parseInt( lvl )
    if isNaN intVal
      switch lvl
        when 'beginner' then idx = 1
        when 'intermediate' then idx = 2
        when 'advanced' then idx = 3
        when 'master' then idx = 4
    else
      idx = Math.min( intVal / 2, 4 )
      idx = Math.max( 0, idx )
  else
    idx = Math.min( lvl / 2, 4 )
    idx = Math.max( 0, idx )
  idx



# Note [1] --------------------------------------------------------------------
# Make sure it's precisely a string or array since some template engines jam
# their options/context object into the last parameter and we are allowing the
# defFont parameter to be omitted in certain cases. This is a little kludgy,
# but works fine for this case. If we start doing this regularly, we should
# rebind these parameters.

# Note [2]: -------------------------------------------------------------------
# If execution reaches here, some sort of cosmic ray or sunspot has landed on
# HackMyResume, or a theme author is deliberately messing with us by doing
# something like:
#
# "fonts": {
#   "default": "",
#   "heading1": null
# }
#
# Rather than sort it out, we'll just fall back to defFont.
