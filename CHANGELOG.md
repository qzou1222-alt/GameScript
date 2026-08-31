# Changelog

This file lists the changes made in each GameScript release.

Changes are organized by feature category and may include new features, improvements, bug fixes, deprecations, experiments, and breaking changes.

For each release, the changelog describes what was added, changed, fixed, or removed since the previous release.

At the end of this file, the release history is provided with links to previous releases.

## 1.6.0 - 2026-08-27

Class & Attribute Update

### Runtime

- Improved property evaluation.
- Added string properties:
    - length
    - as_upper
    - as_lower
- Added internal length getter for String.
- Added playscript().

### Editor

- Added dynamic semantic highlighting for variables.
- Added dynamic semantic highlighting for properties.
- Added highlighting for:
    - .length
    - .as_upper
    - .as_lower
- Improved property highlighting without requiring every property to be hard-coded in the TextMate grammar.

### Parser

- Improved nested expression and property parsing.
- Added support for finding attribute dots outside parentheses and strings.
- Added support for finding matching parentheses when evaluating expressions.

### Demos

- Added demos folder.
- Added StringData.gs demo.
- Added StringRepeater.gs demo.
- Added NumberTest.gs demo.

## Releases

- [1.6.0](https://github.com/qzou1222-alt/GameScript/blob/v1.6.0/CHANGELOG.md)
- [1.5.0](https://github.com/qzou1222-alt/GameScript/blob/v1.5.0/CHANGELOG.md)
- [1.4.0](https://github.com/qzou1222-alt/GameScript/blob/v1.4.0/CHANGELOG.md)
- [1.3.0](https://github.com/qzou1222-alt/GameScript/blob/v1.3.0/CHANGELOG.md)
- [1.2.0](https://github.com/qzou1222-alt/GameScript/blob/v1.2.0/CHANGELOG.md)
- [1.1.1patch](https://github.com/qzou1222-alt/GameScript/blob/v1.1.1patch/CHANGELOG.md)   `patch`
- [1.1.0](https://github.com/qzou1222-alt/GameScript/blob/v1.1.0/CHANGELOG.md)
- [1.0.0](https://github.com/qzou1222-alt/GameScript/blob/v1.0.0/CHANGELOG.md)