"""Smoke test — verifies the test runner finds and executes at least one test."""

def test_package_importable():
    """The src package can be imported without error."""
    import src  # noqa: F401


def test_smoke():
    """Trivial assertion to confirm pytest exits 0."""
    assert True
