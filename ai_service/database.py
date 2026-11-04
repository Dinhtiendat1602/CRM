from pathlib import Path
import os
from contextlib import contextmanager
from datetime import date, datetime
from decimal import Decimal
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2.pool import ThreadedConnectionPool
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_NAME = os.getenv("DB_NAME", "CRM")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")

_pool = None

def get_pool():
    global _pool
    if _pool is None:
        _pool = ThreadedConnectionPool(
            minconn=1,
            maxconn=10,
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
        )
        init_extensions()
    return _pool

def init_extensions():
    """Khởi tạo extension unaccent để hỗ trợ tìm kiếm tiếng Việt không dấu/có dấu đồng nhất."""
    try:
        pool = _pool
        if pool:
            conn = pool.getconn()
            try:
                with conn.cursor() as cur:
                    cur.execute("CREATE EXTENSION IF NOT EXISTS unaccent;")
                    conn.commit()
            finally:
                pool.putconn(conn)
    except Exception as e:
        print("[Database Extension Warning]", e)

@contextmanager
def get_db_connection():
    pool = get_pool()
    conn = pool.getconn()
    try:
        yield conn
    finally:
        pool.putconn(conn)

def _serialize_row(row: dict) -> dict:
    """Chuyển đổi kiểu Decimal, datetime, date thành kiểu cơ bản của Python để Gemini/JSON đọc dễ dàng."""
    serialized = {}
    for k, v in row.items():
        if isinstance(v, Decimal):
            serialized[k] = float(v)
        elif isinstance(v, (datetime, date)):
            serialized[k] = v.strftime("%Y-%m-%d %H:%M:%S") if isinstance(v, datetime) else v.strftime("%Y-%m-%d")
        else:
            serialized[k] = v
    return serialized

def query_all(query: str, params: tuple = None) -> list:
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, params or ())
            rows = cur.fetchall()
            return [_serialize_row(dict(r)) for r in rows]

def query_one(query: str, params: tuple = None) -> dict:
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, params or ())
            row = cur.fetchone()
            return _serialize_row(dict(row)) if row else None

def check_db_health() -> bool:
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
                return cur.fetchone()[0] == 1
    except Exception as e:
        print("DB Healthcheck error:", e)
        return False
