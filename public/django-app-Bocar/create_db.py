import pyodbc

conn_str = (
    "DRIVER={ODBC Driver 18 for SQL Server};"
    "SERVER=127.0.0.1,1433;"
    "DATABASE=master;"
    "UID=sa;"
    "PWD=SuperStrong123!;"
    "TrustServerCertificate=yes;"
)

try:
    conn = pyodbc.connect(conn_str, autocommit=True)
    cursor = conn.cursor()
    cursor.execute("IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'bocar_db') BEGIN CREATE DATABASE bocar_db; END")
    print("Base de datos 'bocar_db' creada exitosamente o ya existía.")
except Exception as e:
    print(f"Error: {e}")
