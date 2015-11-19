/**
FRESH character/resume sheet representation.
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
  A FRESH-style resume in JSON or YAML.
  @class Sheet
  */
  function FreshSheet() {

  }

  /**
  Open and parse the specified JSON resume sheet. Merge the JSON object model
  onto this Sheet instance with extend() and convert sheet dates to a safe &
  consistent format. Then sort each section by startDate descending.
  */
  FreshSheet.prototype.open = function( file, title ) {
    this.meta = { fileName: file };
    this.meta.raw = FS.readFileSync( file, 'utf8' );
    return this.parse( this.meta.raw, title );
  };

  /**
  Save the sheet to disk (for environments that have disk access).
  */
  FreshSheet.prototype.save = function( filename ) {
    this.meta.fileName = filename || this.meta.fileName;
    FS.writeFileSync( this.meta.fileName, this.stringify(), 'utf8' );
    return this;
  };

  /**
  Convert this object to a JSON string, sanitizing meta-properties along the
  way. Don't override .toString().
  */
  FreshSheet.prototype.stringify = function() {
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
  FreshSheet.prototype.parse = function( stringData, opts ) {

    // Parse the incoming JSON representation
    var rep = JSON.parse( stringData );

    // Convert JSON Resume to FRESH if necessary
    rep.basics && (rep = FreshSheet.convert( rep ));

    // Now apply the resume representation onto this object
    extend( true, this, rep );

    // Set up metadata
    opts = opts || { };
    if( opts.meta === undefined || opts.meta ) {
      this.meta = this.meta || { };
      this.meta.title = (opts.title || this.meta.title) || this.name;
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
  Convert from JSON Resume format
  */
  FreshSheet.convert = function( jrs ) {

    return {

      name: jrs.basics.name,
      label: jrs.basics.label,
      class: jrs.basics.label,
      summary: jrs.basics.summary,

      contact: {
        email: jrs.basics.email,
        phone: jrs.basics.phone,
        website: jrs.basics.website,
        postal: {
          city: jrs.basics.location.city,
          region: jrs.basics.location.region,
          country: jrs.basics.location.countryCode,
          code: jrs.basics.location.postalCode,
          address: [
            jrs.basics.location.address,
          ]
        }
      },

      employment: {
        history: jrs.work.map( function( job ) {
          return {
            position: job.position,
            employer: job.company,
            summary: job.summary,
            current: !job.endDate || !job.endDate.trim() || job.endDate.trim().toLowerCase() === 'current',
            start: job.startDate,
            end: job.endDate,
            url: job.website,
            keywords: "",
            highlights: job.highlights
          };
        })
      },

      education: {
        history: jrs.education.map(function(edu){
          return {
            institution: edu.institution,
            start: edu.startDate,
            end: edu.endDate,
            grade: edu.gpa,
            curriculum: edu.courses,
            url: edu.website || edu.url || null,
            summary: null,
            // ???: edu.area, TODO
            // ???: edu.studyType TODO
          };
        })
      },

      service: {
        history: jrs.volunteer.map(function(vol) {
          return {
            type: 'volunteer',
            position: vol.position,
            organization: vol.organization,
            start: vol.startDate,
            end: vol.endDate,
            url: vol.website,
            summary: vol.summary,
            highlights: vol.highlights
          };
        })
      },

      skills: jrs.skills.map(function(sk){
        return {
          name: sk.name,
          summary: "",
          level: sk.level,
          summary: sk.keywords.join(', '),
          years: null,
          proof: null
        };
      }),

      publications: jrs.publications.map(function(pub){
        return {
          title: pub.name,
          publisher: pub.publisher,
          link: [
            { 'url': pub.website }
          ],
          year: pub.releaseDate
        };
      }),

      interests: jrs.interests
    };
  };

  /**
  Return a unique list of all keywords across all skills.
  */
  FreshSheet.prototype.keywords = function() {
    var flatSkills = [];
    this.skills && this.skills.length &&
      (flatSkills = this.skills.map(function(sk) { return sk.name;  }));
    return flatSkills;
  },

  /**
  Update the sheet's raw data. TODO: remove/refactor
  */
  FreshSheet.prototype.updateData = function( str ) {
    this.clear( false );
    this.parse( str )
    return this;
  };

  /**
  Reset the sheet to an empty state.
  */
  FreshSheet.prototype.clear = function( clearMeta ) {
    clearMeta = ((clearMeta === undefined) && true) || clearMeta;
    clearMeta && (delete this.meta);
    delete this.computed; // Don't use Object.keys() here
    delete this.employment;
    delete this.service;
    delete this.education;
    //delete this.awards;
    delete this.publications;
    //delete this.interests;
    delete this.skills;
    delete this.social;
  };

  /**
  Get the default (empty) sheet.
  */
  FreshSheet.default = function() {
    return new FreshSheet().open( PATH.join( __dirname, 'empty.json'), 'Empty' );
  }

  /**
  Add work experience to the sheet.
  */
  FreshSheet.prototype.add = function( moniker ) {
    var defSheet = FreshSheet.default();
    var newObject = $.extend( true, {}, defSheet[ moniker ][0] );
    this[ moniker ] = this[ moniker ] || [];
    this[ moniker ].push( newObject );
    return newObject;
  };

  /**
  Determine if the sheet includes a specific social profile (eg, GitHub).
  */
  FreshSheet.prototype.hasProfile = function( socialNetwork ) {
    socialNetwork = socialNetwork.trim().toLowerCase();
    return this.basics.profiles && _.some( this.basics.profiles, function(p) {
      return p.network.trim().toLowerCase() === socialNetwork;
    });
  };

  /**
  Determine if the sheet includes a specific skill.
  */
  FreshSheet.prototype.hasSkill = function( skill ) {
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
  FreshSheet.prototype.isValid = function( ) { // TODO: ↓ fix this path ↓
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
  FreshSheet.prototype.duration = function() {
    if( this.employment.history && this.employment.history.length ) {
      var careerStart = this.employment.history[ this.employment.history.length - 1].safe.start;
      if ((typeof careerStart === 'string' || careerStart instanceof String) &&
          !careerStart.trim())
        return 0;
      var careerLast = _.max( this.employment.history, function( w ) {
        return w.safe.end.unix();
      }).safe.end;
      return careerLast.diff( careerStart, 'years' );
    }
    return 0;
  };

  /**
  Sort dated things on the sheet by start date descending. Assumes that dates
  on the sheet have been processed with _parseDates().
  */
  FreshSheet.prototype.sort = function( ) {

    this.employment.history && this.employment.history.sort( byDateDesc );
    this.education.history && this.education.history.sort( byDateDesc );
    this.service.history && this.service.history.sort( byDateDesc );

    // this.awards && this.awards.sort( function(a, b) {
    //   return( a.safeDate.isBefore(b.safeDate) ) ? 1
    //     : ( a.safeDate.isAfter(b.safeDate) && -1 ) || 0;
    // });
    this.publications && this.publications.sort( function(a, b) {
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

    this.employment.history && this.employment.history.forEach( function(job) {
      job.safe = {
        start: _fmt( job.start ),
        end: _fmt( job.end || 'current' )
      };
    });
    this.education.history && this.education.history.forEach( function(edu) {
      edu.safe = {
        start: _fmt( edu.start ),
        end: _fmt( edu.end || 'current' )
      };
    });
    this.service.history && this.service.history.forEach( function(vol) {
      vol.safe = {
        start: _fmt( vol.start ),
        end: _fmt( vol.end || 'current' )
      };
    });
    // this.awards && this.awards.forEach( function(awd) {
    //   awd.safeDate = _fmt( awd.date );
    // });
    this.publications && this.publications.forEach( function(pub) {
      pub.safe = {
        date: _fmt( pub.year )
      };
    });
  }

  /**
  Export the Sheet function/ctor.
  */
  module.exports = FreshSheet;

}());
