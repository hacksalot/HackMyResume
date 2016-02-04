###*
Definition of the FRESHResume class.
@license MIT. See LICENSE.md for details.
@module core/fresh-resume
###



FS = require 'fs'
extend = require 'extend'
validator = require 'is-my-json-valid'
_ = require 'underscore'
__ = require 'lodash'
PATH = require 'path'
moment = require 'moment'
XML = require 'xml-escape'
MD = require 'marked'
CONVERTER = require 'fresh-jrs-converter'
JRSResume = require './jrs-resume'
FluentDate = require './fluent-date'
AbstractResume = require './abstract-resume'



###*
A FRESH resume or CV. FRESH resumes are backed by JSON, and each FreshResume
object is an instantiation of that JSON decorated with utility methods.
@constructor
###
class FreshResume extends AbstractResume



  ###* Initialize the the FreshResume from JSON string data. ###
  parse: ( stringData, opts ) ->
    @imp = @imp ? raw: stringData
    this.parseJSON JSON.parse( stringData ), opts



  ###*
  Initialize the FreshResume from JSON.
  Open and parse the specified FRESH resume. Merge the JSON object model onto
  this Sheet instance with extend() and convert sheet dates to a safe &
  consistent format. Then sort each section by startDate descending.
  @param rep {Object} The raw JSON representation.
  @param opts {Object} Resume loading and parsing options.
  {
    date: Perform safe date conversion.
    sort: Sort resume items by date.
    compute: Prepare computed resume totals.
  }
  ###
  parseJSON: ( rep, opts ) ->

    # Ignore any element with the 'ignore: true' designator.
    that = @
    traverse = require 'traverse'
    ignoreList = []
    scrubbed = traverse( rep ).map ( x ) ->
      if !@isLeaf && @node.ignore
        if @node.ignore == true || this.node.ignore == 'true'
          ignoreList.push this.node
          @remove()

    # Now apply the resume representation onto this object
    extend( true, @, scrubbed );

    # If the resume has already been processed, then we are being called from
    # the .dupe method, and there's no need to do any post processing
    if !@imp?.processed
      # Set up metadata TODO: Clean up metadata on the object model.
      opts = opts || { }
      if opts.imp == undefined || opts.imp
        @imp = @imp || { }
        @imp.title = (opts.title || @imp.title) || @name
        unless @imp.raw
          @imp.raw = JSON.stringify rep
      @imp.processed = true
      # Parse dates, sort dates, and calculate computed values
      (opts.date == undefined || opts.date) && _parseDates.call( this );
      (opts.sort == undefined || opts.sort) && this.sort();
      (opts.compute == undefined || opts.compute) && (@computed = {
         numYears: this.duration(),
         keywords: this.keywords()
      });

    @



  ###* Save the sheet to disk (for environments that have disk access). ###
  save: ( filename ) ->
    @imp.file = filename || @imp.file
    FS.writeFileSync @imp.file, @stringify(), 'utf8'
    @



  ###*
  Save the sheet to disk in a specific format, either FRESH or JSON Resume.
  ###
  saveAs: ( filename, format ) ->
    if format != 'JRS'
      @imp.file = filename || @imp.file
      FS.writeFileSync @imp.file, @stringify(), 'utf8'
    else
      newRep = CONVERTER.toJRS this
      FS.writeFileSync filename, JRSResume.stringify( newRep ), 'utf8'
    @



  ###*
  Duplicate this FreshResume instance.
  This method first extend()s this object onto an empty, creating a deep copy,
  and then passes the result into a new FreshResume instance via .parseJSON.
  We do it this way to create a true clone of the object without re-running any
  of the associated processing.
  ###
  dupe: () ->
    jso = extend true, { }, @
    rnew = new FreshResume()
    rnew.parseJSON jso, { }
    rnew



  ###*
  Convert this object to a JSON string, sanitizing meta-properties along the
  way.
  ###
  stringify: () -> FreshResume.stringify @



  ###*
  Create a copy of this resume in which all string fields have been run through
  a transformation function (such as a Markdown filter or XML encoder).
  TODO: Move this out of FRESHResume.
  ###
  transformStrings: ( filt, transformer ) ->
    ret = this.dupe()
    trx = require '../utils/string-transformer'
    trx ret, filt, transformer



  ###*
  Create a copy of this resume in which all fields have been interpreted as
  Markdown.
  ###
  markdownify: () ->

    MDIN = ( txt ) ->
      return MD(txt || '' ).replace(/^\s*<p>|<\/p>\s*$/gi, '')

    trx = ( key, val ) ->
      if key == 'summary'
        return MD val
      MDIN(val)

    return @transformStrings ['skills','url','start','end','date'], trx



  ###*
  Create a copy of this resume in which all fields have been interpreted as
  Markdown.
  ###
  xmlify: () ->
    trx = (key, val) -> XML val
    return @transformStrings [], trx



  ###* Return the resume format. ###
  format: () -> 'FRESH'



  ###*
  Return internal metadata. Create if it doesn't exist.
  ###
  i: () -> this.imp = this.imp || { }



  ###* Return a unique list of all keywords across all skills. ###
  keywords: () ->
    flatSkills = []
    if @skills
      if @skills.sets
        flatSkills = @skills.sets.map((sk) -> sk.skills ).reduce( (a,b) -> a.concat(b) )
      else if @skills.list
        flatSkills = flatSkills.concat( this.skills.list.map (sk) -> return sk.name )
      flatSkills = _.uniq flatSkills
    flatSkills



  ###*
  Reset the sheet to an empty state. TODO: refactor/review
  ###
  clear: ( clearMeta ) ->
    clearMeta = ((clearMeta == undefined) && true) || clearMeta
    delete this.imp if clearMeta
    delete this.computed # Don't use Object.keys() here
    delete this.employment
    delete this.service
    delete this.education
    delete this.recognition
    delete this.reading
    delete this.writing
    delete this.interests
    delete this.skills
    delete this.social



  ###*
  Get a safe count of the number of things in a section.
  ###
  count: ( obj ) ->
    return 0 if !obj
    return obj.history.length if obj.history
    return obj.sets.length if obj.sets
    obj.length || 0;



  ###* Add work experience to the sheet. ###
  add: ( moniker ) ->
    defSheet = FreshResume.default()
    newObject =
      if defSheet[moniker].history
      then $.extend( true, {}, defSheet[ moniker ].history[0] )
      else
        if moniker == 'skills'
        then $.extend( true, {}, defSheet.skills.sets[0] )
        else $.extend( true, {}, defSheet[ moniker ][0] )

    @[ moniker ] = @[ moniker ] || []
    if @[ moniker ].history
      @[ moniker ].history.push newObject
    else if moniker == 'skills'
      @skills.sets.push newObject
    else
      @[ moniker ].push newObject
    newObject



  ###*
  Determine if the sheet includes a specific social profile (eg, GitHub).
  ###
  hasProfile: ( socialNetwork ) ->
    socialNetwork = socialNetwork.trim().toLowerCase()
    @social && _.some @social, (p) ->
      p.network.trim().toLowerCase() == socialNetwork



  ###* Return the specified network profile. ###
  getProfile: ( socialNetwork ) ->
    socialNetwork = socialNetwork.trim().toLowerCase()
    @social && _.find @social, (sn) ->
      sn.network.trim().toLowerCase() == socialNetwork



  ###*
  Return an array of profiles for the specified network, for when the user
  has multiple eg. GitHub accounts.
  ###
  getProfiles: ( socialNetwork ) ->
    socialNetwork = socialNetwork.trim().toLowerCase()
    @social && _.filter @social, (sn) ->
      sn.network.trim().toLowerCase() == socialNetwork



  ###* Determine if the sheet includes a specific skill. ###
  hasSkill: ( skill ) ->
    skill = skill.trim().toLowerCase()
    @skills && _.some @skills, (sk) ->
      sk.keywords && _.some sk.keywords, (kw) ->
        kw.trim().toLowerCase() == skill



  ###* Validate the sheet against the FRESH Resume schema. ###
  isValid: ( info ) ->
    schemaObj = require 'fresca'
    validator = require 'is-my-json-valid'
    validate = validator( schemaObj, { # See Note [1].
      formats: { date: /^\d{4}(?:-(?:0[0-9]{1}|1[0-2]{1})(?:-[0-9]{2})?)?$/ }
    })
    ret = validate @
    if !ret
      this.imp = this.imp || { };
      this.imp.validationErrors = validate.errors;
    ret



  duration: (unit) ->
    super('employment.history', 'start', 'end', unit)



  ###*
  Sort dated things on the sheet by start date descending. Assumes that dates
  on the sheet have been processed with _parseDates().
  ###
  sort: () ->

    byDateDesc = (a,b) ->
      if a.safe.start.isBefore(b.safe.start)
      then 1
      else ( if a.safe.start.isAfter(b.safe.start) then -1 else 0 )

    sortSection = ( key ) ->
      ar = __.get this, key
      if ar && ar.length
        datedThings = obj.filter (o) -> o.start
        datedThings.sort( byDateDesc );

    sortSection 'employment.history'
    sortSection 'education.history'
    sortSection 'service.history'
    sortSection 'projects'

    @writing && @writing.sort (a, b) ->
      if a.safe.date.isBefore b.safe.date
      then 1
      else ( a.safe.date.isAfter(b.safe.date) && -1 ) || 0



###*
Get the default (starter) sheet.
###
FreshResume.default = () ->
  new FreshResume().parseJSON require('fresh-resume-starter').fresh



###*
Convert the supplied FreshResume to a JSON string, sanitizing meta-properties
along the way.
###
FreshResume.stringify = ( obj ) ->
  replacer = ( key,value ) -> # Exclude these keys from stringification
    exKeys = ['imp', 'warnings', 'computed', 'filt', 'ctrl', 'index',
      'safe', 'result', 'isModified', 'htmlPreview', 'display_progress_bar']
    return if _.some( exKeys, (val) -> key.trim() == val )
    then undefined else value
  JSON.stringify obj, replacer, 2



###*
Convert human-friendly dates into formal Moment.js dates for all collections.
We don't want to lose the raw textual date as entered by the user, so we store
the Moment-ified date as a separate property with a prefix of .safe. For ex:
job.startDate is the date as entered by the user. job.safeStartDate is the
parsed Moment.js date that we actually use in processing.
###
_parseDates = () ->

  _fmt = require('./fluent-date').fmt
  that = @

  # TODO: refactor recursion
  replaceDatesInObject = ( obj ) ->

    return if !obj
    if Object.prototype.toString.call( obj ) == '[object Array]'
      obj.forEach (elem) -> replaceDatesInObject( elem )
      return
    else if typeof obj == 'object'
      if obj._isAMomentObject || obj.safe
        return
      Object.keys( obj ).forEach (key) -> replaceDatesInObject obj[key]
      ['start','end','date'].forEach (val) ->
        if (obj[val] != undefined) && (!obj.safe || !obj.safe[val])
          obj.safe = obj.safe || { }
          obj.safe[ val ] = _fmt obj[val]
          if obj[val] && (val == 'start') && !obj.end
            obj.safe.end = _fmt 'current'
            return
      return
  Object.keys( this ).forEach (member) ->
    replaceDatesInObject(that[member])
    return
  return



###* Export the Sheet function/ctor. ###
module.exports = FreshResume



# Note 1: Adjust default date validation to allow YYYY and YYYY-MM formats
# in addition to YYYY-MM-DD. The original regex:
#
#     /^\d{4}-(?:0[0-9]{1}|1[0-2]{1})-[0-9]{2}$/
#
