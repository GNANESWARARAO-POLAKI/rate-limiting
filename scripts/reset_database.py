"""
Database Reset Utility Script

WARNING: This script will delete all data in the database and recreate tables.
Only use this for development or after backing up your data.
"""
import sys
import os

# Add the parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database_models import Base
from app.database import engine, create_tables
from app.db_auth import initialize_demo_data
from app.database import get_db_session

def reset_database():
    """Drop all tables and recreate them"""
    print("⚠️ WARNING: This will delete all data in the database!")
    confirmation = input("Type 'yes' to continue: ")
    
    if confirmation.lower() != 'yes':
        print("Operation cancelled.")
        return
    
    print("🗑️ Dropping all tables...")
    Base.metadata.drop_all(engine)
    
    print("🏗️ Creating tables with new schema...")
    create_tables()
    
    print("🔄 Initializing demo data...")
    with get_db_session() as db:
        initialize_demo_data(db)
    
    print("✅ Database reset complete!")

if __name__ == "__main__":
    reset_database()
