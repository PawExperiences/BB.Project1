from .table import VALUE_TO_NUMERAL

def to_roman(n: int) -> str:
    result = ''
    for value, numeral in VALUE_TO_NUMERAL.items():
        while n >= value:
            result += numeral
            n -= value
    return result


def from_roman(s: str) -> int:
    total = 0
    i = 0
    while i < len(s):
        if i + 1 < len(s) and s[i:i + 2] in VALUE_TO_NUMERAL.values():
            total += list(VALUE_TO_NUMERAL.keys())[list(VALUE_TO_NUMERAL.values()).index(s[i:i + 2])]
            i += 2
        else:
            total += list(VALUE_TO_NUMERAL.keys())[list(VALUE_TO_NUMERAL.values()).index(s[i])]
            i += 1
    return total
