#!/usr/bin/env python3
"""
SQLite to MySQL Migration Script for Qurator

Usage:
    python migrate_to_mysql.py --mysql-url "mysql+pymysql://user:password@host:3306/dbname"

Or set MYSQL_DATABASE_URL environment variable:
    export MYSQL_DATABASE_URL="mysql+pymysql://user:password@host:3306/dbname"
    python migrate_to_mysql.py
"""

import argparse
import os
import sqlite3
from datetime import datetime

import pymysql
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# SQLite source database
SQLITE_PATH = "qurator.db"


def get_sqlite_data():
    """Extract all data from SQLite database."""
    conn = sqlite3.connect(SQLITE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    data = {}

    # Get data in order respecting foreign key constraints
    tables = ["users", "category_groups", "categories", "content_items", "content_clicks"]

    for table in tables:
        cursor.execute(f"SELECT * FROM {table}")
        rows = cursor.fetchall()
        data[table] = [dict(row) for row in rows]
        print(f"Extracted {len(data[table])} rows from {table}")

    conn.close()
    return data


def create_mysql_tables(engine):
    """Create tables in MySQL using SQLAlchemy models."""
    from app.db.database import Base
    from app.models import models  # noqa: F401 - imports register models with Base

    Base.metadata.create_all(bind=engine)
    print("MySQL tables created successfully")


def migrate_data(engine, data):
    """Insert data into MySQL database."""
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # Disable foreign key checks temporarily
        session.execute(text("SET FOREIGN_KEY_CHECKS = 0"))

        # Clear existing data
        tables = ["content_clicks", "content_items", "categories", "category_groups", "users"]
        for table in tables:
            session.execute(text(f"DELETE FROM {table}"))
        print("Cleared existing data")

        # Insert users
        for row in data["users"]:
            session.execute(
                text("""
                    INSERT INTO users (id, email, full_name, google_id, profile_picture,
                                      is_active, is_admin, mfa_enabled, mfa_secret,
                                      created_at, updated_at)
                    VALUES (:id, :email, :full_name, :google_id, :profile_picture,
                           :is_active, :is_admin, :mfa_enabled, :mfa_secret,
                           :created_at, :updated_at)
                """),
                {
                    "id": row["id"],
                    "email": row["email"],
                    "full_name": row["full_name"],
                    "google_id": row["google_id"],
                    "profile_picture": row["profile_picture"],
                    "is_active": bool(row["is_active"]),
                    "is_admin": bool(row["is_admin"]),
                    "mfa_enabled": bool(row["mfa_enabled"]),
                    "mfa_secret": row["mfa_secret"],
                    "created_at": row["created_at"],
                    "updated_at": row["updated_at"],
                },
            )
        print(f"Migrated {len(data['users'])} users")

        # Insert category_groups
        for row in data["category_groups"]:
            session.execute(
                text("""
                    INSERT INTO category_groups (id, name, slug, icon, `order`, is_active, created_at)
                    VALUES (:id, :name, :slug, :icon, :order, :is_active, :created_at)
                """),
                {
                    "id": row["id"],
                    "name": row["name"],
                    "slug": row["slug"],
                    "icon": row["icon"],
                    "order": row["order"],
                    "is_active": bool(row["is_active"]),
                    "created_at": row["created_at"],
                },
            )
        print(f"Migrated {len(data['category_groups'])} category_groups")

        # Insert categories
        for row in data["categories"]:
            session.execute(
                text("""
                    INSERT INTO categories (id, group_id, name, slug, description, icon,
                                           `order`, is_active, created_at, updated_at)
                    VALUES (:id, :group_id, :name, :slug, :description, :icon,
                           :order, :is_active, :created_at, :updated_at)
                """),
                {
                    "id": row["id"],
                    "group_id": row["group_id"],
                    "name": row["name"],
                    "slug": row["slug"],
                    "description": row["description"],
                    "icon": row["icon"],
                    "order": row["order"],
                    "is_active": bool(row["is_active"]),
                    "created_at": row["created_at"],
                    "updated_at": row["updated_at"],
                },
            )
        print(f"Migrated {len(data['categories'])} categories")

        # Insert content_items
        for row in data["content_items"]:
            session.execute(
                text("""
                    INSERT INTO content_items (id, category_id, title, description, youtube_url,
                                              youtube_id, thumbnail_url, `order`, click_count,
                                              is_active, created_at, updated_at)
                    VALUES (:id, :category_id, :title, :description, :youtube_url,
                           :youtube_id, :thumbnail_url, :order, :click_count,
                           :is_active, :created_at, :updated_at)
                """),
                {
                    "id": row["id"],
                    "category_id": row["category_id"],
                    "title": row["title"],
                    "description": row["description"],
                    "youtube_url": row["youtube_url"],
                    "youtube_id": row["youtube_id"],
                    "thumbnail_url": row["thumbnail_url"],
                    "order": row["order"],
                    "click_count": row["click_count"] or 0,
                    "is_active": bool(row["is_active"]),
                    "created_at": row["created_at"],
                    "updated_at": row["updated_at"],
                },
            )
        print(f"Migrated {len(data['content_items'])} content_items")

        # Insert content_clicks
        for row in data["content_clicks"]:
            session.execute(
                text("""
                    INSERT INTO content_clicks (id, user_id, content_id, clicked_at)
                    VALUES (:id, :user_id, :content_id, :clicked_at)
                """),
                {
                    "id": row["id"],
                    "user_id": row["user_id"],
                    "content_id": row["content_id"],
                    "clicked_at": row["clicked_at"],
                },
            )
        print(f"Migrated {len(data['content_clicks'])} content_clicks")

        # Re-enable foreign key checks
        session.execute(text("SET FOREIGN_KEY_CHECKS = 1"))

        # Reset auto-increment values
        for table, rows in data.items():
            if rows:
                max_id = max(row["id"] for row in rows)
                session.execute(text(f"ALTER TABLE {table} AUTO_INCREMENT = {max_id + 1}"))

        session.commit()
        print("\nMigration completed successfully!")

    except Exception as e:
        session.rollback()
        print(f"Error during migration: {e}")
        raise
    finally:
        session.close()


def verify_migration(engine, original_data):
    """Verify data was migrated correctly."""
    Session = sessionmaker(bind=engine)
    session = Session()

    print("\nVerifying migration...")
    for table, rows in original_data.items():
        result = session.execute(text(f"SELECT COUNT(*) FROM {table}"))
        count = result.scalar()
        expected = len(rows)
        status = "✓" if count == expected else "✗"
        print(f"  {status} {table}: {count}/{expected} rows")

    session.close()


def main():
    global SQLITE_PATH

    parser = argparse.ArgumentParser(description="Migrate SQLite to MySQL")
    parser.add_argument(
        "--mysql-url",
        help="MySQL connection URL (mysql+pymysql://user:pass@host:port/db)",
        default=os.getenv("MYSQL_DATABASE_URL"),
    )
    parser.add_argument(
        "--sqlite-path",
        help="Path to SQLite database",
        default=SQLITE_PATH,
    )
    args = parser.parse_args()

    if not args.mysql_url:
        print("Error: MySQL URL required. Use --mysql-url or set MYSQL_DATABASE_URL env var")
        print("\nExample:")
        print('  python migrate_to_mysql.py --mysql-url "mysql+pymysql://user:pass@host:3306/qurator"')
        return 1

    SQLITE_PATH = args.sqlite_path

    print(f"Source: {SQLITE_PATH}")
    print(f"Target: {args.mysql_url.split('@')[1] if '@' in args.mysql_url else args.mysql_url}")
    print()

    # Create MySQL engine
    mysql_engine = create_engine(
        args.mysql_url,
        pool_pre_ping=True,
        echo=False,
    )

    # Extract data from SQLite
    print("Extracting data from SQLite...")
    data = get_sqlite_data()
    print()

    # Create tables in MySQL
    print("Creating MySQL tables...")
    create_mysql_tables(mysql_engine)
    print()

    # Migrate data
    print("Migrating data to MySQL...")
    migrate_data(mysql_engine, data)

    # Verify
    verify_migration(mysql_engine, data)

    return 0


if __name__ == "__main__":
    exit(main())
