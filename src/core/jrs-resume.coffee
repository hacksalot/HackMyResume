###*
Definition of the JRSResume class.
@license MIT. See LICENSE.md for details.
@module core/jrs-resume
###



FS = require('fs')
extend = require('extend')
validator = require('is-my-json-valid')
_ = require('underscore')
PATH = require('path')
MD = require('marked')
CONVERTER = require('fresh-jrs-converter')
moment = require('moment')
AbstractResume = require('./abstract-resume')


###*
A JRS resume or CV. JRS resumes are backed by JSON, and each JRSResume object
is an instantiation of that JSON decorated with utility methods.
@class JRSResume
###
class JRSResume extends AbstractResume



  ###* Initialize the the JSResume from string. ###
  parse: ( stringData, opts ) ->
    @imp = @imp ? raw: stringData
    this.parseJSON JSON.parse( stringData ), opts



  ###*
  Initialize the JRSResume object from JSON.
  Open and parse the specified JRS resume. Merge the JSON object model onto
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
    opts = opts || { };

    # Ignore any element with the 'ignore: true' designator.
    that = this
    traverse = require 'traverse'
    ignoreList = []
    scrubbed = traverse( rep ).map ( x ) ->
      if !@isLeaf && @node.ignore
        if  @node.ignore == true || this.node.ignore == 'true'
          ignoreList.push @node
          @remove()

    # Extend resume properties onto ourself.
    extend true, this, scrubbed

    # Set up metadata
    if !@imp?.processed
      # Set up metadata TODO: Clean up metadata on the object model.
      opts = opts || { }
      if opts.imp == undefined || opts.imp
        @imp = @imp || { }
        @imp.title = (opts.title || @imp.title) || @basics.name
        unless @imp.raw
          @imp.raw = JSON.stringify rep
      @imp.processed = true
    # Parse dates, sort dates, and calculate computed values
    (opts.date == undefined || opts.date) && _parseDates.call( this )
    (opts.sort == undefined || opts.sort) && this.sort()
    if opts.compute == undefined || opts.compute
      @basics.computed =
        numYears: this.duration()
        keywords: this.keywords()
    @



  ###* Save the sheet to disk (for environments that have disk access). ###
  save: ( filename ) ->
    @imp.file = filename || @imp.file
    FS.writeFileSync @imp.file, @stringify( this ), 'utf8'
    @



  ###* Save the sheet to disk in a specific format, either FRESH or JRS. ###
  saveAs: ( filename, format ) ->
    if format == 'JRS'
      @imp.file = filename || @imp.file;
      FS.writeFileSync( @imp.file, @stringify(), 'utf8' );
    else
      newRep = CONVERTER.toFRESH @
      stringRep = CONVERTER.toSTRING newRep
      FS.writeFileSync filename, stringRep, 'utf8'
    @



  ###* Return the resume format. ###
  format: () -> 'JRS'



  stringify: () -> JRSResume.stringify( @ )



  ###* Return a unique list of all keywords across all skills. ###
  keywords: () ->
    flatSkills = []
    if @skills && this.skills.length
      @skills.forEach ( s ) -> flatSkills = _.union flatSkills, s.keywords
    flatSkills



  ###*
  Return internal metadata. Create if it doesn't exist.
  JSON Resume v0.0.0 doesn't allow additional properties at the root level,
  so tuck this into the .basic sub-object.
  ###
  i: () ->
    @imp = @imp ? { }



  ###* Reset the sheet to an empty state. ###
  clear = ( clearMeta ) ->
    clearMeta = ((clearMeta == undefined) && true) || clearMeta;
    delete this.imp if clearMeta
    delete this.basics.computed # Don't use Object.keys() here
    delete this.work
    delete this.volunteer
    delete this.education
    delete this.awards
    delete this.publications
    delete this.interests
    delete this.skills
    delete this.basics.profiles



  ###* Add work experience to the sheet. ###
  add: ( moniker ) ->
    defSheet = JRSResume.default()
    newObject = $.extend( true, {}, defSheet[ moniker ][0] )
    this[ moniker ] = this[ moniker ] || []
    this[ moniker ].push( newObject )
    newObject



  ###* Determine if the sheet includes a specific social profile (eg, GitHub). ###
  hasProfile: ( socialNetwork ) ->
    socialNetwork = socialNetwork.trim().toLowerCase()
    return @basics.profiles && _.some @basics.profiles, (p) ->
      return p.network.trim().toLowerCase() == socialNetwork



  ###* Determine if the sheet includes a specific skill. ###
  hasSkill: ( skill ) ->
    skill = skill.trim().toLowerCase()
    return this.skills && _.some this.skills, (sk) ->
      return sk.keywords && _.some sk.keywords, (kw) ->
        kw.trim().toLowerCase() == skill



  ###* Validate the sheet against the JSON Resume schema. ###
  isValid: ( ) -> # TODO: ↓ fix this path ↓
    schema = FS.readFileSync PATH.join( __dirname, 'resume.json' ), 'utf8'
    schemaObj = JSON.parse schema
    validator = require 'is-my-json-valid'
    validate = validator( schemaObj, { # Note [1]
      formats: { date: /^\d{4}(?:-(?:0[0-9]{1}|1[0-2]{1})(?:-[0-9]{2})?)?$/ }
    });
    temp = @imp
    delete @imp
    ret = validate @
    @imp = temp
    if !ret
      @imp = @imp || { };
      @imp.validationErrors = validate.errors;
    ret



  duration: (unit) ->
    super('work', 'startDate', 'endDate', unit)



  ###*
  Sort dated things on the sheet by start date descending. Assumes that dates
  on the sheet have been processed with _parseDates().
  ###
  sort: ( ) ->

    byDateDesc = (a,b) ->
      if a.safeStartDate.isBefore(b.safeStartDate)
      then 1
      else ( a.safeStartDate.isAfter(b.safeStartDate) && -1 ) || 0

    @work && @work.sort byDateDesc
    @education && @education.sort byDateDesc
    @volunteer && @volunteer.sort byDateDesc

    @awards && @awards.sort (a, b) ->
      if a.safeDate.isBefore b.safeDate
      then 1
      else (a.safeDate.isAfter(b.safeDate) && -1 ) || 0;

    @publications && @publications.sort (a, b) ->
      if ( a.safeReleaseDate.isBefore(b.safeReleaseDate) )
      then 1
      else ( a.safeReleaseDate.isAfter(b.safeReleaseDate) && -1 ) || 0



  dupe: () ->
    rnew = new JRSResume()
    rnew.parse this.stringify(), { }
    rnew



  ###*
  Create a copy of this resume in which all fields have been interpreted as
  Markdown.
  ###
  harden: () ->

    that = @
    ret = @dupe()

    HD = (txt) -> '@@@@~' + txt + '~@@@@'

    HDIN = (txt) ->
      #return MD(txt || '' ).replace(/^\s*<p>|<\/p>\s*$/gi, '');
      return HD txt

    # TODO: refactor recursion
    hardenStringsInObject = ( obj, inline ) ->

      return if !obj
      inline = inline == undefined || inline

      if Object.prototype.toString.call( obj ) == '[object Array]'
        obj.forEach (elem, idx, ar) ->
          if typeof elem == 'string' || elem instanceof String
            ar[idx] = if inline then HDIN(elem) else HD( elem )
          else
            hardenStringsInObject elem
      else if typeof obj == 'object'
        Object.keys( obj ).forEach (key) ->
          sub = obj[key]
          if typeof sub == 'string' || sub instanceof String
            if _.contains(['skills','url','website','startDate','endDate',
              'releaseDate','date','phone','email','address','postalCode',
              'city','country','region'], key)
              return
            if key == 'summary'
              obj[key] = HD( obj[key] )
            else
              obj[key] = if inline then HDIN( obj[key] ) else HD( obj[key] )
          else
            hardenStringsInObject sub


    Object.keys( ret ).forEach (member) ->
      hardenStringsInObject ret[ member ]

    ret



###* Get the default (empty) sheet. ###
JRSResume.default = () ->
  new JRSResume().parseJSON require('fresh-resume-starter').jrs



###*
Convert this object to a JSON string, sanitizing meta-properties along the
way. Don't override .toString().
###
JRSResume.stringify = ( obj ) ->
  replacer = ( key,value ) -> # Exclude these keys from stringification
    temp = _.some ['imp', 'warnings', 'computed', 'filt', 'ctrl', 'index',
      'safeStartDate', 'safeEndDate', 'safeDate', 'safeReleaseDate', 'result',
      'isModified', 'htmlPreview', 'display_progress_bar'],
      ( val ) -> return key.trim() == val
    return if temp then undefined else value
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

  @work && @work.forEach (job) ->
    job.safeStartDate = _fmt( job.startDate )
    job.safeEndDate = _fmt( job.endDate )
  @education && @education.forEach (edu) ->
    edu.safeStartDate = _fmt( edu.startDate )
    edu.safeEndDate = _fmt( edu.endDate )
  @volunteer && @volunteer.forEach (vol) ->
    vol.safeStartDate = _fmt( vol.startDate )
    vol.safeEndDate = _fmt( vol.endDate )
  @awards && @awards.forEach (awd) ->
    awd.safeDate = _fmt( awd.date )
  @publications && @publications.forEach (pub) ->
    pub.safeReleaseDate = _fmt( pub.releaseDate )



###*
Export the JRSResume function/ctor.
###
module.exports = JRSResume
