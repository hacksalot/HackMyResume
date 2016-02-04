
/**
Definition of the HandlebarsGenerator class.
@license MIT. See LICENSE.md for details.
@module renderers/handlebars-generator
 */

(function() {
  var FS, HANDLEBARS, HMSTATUS, HandlebarsGenerator, PATH, READFILES, SLASH, _, parsePath, registerHelpers, registerPartials;

  _ = require('underscore');

  HANDLEBARS = require('handlebars');

  FS = require('fs');

  registerHelpers = require('../helpers/handlebars-helpers');

  PATH = require('path');

  parsePath = require('parse-filepath');

  READFILES = require('recursive-readdir-sync');

  HMSTATUS = require('../core/status-codes');

  SLASH = require('slash');


  /**
  Perform template-based resume generation using Handlebars.js.
  @class HandlebarsGenerator
   */

  HandlebarsGenerator = module.exports = {
    generateSimple: function(data, tpl) {
      var template;
      try {
        template = HANDLEBARS.compile(tpl, {
          strict: false,
          assumeObjects: false
        });
        return template(data);
      } catch (_error) {
        throw {
          fluenterror: HMSTATUS[template ? 'invokeTemplate' : 'compileTemplate'],
          inner: _error
        };
      }
    },
    generate: function(json, jst, format, curFmt, opts, theme) {
      var ctx, encData;
      registerPartials(format, theme);
      registerHelpers(theme, opts);
      encData = json;
      if (format === 'html' || format === 'pdf') {
        encData = json.markdownify();
      }
      if (format === 'doc') {
        encData = json.xmlify();
      }
      ctx = {
        r: encData,
        RAW: json,
        filt: opts.filters,
        format: format,
        opts: opts,
        engine: this,
        results: curFmt.files,
        headFragment: opts.headFragment || ''
      };
      return this.generateSimple(ctx, jst);
    }
  };

  registerPartials = function(format, theme) {
    var partialsFolder;
    if (_.contains(['html', 'doc', 'md', 'txt', 'pdf'], format)) {
      partialsFolder = PATH.join(parsePath(require.resolve('fresh-themes')).dirname, '/partials/', format === 'pdf' ? 'html' : format);
      _.each(READFILES(partialsFolder, function(error) {
        return {};
      }), function(el) {
        var compiledTemplate, name, pathInfo, tplData;
        pathInfo = parsePath(el);
        name = SLASH(PATH.relative(partialsFolder, el).replace(/\.(?:html|xml|hbs|md|txt)$/i, ''));
        tplData = FS.readFileSync(el, 'utf8');
        compiledTemplate = HANDLEBARS.compile(tplData);
        HANDLEBARS.registerPartial(name, compiledTemplate);
        return theme.partialsInitialized = true;
      });
    }
    return _.each(theme.partials, function(el) {
      var compiledTemplate, tplData;
      tplData = FS.readFileSync(el.path, 'utf8');
      compiledTemplate = HANDLEBARS.compile(tplData);
      return HANDLEBARS.registerPartial(el.name, compiledTemplate);
    });
  };

}).call(this);

//# sourceMappingURL=handlebars-generator.js.map
