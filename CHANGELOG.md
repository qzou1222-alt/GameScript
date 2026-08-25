# Changelog

This file lists the changes made in each GameScript release.

Changes are organized by feature category and may include new features, improvements, bug fixes, deprecations, experiments, and breaking changes.

For each release, the changelog describes what was added, changed, fixed, or removed since the previous release.

At the end of this file, the release history is provided with links to previous releases.

## 1.1.0 - 2026-08-25

InOutPut Update

### Runtime

- Added printinfo().
- Added input().
- Added variable support.
- versinfo() now displays its first line as information instead of normal text.
- print(), printinfo(), printwarn(), printerr(), printbash() refactored.

### Editor

- Removed unimplemented syntax highlighting.
- Added highlight for printinfo().
- Added highlight for input().
- Added hover information for print().
- Added hover information for printwarn().
- Added hover information for printerr().
- Added hover information for printinfo().
- Added hover information for printbash().
- Added hover information for versinfo().
- Added hover information for input().

## Diagnostics

- Removed Unimplemented syntax diagnostics.

### Parser

- Added evaluate.
- Added assignment finder.

### File

- File will be automatically saved when program start running.

## Releases

- [1.1.0](https://github.com/qzou1222-alt/GameScript/blob/v1.1.0/CHANGELOG.md)
- [1.0.0](https://github.com/qzou1222-alt/GameScript/blob/v1.0.0/CHANGELOG.md)