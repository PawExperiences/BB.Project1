# Project Title

Description of the project.

## Acceptance Criteria for Round-Trip Test of Roman Numerals

The acceptance check ensures that the conversion between Arabic numbers (1 to 3999) and Roman numerals is lossless, meaning that every number can be converted to a Roman numeral and back to the original number without loss of accuracy.

### Acceptance Criteria
- All numbers from 1 to 3999 must maintain their value through conversion to Roman numerals and back.
- The `to_roman` function converts integers from 1 to 3999 to Roman numerals without errors.
- The `from_roman` function converts valid Roman numerals back to integers without loss of information.
- The `to_roman` function raises a ValueError with the message 'Input must be between 1 and 3999.' for out-of-range inputs.
- The `from_roman` function raises a ValueError naming the offending character if the input is a malformed numeral.
### Instructions to Run Acceptance Test
1. Ensure the environment is set up with the necessary dependencies.
2. Execute the provided test suite with `pytest` to validate the implementation of conversion.
   - Example command: `pytest tests/test_roundtrip.py`
3. Verify that all test cases pass, which confirms the round-trip conversion accuracy.