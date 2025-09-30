# app/services/moderation.py
from __future__ import annotations
import os
from functools import lru_cache
from typing import Tuple, Optional, List
from openai import OpenAI

DEFAULT_MODEL = os.getenv("OPENAI_MODERATION_MODEL", "omni-moderation-latest")
LOCAL_NG_WORDS: List[str] = ["死ね", "バカ", "殺す", "アホ"]

def _truthy(v: Optional[str]) -> bool:
    return str(v or "").strip().lower() in {"1", "true", "yes", "on"}

class ModerationClient:
    """
    - 空文字はNG
    - まずローカル辞書で確定NG
    - OpenAI呼び出しは例外時に fail_open で通せる
    """
    def __init__(self, fail_open: bool = False):
        self.fail_open = fail_open
        api_key = os.getenv("OPENAI_API_KEY")
        base_url = os.getenv("OPENAI_BASE_URL") or None
        self.enabled = bool(api_key)
        self.client: Optional[OpenAI] = OpenAI(api_key=api_key, base_url=base_url) if self.enabled else None

    def check(self, text: str, model: str = DEFAULT_MODEL) -> Tuple[bool, Optional[str]]:
        t = (text or "").strip()
        if not t:
            return False, "empty text"

        # 1) ローカル辞書
        hits = [w for w in LOCAL_NG_WORDS if w in t]
        if hits:
            return False, f"NGワードが含まれています（{', '.join(hits)}）"

        # 2) OpenAI
        if not self.enabled:
            return (True, None) if self.fail_open else (False, "moderation disabled (no API key)")
        try:
            res = self.client.moderations.create(model=model, input=t)
            out = res.results[0]
            if getattr(out, "flagged", False):
                cats = []
                d = getattr(getattr(out, "categories", None), "__dict__", None)
                if isinstance(d, dict):
                    cats = [k for k, v in d.items() if v]
                return False, f"AIモデレーションによりブロック（{', '.join(cats) or 'unsafe'}）"
            return True, None
        except Exception as e:
            # ← 429含むエラーはここに来る。fail_open=Trueなら許可にフォールバック
            if self.fail_open:
                return True, None
            return False, f"moderation error: {e!s}"

@lru_cache(maxsize=1)
def get_moderation_client() -> ModerationClient:
    # 環境変数でフェイルオープン切替（デモ時は true 推奨）
    return ModerationClient(fail_open=_truthy(os.getenv("MODERATION_FAIL_OPEN")))