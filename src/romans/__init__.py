def to_roman(n: int) -> str:
    if not (1 <= n <= 3999):
        raise ValueError('Input must be between 1 and 3999.')

    val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
    syms = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I']
    roman_numeral = ''

    for i in range(len(val)):
        while n >= val[i]:
            roman_numeral += syms[i]
            n -= val[i]
    return roman_numeral


def from_roman(s: str) -> int:
    roman_numerals = {
        'I': 1,
        'V': 5,
        'X': 10,
        'L': 50,
        'C': 100,
        'D': 500,
        'M': 1000,
    }
    total = 0
    prev_value = 0

    for char in reversed(s):
        if char not in roman_numerals:
            raise ValueError(f'Malformed numeral: {char}')
        value = roman_numerals[char]
        if value < prev_value:
            total -= value
        else:
            total += value
        prev_value = value
    return total
