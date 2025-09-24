# app/services/moderation.py
from __future__ import annotations
import os
from functools import lru_cache
from typing import Tuple, Optional
from openai import OpenAI

DEFAULT_MODEL = os.getenv("OPENAI_MODERATION_MODEL", "omni-moderation-latest")


class ModerationClient:
    """
    OpenAI Moderation API を使ったシンプルな判定ラッパー。

    - 空文字は即エラー
    - APIキー未設定時は fail_open に従って動作
    """

    def __init__(self, fail_open: bool = False):
        self.fail_open = fail_open
        api_key = os.getenv("OPENAI_API_KEY")
        base_url = os.getenv("OPENAI_BASE_URL") or None

        self.enabled = bool(api_key)
        self.client: Optional[OpenAI] = (
            OpenAI(api_key=api_key, base_url=base_url) if self.enabled else None
        )

    def check(self, text: str, model: str = DEFAULT_MODEL) -> Tuple[bool, Optional[str]]:
        if not text.strip():
            return False, "comment text is empty"

        if not self.enabled:
            # APIキーが無ければモデレーションをスキップ
            return (True, None) if self.fail_open else (False, "moderation disabled (no API key)")

        try:
            res = self.client.moderations.create(model=model, input=text)
            out = res.results[0]
            if getattr(out, "flagged", False):
                cats = []
                d = getattr(getattr(out, "categories", None), "__dict__", None)
                if isinstance(d, dict):
                    cats = [k for k, v in d.items() if v]
                return False, f"blocked by moderation: {', '.join(cats) or 'unsafe'}"
            return True, None
        except Exception as e:
            if self.fail_open:
                return True, None
            return False, f"moderation error: {e!s}"


@lru_cache(maxsize=1)
def get_moderation_client() -> ModerationClient:
    # デフォルトでは fail_open=False → API障害時もブロック
    return ModerationClient(fail_open=False)