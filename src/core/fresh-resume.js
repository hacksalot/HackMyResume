/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Definition of the FRESHResume class.
@license MIT. See LICENSE.md for details.
@module core/fresh-resume
*/



const FS = require('fs');
const extend = require('extend');
let validator = require('is-my-json-valid');
const _ = require('underscore');
const __ = require('lodash');
const XML = require('xml-escape');
const MD = require('marked');
const CONVERTER = require('fresh-jrs-converter');
const JRSResume = require('./jrs-resume');



/**
A FRESH resume or CV. FRESH resumes are backed by JSON, and each FreshResume
object is an instantiation of that JSON decorated with utility methods.
@constructor
*/
class FreshResume {// extends AbstractResume



  /** Initialize the the FreshResume from JSON string data. */
  parse( stringData, opts ) {
    this.imp = this.imp != null ? this.imp : {raw: stringData};
    return this.parseJSON(JSON.parse( stringData ), opts);
  }



  /**
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
  */
  parseJSON( rep, opts ) {

    let scrubbed;
    if (opts && opts.privatize) {
      // Ignore any element with the 'ignore: true' or 'private: true' designator.
      const scrubber = require('../utils/resume-scrubber');
      var ret = scrubber.scrubResume(rep, opts);
      scrubbed = ret.scrubbed;
    }

    // Now apply the resume representation onto this object
    extend(true, this, opts && opts.privatize ? scrubbed : rep);

    // If the resume has already been processed, then we are being called from
    // the .dupe method, and there's no need to do any post processing
    if (!(this.imp != null ? this.imp.processed : undefined)) {
      // Set up metadata TODO: Clean up metadata on the object model.
      opts = opts || { };
      if ((opts.imp === undefined) || opts.imp) {
        this.imp = this.imp || { };
        this.imp.title = (opts.title || this.imp.title) || this.name;
        if (!this.imp.raw) {
          this.imp.raw = JSON.stringify(rep);
        }
      }
      this.imp.processed = true;
      // Parse dates, sort dates, and calculate computed values
      ((opts.date === undefined) || opts.date) && _parseDates.call( this );
      ((opts.sort === undefined) || opts.sort) && this.sort();
      ((opts.compute === undefined) || opts.compute) && (this.computed = {
         numYears: this.duration(),
         keywords: this.keywords()
      });
    }

    return this;
  }



  /** Save the sheet to disk (for environments that have disk access). */
  save( filename ) {
    this.imp.file = filename || this.imp.file;
    FS.writeFileSync(this.imp.file, this.stringify(), 'utf8');
    return this;
  }



  /**
  Save the sheet to disk in a specific format, either FRESH or JSON Resume.
  */
  saveAs( filename, format ) {

    // If format isn't specified, default to FRESH
    const safeFormat = (format && format.trim()) || 'FRESH';

    // Validate against the FRESH version regex
    // freshVersionReg = require '../utils/fresh-version-regex'
    // if (not freshVersionReg().test( safeFormat ))
    //   throw badVer: safeFormat

    const parts = safeFormat.split('@');

    if (parts[0] === 'FRESH') {
      this.imp.file = filename || this.imp.file;
      FS.writeFileSync(this.imp.file, this.stringify(), 'utf8');

    } else if (parts[0] === 'JRS') {
      const useEdgeSchema = parts.length > 1 ? parts[1] === '1' : false;
      const newRep = CONVERTER.toJRS(this, {edge: useEdgeSchema});
      FS.writeFileSync(filename, JRSResume.stringify( newRep ), 'utf8');
    } else {
      throw {badVer: safeFormat};
    }
    return this;
  }



  /**
  Duplicate this FreshResume instance.
  This method first extend()s this object onto an empty, creating a deep copy,
  and then passes the result into a new FreshResume instance via .parseJSON.
  We do it this way to create a true clone of the object without re-running any
  of the associated processing.
  */
  dupe() {
    const jso = extend(true, { }, this);
    const rnew = new FreshResume();
    rnew.parseJSON(jso, { });
    return rnew;
  }



  /**
  Convert this object to a JSON string, sanitizing meta-properties along the
  way.
  */
  stringify() { return FreshResume.stringify(this); }



  /**
  Create a copy of this resume in which all string fields have been run through
  a transformation function (such as a Markdown filter or XML encoder).
  TODO: Move this out of FRESHResume.
  */
  transformStrings( filt, transformer ) {
    const ret = this.dupe();
    const trx = require('../utils/string-transformer');
    return trx(ret, filt, transformer);
  }



  /**
  Create a copy of this resume in which all fields have been interpreted as
  Markdown.
  */
  markdownify() {

    const MDIN =  txt  => MD(txt || '' ).replace(/^\s*<p>|<\/p>\s*$/gi, '');

    const trx = function( key, val ) {
      if (key === 'summary') {
        return MD(val);
      }
      return MDIN(val);
    };

    return this.transformStrings(['skills','url','start','end','date'], trx);
  }



  /**
  Create a copy of this resume in which all fields have been interpreted as
  Markdown.
  */
  xmlify() {
    const trx = (key, val) => XML(val);
    return this.transformStrings([], trx);
  }



  /** Return the resume format. */
  format() { return 'FRESH'; }



  /**
  Return internal metadata. Create if it doesn't exist.
  */
  i() { return this.imp = this.imp || { }; }



  /**
  Return a unique list of all skills declared in the resume.
  */

  // TODO: Several problems here:
  // 1) Confusing name. Easily confused with the keyword-inspector module, which
  // parses resume body text looking for these same keywords. This should probably
  // be renamed.
  //
  // 2) Doesn't bother trying to integrate skills.list with skills.sets if they
  // happen to declare different skills, and if skills.sets declares ONE skill and
  // skills.list declared 50, only 1 skill will be registered.
  //
  // 3) In the future, skill.sets should only be able to use skills declared in
  // skills.list. That is, skills.list is the official record of a candidate's
  // declared skills. skills.sets is just a way of grouping those into skillsets
  // for easier consumption.

  keywords() {
    let flatSkills = [];
    if (this.skills) {
      if (this.skills.sets) {
        flatSkills = this.skills.sets.map(sk => sk.skills).reduce( (a,b) => a.concat(b));
      } else if (this.skills.list) {
        flatSkills = flatSkills.concat( this.skills.list.map(sk => sk.name) );
      }
      flatSkills = _.uniq(flatSkills);
    }
    return flatSkills;
  }



  /**
  Reset the sheet to an empty state. TODO: refactor/review
  */
  clear( clearMeta ) {
    clearMeta = ((clearMeta === undefined) && true) || clearMeta;
    if (clearMeta) { delete this.imp; }
    delete this.computed; // Don't use Object.keys() here
    delete this.employment;
    delete this.service;
    delete this.education;
    delete this.recognition;
    delete this.reading;
    delete this.writing;
    delete this.interests;
    delete this.skills;
    return delete this.social;
  }



  /**
  Get a safe count of the number of things in a section.
  */
  count( obj ) {
    if (!obj) { return 0; }
    if (obj.history) { return obj.history.length; }
    if (obj.sets) { return obj.sets.length; }
    return obj.length || 0;
  }



  /** Add work experience to the sheet. */
  add( moniker ) {
    const defSheet = FreshResume.default();
    const newObject =
      defSheet[moniker].history
      ? extend( true, {}, defSheet[ moniker ].history[0] )
      :
        moniker === 'skills'
        ? extend( true, {}, defSheet.skills.sets[0] )
        : extend( true, {}, defSheet[ moniker ][0] );

    this[ moniker ] = this[ moniker ] || [];
    if (this[ moniker ].history) {
      this[ moniker ].history.push(newObject);
    } else if (moniker === 'skills') {
      this.skills.sets.push(newObject);
    } else {
      this[ moniker ].push(newObject);
    }
    return newObject;
  }



  /**
  Determine if the sheet includes a specific social profile (eg, GitHub).
  */
  hasProfile( socialNetwork ) {
    socialNetwork = socialNetwork.trim().toLowerCase();
    return this.social && _.some(this.social, p => p.network.trim().toLowerCase() === socialNetwork);
  }



  /** Return the specified network profile. */
  getProfile( socialNetwork ) {
    socialNetwork = socialNetwork.trim().toLowerCase();
    return this.social && _.find(this.social, sn => sn.network.trim().toLowerCase() === socialNetwork);
  }



  /**
  Return an array of profiles for the specified network, for when the user
  has multiple eg. GitHub accounts.
  */
  getProfiles( socialNetwork ) {
    socialNetwork = socialNetwork.trim().toLowerCase();
    return this.social && _.filter(this.social, sn => sn.network.trim().toLowerCase() === socialNetwork);
  }



  /** Determine if the sheet includes a specific skill. */
  hasSkill( skill ) {
    skill = skill.trim().toLowerCase();
    return this.skills && _.some(this.skills, sk =>
      sk.keywords && _.some(sk.keywords, kw => kw.trim().toLowerCase() === skill)
    );
  }



  /** Validate the sheet against the FRESH Resume schema. */
  isValid() {
    const schemaObj = require('fresh-resume-schema');
    validator = require('is-my-json-valid');
    const validate = validator( schemaObj, { // See Note [1].
      formats: { date: /^\d{4}(?:-(?:0[0-9]{1}|1[0-2]{1})(?:-[0-9]{2})?)?$/ }
    });
    const ret = validate(this);
    if (!ret) {
      this.imp = this.imp || { };
      this.imp.validationErrors = validate.errors;
    }
    return ret;
  }



  duration(unit) {
    const inspector = require('../inspectors/duration-inspector');
    return inspector.run(this, 'employment.history', 'start', 'end', unit);
  }




  /**
  Sort dated things on the sheet by start date descending. Assumes that dates
  on the sheet have been processed with _parseDates().
  */
  sort() {

    const byDateDesc = function(a,b) {
      if (a.safe.start.isBefore(b.safe.start)) {
      return 1;
      } else {  if (a.safe.start.isAfter(b.safe.start)) { return -1; } else { return 0; }  }
    };

    const sortSection = function( key ) {
      const ar = __.get(this, key);
      if (ar && ar.length) {
        const datedThings = ar.filter(o => o.start);
        return datedThings.sort( byDateDesc );
      }
    };

    sortSection('employment.history');
    sortSection('education.history');
    sortSection('service.history');
    sortSection('projects');

    return this.writing && this.writing.sort(function(a, b) {
      if (a.safe.date.isBefore(b.safe.date)) {
      return 1;
      } else { return ( a.safe.date.isAfter(b.safe.date) && -1 ) || 0; }
    });
  }
}



/**
Get the default (starter) sheet.
*/
FreshResume.default = () => new FreshResume().parseJSON(require('fresh-resume-starter').fresh);



/**
Convert the supplied FreshResume to a JSON string, sanitizing meta-properties
along the way.
*/
FreshResume.stringify = function( obj ) {
  const replacer = function( key,value ) { // Exclude these keys from stringification
    const exKeys = ['imp', 'warnings', 'computed', 'filt', 'ctrl', 'index',
      'safe', 'result', 'isModified', 'htmlPreview', 'display_progress_bar'];
    if (_.some( exKeys, val => key.trim() === val)) {
    return undefined; } else { return value; }
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
  const that = this;

  // TODO: refactor recursion
  var replaceDatesInObject = function( obj ) {

    if (!obj) { return; }
    if (Object.prototype.toString.call( obj ) === '[object Array]') {
      obj.forEach(elem => replaceDatesInObject( elem ));
      return;
    } else if (typeof obj === 'object') {
      if (obj._isAMomentObject || obj.safe) {
        return;
      }
      Object.keys( obj ).forEach(key => replaceDatesInObject(obj[key]));
      ['start','end','date'].forEach(function(val) {
        if ((obj[val] !== undefined) && (!obj.safe || !obj.safe[val])) {
          obj.safe = obj.safe || { };
          obj.safe[ val ] = _fmt(obj[val]);
          if (obj[val] && (val === 'start') && !obj.end) {
            obj.safe.end = _fmt('current');
            return;
          }
        }
      });
      return;
    }
  };
  Object.keys( this ).forEach(function(member) {
    replaceDatesInObject(that[member]);
  });
};



/** Export the Sheet function/ctor. */
module.exports = FreshResume;



// Note 1: Adjust default date validation to allow YYYY and YYYY-MM formats
// in addition to YYYY-MM-DD. The original regex:
//
//     /^\d{4}-(?:0[0-9]{1}|1[0-2]{1})-[0-9]{2}$/
//
