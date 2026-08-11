"""Row-cleaning rules shared by the CSV cleaner CLI and its test suite."""


def clean_row(row):
    """Return row with each field's leading/trailing whitespace stripped."""
    return [field.strip() for field in row]


def is_blank(row):
    """Return True if every field of row is empty after trimming."""
    return all(field.strip() == "" for field in row)
