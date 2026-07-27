"""Pytest config: add the `src/` directory to sys.path so tests can `import api`.

The `src/` layout is the recommended Python packaging convention. Without this,
pytest would only see modules on the import path that pip / uv have installed,
which doesn't include the local `src/api/` package during `pytest` runs.
"""

import sys
from pathlib import Path

_SRC = Path(__file__).parent / "src"
if str(_SRC) not in sys.path:
    sys.path.insert(0, str(_SRC))
