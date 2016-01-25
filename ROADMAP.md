Development Roadmap
===================

## Short-Term

### FluentCV Desktop: Beta 1

The **FluentCV Desktop 1.0 beta release** will present HackMyResume
functionality in a cross-platform desktop application for OS X, Linux, and
Windows.

### GitHub Integration

HackMyResume will offer GitHub integration for versioned resume storage and
retrieval via the `COMMIT` or `STORE` command(s) starting in 1.7.0 or 1.8.0.

### fresh-themes 1.0.0

The **fresh-themes 1.0** release will bring 100% coverage of the FRESH and JRS
object models&mdash;all resume sections and fields&mdash;along with
documentation, theme developer's guide, new themes, and a freeze to the FRESH
theme structure.

### Better LaTeX support

Including Markdown-to-LaTeX translation and more LaTeX-driven themes / formats.

### StackOverflow and LinkedIn support

Will start appearing in v1.7.0, with incremental improvements in 1.8.0 and
beyond.

### Improved resume sorting and arranging

**Better resume sorting** of items and sections: ascending, descending, by
date or other criteria ([#67][i67]).

### Remote resume / theme loading

Support remote loading of themes and resumes over `http`, `https`, and
`git://`. Enable these usage patterns:

    ```bash
    hackmyresume build https://somesite.com/my-resume.json -t informatic

    hackmyresume build resume.json -t npm:fresh-theme-ergonomic

    hackmyresume analyze https://github.com/foo/my-resume
    ```

### 100% code coverage

Should reduce certain classes of errors and allow HMR to display a nifty 100%
code coverage badge.

### Improved **documentation and samples**

Expanded documentation and samples throughout.

## Mid-Term

### Cover letters and job descriptions

Add support for schema-driven **cover letters** and **job descriptions**.

### Character Sheets

HackMyResume 2.0 will ship with support for, yes, RPG-style character sheets.
This will demonstrate the tool's ability to flow arbitrary JSON to concrete
document(s) and provide unique albeit niche functionality around various games
([#117][i117]).

### Rich text (.rtf) output formats

Basic support for **rich text** `.rtf` output formats.

### Investigate: groff support

Investigate adding [**groff**][groff] support, because that would, indeed, be
[dope][d] ([#37][i37]).

### Investigate: org-mode support

Investigate adding [**org mode**][om] support ([#38][i38]).

### Investigate: Scribus

Investigate adding [**Scribus SLA**][scri] support ([#54][i54]).

### Support JSON Resume 1.0.0

When released.

## Long-Term

- TBD

[groff]: http://www.gnu.org/software/groff/
[om]: http://orgmode.org/
[scri]: https://en.wikipedia.org/wiki/Scribus
[d]: https://github.com/hacksalot/HackMyResume/issues/37#issue-123818674
[i37]: https://github.com/hacksalot/HackMyResume/issues/37
[i38]: https://github.com/hacksalot/HackMyResume/issues/38
[i54]: https://github.com/hacksalot/HackMyResume/issues/54
[i67]: https://github.com/hacksalot/HackMyResume/issues/67
[i107]: https://github.com/hacksalot/HackMyResume/issues/107
[i117]: https://github.com/hacksalot/HackMyResume/issues/117
