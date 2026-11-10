import os
import sys
from pathlib import Path
try:
    import pytest
except ImportError:
    pytest = None

# Đảm bảo đường dẫn gốc của service nằm trong sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

@pytest.fixture
def mock_user_session():
    return "test-session-123"
