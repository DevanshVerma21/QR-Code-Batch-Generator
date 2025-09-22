# database.py
import sqlite3
import json
from datetime import datetime
from typing import Dict, List, Optional
import os

class QRDatabase:
    def __init__(self, db_path: str = "qr_records.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize the database and create tables if they don't exist"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Create sessions table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS qr_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    part_name TEXT NOT NULL,
                    vendor_name TEXT NOT NULL,
                    year TEXT NOT NULL,
                    location TEXT NOT NULL,
                    quantity INTEGER NOT NULL,
                    serial_range TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Create year_counts table for tracking serial numbers per year
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS year_counts (
                    year TEXT PRIMARY KEY,
                    count INTEGER NOT NULL DEFAULT 0,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Create indexes for better performance
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_sessions_year ON qr_sessions(year)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_sessions_timestamp ON qr_sessions(timestamp)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_sessions_part_vendor ON qr_sessions(part_name, vendor_name)')
            
            conn.commit()
    
    def add_session(self, part_name: str, vendor_name: str, year: str, 
                   location: str, quantity: int, serial_range: str) -> int:
        """Add a new QR generation session"""
        timestamp = datetime.now().isoformat()
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Insert session record
            cursor.execute('''
                INSERT INTO qr_sessions (timestamp, part_name, vendor_name, year, location, quantity, serial_range)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (timestamp, part_name, vendor_name, year, location, quantity, serial_range))
            
            session_id = cursor.lastrowid
            conn.commit()
            return session_id
    
    def update_year_count(self, year: str, count: int):
        """Update the count for a specific year"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT OR REPLACE INTO year_counts (year, count, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
            ''', (year, count))
            
            conn.commit()
    
    def get_year_count(self, year: str) -> int:
        """Get the current count for a specific year"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT count FROM year_counts WHERE year = ?', (year,))
            result = cursor.fetchone()
            return result[0] if result else 0
    
    def get_all_year_counts(self) -> Dict[str, int]:
        """Get all year counts"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT year, count FROM year_counts ORDER BY year')
            return dict(cursor.fetchall())
    
    def get_total_count(self) -> int:
        """Get total count across all years"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT COUNT(*) FROM qr_sessions')
            result = cursor.fetchone()
            return result[0] if result else 0
    
    def get_sessions(self, limit: Optional[int] = None, offset: int = 0) -> List[Dict]:
        """Get QR generation sessions"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row  # This allows us to access columns by name
            cursor = conn.cursor()
            
            query = '''
                SELECT timestamp, part_name, vendor_name, year, location, quantity, serial_range
                FROM qr_sessions 
                ORDER BY timestamp DESC
            '''
            
            if limit:
                query += f' LIMIT {limit} OFFSET {offset}'
            
            cursor.execute(query)
            rows = cursor.fetchall()
            
            # Convert to list of dictionaries
            sessions = []
            for row in rows:
                sessions.append({
                    'timestamp': row['timestamp'],
                    'part_name': row['part_name'],
                    'vendor_name': row['vendor_name'],
                    'year': row['year'],
                    'location': row['location'],
                    'quantity': row['quantity'],
                    'serial_range': row['serial_range']
                })
            
            return sessions
    
    def get_history_data(self) -> Dict:
        """Get complete history data in the format expected by the frontend"""
        sessions = self.get_sessions()
        year_counts = self.get_all_year_counts()
        total_count = self.get_total_count()
        
        return {
            'total_count': total_count,
            'year_counts': year_counts,
            'sessions': sessions
        }
    
    def migrate_from_json(self, json_file_path: str = "records.json"):
        """Migrate existing data from JSON file to database"""
        if not os.path.exists(json_file_path):
            print(f"JSON file {json_file_path} not found. Skipping migration.")
            return
        
        try:
            with open(json_file_path, 'r') as f:
                data = json.load(f)
            
            # Clear existing data
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('DELETE FROM qr_sessions')
                cursor.execute('DELETE FROM year_counts')
                conn.commit()
            
            # Import year counts
            if 'year_counts' in data:
                for year, count in data['year_counts'].items():
                    self.update_year_count(year, count)
            
            # Import sessions
            if 'sessions' in data:
                for session in data['sessions']:
                    self.add_session(
                        session['part_name'],
                        session['vendor_name'],
                        session['year'],
                        session['location'],
                        session['quantity'],
                        session['serial_range']
                    )
            
            print(f"Successfully migrated {len(data.get('sessions', []))} sessions from JSON to database.")
            
            # Backup the JSON file
            backup_name = f"{json_file_path}.backup"
            os.rename(json_file_path, backup_name)
            print(f"Original JSON file backed up as {backup_name}")
            
        except Exception as e:
            print(f"Error migrating from JSON: {e}")
    
    def backup_to_json(self, backup_file_path: str = "database_backup.json"):
        """Create a JSON backup of the database"""
        data = self.get_history_data()
        
        with open(backup_file_path, 'w') as f:
            json.dump(data, f, indent=2)
        
        print(f"Database backed up to {backup_file_path}")
    
    def close(self):
        """Close database connection (SQLite auto-manages connections, but this is here for completeness)"""
        pass

# Convenience function to get database instance
def get_database() -> QRDatabase:
    """Get a database instance"""
    return QRDatabase()