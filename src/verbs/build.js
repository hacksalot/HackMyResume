/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Implementation of the 'build' verb for HackMyResume.
@module verbs/build
@license MIT. See LICENSE.md for details.
*/



const _              = require('underscore');
const PATH           = require('path');
const MKDIRP         = require('mkdirp');
const extend         = require('extend');
const parsePath      = require('parse-filepath');
const RConverter     = require('fresh-jrs-converter');
const HMSTATUS       = require('../core/status-codes');
const HMEVENT        = require('../core/event-codes');
const RTYPES         = {
  FRESH: require('../core/fresh-resume'),
  JRS: require('../core/jrs-resume')
};
const _opts          = require('../core/default-options');
const FRESHTheme     = require('../core/fresh-theme');
const JRSTheme       = require('../core/jrs-theme');
const ResumeFactory  = require('../core/resume-factory');
const _fmts          = require('../core/default-formats');
const Verb           = require('../verbs/verb');

//const _err = null;
//const _log = null;
let _rezObj = null;
//const build = null;
//const prep = null;
//const single = null;
//const verifyOutputs = null;
//const addFreebieFormats = null;
//const expand = null;
//const verifyTheme = null;
//const loadTheme = null;

/** An invokable resume generation command. */
class BuildVerb extends Verb {

  /** Create a new build verb. */
  constructor() { super('build', _build); }
}


module.exports = BuildVerb;



/**
Given a source resume in FRESH or JRS format, a destination resume path, and a
theme file, generate 0..N resumes in the desired formats.
@param src Path to the source JSON resume file: "rez/resume.json".
@param dst An array of paths to the target resume file(s).
@param opts Generation options.
*/
var _build = function( src, dst, opts ) {

  let err;
  if (!src || !src.length) {
    this.err(HMSTATUS.resumeNotFound, {quit: true});
    return null;
  }

  _prep.call(this, src, dst, opts);

  // Load input resumes as JSON...
  const sheetObjects = ResumeFactory.load(src, {
    format: null, objectify: false, quit: true, inner: {
      sort: _opts.sort,
      private: _opts.private
    }
  }
  , this);

  // Explicit check for any resume loading errors...
  const problemSheets = _.filter(sheetObjects, so => so.fluenterror);
  if (problemSheets && problemSheets.length) {
    problemSheets[0].quit = true; // can't go on
    this.err(problemSheets[0].fluenterror, problemSheets[0]);
    return null;
  }

  // Get the collection of raw JSON sheets
  const sheets = sheetObjects.map(r => r.json);

  // Load the theme...
  let theme = null;
  this.stat(HMEVENT.beforeTheme, { theme: _opts.theme });
  try {
    const tFolder = _verifyTheme.call(this, _opts.theme);
    if (tFolder.fluenterror) {
      tFolder.quit = true;
      this.err(tFolder.fluenterror, tFolder);
      return;
    }
    theme = (_opts.themeObj = _loadTheme(tFolder));
    _addFreebieFormats(theme);
  } catch (error) {
    err = error;
    const newEx = {
      fluenterror: HMSTATUS.themeLoad,
      inner: err,
      attempted: _opts.theme,
      quit: true
    };
    this.err(HMSTATUS.themeLoad, newEx);
    return null;
  }

  this.stat(HMEVENT.afterTheme, {theme});

  // Check for invalid outputs...
  const inv = _verifyOutputs.call(this, dst, theme);
  if (inv && inv.length) {
    this.err(HMSTATUS.invalidFormat, {data: inv, theme, quit: true});
    return null;
  }

  //# Merge input resumes, yielding a single source resume...
  let rez = null;
  if (sheets.length > 1) {
    const isFRESH = !sheets[0].basics;
    const mixed = _.any(sheets, function(s) { if (isFRESH) { return s.basics; } else { return !s.basics; } });
    this.stat(HMEVENT.beforeMerge, { f: _.clone(sheetObjects), mixed });
    if (mixed) {
      this.err(HMSTATUS.mixedMerge);
    }
    rez = _.reduceRight(sheets, ( a, b ) => extend( true, b, a ));
    this.stat(HMEVENT.afterMerge, { r: rez });
  } else {
    rez = sheets[0];
  }

  // Convert the merged source resume to the theme's format, if necessary..
  const orgFormat = rez.basics ? 'JRS' : 'FRESH';
  const toFormat = theme.render ? 'JRS' : 'FRESH';
  if (toFormat !== orgFormat) {
    this.stat(HMEVENT.beforeInlineConvert);
    rez = RConverter[ `to${toFormat}` ]( rez );
    this.stat(HMEVENT.afterInlineConvert, { file: sheetObjects[0].file, fmt: toFormat });
  }

  // Announce the theme
  this.stat(HMEVENT.applyTheme, {r: rez, theme});

  // Load the resume into a FRESHResume or JRSResume object
  _rezObj = new (RTYPES[ toFormat ])().parseJSON( rez, {private: _opts.private} );

  // Expand output resumes...
  const targets = _expand(dst, theme);

  // Run the transformation!
  _.each(targets, function(t) {
    if (this.hasError() && opts.assert) { return { }; }
    t.final = _single.call(this, t, theme, targets);
    if (t.final != null ? t.final.fluenterror : undefined) {
      t.final.quit = opts.assert;
      this.err(t.final.fluenterror, t.final);
    }
  }
  , this);

  const results = {
    sheet: _rezObj,
    targets,
    processed: targets
  };

  if (this.hasError() && !opts.assert) {
    this.reject(results);
  } else if (!this.hasError()) {
    this.resolve(results);
  }

  return results;
};



/**
Prepare for a BUILD run.
*/
var _prep = function( src, dst, opts ) {
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
  const that = this;

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
  ( (src.length > 1) && ( !dst || !dst.length ) ) && dst.push( src.pop() );
};



/**
Generate a single target resume such as "out/rez.html" or "out/rez.doc".
TODO: Refactor.
@param targInfo Information for the target resume.
@param theme A FRESHTheme or JRSTheme object.
*/
var _single = function( targInfo, theme, finished ) {

  let ret = null;
  let ex = null;
  const f = targInfo.file;

  try {

    if (!targInfo.fmt) {
      return { };
    }
    let theFormat = null;

    this.stat(HMEVENT.beforeGenerate, {
      fmt: targInfo.fmt.outFormat,
      file: PATH.relative(process.cwd(), f)
    }
    );

    _opts.targets = finished;

    // If targInfo.fmt.files exists, this format is backed by a document.
    // Fluent/FRESH themes are handled here.
    if (targInfo.fmt.files && targInfo.fmt.files.length) {
      theFormat = _fmts.filter( fmt => fmt.name === targInfo.fmt.outFormat)[0];
      MKDIRP.sync(PATH.dirname( f ));
      ret = theFormat.gen.generate(_rezObj, f, _opts);

    // Otherwise this is an ad-hoc format (JSON, YML, or PNG) that every theme
    // gets "for free".
    } else {
      theFormat = _fmts.filter( fmt => fmt.name === targInfo.fmt.outFormat)[0];
      const outFolder = PATH.dirname(f);
      MKDIRP.sync(outFolder); // Ensure dest folder exists;
      ret = theFormat.gen.generate(_rezObj, f, _opts);
    }

  } catch (e) {
    ex = e;
  }

  this.stat(HMEVENT.afterGenerate, {
    fmt: targInfo.fmt.outFormat,
    file: PATH.relative(process.cwd(), f),
    error: ex
  }
  );

  if (ex) {
    if (ex.fluenterror) {
      ret = ex;
    } else {
      ret = {fluenterror: HMSTATUS.generateError, inner: ex};
    }
  }
  return ret;
};



/** Ensure that user-specified outputs/targets are valid. */
var _verifyOutputs = function( targets, theme ) {
  this.stat(HMEVENT.verifyOutputs, {targets, theme});
  return _.reject(targets.map( function( t ) {
    const pathInfo = parsePath(t);
    return {format: pathInfo.extname.substr(1)}; }),
    t => (t.format === 'all') || theme.hasFormat( t.format ));
};



/**
Reinforce the chosen theme with "freebie" formats provided by HackMyResume.
A "freebie" format is an output format such as JSON, YML, or PNG that can be
generated directly from the resume model or from one of the theme's declared
output formats. For example, the PNG format can be generated for any theme
that declares an HTML format; the theme doesn't have to provide an explicit
PNG template.
@param theTheme A FRESHTheme or JRSTheme object.
*/
var _addFreebieFormats = function( theTheme ) {
  // Add freebie formats (JSON, YAML, PNG) every theme gets...
  // Add HTML-driven PNG only if the theme has an HTML format.
  theTheme.formats.json = theTheme.formats.json || {
    freebie: true, title: 'json', outFormat: 'json', pre: 'json',
    ext: 'json', path: null, data: null
  };
  theTheme.formats.yml = theTheme.formats.yml || {
    freebie: true, title: 'yaml', outFormat: 'yml', pre: 'yml',
    ext: 'yml', path: null, data: null
  };
  if (theTheme.formats.html && !theTheme.formats.png) {
    theTheme.formats.png = {
      freebie: true, title: 'png', outFormat: 'png',
      ext: 'yml', path: null, data: null
    };
  }
};



/**
Expand output files. For example, "foo.all" should be expanded to
["foo.html", "foo.doc", "foo.pdf", "etc"].
@param dst An array of output files as specified by the user.
@param theTheme A FRESHTheme or JRSTheme object.
*/
var _expand = function( dst, theTheme ) {

  // Set up the destination collection. It's either the array of files passed
  // by the user or 'out/resume.all' if no targets were specified.
  const destColl = (dst && dst.length && dst) || [PATH.normalize('out/resume.all')];

  // Assemble an array of expanded target files... (can't use map() here)
  const targets = [];
  destColl.forEach(function(t) {
    const to = PATH.resolve(t);
    const pa = parsePath(to);
    const fmat = pa.extname || '.all';
    return targets.push.apply( targets,
      fmat === '.all'
      ? Object.keys( theTheme.formats ).map( function( k ) {
        const z = theTheme.formats[k];
        return { file: to.replace( /all$/g, z.outFormat ), fmt: z };
      })
      : [{ file: to, fmt: theTheme.getFormat( fmat.slice(1) ) }]
    );
  });
  return targets;
};



/**
Verify the specified theme name/path.
*/
var _verifyTheme = function( themeNameOrPath ) {

  // First, see if this is one of the predefined FRESH themes. There are only a
  // handful of these, but they may change over time, so we need to query
  // the official source of truth: the fresh-themes repository, which mounts the
  // themes conveniently by name to the module object, and which is embedded
  // locally inside the HackMyResume installation.
  let tFolder;
  const themesObj = require('fresh-themes');
  if (_.has(themesObj.themes, themeNameOrPath)) {
    tFolder = PATH.join(
      parsePath( require.resolve('fresh-themes') ).dirname,
      '/themes/',
      themeNameOrPath
    );
  } else {
  // Otherwsie it's a path to an arbitrary FRESH or JRS theme sitting somewhere
  // on the user's system (or, in the future, at a URI).
    tFolder = PATH.resolve(themeNameOrPath);
  }

  // In either case, make sure the theme folder exists
  const exists = require('path-exists').sync;
  if (exists(tFolder)) {
    return tFolder;
  } else {
    return {fluenterror: HMSTATUS.themeNotFound, data: _opts.theme};
  }
};



/**
Load the specified theme, which could be either a FRESH theme or a JSON Resume
theme (or both).
*/
var _loadTheme = function( tFolder ) {

  const themeJsonPath = PATH.join(tFolder, 'theme.json'); // [^1]
  const exists = require('path-exists').sync;

  // Create a FRESH or JRS theme object
  const theTheme =
    exists(themeJsonPath)
    ? new FRESHTheme().open(tFolder)
    : new JRSTheme().open(tFolder);

  // Cache the theme object
  _opts.themeObj = theTheme;
  return theTheme;
};


// FOOTNOTES
// ------------------------------------------------------------------------------
// [^1] We don't know ahead of time whether this is a FRESH or JRS theme.
//      However, all FRESH themes have a theme.json file, so we'll use that as a
//      canary for now, as an interim solution.
//
//      Unfortunately, with the exception of FRESH's theme.json, both FRESH and
//      JRS themes are free-form and don't have a ton of reliable distinguishing
//      marks, which makes a simple task like ad hoc theme detection harder than
//      it should be to do cleanly.
//
//      Another complicating factor is that it's possible for a theme to be BOTH.
//      That is, a single set of theme files can serve as a FRESH theme -and- a
//      JRS theme.
//
//      TODO: The most robust way to deal with all these issues is with a strong
//      theme validator. If a theme structure validates as a particular theme
//      type, then for all intents and purposes, it IS a theme of that type.
