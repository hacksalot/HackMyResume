CHANGELOG
=========
## v1.6.0

### Added

- Improved consistency and coverage for all FRESH themes.

- Support for new `projects` and `affiliations` resume sections.

- Better handling of start and end dates on `employment`, `projects`,
`education`, and other sections with start/end dates. A missing or empty
end date will be interpreted as "currently employed/engaged/involved with
the job/project/education", as will the words "current", "present", or "new".

- New command! `PEEK` at any arbitrary field or entry on your `.json` resume.

- Annotated the HTML and MS Word (XML) formats of the Modern theme for FRESH
theme authors.

- Emit extended status and error info with the `--debug` or `-d` switch.

- The `-o` or `--options` switch can now handle either the path to a **JSON
settings file** or **raw JSON/JavaScript**. Since the JSON double quote syntax
is a bit cumbersome from the command line, HackMyResume accepts regular
JavaScript object literal syntax:

        hackmyresume build resume.json -o "{ theme: 'compact', silent: 'true' }"

- Ability to disable sorting of resume sections (employments, projects, etc.)
with the `--no-sort` option. HMR will respect the order of items as they appear
in your resume `.json` file.

- Improvements to the starter resume emitted by `hackmyresume new`.

- Refactored colors in HackMyResume output. Errors will now display as red,
warnings as yellow, successful operations as green, and informational warnings
as cyan. Similar to the color scheme used by Bootstrap.

- Added CHANGELOG.md (this file).

### Changed

- Rewrote the HackMyResume man/help page.

- Minor updates to the FRESCA schema.

- PDF generation now uses asynchronous `spawn()` which has better compatibility
with old or boutique versions of Node.js. Synchronous spawn is preserved as an
internal code path.

### Fixed

- Issue with synchronous spawning of PDF generation process on older
versions of Node.

- Issue with stack traces not being emitted correctly when needed.

- Issue with `speaking` section not appearing on generated resume.

### Internal

- Logging messages have been moved out of core HackMyResume code ahead of
localization support.

- All HackMyResume console output is described in `msg.yml`.

- Relaxed pure JavaScript requirement. CoffeeScript will now start appearing
in HackMyResume and FluentCV sources!

- Additional tests.

## v1.5.2

### Fixed

- Tweak stack trace under `--debug`.

## v1.5.1

### Added

- Preliminary support for `-d` or `--debug` flag. Forces HackMyResume to emit a stack trace under error conditions.

## v1.5.0

### Added

- HackMyResume now supports **CLI-based generation of PDF formats across multiple engines (Phantom, wkhtmltopdf, etc)**. Instead of talking to these engines over a programmatic API, as in prior versions, HackMyResume 1.5+ speaks to them over the same command-line interface (CLI) you'd use if you were using these tools directly.

- HackMyResume will now (attempt to) **generate a PDF output for JSON Resume themes** (in addition to HTML).

- Minor README and FAQ additions.

### Changed

- **Cleaner, quicker installs**. Installing HackMyResume with `npm install hackmyresume -g` will no longer trigger a lengthy, potentially error-prone install for Phantom.js and/or wkhtmltopdf for PDF support. Instead, users can install these engines externally and HMR will use them when present.

- Minor error handling improvements.

### Fixed

- Fixed an error with generating specific formats with the `BUILD` command (#97).

- Fixed numerous latent/undocumented bugs and glitches.

## v1.4.2

### Added

- Introduced [FAQ](https://github.com/hacksalot/HackMyResume/blob/master/FAQ.md).
- Additional README notes.

## v1.4.1

### Added

- `hackmyresume new` now generates a [valid starter resume with sample data](https://github.com/fluentdesk/fresh-resume-starter).

### Fixed

- Fixed warning message when `hackmyresume new` is run without a filename.

## v1.4.0

### Added

- **"Projects" support**: FRESH resumes and themes can now store and display
open source, commercial, private, personal, and creative projects.
- **New command: ANALYZE**. Inspect your resume for gaps, keyword counts, and other metrics. (Experimental.)
- **Side-by-side PDF generation** with Phantom and wkhtmltopdf. Use the `--pdf` or `-p` flag to pick between `phantom` and `wkhtmltopdf` generation.
- **Disable PDF generation** with the `--pdf none` switch.
- **Inherit formats between themes**. Themes can now inherit formats (Word, HTML, .txt, etc.) from other themes. (FRESH themes only.)
- **Rename resume sections** to different languages or wordings.
- **Specify complex options via external file**. Use with the `-o` or `--opts` option.
- **Disable colors** with the `--no-color` flag.
- **Theme messages and usage tips** instructions will now appear in the default HackMyResume output for the `build` command. Run `hackmyresume build resume.json -t awesome` for an example. Turn off with the `--no-tips` flag.
- **Treat validation errors as warnings** with the `--assert` switch (VALIDATE command only).

### Fixed

- Fixed a minor glitch in the FRESCA schema.
- Fixed encoding issues in the `Highlights` section of certain resumes.
- Fix behavior of `-s` and `--silent` flags.

### Changed

- PDF generation now defaults to Phantom for all platforms, with `wkhtmltopdf`
accessible with `--pdf wkhtmltopdf`.
- Resumes are now validated, by default, prior to generation. This
behavior can be disabled with the `--novalidate` or `--force` switch.
- Syntax errors in source FRESH and JSON Resumes are now captured for all
commands.
- Minor updates to README.
- Most themes now inherit Markdown and Plain Text formats from the **Basis**
theme.

### Internal

- Switched from color to chalk.
- Command invocations now handled through commander.js.
- Improved FRESH theme infrastructure (more partials, more DRY).

## v1.3.1

### Added

- Add additional Travis badges.

### Fixed

- Fix extraneous console log output when generating a FRESH theme to MS Word.
- Fix Travis tests on `dev`.

## v1.3.0

### Added

- **Local generation of JSON Resume themes**. To use a JSON Resume theme, first install it with `npm install jsonresume-theme-[blah]` (most JSON Resume themes are on NPM). Then pass it into HackMyResume via the `-t` parameter:

    `hackmyresume BUILD resume.json TO out/somefile.all -t node_modules/jsonresume-theme-classy`
- **Better Markdown support.** HackMyResume will start flowing basic Markdown styles to JSON Resume (HTML) themes. FRESH's existing Markdown support has also been improved.
- **.PNG output formats** will start appearing in themes that declare an HTML output.
- **Tweak CSS embedding / linking via the --css option** (`<style></style>` vs `<link>`). Only works for HTML (or HTML-driven) formats of FRESH themes. Use `--css=link` to link in CSS assets and `--css=embed` to embed the styles in the HTML document. For example `hackmyresume BUILD resume.json TO out/resume.all --css=link`.
- **Improved Handlebars/Underscore helper support** for FRESH themes. Handlebars themes can access helpers via `{{helperName}}`. Underscore themes can access helpers via the `h` object.

### Changed

- **Distinguish between validation errors and syntax errors** when validating a FRESH or JRS resume with `hackmyresume validate <blah>`.
- **Emit line and column info** for syntax errors during validation of FRESH and JRS resumes.
- **FRESH themes now embed CSS into HTML formats by default** so that the HTML resume output doesn't have an external CSS file dependency by default. Users can specify normal linked stylesheets by setting `--css=link`.
- **Renamed fluent-themes repo to fresh-themes** in keeping with the other parts of the project.

### Fixed

- Fix various encoding errors in MS Word outputs.
- Fix assorted FRESH-to-JRS and JRS-to-FRESH conversion glitches.
- Fix error when running HMR with no parameters.
- Other minor fixes.

## v1.3.0-beta

- Numerous changes supporting v1.3.0.

## v1.2.2

### Fixed

- Various in-passing fixes.

## v1.2.1

### Fixed

- Fix `require('FRESCA')` error.
- Fix `.history` and `.map` errors on loading incomplete or empty JRS resumes.

### Added

- Better test coverage of incomplete/empty resumes.

## v1.2.0

### Fixed

- Fixed the `new` command: Generate a new FRESH-format resume with `hackmyresume new resume.json` or a new JSON Resume with `hackmyresume new resume.json -f jrs`.

### Added

- Introduced CLI tests.

## v1.1.0

### Fixed

- MS Word formats: Fixed skill coloring/level bug.

### Changed

- Make the `TO` keyword optional. If no `TO` keyword is specified (for the `build` and `convert` commands), HMR will assume the last file passed in is the desired output file. So these are equivalent:

    ```shell
    hackmyresume BUILD resume.json TO out/resume.all
    hackmyresume BUILD resume.json out/resume.all
    ```

    `TO` only needs to be included if you have multipled output files:

    ```shell
     hackmyresume BUILD resume.json TO out1.doc out2.html out3.tex
    ```

## v1.0.1

### Fixed

- Correctly generate MS Word hyperlinks from Markdown source data.

## v1.0.0

- Initial public 1.0 release.
