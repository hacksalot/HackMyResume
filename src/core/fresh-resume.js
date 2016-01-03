/**
Definition of the FRESHResume class.
@license MIT. Copyright (c) 2015 James Devlin / FluentDesk.
@module fresh-resume.js
*/

(function() {

  var FS = require('fs')
    , extend = require('../utils/extend')
    , validator = require('is-my-json-valid')
    , _ = require('underscore')
    , __ = require('lodash')
    , PATH = require('path')
    , moment = require('moment')
    , XML = require('xml-escape')
    , MD = require('marked')
    , CONVERTER = require('./convert')
    , JRSResume = require('./jrs-resume');

  /**
  A FRESH-style resume in JSON or YAML.
  @class FreshResume
  */
  function FreshResume() {

  }

  /**
  Open and parse the specified FRESH resume sheet. Merge the JSON object model
  onto this Sheet instance with extend() and convert sheet dates to a safe &
  consistent format. Then sort each section by startDate descending.
  */
  FreshResume.prototype.open = function( file, title ) {
    this.imp = { fileName: file };
    this.imp.raw = FS.readFileSync( file, 'utf8' );
    return this.parse( this.imp.raw, title );
  };

  /**
  Save the sheet to disk (for environments that have disk access).
  */
  FreshResume.prototype.save = function( filename ) {
    this.imp.fileName = filename || this.imp.fileName;
    FS.writeFileSync( this.imp.fileName, this.stringify(), 'utf8' );
    return this;
  };

  /**
  Save the sheet to disk in a specific format, either FRESH or JSON Resume.
  */
  FreshResume.prototype.saveAs = function( filename, format ) {

    if( format !== 'JRS' ) {
      this.imp.fileName = filename || this.imp.fileName;
      FS.writeFileSync( this.imp.fileName, this.stringify(), 'utf8' );
    }
    else {
      var newRep = CONVERTER.toJRS( this );
      FS.writeFileSync( filename, JRSResume.stringify( newRep ), 'utf8' );
    }
    return this;
  };

  FreshResume.prototype.dupe = function() {
    var rnew = new FreshResume();
    rnew.parse( this.stringify(), { } );
    return rnew;
  };

  /**
  Convert the supplied object to a JSON string, sanitizing meta-properties along
  the way.
  */
  FreshResume.stringify = function( obj ) {
    function replacer( key,value ) { // Exclude these keys from stringification
      return _.some(['imp', 'warnings', 'computed', 'filt', 'ctrl', 'index',
        'safe', 'result', 'isModified', 'htmlPreview', 'display_progress_bar'],
        function( val ) { return key.trim() === val; }
      ) ? undefined : value;
    }
    return JSON.stringify( obj, replacer, 2 );
  };

  /**
  Create a copy of this resume in which all string fields have been run through
  a transformation function (such as a Markdown filter or XML encoder).
  */
  FreshResume.prototype.transformStrings = function( filt, transformer ) {

    var that = this;
    var ret = this.dupe();

    // TODO: refactor recursion
    function transformStringsInObject( obj, filters ) {

      if( !obj ) return;
      if( moment.isMoment( obj ) ) return;

      if( _.isArray( obj ) ) {
        obj.forEach( function(elem, idx, ar) {
          if( typeof elem === 'string' || elem instanceof String )
            ar[idx] = transformer( null, elem );
          else if (_.isObject(elem))
            transformStringsInObject( elem, filters );
        });
      }
      else if (_.isObject( obj )) {
        Object.keys( obj ).forEach(function(k) {
          if( filters.length && _.contains(filters, k) )
            return;
          var sub = obj[k];
          if( typeof sub === 'string' || sub instanceof String ) {
            obj[k] = transformer( k, sub );
          }
          else if (_.isObject( sub ))
            transformStringsInObject( sub, filters );
        });
      }

    }

    Object.keys( ret ).forEach(function(member){
      if( !filt || !filt.length || !_.contains(filt, member) )
        transformStringsInObject( ret[ member ], filt || [] );
    });

    return ret;
  };

  /**
  Create a copy of this resume in which all fields have been interpreted as
  Markdown.
  */
  FreshResume.prototype.markdownify = function() {

    function MDIN( txt ){
      return MD(txt || '' ).replace(/^\s*<p>|<\/p>\s*$/gi, '');
    }

    function trx(key, val) {
      if( key === 'summary' ) {
        return MD(val);
      }
      return MDIN(val);
    }

    return this.transformStrings( ['skills','url','start','end','date'], trx );
  };

  /**
  Create a copy of this resume in which all fields have been interpreted as
  Markdown.
  */
  FreshResume.prototype.xmlify = function() {

    function trx(key, val) {
      return XML(val);
    }

    return this.transformStrings( [], trx );
  };

  /**
  Convert this object to a JSON string, sanitizing meta-properties along the
  way. Don't override .toString().
  */
  FreshResume.prototype.stringify = function() {
    return FreshResume.stringify( this );
  };

  /**
  Initialize the FreshResume from JSON data.
  Open and parse the specified FRESH resume. Merge the JSON object model onto
  this Sheet instance with extend() and convert sheet dates to a safe &
  consistent format. Then sort each section by startDate descending.
  */
  FreshResume.prototype.parseJSON = function( rep, opts ) {
    // Convert JSON Resume to FRESH if necessary
    if( rep.basics ) {
      rep = CONVERTER.toFRESH( rep );
      rep.imp = rep.imp || { };
      rep.imp.orgFormat = 'JRS';
    }

    // Now apply the resume representation onto this object
    extend( true, this, rep );

    // Set up metadata
    opts = opts || { };
    if( opts.imp === undefined || opts.imp ) {
      this.imp = this.imp || { };
      this.imp.title = (opts.title || this.imp.title) || this.name;
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
  Initialize the the FreshResume from string data.
  */
  FreshResume.prototype.parse = function( stringData, opts ) {
    return this.parseJSON( JSON.parse( stringData ), opts );
  };

  /**
  Return internal metadata. Create if it doesn't exist.
  */
  FreshResume.prototype.imp = function() {
    this.imp = (this.imp || { });
    return this.imp;
  };

  /**
  Return a unique list of all keywords across all skills.
  */
  FreshResume.prototype.keywords = function() {
    var flatSkills = [];
    if( this.skills ) {
      if( this.skills.sets ) {
        flatSkills = flatSkills.concat( this.skills.sets.map(function(sk) { return sk.name;  }) );
      }
      else if( this.skills.list ) {
        flatSkills = flatSkills.concat( this.skills.list.map(function(sk) { return sk.name;  }) );
      }
    }
    return flatSkills;
  },

  /**
  Reset the sheet to an empty state.
  */
  FreshResume.prototype.clear = function( clearMeta ) {
    clearMeta = ((clearMeta === undefined) && true) || clearMeta;
    clearMeta && (delete this.imp);
    delete this.computed; // Don't use Object.keys() here
    delete this.employment;
    delete this.service;
    delete this.education;
    delete this.recognition;
    delete this.reading;
    delete this.writing;
    delete this.interests;
    delete this.skills;
    delete this.social;
  };

  /**
  Get a safe count of the number of things in a section.
  */
  FreshResume.prototype.count = function( obj ) {
    if( !obj ) return 0;
    if( obj.history ) return obj.history.length;
    if( obj.sets ) return obj.sets.length;
    return obj.length || 0;
  };

  /**
  Get the default (empty) sheet.
  */
  FreshResume.default = function() {
    return new FreshResume().open(
      PATH.join( __dirname, 'empty-fresh.json'), 'Empty' );
  };

  /**
  Add work experience to the sheet.
  */
  FreshResume.prototype.add = function( moniker ) {
    var defSheet = FreshResume.default();
    var newObject = defSheet[moniker].history ?
      $.extend( true, {}, defSheet[ moniker ].history[0] ) :
      (moniker === 'skills' ?
        $.extend( true, {}, defSheet.skills.sets[0] ) :
        $.extend( true, {}, defSheet[ moniker ][0] ));
    this[ moniker ] = this[ moniker ] || [];
    if( this[ moniker ].history )
      this[ moniker ].history.push( newObject );
    else if( moniker === 'skills' )
      this.skills.sets.push( newObject );
    else
      this[ moniker ].push( newObject );
    return newObject;
  };

  /**
  Determine if the sheet includes a specific social profile (eg, GitHub).
  */
  FreshResume.prototype.hasProfile = function( socialNetwork ) {
    socialNetwork = socialNetwork.trim().toLowerCase();
    return this.social && _.some( this.social, function(p) {
      return p.network.trim().toLowerCase() === socialNetwork;
    });
  };

  /**
  Return the specified network profile.
  */
  FreshResume.prototype.getProfile = function( socialNetwork ) {
    socialNetwork = socialNetwork.trim().toLowerCase();
    return this.social && _.find( this.social, function(sn) {
      return sn.network.trim().toLowerCase() === socialNetwork;
    });
  };

  /**
  Return an array of profiles for the specified network, for when the user
  has multiple eg. GitHub accounts.
  */
  FreshResume.prototype.getProfiles = function( socialNetwork ) {
    socialNetwork = socialNetwork.trim().toLowerCase();
    return this.social && _.filter( this.social, function(sn){
      return sn.network.trim().toLowerCase() === socialNetwork;
    });
  };

  /**
  Determine if the sheet includes a specific skill.
  */
  FreshResume.prototype.hasSkill = function( skill ) {
    skill = skill.trim().toLowerCase();
    return this.skills && _.some( this.skills, function(sk) {
      return sk.keywords && _.some( sk.keywords, function(kw) {
        return kw.trim().toLowerCase() === skill;
      });
    });
  };

  /**
  Validate the sheet against the FRESH Resume schema.
  */
  FreshResume.prototype.isValid = function( info ) {
    var schemaObj = require('fresca');
    var validator = require('is-my-json-valid');
    var validate = validator( schemaObj, { // Note [1]
      formats: { date: /^\d{4}(?:-(?:0[0-9]{1}|1[0-2]{1})(?:-[0-9]{2})?)?$/ }
    });
    var ret = validate( this );
    if( !ret ) {
      this.imp = this.imp || { };
      this.imp.validationErrors = validate.errors;
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
  FreshResume.prototype.duration = function() {
    var empHist = __.get(this, 'employment.history');
    if( empHist && empHist.length ) {
      var firstJob = _.last( this.employment.history );
      var careerStart = firstJob.start ? firstJob.safe.start : '';
      if ((typeof careerStart === 'string' || careerStart instanceof String) &&
          !careerStart.trim())
        return 0;
      var careerLast = _.max( this.employment.history, function( w ) {
        return( w.safe && w.safe.end ) ? w.safe.end.unix() : moment().unix();
      });
      return careerLast.safe.end.diff( careerStart, 'years' );
    }
    return 0;
  };

  /**
  Sort dated things on the sheet by start date descending. Assumes that dates
  on the sheet have been processed with _parseDates().
  */
  FreshResume.prototype.sort = function( ) {

    __.get(this, 'employment.history') && this.employment.history.sort( byDateDesc );
    __.get(this, 'education.history') && this.education.history.sort( byDateDesc );
    __.get(this, 'service.history') && this.service.history.sort( byDateDesc );

    // this.awards && this.awards.sort( function(a, b) {
    //   return( a.safeDate.isBefore(b.safeDate) ) ? 1
    //     : ( a.safeDate.isAfter(b.safeDate) && -1 ) || 0;
    // });
    this.writing && this.writing.sort( function(a, b) {
      return( a.safe.date.isBefore(b.safe.date) ) ? 1
        : ( a.safe.date.isAfter(b.safe.date) && -1 ) || 0;
    });

    function byDateDesc(a,b) {
      return( a.safe.start.isBefore(b.safe.start) ) ? 1
        : ( a.safe.start.isAfter(b.safe.start) && -1 ) || 0;
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
    var that = this;

    // TODO: refactor recursion
    function replaceDatesInObject( obj ) {

      if( !obj ) return;
      if( Object.prototype.toString.call( obj ) === '[object Array]' ) {
        obj.forEach(function(elem){
          replaceDatesInObject( elem );
        });
      }
      else if (typeof obj === 'object') {
        if( obj._isAMomentObject || obj.safe )
         return;
        Object.keys( obj ).forEach(function(key) {
          replaceDatesInObject( obj[key] );
        });
        ['start','end','date'].forEach( function(val) {
          if( (obj[val] !== undefined) && (!obj.safe || !obj.safe[val] )) {
            obj.safe = obj.safe || { };
            obj.safe[ val ] = _fmt( obj[val] );
            if( obj[val] && (val === 'start') && !obj.end ) {
              obj.safe.end = _fmt('current');
            }
          }
        });
      }
    }

    Object.keys( this ).forEach(function(member){
      replaceDatesInObject( that[ member ] );
    });

  }

  /**
  Export the Sheet function/ctor.
  */
  module.exports = FreshResume;

}());

// Note 1: Adjust default date validation to allow YYYY and YYYY-MM formats
// in addition to YYYY-MM-DD. The original regex:
//
//     /^\d{4}-(?:0[0-9]{1}|1[0-2]{1})-[0-9]{2}$/
//
