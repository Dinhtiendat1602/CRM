"""Trình chạy kiểm thử tự động độc lập cho Zen CRM AI Agent Service (không phụ thuộc pytest)."""
import os
import sys
from pathlib import Path

# Đảm bảo đường dẫn gốc được import
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import tests.test_queries as tq
import tests.test_agent_actions as ta

def run():
    modules = [tq, ta]
    passed = 0
    failed = 0
    errors = []

    print("=" * 60)
    print("🚀 Đang chạy bộ kiểm thử Zen CRM AI Agent Service...")
    print("=" * 60)

    for mod in modules:
        mod_name = mod.__name__
        print(f"\n▶ Đang kiểm tra module: {mod_name}")
        for attr in dir(mod):
            if attr.startswith("test_") and callable(getattr(mod, attr)):
                func = getattr(mod, attr)
                try:
                    func()
                    print(f"  ✔ {attr} (PASS)")
                    passed += 1
                except Exception as e:
                    import traceback
                    tb = traceback.format_exc()
                    print(f"  ✖ {attr} (FAILED: {e})")
                    print(tb)
                    failed += 1
                    errors.append((attr, str(e)))

    print("\n" + "=" * 60)
    print(f"Tổng kết: {passed} bài kiểm thử PASS | {failed} bài kiểm thử FAIL")
    print("=" * 60)

    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    run()
