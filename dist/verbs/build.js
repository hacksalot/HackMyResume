(function() {
  /**
  Implementation of the 'build' verb for HackMyResume.
  @module verbs/build
  @license MIT. See LICENSE.md for details.
  */
  /**
  Reinforce the chosen theme with "freebie" formats provided by HackMyResume.
  A "freebie" format is an output format such as JSON, YML, or PNG that can be
  generated directly from the resume model or from one of the theme's declared
  output formats. For example, the PNG format can be generated for any theme
  that declares an HTML format; the theme doesn't have to provide an explicit
  PNG template.
  @param theTheme A FRESHTheme or JRSTheme object.
  */
  /**
  Given a source resume in FRESH or JRS format, a destination resume path, and a
  theme file, generate 0..N resumes in the desired formats.
  @param src Path to the source JSON resume file: "rez/resume.json".
  @param dst An array of paths to the target resume file(s).
  @param opts Generation options.
  */
  /**
  Expand output files. For example, "foo.all" should be expanded to
  ["foo.html", "foo.doc", "foo.pdf", "etc"].
  @param dst An array of output files as specified by the user.
  @param theTheme A FRESHTheme or JRSTheme object.
  */
  /**
  Load the specified theme, which could be either a FRESH theme or a JSON Resume
  theme (or both).
  */
  /**
  Prepare for a BUILD run.
  */
  /**
  Generate a single target resume such as "out/rez.html" or "out/rez.doc".
  TODO: Refactor.
  @param targInfo Information for the target resume.
  @param theme A FRESHTheme or JRSTheme object.
  */
  /** Ensure that user-specified outputs/targets are valid. */
  /**
  Verify the specified theme name/path.
  */
  var BuildVerb, FRESHTheme, FS, HMEVENT, HMSTATUS, JRSTheme, MD, MKDIRP, PATH, RConverter, RTYPES, ResumeFactory, Verb, _, _addFreebieFormats, _build, _err, _expand, _fmts, _loadTheme, _log, _opts, _prep, _rezObj, _single, _verifyOutputs, _verifyTheme, addFreebieFormats, build, expand, extend, loadTheme, parsePath, prep, single, verifyOutputs, verifyTheme;

  _ = require('underscore');

  PATH = require('path');

  FS = require('fs');

  MD = require('marked');

  MKDIRP = require('mkdirp');

  extend = require('extend');

  parsePath = require('parse-filepath');

  RConverter = require('fresh-jrs-converter');

  HMSTATUS = require('../core/status-codes');

  HMEVENT = require('../core/event-codes');

  RTYPES = {
    FRESH: require('../core/fresh-resume'),
    JRS: require('../core/jrs-resume')
  };

  _opts = require('../core/default-options');

  FRESHTheme = require('../core/fresh-theme');

  JRSTheme = require('../core/jrs-theme');

  ResumeFactory = require('../core/resume-factory');

  _fmts = require('../core/default-formats');

  Verb = require('../verbs/verb');

  _err = null;

  _log = null;

  _rezObj = null;

  build = null;

  prep = null;

  single = null;

  verifyOutputs = null;

  addFreebieFormats = null;

  expand = null;

  verifyTheme = null;

  loadTheme = null;

  /** An invokable resume generation command. */
  module.exports = BuildVerb = class BuildVerb extends Verb {
    /** Create a new build verb. */
    constructor() {
      super('build', _build);
    }

  };

  _build = function(src, dst, opts) {
    var err, inv, isFRESH, mixed, newEx, orgFormat, problemSheets, results, rez, sheetObjects, sheets, tFolder, targets, theme, toFormat;
    if (!src || !src.length) {
      this.err(HMSTATUS.resumeNotFound, {
        quit: true
      });
      return null;
    }
    _prep.call(this, src, dst, opts);
    // Load input resumes as JSON...
    sheetObjects = ResumeFactory.load(src, {
      format: null,
      objectify: false,
      quit: true,
      inner: {
        sort: _opts.sort,
        private: _opts.private
      }
    }, this);
    // Explicit check for any resume loading errors...
    problemSheets = _.filter(sheetObjects, function(so) {
      return so.fluenterror;
    });
    if (problemSheets && problemSheets.length) {
      problemSheets[0].quit = true; // can't go on
      this.err(problemSheets[0].fluenterror, problemSheets[0]);
      return null;
    }
    // Get the collection of raw JSON sheets
    sheets = sheetObjects.map(function(r) {
      return r.json;
    });
    // Load the theme...
    theme = null;
    this.stat(HMEVENT.beforeTheme, {
      theme: _opts.theme
    });
    try {
      tFolder = _verifyTheme.call(this, _opts.theme);
      if (tFolder.fluenterror) {
        tFolder.quit = true;
        this.err(tFolder.fluenterror, tFolder);
        return;
      }
      theme = _opts.themeObj = _loadTheme(tFolder);
      _addFreebieFormats(theme);
    } catch (error) {
      err = error;
      newEx = {
        fluenterror: HMSTATUS.themeLoad,
        inner: err,
        attempted: _opts.theme,
        quit: true
      };
      this.err(HMSTATUS.themeLoad, newEx);
      return null;
    }
    this.stat(HMEVENT.afterTheme, {
      theme: theme
    });
    // Check for invalid outputs...
    inv = _verifyOutputs.call(this, dst, theme);
    if (inv && inv.length) {
      this.err(HMSTATUS.invalidFormat, {
        data: inv,
        theme: theme,
        quit: true
      });
      return null;
    }
    //# Merge input resumes, yielding a single source resume...
    rez = null;
    if (sheets.length > 1) {
      isFRESH = !sheets[0].basics;
      mixed = _.any(sheets, function(s) {
        if (isFRESH) {
          return s.basics;
        } else {
          return !s.basics;
        }
      });
      this.stat(HMEVENT.beforeMerge, {
        f: _.clone(sheetObjects),
        mixed: mixed
      });
      if (mixed) {
        this.err(HMSTATUS.mixedMerge);
      }
      rez = _.reduceRight(sheets, function(a, b, idx) {
        return extend(true, b, a);
      });
      this.stat(HMEVENT.afterMerge, {
        r: rez
      });
    } else {
      rez = sheets[0];
    }
    orgFormat = rez.basics ? 'JRS' : 'FRESH';
    toFormat = theme.render ? 'JRS' : 'FRESH';
    if (toFormat !== orgFormat) {
      this.stat(HMEVENT.beforeInlineConvert);
      rez = RConverter['to' + toFormat](rez);
      this.stat(HMEVENT.afterInlineConvert, {
        file: sheetObjects[0].file,
        fmt: toFormat
      });
    }
    // Announce the theme
    this.stat(HMEVENT.applyTheme, {
      r: rez,
      theme: theme
    });
    // Load the resume into a FRESHResume or JRSResume object
    _rezObj = new RTYPES[toFormat]().parseJSON(rez, {
      private: _opts.private
    });
    targets = _expand(dst, theme);
    // Run the transformation!
    _.each(targets, function(t) {
      var ref;
      if (this.hasError() && opts.assert) {
        return {};
      }
      t.final = _single.call(this, t, theme, targets);
      if ((ref = t.final) != null ? ref.fluenterror : void 0) {
        t.final.quit = opts.assert;
        this.err(t.final.fluenterror, t.final);
      }
    }, this);
    results = {
      sheet: _rezObj,
      targets: targets,
      processed: targets
    };
    if (this.hasError() && !opts.assert) {
      this.reject(results);
    } else if (!this.hasError()) {
      this.resolve(results);
    }
    return results;
  };

  _prep = function(src, dst, opts) {
    var that;
    // Cherry-pick options //_opts = extend( true, _opts, opts );
    _opts.theme = (opts.theme && opts.theme.toLowerCase().trim()) || 'modern';
    _opts.prettify = opts.prettify === true;
    _opts.private = opts.private === true;
    _opts.noescape = opts.noescape === true;
    _opts.css = opts.css;
    _opts.pdf = opts.pdf;
    _opts.wrap = opts.wrap || 60;
    _opts.stitles = opts.sectionTitles;
    _opts.tips = opts.tips;
    _opts.errHandler = opts.errHandler;
    _opts.noTips = opts.noTips;
    _opts.debug = opts.debug;
    _opts.sort = opts.sort;
    _opts.wkhtmltopdf = opts.wkhtmltopdf;
    that = this;
    // Set up callbacks for internal generators
    _opts.onTransform = function(info) {
      that.stat(HMEVENT.afterTransform, info);
    };
    _opts.beforeWrite = function(info) {
      that.stat(HMEVENT.beforeWrite, info);
    };
    _opts.afterWrite = function(info) {
      that.stat(HMEVENT.afterWrite, info);
    };
    // If two or more files are passed to the GENERATE command and the TO
    // keyword is omitted, the last file specifies the output file.
    (src.length > 1 && (!dst || !dst.length)) && dst.push(src.pop());
  };

  _single = function(targInfo, theme, finished) {
    var e, ex, f, fName, fType, outFolder, ret, theFormat;
    ret = null;
    ex = null;
    f = targInfo.file;
    try {
      if (!targInfo.fmt) {
        return {};
      }
      fType = targInfo.fmt.outFormat;
      fName = PATH.basename(f, '.' + fType);
      theFormat = null;
      this.stat(HMEVENT.beforeGenerate, {
        fmt: targInfo.fmt.outFormat,
        file: PATH.relative(process.cwd(), f)
      });
      _opts.targets = finished;
      // If targInfo.fmt.files exists, this format is backed by a document.
      // Fluent/FRESH themes are handled here.
      if (targInfo.fmt.files && targInfo.fmt.files.length) {
        theFormat = _fmts.filter(function(fmt) {
          return fmt.name === targInfo.fmt.outFormat;
        })[0];
        MKDIRP.sync(PATH.dirname(f));
        ret = theFormat.gen.generate(_rezObj, f, _opts);
      } else {
        // Otherwise this is an ad-hoc format (JSON, YML, or PNG) that every theme
        // gets "for free".
        theFormat = _fmts.filter(function(fmt) {
          return fmt.name === targInfo.fmt.outFormat;
        })[0];
        outFolder = PATH.dirname(f);
        MKDIRP.sync(outFolder); // Ensure dest folder exists;
        ret = theFormat.gen.generate(_rezObj, f, _opts);
      }
    } catch (error) {
      e = error;
      ex = e;
    }
    this.stat(HMEVENT.afterGenerate, {
      fmt: targInfo.fmt.outFormat,
      file: PATH.relative(process.cwd(), f),
      error: ex
    });
    if (ex) {
      if (ex.fluenterror) {
        ret = ex;
      } else {
        ret = {
          fluenterror: HMSTATUS.generateError,
          inner: ex
        };
      }
    }
    return ret;
  };

  _verifyOutputs = function(targets, theme) {
    this.stat(HMEVENT.verifyOutputs, {
      targets: targets,
      theme: theme
    });
    return _.reject(targets.map(function(t) {
      var pathInfo;
      pathInfo = parsePath(t);
      return {
        format: pathInfo.extname.substr(1)
      };
    }), function(t) {
      return t.format === 'all' || theme.hasFormat(t.format);
    });
  };

  _addFreebieFormats = function(theTheme) {
    // Add freebie formats (JSON, YAML, PNG) every theme gets...
    // Add HTML-driven PNG only if the theme has an HTML format.
    theTheme.formats.json = theTheme.formats.json || {
      freebie: true,
      title: 'json',
      outFormat: 'json',
      pre: 'json',
      ext: 'json',
      path: null,
      data: null
    };
    theTheme.formats.yml = theTheme.formats.yml || {
      freebie: true,
      title: 'yaml',
      outFormat: 'yml',
      pre: 'yml',
      ext: 'yml',
      path: null,
      data: null
    };
    if (theTheme.formats.html && !theTheme.formats.png) {
      theTheme.formats.png = {
        freebie: true,
        title: 'png',
        outFormat: 'png',
        ext: 'yml',
        path: null,
        data: null
      };
    }
  };

  _expand = function(dst, theTheme) {
    var destColl, targets;
    // Set up the destination collection. It's either the array of files passed
    // by the user or 'out/resume.all' if no targets were specified.
    destColl = (dst && dst.length && dst) || [PATH.normalize('out/resume.all')];
    targets = [];
    destColl.forEach(function(t) {
      var fmat, pa, to;
      to = PATH.resolve(t);
      pa = parsePath(to);
      fmat = pa.extname || '.all';
      return targets.push.apply(targets, fmat === '.all' ? Object.keys(theTheme.formats).map(function(k) {
        var z;
        z = theTheme.formats[k];
        return {
          file: to.replace(/all$/g, z.outFormat),
          fmt: z
        };
      }) : [
        {
          file: to,
          fmt: theTheme.getFormat(fmat.slice(1))
        }
      ]);
    });
    return targets;
  };

  _verifyTheme = function(themeNameOrPath) {
    var exists, tFolder, themesObj;
    // First, see if this is one of the predefined FRESH themes. There are only a
    // handful of these, but they may change over time, so we need to query
    // the official source of truth: the fresh-themes repository, which mounts the
    // themes conveniently by name to the module object, and which is embedded
    // locally inside the HackMyResume installation.
    themesObj = require('fresh-themes');
    if (_.has(themesObj.themes, themeNameOrPath)) {
      tFolder = PATH.join(parsePath(require.resolve('fresh-themes')).dirname, '/themes/', themeNameOrPath);
    } else {
      // Otherwsie it's a path to an arbitrary FRESH or JRS theme sitting somewhere
      // on the user's system (or, in the future, at a URI).
      tFolder = PATH.resolve(themeNameOrPath);
    }
    // In either case, make sure the theme folder exists
    exists = require('path-exists').sync;
    if (exists(tFolder)) {
      return tFolder;
    } else {
      return {
        fluenterror: HMSTATUS.themeNotFound,
        data: _opts.theme
      };
    }
  };

  _loadTheme = function(tFolder) {
    var exists, theTheme, themeJsonPath;
    themeJsonPath = PATH.join(tFolder, 'theme.json'); // [^1]
    exists = require('path-exists').sync;
    // Create a FRESH or JRS theme object
    theTheme = exists(themeJsonPath) ? new FRESHTheme().open(tFolder) : new JRSTheme().open(tFolder);
    // Cache the theme object
    _opts.themeObj = theTheme;
    return theTheme;
  };

  // FOOTNOTES
// ------------------------------------------------------------------------------
// [^1] We don't know ahead of time whether this is a FRESH or JRS theme.
//      However, all FRESH themes have a theme.json file, so we'll use that as a
//      canary for now, as an interim solution.

//      Unfortunately, with the exception of FRESH's theme.json, both FRESH and
//      JRS themes are free-form and don't have a ton of reliable distinguishing
//      marks, which makes a simple task like ad hoc theme detection harder than
//      it should be to do cleanly.

//      Another complicating factor is that it's possible for a theme to be BOTH.
//      That is, a single set of theme files can serve as a FRESH theme -and- a
//      JRS theme.

//      TODO: The most robust way to deal with all these issues is with a strong
//      theme validator. If a theme structure validates as a particular theme
//      type, then for all intents and purposes, it IS a theme of that type.

}).call(this);

//# sourceMappingURL=build.js.map
