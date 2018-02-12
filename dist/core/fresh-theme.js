(function() {
  /**
  Definition of the FRESHTheme class.
  @module core/fresh-theme
  @license MIT. See LICENSE.md for details.
  */
  /* Load and parse theme source files. */
  /* Load a single theme file. */
  /* Return a more friendly name for certain formats. */
  var EXTEND, FRESHTheme, FS, HMSTATUS, PATH, READFILES, _, _load, _loadOne, friendlyName, loadSafeJson, moment, parsePath, pathExists, validator;

  FS = require('fs');

  validator = require('is-my-json-valid');

  _ = require('underscore');

  PATH = require('path');

  parsePath = require('parse-filepath');

  pathExists = require('path-exists').sync;

  EXTEND = require('extend');

  HMSTATUS = require('./status-codes');

  moment = require('moment');

  loadSafeJson = require('../utils/safe-json-loader');

  READFILES = require('recursive-readdir-sync');

  /* A representation of a FRESH theme asset.
  @class FRESHTheme */
  FRESHTheme = class FRESHTheme {
    constructor() {
      this.baseFolder = 'src';
      return;
    }

    /* Open and parse the specified theme. */
    open(themeFolder) {
      var cached, formatsHash, pathInfo, that, themeFile, themeInfo;
      this.folder = themeFolder;
      // Open the [theme-name].json file; should have the same name as folder
      pathInfo = parsePath(themeFolder);
      // Set up a formats hash for the theme
      formatsHash = {};
      // Load the theme
      themeFile = PATH.join(themeFolder, 'theme.json');
      themeInfo = loadSafeJson(themeFile);
      if (themeInfo.ex) {
        throw {
          fluenterror: themeInfo.ex.op === 'parse' ? HMSTATUS.parseError : HMSTATUS.readError
        };
        ({
          inner: themeInfo.ex.inner
        });
      }
      that = this;
      // Move properties from the theme JSON file to the theme object
      EXTEND(true, this, themeInfo.json);
      // Check for an "inherits" entry in the theme JSON.
      if (this.inherits) {
        cached = {};
        _.each(this.inherits, function(th, key) {
          var d, themePath, themesObj;
          // First, see if this is one of the predefined FRESH themes. There are
          // only a handful of these, but they may change over time, so we need to
          // query the official source of truth: the fresh-themes repository, which
          // mounts the themes conveniently by name to the module object, and which
          // is embedded locally inside the HackMyResume installation.
          // TODO: merge this code with
          themesObj = require('fresh-themes');
          if (_.has(themesObj.themes, th)) {
            themePath = PATH.join(parsePath(require.resolve('fresh-themes')).dirname, '/themes/', th);
          } else {
            d = parsePath(th).dirname;
            themePath = PATH.join(d, th);
          }
          cached[th] = cached[th] || new FRESHTheme().open(themePath);
          return formatsHash[key] = cached[th].getFormat(key);
        });
      }
      // Load theme files
      formatsHash = _load.call(this, formatsHash);
      // Cache
      this.formats = formatsHash;
      // Set the official theme name
      this.name = parsePath(this.folder).name;
      return this;
    }

    /* Determine if the theme supports the specified output format. */
    hasFormat(fmt) {
      return _.has(this.formats, fmt);
    }

    /* Determine if the theme supports the specified output format. */
    getFormat(fmt) {
      return this.formats[fmt];
    }

  };

  _load = function(formatsHash) {
    var copyOnly, fmts, jsFiles, major, that, tplFolder;
    that = this;
    major = false;
    tplFolder = PATH.join(this.folder, this.baseFolder);
    copyOnly = ['.ttf', '.otf', '.png', '.jpg', '.jpeg', '.pdf'];
    // Iterate over all files in the theme folder, producing an array, fmts,
    // containing info for each file. While we're doing that, also build up
    // the formatsHash object.
    fmts = READFILES(tplFolder).map(function(absPath) {
      return _loadOne.call(this, absPath, formatsHash, tplFolder);
    }, this);
    // Now, get all the CSS files...
    this.cssFiles = fmts.filter(function(fmt) {
      return fmt && (fmt.ext === 'css');
    });
    // For each CSS file, get its corresponding HTML file. It's possible that
    // a theme can have a CSS file but *no* HTML file, as when a theme author
    // creates a pure CSS override of an existing theme.
    this.cssFiles.forEach(function(cssf) {
      var idx;
      idx = _.findIndex(fmts, function(fmt) {
        return fmt && fmt.pre === cssf.pre && fmt.ext === 'html';
      });
      cssf.major = false;
      if (idx > -1) {
        fmts[idx].css = cssf.data;
        return fmts[idx].cssPath = cssf.path;
      } else {
        if (that.inherits) {
          // Found a CSS file without an HTML file in a theme that inherits
          // from another theme. This is the override CSS file.
          return that.overrides = {
            file: cssf.path,
            data: cssf.data
          };
        }
      }
    });
    // Now, save all the javascript file paths to a theme property.
    jsFiles = fmts.filter(function(fmt) {
      return fmt && (fmt.ext === 'js');
    });
    this.jsFiles = jsFiles.map(function(jsf) {
      return jsf['path'];
    });
    return formatsHash;
  };

  _loadOne = function(absPath, formatsHash, tplFolder) {
    var absPathSafe, act, defFormats, idx, isPrimary, obj, outFmt, pathInfo, portion, ref, ref1, reg, res;
    pathInfo = parsePath(absPath);
    if (pathInfo.basename.toLowerCase() === 'theme.json') {
      return;
    }
    absPathSafe = absPath.trim().toLowerCase();
    outFmt = '';
    act = 'copy';
    isPrimary = false;
    // If this is an "explicit" theme, all files of importance are specified in
    // the "transform" section of the theme.json file.
    if (this.explicit) {
      outFmt = _.find(Object.keys(this.formats), function(fmtKey) {
        var fmtVal;
        fmtVal = this.formats[fmtKey];
        return _.some(fmtVal.transform, function(fpath) {
          var absPathB;
          absPathB = PATH.join(this.folder, fpath).trim().toLowerCase();
          return absPathB === absPathSafe;
        }, this);
      }, this);
      if (outFmt) {
        act = 'transform';
      }
    }
    if (!outFmt) {
      // If this file lives in a specific format folder within the theme,
      // such as "/latex" or "/html", then that format is the implicit output
      // format for all files within the folder
      portion = pathInfo.dirname.replace(tplFolder, '');
      if (portion && portion.trim()) {
        if (portion[1] === '_') {
          return;
        }
        reg = /^(?:\/|\\)(html|latex|doc|pdf|png|partials)(?:\/|\\)?/ig;
        res = reg.exec(portion);
        if (res) {
          if (res[1] !== 'partials') {
            outFmt = res[1];
            if (!this.explicit) {
              act = 'transform';
            }
          } else {
            this.partials = this.partials || [];
            this.partials.push({
              name: pathInfo.name,
              path: absPath
            });
            return null;
          }
        }
      }
    }
    if (!outFmt) {
      idx = pathInfo.name.lastIndexOf('-');
      outFmt = idx === -1 ? pathInfo.name : pathInfo.name.substr(idx + 1);
      if (!this.explicit) {
        act = 'transform';
      }
      defFormats = require('./default-formats');
      isPrimary = _.some(defFormats, function(form) {
        return form.name === outFmt && pathInfo.extname !== '.css';
      });
    }
    // Make sure we have a valid formatsHash
    formatsHash[outFmt] = formatsHash[outFmt] || {
      outFormat: outFmt,
      files: []
    };
    // Move symlink descriptions from theme.json to the format
    if ((ref = this.formats) != null ? (ref1 = ref[outFmt]) != null ? ref1.symLinks : void 0 : void 0) {
      formatsHash[outFmt].symLinks = this.formats[outFmt].symLinks;
    }
    // Create the file representation object
    obj = {
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
    formatsHash[outFmt].files.push(obj);
    return obj;
  };

  friendlyName = function(val) {
    var friendly;
    val = (val && val.trim().toLowerCase()) || '';
    friendly = {
      yml: 'yaml',
      md: 'markdown',
      txt: 'text'
    };
    return friendly[val] || val;
  };

  module.exports = FRESHTheme;

}).call(this);

//# sourceMappingURL=fresh-theme.js.map
