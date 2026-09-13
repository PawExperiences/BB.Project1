def to_roman(n):
    if not isinstance(n, int):
        raise ValueError("Input must be an integer within 1 to 3999")
    if n < 1:
        raise ValueError("Input must be at least 1")
    if n > 3999:
        raise ValueError("Input must not exceed 3999")

    val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
    syms = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"]
    roman_num = ""
    i = 0
    while n > 0:
        for _ in range(n // val[i]):
            roman_num += syms[i]
            n -= val[i]
        i += 1
    return roman_num


def from_roman(s):
    if not isinstance(s, str) or not s:
        raise ValueError("Input must be a non-empty string")

    roman_numeral_map = {
        'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000
    }

    prev_value = 0
    total = 0
    for char in reversed(s):
        if char not in roman_numeral_map:
            raise ValueError(f"Malformed numeral: {char}")
        value = roman_numeral_map[char]
        if value < prev_value:
            total -= value
        else:
            total += value
        prev_value = value
    return total
