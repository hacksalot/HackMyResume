/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Definition of the FRESHTheme class.
@module core/fresh-theme
@license MIT. See LICENSE.md for details.
*/



const FS = require('fs');
const _ = require('underscore');
const PATH = require('path');
const parsePath = require('parse-filepath');
const EXTEND = require('extend');
const HMSTATUS = require('./status-codes');
const loadSafeJson = require('../utils/safe-json-loader');
const READFILES = require('recursive-readdir-sync');



/* A representation of a FRESH theme asset.
@class FRESHTheme */
class FRESHTheme {

  constructor() {
    this.baseFolder = 'src';
  }

  /* Open and parse the specified theme. */
  open( themeFolder ) {

    this.folder = themeFolder;

    // Set up a formats hash for the theme
    let formatsHash = { };

    // Load the theme
    const themeFile = PATH.join(themeFolder, 'theme.json');
    const themeInfo = loadSafeJson(themeFile);
    if (themeInfo.ex) {
      throw{
        fluenterror:
          themeInfo.ex.op === 'parse'
          ? HMSTATUS.parseError
          : HMSTATUS.readError,
      inner: themeInfo.ex.inner
      };
    }

    // Move properties from the theme JSON file to the theme object
    EXTEND(true, this, themeInfo.json);

    // Check for an "inherits" entry in the theme JSON.
    if (this.inherits) {
      const cached = { };
      _.each(this.inherits, function(th, key) {
        // First, see if this is one of the predefined FRESH themes. There are
        // only a handful of these, but they may change over time, so we need to
        // query the official source of truth: the fresh-themes repository, which
        // mounts the themes conveniently by name to the module object, and which
        // is embedded locally inside the HackMyResume installation.
        // TODO: merge this code with
        let themePath;
        const themesObj = require('fresh-themes');
        if (_.has(themesObj.themes, th)) {
          themePath = PATH.join(
            parsePath( require.resolve('fresh-themes') ).dirname,
            '/themes/',
            th
          );
        } else {
          const d = parsePath( th ).dirname;
          themePath = PATH.join(d, th);
        }

        cached[ th ] = cached[th] || new FRESHTheme().open( themePath );
        return formatsHash[ key ] = cached[ th ].getFormat( key );
      });
    }

    // Load theme files
    formatsHash = _load.call(this, formatsHash);

    // Cache
    this.formats = formatsHash;

    // Set the official theme name
    this.name = parsePath( this.folder ).name;
    return this;
  }

  /* Determine if the theme supports the specified output format. */
  hasFormat( fmt ) { return _.has(this.formats, fmt); }

  /* Determine if the theme supports the specified output format. */
  getFormat( fmt ) { return this.formats[ fmt ]; }
}



/* Load and parse theme source files. */
var _load = function(formatsHash) {

  const that = this;
  const tplFolder = PATH.join(this.folder, this.baseFolder);

  // Iterate over all files in the theme folder, producing an array, fmts,
  // containing info for each file. While we're doing that, also build up
  // the formatsHash object.
  const fmts = READFILES(tplFolder).map(function(absPath) {
    return _loadOne.call(this, absPath, formatsHash, tplFolder);
  }
  , this);

  // Now, get all the CSS files...
  this.cssFiles = fmts.filter(fmt => fmt && (fmt.ext === 'css'));

  // For each CSS file, get its corresponding HTML file. It's possible that
  // a theme can have a CSS file but *no* HTML file, as when a theme author
  // creates a pure CSS override of an existing theme.
  this.cssFiles.forEach(function(cssf) {
    const idx = _.findIndex(fmts,  fmt  => fmt && (fmt.pre === cssf.pre) && (fmt.ext === 'html'));
    cssf.major = false;
    if (idx > -1) {
      fmts[ idx ].css = cssf.data;
      return fmts[ idx ].cssPath = cssf.path;
    } else {
      if (that.inherits) {
        // Found a CSS file without an HTML file in a theme that inherits
        // from another theme. This is the override CSS file.
        return that.overrides = { file: cssf.path, data: cssf.data };
      }
    }});

  // Now, save all the javascript file paths to a theme property.
  const jsFiles = fmts.filter(fmt => fmt && (fmt.ext === 'js'));
  this.jsFiles = jsFiles.map(jsf => jsf['path']);

  return formatsHash;
};


/* Load a single theme file. */
var _loadOne = function( absPath, formatsHash, tplFolder ) {

  const pathInfo = parsePath(absPath);
  if (pathInfo.basename.toLowerCase() === 'theme.json') { return; }

  const absPathSafe = absPath.trim().toLowerCase();
  let outFmt = '';
  let act = 'copy';
  let isPrimary = false;

  // If this is an "explicit" theme, all files of importance are specified in
  // the "transform" section of the theme.json file.
  if (this.explicit) {

    outFmt = _.find(Object.keys( this.formats ), function( fmtKey ) {
      const fmtVal = this.formats[ fmtKey ];
      return _.some(fmtVal.transform, function(fpath) {
        const absPathB = PATH.join( this.folder, fpath ).trim().toLowerCase();
        return absPathB === absPathSafe;
      }
      , this);
    }
    , this);
    if (outFmt) { act = 'transform'; }
  }

  if (!outFmt) {
    // If this file lives in a specific format folder within the theme,
    // such as "/latex" or "/html", then that format is the implicit output
    // format for all files within the folder
    const portion = pathInfo.dirname.replace(tplFolder,'');
    if (portion && portion.trim()) {
      if (portion[1] === '_') { return; }
      const reg = /^(?:\/|\\)(html|latex|doc|pdf|png|partials)(?:\/|\\)?/ig;
      const res = reg.exec( portion );
      if (res) {
        if (res[1] !== 'partials') {
          outFmt = res[1];
          if (!this.explicit) { act = 'transform'; }
        } else {
          this.partials = this.partials || [];
          this.partials.push( { name: pathInfo.name, path: absPath } );
          return null;
        }
      }
    }
  }

  // Otherwise, the output format is inferred from the filename, as in
  // compact-[outputformat].[extension], for ex, compact-pdf.html
  if (!outFmt) {
    const idx = pathInfo.name.lastIndexOf('-');
    outFmt = idx === -1 ? pathInfo.name : pathInfo.name.substr(idx+1);
    if (!this.explicit) { act = 'transform'; }
    const defFormats = require('./default-formats');
    isPrimary = _.some(defFormats, form => (form.name === outFmt) && (pathInfo.extname !== '.css'));
  }

  // Make sure we have a valid formatsHash
  formatsHash[ outFmt ] = formatsHash[outFmt] || {
    outFormat: outFmt,
    files: []
  };

  // Move symlink descriptions from theme.json to the format
  if (__guard__(this.formats != null ? this.formats[outFmt ] : undefined, x => x.symLinks)) {
    formatsHash[ outFmt ].symLinks = this.formats[ outFmt ].symLinks;
  }

  // Create the file representation object
  const obj = {
    action: act,
    primary: isPrimary,
    path: absPath,
    orgPath: PATH.relative(tplFolder, absPath),
    ext: pathInfo.extname.slice(1),
    title: friendlyName(outFmt),
    pre: outFmt,
    // outFormat: outFmt || pathInfo.name,
    data: FS.readFileSync(absPath, 'utf8'),
    css: null
  };

  // Add this file to the list of files for this format type.
  formatsHash[ outFmt ].files.push( obj );
  return obj;
};



/* Return a more friendly name for certain formats. */
var friendlyName = function( val ) {
  val = (val && val.trim().toLowerCase()) || '';
  const friendly = { yml: 'yaml', md: 'markdown', txt: 'text' };
  return friendly[val] || val;
};



module.exports = FRESHTheme;

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
