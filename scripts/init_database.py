"""
Database initialization script
Run this to set up the database and create demo data
"""
import sys
import os

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import create_tables, get_db_session
from app.db_auth import initialize_demo_data

def main():
    """Initialize database with tables and demo data"""
    print("🚀 Initializing database...")
    
    try:
        # Create all tables
        print("📊 Creating database tables...")
        create_tables()
        print("✅ Tables created successfully!")
        
        # Initialize demo data
        print("📝 Setting up demo data...")
        with get_db_session() as db:
            initialize_demo_data(db)
        
        print("🎉 Database initialization complete!")
        print("\n📋 Demo credentials:")
        print("   Email: demo@example.com")
        print("   Password: demo123")
        print("\n🔑 Demo API Keys:")
        print("   demo123 (10 requests/minute)")
        print("   demo_high (100 requests/minute)")
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
