/**
Definition of the JRSResume class.
@license MIT. Copyright (c) 2015 James M. Devlin / FluentDesk
*/

(function() {

  var FS = require('fs')
    , extend = require('../utils/extend')
    , validator = require('is-my-json-valid')
    , _ = require('underscore')
    , PATH = require('path')
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
    this.imp = { fileName: file };
    this.imp.raw = FS.readFileSync( file, 'utf8' );
    return this.parse( this.imp.raw, title );
  };

  /**
  Save the sheet to disk (for environments that have disk access).
  */
  JRSResume.prototype.save = function( filename ) {
    this.imp.fileName = filename || this.imp.fileName;
    FS.writeFileSync( this.imp.fileName, this.stringify(), 'utf8' );
    return this;
  };

  /**
  Convert this object to a JSON string, sanitizing meta-properties along the
  way. Don't override .toString().
  */
  JRSResume.prototype.stringify = function() {
    function replacer( key,value ) { // Exclude these keys from stringification
      return _.some(['meta', 'warnings', 'computed', 'filt', 'ctrl', 'index',
        'safeStartDate', 'safeEndDate', 'safeDate', 'safeReleaseDate', 'result',
      'isModified', 'htmlPreview', 'display_progress_bar'],
        function( val ) { return key.trim() === val; }
      ) ? undefined : value;
    }
    return JSON.stringify( this, replacer, 2 );
  };

  /**
  Open and parse the specified JSON resume sheet. Merge the JSON object model
  onto this Sheet instance with extend() and convert sheet dates to a safe &
  consistent format. Then sort each section by startDate descending.
  */
  JRSResume.prototype.parse = function( stringData, opts ) {
    opts = opts || { };
    var rep = JSON.parse( stringData );
    extend( true, this, rep );
    // Set up metadata
    if( opts.imp === undefined || opts.imp ) {
      this.imp = this.imp || { };
      this.imp.title = (opts.title || this.imp.title) || this.basics.name;
    }
    // Parse dates, sort dates, and calculate computed values
    (opts.date === undefined || opts.date) && _parseDates.call( this );
    (opts.sort === undefined || opts.sort) && this.sort();
    (opts.compute === undefined || opts.compute) && (this.computed = {
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
  },

  /**
  Update the sheet's raw data. TODO: remove/refactor
  */
  JRSResume.prototype.updateData = function( str ) {
    this.clear( false );
    this.parse( str )
    return this;
  };

  /**
  Reset the sheet to an empty state.
  */
  JRSResume.prototype.clear = function( clearMeta ) {
    clearMeta = ((clearMeta === undefined) && true) || clearMeta;
    clearMeta && (delete this.imp);
    delete this.computed; // Don't use Object.keys() here
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
    return new JRSResume().open( PATH.join( __dirname, 'empty.json'), 'Empty' );
  }

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
    var validator = require('is-my-json-valid')
    var validate = validator( schemaObj );
    return validate( this );
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
