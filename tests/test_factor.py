import pytest

import factorlib


def test_prime_factors_of_12():
    assert factorlib.prime_factors(12) == [2, 2, 3]


def test_prime_factors_of_prime():
    assert factorlib.prime_factors(97) == [97]


def test_prime_factors_of_prime_square():
    assert factorlib.prime_factors(49) == [7, 7]


def test_prime_factors_of_one():
    assert factorlib.prime_factors(1) == []


def test_prime_factors_of_zero_raises_value_error():
    with pytest.raises(ValueError, match="0"):
        factorlib.prime_factors(0)


def test_prime_factors_of_negative_raises_value_error():
    with pytest.raises(ValueError, match="-5"):
        factorlib.prime_factors(-5)


def test_prime_factors_of_non_int_raises_type_error():
    with pytest.raises(TypeError):
        factorlib.prime_factors("12")


def test_prime_factors_of_float_raises_type_error():
    with pytest.raises(TypeError):
        factorlib.prime_factors(12.0)
