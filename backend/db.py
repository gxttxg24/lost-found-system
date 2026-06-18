import pymysql
from config import DB_CONFIG


def get_db_connection():
    return pymysql.connect(
        host=DB_CONFIG["host"],
        user=DB_CONFIG["user"],
        password=DB_CONFIG["password"],
        database=DB_CONFIG["database"],
        charset=DB_CONFIG["charset"],
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False,
    )


def execute_update(query, params=None):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            affected_rows = cursor.execute(query, params or ())
            conn.commit()
            last_id = cursor.lastrowid
            return affected_rows, last_id
    finally:
        conn.close()


def fetch_one(query, params=None):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(query, params or ())
            return cursor.fetchone()
    finally:
        conn.close()


def fetch_all(query, params=None):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(query, params or ())
            return cursor.fetchall()
    finally:
        conn.close()
