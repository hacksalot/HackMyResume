/**
Definition of the JRSResume class.
@license MIT. See LICENSE.md for details.
@module jrs-resume.js
*/

(function() {

  var FS = require('fs')
    , extend = require('../utils/extend')
    , validator = require('is-my-json-valid')
    , _ = require('underscore')
    , PATH = require('path')
    , MD = require('marked')
    , CONVERTER = require('./convert')
    , moment = require('moment');

  /**
  The JRSResume class represent a specific JSON character sheet. When Sheet.open
  is called, we merge the loaded JSON sheet properties onto the Sheet instance
  via extend(), so a full-grown sheet object will have all of the methods here,
  plus a complement of JSON properties from the backing JSON file. That allows
  us to treat Sheet objects interchangeably with the loaded JSON model.
  @class JRSResume
  */
  function JRSResume() {

  }

  /**
  Open and parse the specified JSON resume sheet. Merge the JSON object model
  onto this Sheet instance with extend() and convert sheet dates to a safe &
  consistent format. Then sort each section by startDate descending.
  */
  JRSResume.prototype.open = function( file, title ) {
    //this.imp = { fileName: file }; <-- schema violation, tuck it into .basics instead
    this.basics = {
      imp: {
        fileName: file,
        raw: FS.readFileSync( file, 'utf8' )
      }
    };
    return this.parse( this.basics.imp.raw, title );
  };

  /**
  Save the sheet to disk (for environments that have disk access).
  */
  JRSResume.prototype.save = function( filename ) {
    this.basics.imp.fileName = filename || this.basics.imp.fileName;
    FS.writeFileSync( this.basics.imp.fileName, this.stringify( this ), 'utf8' );
    return this;
  };

  /**
  Save the sheet to disk in a specific format, either FRESH or JRS.
  */
  JRSResume.prototype.saveAs = function( filename, format ) {

    if( format === 'JRS' ) {
      this.basics.imp.fileName = filename || this.imp.fileName;
      FS.writeFileSync( this.basics.imp.fileName, this.stringify(), 'utf8' );
    }
    else {
      var newRep = CONVERTER.toFRESH( this );
      var stringRep = CONVERTER.toSTRING( newRep );
      FS.writeFileSync( filename, stringRep, 'utf8' );
    }
    return this;

  };

  /**
  Convert this object to a JSON string, sanitizing meta-properties along the
  way. Don't override .toString().
  */
  JRSResume.stringify = function( obj ) {
    function replacer( key,value ) { // Exclude these keys from stringification
      return _.some(['imp', 'warnings', 'computed', 'filt', 'ctrl', 'index',
        'safeStartDate', 'safeEndDate', 'safeDate', 'safeReleaseDate', 'result',
      'isModified', 'htmlPreview', 'display_progress_bar'],
        function( val ) { return key.trim() === val; }
      ) ? undefined : value;
    }
    return JSON.stringify( obj, replacer, 2 );
  };

  JRSResume.prototype.stringify = function() {
    return JRSResume.stringify( this );
  };

  /**
  Initialize the JRS Resume from string data.
  Open and parse the specified JSON resume sheet. Merge the JSON object model
  onto this Sheet instance with extend() and convert sheet dates to a safe &
  consistent format. Then sort each section by startDate descending.
  */
  JRSResume.prototype.parse = function( stringData, opts ) {
    opts = opts || { };
    var rep = JSON.parse( stringData );
    return this.parseJSON( rep, opts );
  };

  /**
  Initialize the JRSRume from JSON data.
  */
  JRSResume.prototype.parseJSON = function( rep, opts ) {
    opts = opts || { };
    extend( true, this, rep );
    // Set up metadata
    if( opts.imp === undefined || opts.imp ) {
      this.basics.imp = this.basics.imp || { };
      this.basics.imp.title = (opts.title || this.basics.imp.title) || this.basics.name;
      this.basics.imp.orgFormat = 'JRS';
    }
    // Parse dates, sort dates, and calculate computed values
    (opts.date === undefined || opts.date) && _parseDates.call( this );
    (opts.sort === undefined || opts.sort) && this.sort();
    (opts.compute === undefined || opts.compute) && (this.basics.computed = {
      numYears: this.duration(),
      keywords: this.keywords()
    });
    return this;
  };

  /**
  Return a unique list of all keywords across all skills.
  */
  JRSResume.prototype.keywords = function() {
    var flatSkills = [];
    if( this.skills && this.skills.length ) {
      this.skills.forEach( function( s ) {
        flatSkills = _.union( flatSkills, s.keywords );
      });
    }
    return flatSkills;
  };

  /**
  Return internal metadata. Create if it doesn't exist.
  JSON Resume v0.0.0 doesn't allow additional properties at the root level,
  so tuck this into the .basic sub-object.
  */
  JRSResume.prototype.imp = function() {
    this.basics = this.basics || { imp: { } };
    return this.basics;
  };

  /**
  Reset the sheet to an empty state.
  */
  JRSResume.prototype.clear = function( clearMeta ) {
    clearMeta = ((clearMeta === undefined) && true) || clearMeta;
    clearMeta && (delete this.imp);
    delete this.basics.computed; // Don't use Object.keys() here
    delete this.work;
    delete this.volunteer;
    delete this.education;
    delete this.awards;
    delete this.publications;
    delete this.interests;
    delete this.skills;
    delete this.basics.profiles;
  };

  /**
  Get the default (empty) sheet.
  */
  JRSResume.default = function() {
    return new JRSResume().open( PATH.join( __dirname, 'empty-jrs.json'), 'Empty' );
  };

  /**
  Add work experience to the sheet.
  */
  JRSResume.prototype.add = function( moniker ) {
    var defSheet = JRSResume.default();
    var newObject = $.extend( true, {}, defSheet[ moniker ][0] );
    this[ moniker ] = this[ moniker ] || [];
    this[ moniker ].push( newObject );
    return newObject;
  };

  /**
  Determine if the sheet includes a specific social profile (eg, GitHub).
  */
  JRSResume.prototype.hasProfile = function( socialNetwork ) {
    socialNetwork = socialNetwork.trim().toLowerCase();
    return this.basics.profiles && _.some( this.basics.profiles, function(p) {
      return p.network.trim().toLowerCase() === socialNetwork;
    });
  };

  /**
  Determine if the sheet includes a specific skill.
  */
  JRSResume.prototype.hasSkill = function( skill ) {
    skill = skill.trim().toLowerCase();
    return this.skills && _.some( this.skills, function(sk) {
      return sk.keywords && _.some( sk.keywords, function(kw) {
        return kw.trim().toLowerCase() === skill;
      });
    });
  };

  /**
  Validate the sheet against the JSON Resume schema.
  */
  JRSResume.prototype.isValid = function( ) { // TODO: ↓ fix this path ↓
    var schema = FS.readFileSync( PATH.join( __dirname, 'resume.json' ), 'utf8' );
    var schemaObj = JSON.parse( schema );
    var validator = require('is-my-json-valid');
    var validate = validator( schemaObj, { // Note [1]
      formats: { date: /^\d{4}(?:-(?:0[0-9]{1}|1[0-2]{1})(?:-[0-9]{2})?)?$/ }
    });
    var ret = validate( this );
    if( !ret ) {
      this.basics.imp = this.basics.imp || { };
      this.basics.imp.validationErrors = validate.errors;
    }
    return ret;
  };

  /**
  Calculate the total duration of the sheet. Assumes this.work has been sorted
  by start date descending, perhaps via a call to Sheet.sort().
  @returns The total duration of the sheet's work history, that is, the number
  of years between the start date of the earliest job on the resume and the
  *latest end date of all jobs in the work history*. This last condition is for
  sheets that have overlapping jobs.
  */
  JRSResume.prototype.duration = function() {
    if( this.work && this.work.length ) {
      var careerStart = this.work[ this.work.length - 1].safeStartDate;
      if ((typeof careerStart === 'string' || careerStart instanceof String) &&
          !careerStart.trim())
        return 0;
      var careerLast = _.max( this.work, function( w ) {
        return w.safeEndDate.unix();
      }).safeEndDate;
      return careerLast.diff( careerStart, 'years' );
    }
    return 0;
  };

  /**
  Sort dated things on the sheet by start date descending. Assumes that dates
  on the sheet have been processed with _parseDates().
  */
  JRSResume.prototype.sort = function( ) {

    this.work && this.work.sort( byDateDesc );
    this.education && this.education.sort( byDateDesc );
    this.volunteer && this.volunteer.sort( byDateDesc );

    this.awards && this.awards.sort( function(a, b) {
      return( a.safeDate.isBefore(b.safeDate) ) ? 1
        : ( a.safeDate.isAfter(b.safeDate) && -1 ) || 0;
    });
    this.publications && this.publications.sort( function(a, b) {
      return( a.safeReleaseDate.isBefore(b.safeReleaseDate) ) ? 1
        : ( a.safeReleaseDate.isAfter(b.safeReleaseDate) && -1 ) || 0;
    });

    function byDateDesc(a,b) {
      return( a.safeStartDate.isBefore(b.safeStartDate) ) ? 1
        : ( a.safeStartDate.isAfter(b.safeStartDate) && -1 ) || 0;
    }

  };

  JRSResume.prototype.dupe = function() {
    var rnew = new JRSResume();
    rnew.parse( this.stringify(), { } );
    return rnew;
  };

  /**
  Create a copy of this resume in which all fields have been interpreted as
  Markdown.
  */
  JRSResume.prototype.harden = function() {

    var that = this;
    var ret = this.dupe();

    function HD(txt) {
      return '@@@@~' + txt + '~@@@@';
    }

    function HDIN(txt){
      //return MD(txt || '' ).replace(/^\s*<p>|<\/p>\s*$/gi, '');
      return HD(txt);
    }

    // TODO: refactor recursion
    function hardenStringsInObject( obj, inline ) {

      if( !obj ) return;
      inline = inline === undefined || inline;


      if( Object.prototype.toString.call( obj ) === '[object Array]' ) {
        obj.forEach(function(elem, idx, ar){
          if( typeof elem === 'string' || elem instanceof String )
            ar[idx] = inline ? HDIN(elem) : HD( elem );
          else
            hardenStringsInObject( elem );
        });
      }
      else if (typeof obj === 'object') {
        Object.keys( obj ).forEach(function(key) {
          var sub = obj[key];
          if( typeof sub === 'string' || sub instanceof String ) {
            if( _.contains(['skills','url','website','startDate','endDate','releaseDate','date','phone','email','address','postalCode','city','country','region'], key) )
              return;
            if( key === 'summary' )
              obj[key] = HD( obj[key] );
            else
              obj[key] = inline ? HDIN( obj[key] ) : HD( obj[key] );
          }
          else
            hardenStringsInObject( sub );
        });
      }

    }

    Object.keys( ret ).forEach(function(member){
      hardenStringsInObject( ret[ member ] );
    });

    return ret;
  };

  /**
  Convert human-friendly dates into formal Moment.js dates for all collections.
  We don't want to lose the raw textual date as entered by the user, so we store
  the Moment-ified date as a separate property with a prefix of .safe. For ex:
  job.startDate is the date as entered by the user. job.safeStartDate is the
  parsed Moment.js date that we actually use in processing.
  */
  function _parseDates() {

    var _fmt = require('./fluent-date').fmt;

    this.work && this.work.forEach( function(job) {
      job.safeStartDate = _fmt( job.startDate );
      job.safeEndDate = _fmt( job.endDate );
    });
    this.education && this.education.forEach( function(edu) {
      edu.safeStartDate = _fmt( edu.startDate );
      edu.safeEndDate = _fmt( edu.endDate );
    });
    this.volunteer && this.volunteer.forEach( function(vol) {
      vol.safeStartDate = _fmt( vol.startDate );
      vol.safeEndDate = _fmt( vol.endDate );
    });
    this.awards && this.awards.forEach( function(awd) {
      awd.safeDate = _fmt( awd.date );
    });
    this.publications && this.publications.forEach( function(pub) {
      pub.safeReleaseDate = _fmt( pub.releaseDate );
    });
  }

  /**
  Export the JRSResume function/ctor.
  */
  module.exports = JRSResume;

}());
