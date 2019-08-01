/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Definition of the JRSResume class.
@license MIT. See LICENSE.md for details.
@module core/jrs-resume
*/



const FS = require('fs');
const extend = require('extend');
let validator = require('is-my-json-valid');
const _ = require('underscore');
const PATH = require('path');
const CONVERTER = require('fresh-jrs-converter');


/**
A JRS resume or CV. JRS resumes are backed by JSON, and each JRSResume object
is an instantiation of that JSON decorated with utility methods.
@class JRSResume
*/


class JRSResume {

  static initClass() {
    /** Reset the sheet to an empty state. */
    // clear = function( clearMeta ) {
    //   clearMeta = ((clearMeta === undefined) && true) || clearMeta;
    //   if (clearMeta) { delete this.imp; }
    //   delete this.basics.computed; // Don't use Object.keys() here
    //   delete this.work;
    //   delete this.volunteer;
    //   delete this.education;
    //   delete this.awards;
    //   delete this.publications;
    //   delete this.interests;
    //   delete this.skills;
    //   return delete this.basics.profiles;
    // };
    // extends AbstractResume
  }



  /** Initialize the the JSResume from string. */
  parse( stringData, opts ) {
    this.imp = this.imp != null ? this.imp : {raw: stringData};
    return this.parseJSON(JSON.parse( stringData ), opts);
  }



  /**
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
  */
  parseJSON( rep, opts ) {
    let scrubbed;
    opts = opts || { };
    if (opts.privatize) {
      const scrubber = require('../utils/resume-scrubber');
      // Ignore any element with the 'ignore: true' or 'private: true' designator.
      var ret = scrubber.scrubResume(rep, opts);
      scrubbed = ret.scrubbed;
    }

    // Extend resume properties onto ourself.
    extend(true, this, opts.privatize ? scrubbed : rep);

    // Set up metadata
    if (!(this.imp != null ? this.imp.processed : undefined)) {
      // Set up metadata TODO: Clean up metadata on the object model.
      opts = opts || { };
      if ((opts.imp === undefined) || opts.imp) {
        this.imp = this.imp || { };
        this.imp.title = (opts.title || this.imp.title) || this.basics.name;
        if (!this.imp.raw) {
          this.imp.raw = JSON.stringify(rep);
        }
      }
      this.imp.processed = true;
    }
    // Parse dates, sort dates, and calculate computed values
    ((opts.date === undefined) || opts.date) && _parseDates.call( this );
    ((opts.sort === undefined) || opts.sort) && this.sort();
    if ((opts.compute === undefined) || opts.compute) {
      this.basics.computed = {
        numYears: this.duration(),
        keywords: this.keywords()
      };
    }
    return this;
  }



  /** Save the sheet to disk (for environments that have disk access). */
  save( filename ) {
    this.imp.file = filename || this.imp.file;
    FS.writeFileSync(this.imp.file, this.stringify( this ), 'utf8');
    return this;
  }



  /** Save the sheet to disk in a specific format, either FRESH or JRS. */
  saveAs( filename, format ) {
    if (format === 'JRS') {
      this.imp.file = filename || this.imp.file;
      FS.writeFileSync( this.imp.file, this.stringify(), 'utf8' );
    } else {
      const newRep = CONVERTER.toFRESH(this);
      const stringRep = CONVERTER.toSTRING(newRep);
      FS.writeFileSync(filename, stringRep, 'utf8');
    }
    return this;
  }



  /** Return the resume format. */
  format() { return 'JRS'; }



  stringify() { return JRSResume.stringify( this ); }



  /** Return a unique list of all keywords across all skills. */
  keywords() {
    let flatSkills = [];
    if (this.skills && this.skills.length) {
      this.skills.forEach( s  => flatSkills = _.union(flatSkills, s.keywords));
    }
    return flatSkills;
  }



  /**
  Return internal metadata. Create if it doesn't exist.
  JSON Resume v0.0.0 doesn't allow additional properties at the root level,
  so tuck this into the .basic sub-object.
  */
  i() {
    return this.imp = this.imp != null ? this.imp : { };
  }



  /** Add work experience to the sheet. */
  add( moniker ) {
    const defSheet = JRSResume.default();
    const newObject = extend( true, {}, defSheet[ moniker ][0] );
    this[ moniker ] = this[ moniker ] || [];
    this[ moniker ].push( newObject );
    return newObject;
  }



  /** Determine if the sheet includes a specific social profile (eg, GitHub). */
  hasProfile( socialNetwork ) {
    socialNetwork = socialNetwork.trim().toLowerCase();
    return this.basics.profiles && _.some(this.basics.profiles, p => p.network.trim().toLowerCase() === socialNetwork);
  }



  /** Determine if the sheet includes a specific skill. */
  hasSkill( skill ) {
    skill = skill.trim().toLowerCase();
    return this.skills && _.some(this.skills, sk =>
      sk.keywords && _.some(sk.keywords, kw => kw.trim().toLowerCase() === skill)
    );
  }



  /** Validate the sheet against the JSON Resume schema. */
  isValid( ) { // TODO: ↓ fix this path ↓
    const schema = FS.readFileSync(PATH.join( __dirname, 'resume.json' ), 'utf8');
    const schemaObj = JSON.parse(schema);
    validator = require('is-my-json-valid');
    const validate = validator( schemaObj, { // Note [1]
      formats: { date: /^\d{4}(?:-(?:0[0-9]{1}|1[0-2]{1})(?:-[0-9]{2})?)?$/ }
    });
    const temp = this.imp;
    delete this.imp;
    const ret = validate(this);
    this.imp = temp;
    if (!ret) {
      this.imp = this.imp || { };
      this.imp.validationErrors = validate.errors;
    }
    return ret;
  }



  duration(unit) {
    const inspector = require('../inspectors/duration-inspector');
    return inspector.run(this, 'work', 'startDate', 'endDate', unit);
  }



  /**
  Sort dated things on the sheet by start date descending. Assumes that dates
  on the sheet have been processed with _parseDates().
  */
  sort( ) {

    const byDateDesc = function(a,b) {
      if (a.safeStartDate.isBefore(b.safeStartDate)) {
      return 1;
      } else { return ( a.safeStartDate.isAfter(b.safeStartDate) && -1 ) || 0; }
    };

    this.work && this.work.sort(byDateDesc);
    this.education && this.education.sort(byDateDesc);
    this.volunteer && this.volunteer.sort(byDateDesc);

    this.awards && this.awards.sort(function(a, b) {
      if (a.safeDate.isBefore(b.safeDate)) {
      return 1;
      } else { return (a.safeDate.isAfter(b.safeDate) && -1 ) || 0; }
    });

    return this.publications && this.publications.sort(function(a, b) {
      if ( a.safeReleaseDate.isBefore(b.safeReleaseDate) ) {
      return 1;
      } else { return ( a.safeReleaseDate.isAfter(b.safeReleaseDate) && -1 ) || 0; }
    });
  }



  dupe() {
    const rnew = new JRSResume();
    rnew.parse(this.stringify(), { });
    return rnew;
  }



  /**
  Create a copy of this resume in which all fields have been interpreted as
  Markdown.
  */
  harden() {

    const ret = this.dupe();

    const HD = txt => `@@@@~${txt}~@@@@`;

    // const HDIN = txt =>
    //   //return MD(txt || '' ).replace(/^\s*<p>|<\/p>\s*$/gi, '');
    //   HD(txt)
    // ;

    const transformer = require('../utils/string-transformer');
    return transformer(ret,
      [ 'skills','url','website','startDate','endDate', 'releaseDate', 'date',
      'phone','email','address','postalCode','city','country','region',
      'safeStartDate','safeEndDate', 'summary', 'description' ],
      (key, val) => HD(val));
  }
}

JRSResume.initClass();




/** Get the default (empty) sheet. */
JRSResume.default = () => new JRSResume().parseJSON(require('fresh-resume-starter').jrs);



/**
Convert this object to a JSON string, sanitizing meta-properties along the
way. Don't override .toString().
*/
JRSResume.stringify = function( obj ) {
  const replacer = function( key,value ) { // Exclude these keys from stringification
    const temp = _.some(['imp', 'warnings', 'computed', 'filt', 'ctrl', 'index',
      'safeStartDate', 'safeEndDate', 'safeDate', 'safeReleaseDate', 'result',
      'isModified', 'htmlPreview', 'display_progress_bar'],
       val  => key.trim() === val);
    if (temp) { return undefined; } else { return value; }
  };
  return JSON.stringify(obj, replacer, 2);
};



/**
Convert human-friendly dates into formal Moment.js dates for all collections.
We don't want to lose the raw textual date as entered by the user, so we store
the Moment-ified date as a separate property with a prefix of .safe. For ex:
job.startDate is the date as entered by the user. job.safeStartDate is the
parsed Moment.js date that we actually use in processing.
*/
var _parseDates = function() {

  const _fmt = require('./fluent-date').fmt;

  this.work && this.work.forEach(function(job) {
    job.safeStartDate = _fmt( job.startDate );
    return job.safeEndDate = _fmt( job.endDate );
  });
  this.education && this.education.forEach(function(edu) {
    edu.safeStartDate = _fmt( edu.startDate );
    return edu.safeEndDate = _fmt( edu.endDate );
  });
  this.volunteer && this.volunteer.forEach(function(vol) {
    vol.safeStartDate = _fmt( vol.startDate );
    return vol.safeEndDate = _fmt( vol.endDate );
  });
  this.awards && this.awards.forEach(awd => awd.safeDate = _fmt( awd.date ));
  return this.publications && this.publications.forEach(pub => pub.safeReleaseDate = _fmt( pub.releaseDate ));
};



/**
Export the JRSResume class.
*/
module.exports = JRSResume;
