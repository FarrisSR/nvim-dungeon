from fastapi import FastAPI, Query
from pydantic import BaseModel, Field
from typing import Literal
import sqlite3
from pathlib import Path
from contextlib import contextmanager

DB_PATH = Path(__file__).parent.parent / "scores.db"
TOP_N = 20


def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS scores (
                id             INTEGER PRIMARY KEY AUTOINCREMENT,
                name           TEXT    NOT NULL,
                xp             INTEGER NOT NULL,
                level          INTEGER NOT NULL,
                floors_cleared INTEGER NOT NULL,
                outcome        TEXT    NOT NULL CHECK(outcome IN ('victory','defeat')),
                date           TEXT    NOT NULL
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_xp ON scores(xp DESC)")


init_db()

app = FastAPI(title="NvimDungeon Score API")


# ── Pydantic validerer input automatisk ───────────────────────────────────────
class ScoreIn(BaseModel):
    name: str = Field(..., min_length=1, max_length=24)
    xp: int = Field(..., ge=0)
    level: int = Field(..., ge=1)
    floorsCleared: int = Field(..., ge=0)
    outcome: Literal["victory", "defeat"]
    date: str


# ── DB-hjelper ────────────────────────────────────────────────────────────────
@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row   # gir dict-lignende rader
    try:
        yield conn
    finally:
        conn.close()


def fetch_top(conn: sqlite3.Connection, limit: int = TOP_N) -> list[dict]:
    rows = conn.execute("""
        SELECT name, xp, level, floors_cleared AS floorsCleared, outcome, date
        FROM scores ORDER BY xp DESC LIMIT ?
    """, (limit,)).fetchall()
    return [dict(r) for r in rows]


# ── Endepunkter ───────────────────────────────────────────────────────────────
@app.get("/scores")
def get_scores(limit: int = Query(default=TOP_N, le=100)) -> list[dict]:
    with get_db() as conn:
        return fetch_top(conn, limit)


@app.post("/scores")
def post_score(score: ScoreIn) -> list[dict]:
    with get_db() as conn:
        conn.execute("""
            INSERT INTO scores (name, xp, level, floors_cleared, outcome, date)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (score.name.strip(), score.xp, score.level,
              score.floorsCleared, score.outcome, score.date))
        conn.commit()
        return fetch_top(conn)
