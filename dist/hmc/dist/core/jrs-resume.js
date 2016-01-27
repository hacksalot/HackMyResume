
/**
Definition of the JRSResume class.
@license MIT. See LICENSE.md for details.
@module core/jrs-resume
 */

(function() {
  var CONVERTER, FS, JRSResume, MD, PATH, _, _parseDates, extend, moment, validator;

  FS = require('fs');

  extend = require('extend');

  validator = require('is-my-json-valid');

  _ = require('underscore');

  PATH = require('path');

  MD = require('marked');

  CONVERTER = require('fresh-jrs-converter');

  moment = require('moment');


  /**
  A JRS resume or CV. JRS resumes are backed by JSON, and each JRSResume object
  is an instantiation of that JSON decorated with utility methods.
  @class JRSResume
   */

  JRSResume = (function() {
    var clear, format;

    function JRSResume() {}


    /** Initialize the JSResume from file. */

    JRSResume.prototype.open = function(file, title) {
      this.basics = {
        imp: {
          file: file,
          raw: FS.readFileSync(file, 'utf8')
        }
      };
      return this.parse(this.basics.imp.raw, title);
    };


    /** Initialize the the JSResume from string. */

    JRSResume.prototype.parse = function(stringData, opts) {
      var rep;
      opts = opts || {};
      rep = JSON.parse(stringData);
      return this.parseJSON(rep, opts);
    };


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

    JRSResume.prototype.parseJSON = function(rep, opts) {
      var ignoreList, scrubbed, that, traverse;
      opts = opts || {};
      that = this;
      traverse = require('traverse');
      ignoreList = [];
      scrubbed = traverse(rep).map(function(x) {
        if (!this.isLeaf && this.node.ignore) {
          if (this.node.ignore === true || this.node.ignore === 'true') {
            ignoreList.push(this.node);
            return this.remove();
          }
        }
      });
      extend(true, this, scrubbed);
      if (opts.imp === void 0 || opts.imp) {
        this.basics.imp = this.basics.imp || {};
        this.basics.imp.title = (opts.title || this.basics.imp.title) || this.basics.name;
        this.basics.imp.orgFormat = 'JRS';
      }
      (opts.date === void 0 || opts.date) && _parseDates.call(this);
      (opts.sort === void 0 || opts.sort) && this.sort();
      if (opts.compute === void 0 || opts.compute) {
        this.basics.computed = {
          numYears: this.duration(),
          keywords: this.keywords()
        };
      }
      return this;
    };


    /** Save the sheet to disk (for environments that have disk access). */

    JRSResume.prototype.save = function(filename) {
      this.basics.imp.file = filename || this.basics.imp.file;
      FS.writeFileSync(this.basics.imp.file, this.stringify(this), 'utf8');
      return this;
    };


    /** Save the sheet to disk in a specific format, either FRESH or JRS. */

    JRSResume.prototype.saveAs = function(filename, format) {
      var newRep, stringRep;
      if (format === 'JRS') {
        this.basics.imp.file = filename || this.basics.imp.file;
        FS.writeFileSync(this.basics.imp.file, this.stringify(), 'utf8');
      } else {
        newRep = CONVERTER.toFRESH(this);
        stringRep = CONVERTER.toSTRING(newRep);
        FS.writeFileSync(filename, stringRep, 'utf8');
      }
      return this;
    };


    /** Return the resume format. */

    format = function() {
      return 'JRS';
    };

    JRSResume.prototype.stringify = function() {
      return JRSResume.stringify(this);
    };


    /** Return a unique list of all keywords across all skills. */

    JRSResume.prototype.keywords = function() {
      var flatSkills;
      flatSkills = [];
      if (this.skills && this.skills.length) {
        this.skills.forEach(function(s) {
          return flatSkills = _.union(flatSkills, s.keywords);
        });
      }
      return flatSkills;
    };


    /**
    Return internal metadata. Create if it doesn't exist.
    JSON Resume v0.0.0 doesn't allow additional properties at the root level,
    so tuck this into the .basic sub-object.
     */

    JRSResume.prototype.i = function() {
      this.basics = this.basics || {};
      this.basics.imp = this.basics.imp || {};
      return this.basics.imp;
    };


    /** Reset the sheet to an empty state. */

    clear = function(clearMeta) {
      clearMeta = ((clearMeta === void 0) && true) || clearMeta;
      if (clearMeta) {
        delete this.imp;
      }
      delete this.basics.computed;
      delete this.work;
      delete this.volunteer;
      delete this.education;
      delete this.awards;
      delete this.publications;
      delete this.interests;
      delete this.skills;
      return delete this.basics.profiles;
    };


    /** Add work experience to the sheet. */

    JRSResume.prototype.add = function(moniker) {
      var defSheet, newObject;
      defSheet = JRSResume["default"]();
      newObject = $.extend(true, {}, defSheet[moniker][0]);
      this[moniker] = this[moniker] || [];
      this[moniker].push(newObject);
      return newObject;
    };


    /** Determine if the sheet includes a specific social profile (eg, GitHub). */

    JRSResume.prototype.hasProfile = function(socialNetwork) {
      socialNetwork = socialNetwork.trim().toLowerCase();
      return this.basics.profiles && _.some(this.basics.profiles, function(p) {
        return p.network.trim().toLowerCase() === socialNetwork;
      });
    };


    /** Determine if the sheet includes a specific skill. */

    JRSResume.prototype.hasSkill = function(skill) {
      skill = skill.trim().toLowerCase();
      return this.skills && _.some(this.skills, function(sk) {
        return sk.keywords && _.some(sk.keywords, function(kw) {
          return kw.trim().toLowerCase() === skill;
        });
      });
    };


    /** Validate the sheet against the JSON Resume schema. */

    JRSResume.prototype.isValid = function() {
      var ret, schema, schemaObj, validate;
      schema = FS.readFileSync(PATH.join(__dirname, 'resume.json'), 'utf8');
      schemaObj = JSON.parse(schema);
      validator = require('is-my-json-valid');
      validate = validator(schemaObj, {
        formats: {
          date: /^\d{4}(?:-(?:0[0-9]{1}|1[0-2]{1})(?:-[0-9]{2})?)?$/
        }
      });
      ret = validate(this);
      if (!ret) {
        this.basics.imp = this.basics.imp || {};
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

    JRSResume.prototype.duration = function(unit) {
      var careerLast, careerStart;
      unit = unit || 'years';
      if (this.work && this.work.length) {
        careerStart = this.work[this.work.length - 1].safeStartDate;
        if ((typeof careerStart === 'string' || careerStart instanceof String) && !careerStart.trim()) {
          return 0;
        }
        careerLast = _.max(this.work, function(w) {
          return w.safeEndDate.unix();
        }).safeEndDate;
        return careerLast.diff(careerStart, unit);
      }
      return 0;
    };


    /**
    Sort dated things on the sheet by start date descending. Assumes that dates
    on the sheet have been processed with _parseDates().
     */

    JRSResume.prototype.sort = function() {
      var byDateDesc;
      byDateDesc = function(a, b) {
        if (a.safeStartDate.isBefore(b.safeStartDate)) {
          return 1;
        } else {
          return (a.safeStartDate.isAfter(b.safeStartDate) && -1) || 0;
        }
      };
      this.work && this.work.sort(byDateDesc);
      this.education && this.education.sort(byDateDesc);
      this.volunteer && this.volunteer.sort(byDateDesc);
      this.awards && this.awards.sort(function(a, b) {
        if (a.safeDate.isBefore(b.safeDate)) {
          return 1;
        } else {
          return (a.safeDate.isAfter(b.safeDate) && -1) || 0;
        }
      });
      return this.publications && this.publications.sort(function(a, b) {
        if (a.safeReleaseDate.isBefore(b.safeReleaseDate)) {
          return 1;
        } else {
          return (a.safeReleaseDate.isAfter(b.safeReleaseDate) && -1) || 0;
        }
      });
    };

    JRSResume.prototype.dupe = function() {
      var rnew;
      rnew = new JRSResume();
      rnew.parse(this.stringify(), {});
      return rnew;
    };


    /**
    Create a copy of this resume in which all fields have been interpreted as
    Markdown.
     */

    JRSResume.prototype.harden = function() {
      var HD, HDIN, hardenStringsInObject, ret, that;
      that = this;
      ret = this.dupe();
      HD = function(txt) {
        return '@@@@~' + txt + '~@@@@';
      };
      HDIN = function(txt) {
        return HD(txt);
      };
      hardenStringsInObject = function(obj, inline) {
        if (!obj) {
          return;
        }
        inline = inline === void 0 || inline;
        if (Object.prototype.toString.call(obj) === '[object Array]') {
          return obj.forEach(function(elem, idx, ar) {
            if (typeof elem === 'string' || elem instanceof String) {
              return ar[idx] = inline ? HDIN(elem) : HD(elem);
            } else {
              return hardenStringsInObject(elem);
            }
          });
        } else if (typeof obj === 'object') {
          return Object.keys(obj).forEach(function(key) {
            var sub;
            sub = obj[key];
            if (typeof sub === 'string' || sub instanceof String) {
              if (_.contains(['skills', 'url', 'website', 'startDate', 'endDate', 'releaseDate', 'date', 'phone', 'email', 'address', 'postalCode', 'city', 'country', 'region'], key)) {
                return;
              }
              if (key === 'summary') {
                return obj[key] = HD(obj[key]);
              } else {
                return obj[key] = inline ? HDIN(obj[key]) : HD(obj[key]);
              }
            } else {
              return hardenStringsInObject(sub);
            }
          });
        }
      };
      Object.keys(ret).forEach(function(member) {
        return hardenStringsInObject(ret[member]);
      });
      return ret;
    };

    return JRSResume;

  })();


  /** Get the default (empty) sheet. */

  JRSResume["default"] = function() {
    return new JRSResume().open(PATH.join(__dirname, 'empty-jrs.json'), 'Empty');
  };


  /**
  Convert this object to a JSON string, sanitizing meta-properties along the
  way. Don't override .toString().
   */

  JRSResume.stringify = function(obj) {
    var replacer;
    replacer = function(key, value) {
      var temp;
      temp = _.some(['imp', 'warnings', 'computed', 'filt', 'ctrl', 'index', 'safeStartDate', 'safeEndDate', 'safeDate', 'safeReleaseDate', 'result', 'isModified', 'htmlPreview', 'display_progress_bar'], function(val) {
        return key.trim() === val;
      });
      if (temp) {
        return void 0;
      } else {
        return value;
      }
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

  _parseDates = function() {
    var _fmt;
    _fmt = require('./fluent-date').fmt;
    this.work && this.work.forEach(function(job) {
      job.safeStartDate = _fmt(job.startDate);
      return job.safeEndDate = _fmt(job.endDate);
    });
    this.education && this.education.forEach(function(edu) {
      edu.safeStartDate = _fmt(edu.startDate);
      return edu.safeEndDate = _fmt(edu.endDate);
    });
    this.volunteer && this.volunteer.forEach(function(vol) {
      vol.safeStartDate = _fmt(vol.startDate);
      return vol.safeEndDate = _fmt(vol.endDate);
    });
    this.awards && this.awards.forEach(function(awd) {
      return awd.safeDate = _fmt(awd.date);
    });
    return this.publications && this.publications.forEach(function(pub) {
      return pub.safeReleaseDate = _fmt(pub.releaseDate);
    });
  };


  /**
  Export the JRSResume function/ctor.
   */

  module.exports = JRSResume;

}).call(this);
