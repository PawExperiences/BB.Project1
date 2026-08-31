"""romans -- Roman numeral conversion.

The package surface re-exports :data:`romans.table.NUMERAL_TABLE`, the
canonical value-to-numeral table, so callers can import it straight from
the package while the encoder and decoder share the one definition in
:mod:`romans.table`. The pairs themselves are never defined inline here.
"""

from .table import NUMERAL_TABLE

__all__ = ["NUMERAL_TABLE"]
