# frontend/tests/conftest.py
import pathlib, sys
from pathlib import Path

# repo ルート（…/repo/frontend/tests から 2 つ上）
ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend"

# 最優先に backend を通す
sys.path.insert(0, str(BACKEND))

# 参考: もし backend/app を直接先頭に置きたいならこちらでもOK
# sys.path.insert(0, str(BACKEND / "app"))

# frontend/tests/conftest.py
# /Users/moriiryotaro/Desktop/Udon_App/backend を sys.path に追加
ROOT = pathlib.Path(__file__).resolve().parents[2]  # Udon_App
BACKEND = ROOT / "backend"
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))
