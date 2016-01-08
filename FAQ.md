Frequently Asked Questions (FAQ)
================================

## How do I get started with HackMyResume?

1. Install with NPM: `[sudo] npm install hackmyresume -g`.

2. Create a new resume with: `hackmyresume NEW <resume-name>.json`.

3. Test with `hackmyresume BUILD <resume-name>.json`. Look in the `out/` folder.

4. Play around with different themes with the `-t` or `--theme` parameter. You can use any [FRESH](https://github.com/fluentdesk/fresh-themes) or [JSON Resume](https://jsonresume.org/themes) theme. The latter have to be installed first.

## What is FRESH?

FRESH is the **F**luent **R**esume and **E**mployment **S**ystem for **H**umans. It's an open-source, user-first workflow, schema, and set of practices for technical candidates and recruiters.

## What is FRESCA?

The **F**RESH **R**esume and **E**mployment **SC**hem**A**&mdash;an open-source, JSON-driven schema for resumes, CVs, and other employment artifacts. FRESCA is the recommended schema/format for FRESH, with optional support for JSON Resume.

## What is JSON Resume?

An [open resume standard](http://jsonresume.org/themes/) sponsored by Hired.com. Like FRESCA, JSON Resume is JSON-driven and open-source. Unlike FRESCA, JSON Resume targets a worldwide audience where FRESCA is optimized for technical candidates.

## Should I use the FRESH or JSON Resume format/schema for my resume?

Both! The workflow we like to use:

1. Create a resume in FRESH format for tooling and analysis.
2. Convert it to JSON Resume format for additional themes/tools.
3. Maintain both versions.

Both formats are open-source and both formats are JSON-driven. FRESH was designed as a universal container format and superset of existing formats, where the JSON Resume format is intended for a generic audience.

## How do I use a FRESH theme?

FRESH themes currently come preinstalled with HackMyResume.

1. Specify the theme name in the `--theme` or `-t` parameter to the **build** command:

    ```bash
    hackmyresume BUILD my-resume.json --theme <theme-name>`
    ```

    `<theme-name>` can be one of `positive`, `compact`, `modern`, `minimist`, `hello-world`, or `awesome`.

2. Check your output folder. Although under FRESH, HTML formats are hardened to a degree for local file access, it's best to view HTML formats over a local web server connection.

## How do I use a JSON Resume theme?

1. Install the theme locally. The easiest way to do that is with NPM.

    ```bash
    npm install jsonresume-theme-classy
    ```

2. Pass the theme folder path into HackMyResume:

    ```bash
    hackmyresume BUILD resume.json --theme node_modules/jsonresume-theme-classy
    ```

3. Check your output folder. It's best to view HTML formats over a local web server connection.

## Should I keep my resume in version control?

Absolutely! As text-based, JSON-driven documents, both FRESH and JSON Resume are ideal candidates for version control. Future versions of HackMyResume will have this functionality built-in.

## Can I change the default section titles ("Employment", "Skills", etc.)?

If you're using a FRESH theme, yes. First, create a HackMyResume options file mapping resume sections to your preferred section title:

```javascript
// myoptions.json
{
  "sectionTitles": {
    "employment": "empleo",
    "skills": "habilidades",
    "education": "educación"
  }
}
```

Then, pass the options file into the `-o` or `--opts` parameter:

```bash
hackmyresume BUILD resume.json -o myoptions.json
```

This ability is currently only supported for FRESH resume themes.

## The HackMyResume terminal color scheme is giving me a headache! Can I disable it?

Yes. Use the `--no-color` option to disable terminal colors:

`hackmyresume <somecommand> <someoptions> --no-color`
