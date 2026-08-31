# Acceptance Check for Roman Numeral Conversion

## Overview
This document outlines the acceptance criteria that ensures the lossless round-trip conversion of numbers between 1 and 3999 for the Roman numeral conversion project.

## Acceptance Criteria
- The documentation must explicitly state the acceptance criterion for lossless round-trip conversion for integers within the range 1 to 3999.
- Examples of numeral representations for boundary values (1, 3999) must be included.
- References to related tasks, specifically the following, must be clearly mentioned:
  - Roman numerals both ways
  - The numeral table
  - Round-trip test

## Round-trip Conversion Criteria
To satisfy the acceptance criteria, the round-trip conversion must adhere to the following rules:
1. Any integer between 1 and 3999 must be converted to a Roman numeral.
2. Each Roman numeral can then be converted back to its integer representation.
3. The final integer from the conversion back must match the original integer.

## Boundary Value Representations
- **Integer 1**: Converted to Roman numeral `I`, and converting `I` back results in `1`.
- **Integer 3999**: Converted to Roman numeral `MMMCMXCIX`, and converting `MMMCMXCIX` back results in `3999`.

## References to Related Tasks
This acceptance check is linked to the following tasks:
- Roman numerals both ways: Ensure both conversion directions are implemented and validated.
- The numeral table: Documentation on the mapping of numerals should be established.
- Round-trip test: Automated tests verifying the round-trip conversion must be created and executed.