from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import qrcode
from PIL import Image
import io
import base64
import os
import json
from datetime import datetime
from database import QRDatabase

app = Flask(__name__)
CORS(app)

# Initialize database with production path
db_path = os.environ.get('DATABASE_PATH', 'qr_records.db')
db = QRDatabase(db_path)

# Migrate from JSON if exists (run once)
json_path = 'records.json'
if os.path.exists(json_path) and not os.path.exists(db_path):
    print("Migrating from JSON to database...")
    db.migrate_from_json(json_path)

def get_next_serial_number(year, quantity):
    """Get the next serial number starting from year-specific count + 1"""
    year_str = str(year)
    current_count = db.get_year_count(year_str)
    start_number = current_count + 1
    return start_number

@app.route('/')
def index():
    return send_file('index.html')

@app.route('/static/<path:filename>')
def static_files(filename):
    return send_file(f'static/{filename}')

@app.route('/generate_qr_batch', methods=['POST'])
def generate_qr_batch():
    try:
        data = request.get_json()
        
        # Extract form data
        part_name = data.get('partName', '').strip()
        vendor_name = data.get('vendorName', '').strip()
        year = data.get('year', '').strip()
        location = data.get('location', '').strip()
        quantity = int(data.get('quantity', 1))
        
        # Validate required fields
        if not all([part_name, vendor_name, year, location]):
            return jsonify({'error': 'All fields are required'}), 400
        
        # Get starting serial number for this year
        start_serial = get_next_serial_number(year, quantity)
        
        qr_codes = []
        
        for i in range(quantity):
            # Calculate current serial number
            current_serial = start_serial + i
            serial_number = f"{current_serial:04d}"
            
            # Create QR code text in the specified format
            # <Part Name> - <Vendor Name>-<Year>-<Serial Number>-<Location>
            qr_text = f"{part_name} - {vendor_name}-{year}-{serial_number}-{location}"
            
            # Generate QR code
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(qr_text)
            qr.make(fit=True)
            
            # Create QR code image
            qr_image = qr.make_image(fill_color="black", back_color="white")
            
            # Convert to base64 for JSON response
            img_buffer = io.BytesIO()
            qr_image.save(img_buffer, format='PNG')
            img_buffer.seek(0)
            img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
            
            qr_codes.append({
                'qr_text': qr_text,
                'image_base64': img_base64,
                'serial_number': serial_number,
                'filename': f"{part_name}_{vendor_name}_{year}_{serial_number}_{location}.png".replace(' ', '_')
            })
        
        # Create serial range for session info
        serial_range = f"{start_serial:04d}-{(start_serial + quantity - 1):04d}"
        
        # Save session to database
        session_id = db.add_session(
            part_name=part_name,
            vendor_name=vendor_name,
            year=str(year),
            location=location,
            quantity=quantity,
            serial_range=serial_range
        )
        
        # Update year count
        current_year_count = db.get_year_count(str(year))
        new_year_count = current_year_count + quantity
        db.update_year_count(str(year), new_year_count)
        
        # Get updated totals
        total_count = db.get_total_count()
        
        return jsonify({
            'success': True,
            'qr_codes': qr_codes,
            'batch_info': {
                'part_name': part_name,
                'vendor_name': vendor_name,
                'year': year,
                'location': location,
                'quantity': quantity,
                'serial_range': serial_range,
                'total_generated': total_count,
                'year_count': new_year_count,
                'session_id': session_id
            }
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get_current_count', methods=['GET'])
def get_current_count():
    """Get the current total count of generated QR codes"""
    total_count = db.get_total_count()
    year_counts = db.get_all_year_counts()
    return jsonify({
        'total_count': total_count,
        'year_counts': year_counts,
        'next_serial': total_count + 1
    })

@app.route('/get_year_count/<year>', methods=['GET'])
def get_year_count(year):
    """Get the count for a specific year"""
    year_str = str(year)
    year_count = db.get_year_count(year_str)
    return jsonify({
        'year': year,
        'count': year_count,
        'next_serial': year_count + 1
    })

@app.route('/get_history', methods=['GET'])
def get_history():
    """Get the generation history"""
    history_data = db.get_history_data()
    # Return last 10 sessions for compatibility
    recent_sessions = history_data['sessions'][-10:] if len(history_data['sessions']) > 10 else history_data['sessions']
    return jsonify({
        'total_count': history_data['total_count'],
        'sessions': recent_sessions
    })

@app.route('/download_qr/<filename>')
def download_qr(filename):
    """Download individual QR code (this would need to be implemented with file storage)"""
    return jsonify({'message': 'Download functionality ready for implementation'})

if __name__ == '__main__':
    # Create static directory if it doesn't exist
    os.makedirs('static', exist_ok=True)
    
    # Production vs Development configuration
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') != 'production'
    host = '0.0.0.0' if not debug else '127.0.0.1'
    
    app.run(debug=debug, host=host, port=port)