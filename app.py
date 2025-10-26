from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS  # Add this import
import json
import os
import random
import logging
import subprocess
import qrcode
from io import BytesIO
import base64
from werkzeug.utils import secure_filename
from PIL import Image

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
app.logger.setLevel(logging.DEBUG)  # Set logging level to DEBUG for more detailed logs

# Add cache control headers to all responses
@app.after_request
def add_header(response):
    """Add headers to prevent caching"""
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '-1'
    return response

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
THUMBNAIL_FOLDER = 'uploads/thumbnails'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
if not os.path.exists(THUMBNAIL_FOLDER):
    os.makedirs(THUMBNAIL_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['THUMBNAIL_FOLDER'] = THUMBNAIL_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

RAFFLES_FILE = 'raffle_data.json'
BUYERS_FILE = 'buyers.json'

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def create_thumbnail(image_path, thumbnail_path, max_size=(300, 300)):
    """Create a thumbnail from the original image"""
    try:
        with Image.open(image_path) as img:
            # Convert RGBA to RGB if necessary
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            
            # Create thumbnail
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
            img.save(thumbnail_path, 'JPEG', quality=85, optimize=True)
            return True
    except Exception as e:
        app.logger.error(f"Error creating thumbnail: {str(e)}")
        return False

def load_raffles():
    try:
        if not os.path.exists(RAFFLES_FILE):
            save_raffles({"raffles": [], "current_raffle": None})
            return {"raffles": [], "current_raffle": None}
        with open(RAFFLES_FILE, 'r') as f:
            data = json.load(f)
            # Ensure the data has the correct structure
            if not isinstance(data, dict):
                data = {"raffles": [], "current_raffle": None}
            if "raffles" not in data:
                data["raffles"] = []
            if "current_raffle" not in data:
                data["current_raffle"] = None
            return data
    except Exception as e:
        app.logger.error(f"Error loading raffles: {str(e)}")
        return {"raffles": [], "current_raffle": None}

def save_raffles(data):
    try:
        with open(RAFFLES_FILE, 'w') as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        app.logger.error(f"Error saving raffles: {str(e)}")
        raise

def load_buyers(raffle_id):
    try:
        if not os.path.exists(BUYERS_FILE):
            save_buyers({})
            return []
            
        with open(BUYERS_FILE, 'r') as f:
            buyers_data = json.load(f)
            return buyers_data.get(str(raffle_id), [])
    except json.JSONDecodeError:
        # If file is empty or invalid, initialize it
        save_buyers({})
        return []
    except Exception as e:
        app.logger.error(f"Error loading buyers: {str(e)}")
        return []

def save_buyers(data):
    try:
        with open(BUYERS_FILE, 'w') as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        app.logger.error(f"Error saving buyers: {str(e)}")
        raise

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/uploads/thumbnails/<filename>')
def uploaded_thumbnail(filename):
    return send_from_directory(app.config['THUMBNAIL_FOLDER'], filename)

@app.route('/')
def home():
    response = send_from_directory('.', 'index.html')
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@app.route('/api/raffles', methods=['GET'])
def get_raffles():
    try:
        data = load_raffles()
        return jsonify(data['raffles'])
    except Exception as e:
        app.logger.error(f"Error getting raffles: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/raffles', methods=['POST'])
def create_raffle():
    try:
        app.logger.info("Received POST request to /api/raffles")
        
        # Get form data instead of JSON
        name = request.form.get('name')
        draw_date = request.form.get('drawDate')
        prize = request.form.get('prize')
        ticket_cost = request.form.get('ticketCost')
        payment_link = request.form.get('paymentLink')
        banking_details_json = request.form.get('bankingDetails')
        
        app.logger.info(f"Form data: name={name}, drawDate={draw_date}, prize={prize}")
        
        if not all([name, draw_date, prize, ticket_cost, payment_link]):
            missing = [f for f, v in [("name", name), ("drawDate", draw_date), ("prize", prize), 
                                     ("ticketCost", ticket_cost), ("paymentLink", payment_link)] if not v]
            app.logger.error(f"Missing required fields: {missing}")
            return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400
        
        data = load_raffles()
        
        # Generate new raffle ID
        new_id = str(max([int(r['id']) for r in data['raffles']], default=0) + 1)
        
        # Handle image upload
        image_filename = None
        thumbnail_filename = None
        if 'image' in request.files:
            file = request.files['image']
            if file and file.filename and allowed_file(file.filename):
                # Create unique filename with raffle ID
                ext = file.filename.rsplit('.', 1)[1].lower()
                image_filename = f"raffle_{new_id}.{ext}"
                thumbnail_filename = f"raffle_{new_id}_thumb.jpg"
                
                # Save original image
                image_path = os.path.join(app.config['UPLOAD_FOLDER'], image_filename)
                file.save(image_path)
                app.logger.info(f"Image saved: {image_filename}")
                
                # Create thumbnail
                thumbnail_path = os.path.join(app.config['THUMBNAIL_FOLDER'], thumbnail_filename)
                if create_thumbnail(image_path, thumbnail_path):
                    app.logger.info(f"Thumbnail created: {thumbnail_filename}")
                else:
                    thumbnail_filename = None
        
        # Parse banking details if provided
        banking_details = None
        if banking_details_json:
            try:
                banking_details = json.loads(banking_details_json)
            except json.JSONDecodeError:
                app.logger.warning("Failed to parse banking details JSON")
        
        new_raffle = {
            'id': new_id,
            'name': name,
            'drawDate': draw_date,
            'prize': prize,
            'ticketCost': float(ticket_cost),
            'paymentLink': payment_link,
            'drawn': False,
            'winner': None
        }
        
        if image_filename:
            new_raffle['image'] = image_filename
            if thumbnail_filename:
                new_raffle['thumbnail'] = thumbnail_filename
        
        if banking_details:
            new_raffle['bankingDetails'] = banking_details
        
        # Add to raffles list
        data['raffles'].append(new_raffle)
        save_raffles(data)
        
        app.logger.info(f"Raffle created successfully: {new_raffle}")
        return jsonify(new_raffle), 201
        
    except Exception as e:
        app.logger.error(f"Error creating raffle: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/raffles/<raffle_id>', methods=['GET'])
def get_raffle(raffle_id):
    try:
        app.logger.debug(f"Loading raffle with ID: {raffle_id}")
        raffles_data = load_raffles()
        
        if not raffles_data or 'raffles' not in raffles_data:
            app.logger.error("No raffles data found")
            return jsonify({"error": "No raffles data available"}), 404
            
        app.logger.debug(f"Found {len(raffles_data['raffles'])} raffles")
        raffle = next((r for r in raffles_data['raffles'] if str(r['id']) == str(raffle_id)), None)
        
        if raffle is None:
            app.logger.error(f"Raffle with ID {raffle_id} not found")
            return jsonify({"error": "Raffle not found"}), 404
            
        app.logger.debug(f"Successfully found raffle: {raffle['name']}")
        return jsonify(raffle)
        
    except Exception as e:
        app.logger.error(f"Error getting raffle {raffle_id}: {str(e)}")
        return jsonify({"error": f"Failed to load raffle: {str(e)}"}), 500

@app.route('/api/raffles/<raffle_id>', methods=['PUT'])
def update_raffle(raffle_id):
    try:
        app.logger.info(f"Updating raffle with ID: {raffle_id}")
        
        # Get form data
        name = request.form.get('name')
        draw_date = request.form.get('drawDate')
        prize = request.form.get('prize')
        ticket_cost = request.form.get('ticketCost')
        payment_link = request.form.get('paymentLink')
        banking_details_json = request.form.get('bankingDetails')
        
        app.logger.info(f"Form data: name={name}, drawDate={draw_date}, prize={prize}")
        
        if not all([name, draw_date, prize, ticket_cost, payment_link]):
            missing = [f for f, v in [("name", name), ("drawDate", draw_date), ("prize", prize), 
                                     ("ticketCost", ticket_cost), ("paymentLink", payment_link)] if not v]
            app.logger.error(f"Missing required fields: {missing}")
            return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400
        
        # Load raffles data
        data = load_raffles()
        
        # Find the raffle to update
        raffle_index = None
        existing_raffle = None
        for i, r in enumerate(data['raffles']):
            if str(r['id']) == str(raffle_id):
                raffle_index = i
                existing_raffle = r
                break
        
        if raffle_index is None:
            app.logger.error(f"Raffle with ID {raffle_id} not found")
            return jsonify({"error": "Raffle not found"}), 404
        
        # Handle image upload
        image_filename = existing_raffle.get('image')  # Keep existing image by default
        thumbnail_filename = existing_raffle.get('thumbnail')  # Keep existing thumbnail by default
        
        if 'image' in request.files:
            file = request.files['image']
            if file and file.filename and allowed_file(file.filename):
                # Delete old images if they exist
                if image_filename:
                    old_image_path = os.path.join(app.config['UPLOAD_FOLDER'], image_filename)
                    if os.path.exists(old_image_path):
                        os.remove(old_image_path)
                        app.logger.info(f"Deleted old image: {image_filename}")
                
                if thumbnail_filename:
                    old_thumbnail_path = os.path.join(app.config['THUMBNAIL_FOLDER'], thumbnail_filename)
                    if os.path.exists(old_thumbnail_path):
                        os.remove(old_thumbnail_path)
                        app.logger.info(f"Deleted old thumbnail: {thumbnail_filename}")
                
                # Create unique filename with raffle ID
                ext = file.filename.rsplit('.', 1)[1].lower()
                image_filename = f"raffle_{raffle_id}.{ext}"
                thumbnail_filename = f"raffle_{raffle_id}_thumb.jpg"
                
                # Save new image
                image_path = os.path.join(app.config['UPLOAD_FOLDER'], image_filename)
                file.save(image_path)
                app.logger.info(f"Image saved: {image_filename}")
                
                # Create thumbnail
                thumbnail_path = os.path.join(app.config['THUMBNAIL_FOLDER'], thumbnail_filename)
                if create_thumbnail(image_path, thumbnail_path):
                    app.logger.info(f"Thumbnail created: {thumbnail_filename}")
                else:
                    thumbnail_filename = None
        
        # Parse banking details if provided
        banking_details = None
        if banking_details_json:
            try:
                banking_details = json.loads(banking_details_json)
            except json.JSONDecodeError:
                app.logger.warning("Failed to parse banking details JSON")
        
        # Update raffle data
        updated_raffle = {
            'id': raffle_id,
            'name': name,
            'drawDate': draw_date,
            'prize': prize,
            'ticketCost': float(ticket_cost),
            'paymentLink': payment_link,
            'drawn': existing_raffle.get('drawn', False),  # Preserve drawn status
            'winner': existing_raffle.get('winner')  # Preserve winner if exists
        }
        
        if image_filename:
            updated_raffle['image'] = image_filename
            if thumbnail_filename:
                updated_raffle['thumbnail'] = thumbnail_filename
        
        if banking_details:
            updated_raffle['bankingDetails'] = banking_details
        
        # Replace the raffle in the list
        data['raffles'][raffle_index] = updated_raffle
        save_raffles(data)
        
        app.logger.info(f"Raffle updated successfully: {updated_raffle}")
        return jsonify(updated_raffle), 200
        
    except Exception as e:
        app.logger.error(f"Error updating raffle: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/buyers/<raffle_id>', methods=['GET'])
def get_buyers(raffle_id):
    try:
        buyers = load_buyers(raffle_id)
        return jsonify(buyers)
    except Exception as e:
        app.logger.error(f"Error getting buyers: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/buyers/<raffle_id>', methods=['POST'])
def add_buyer(raffle_id):
    try:
        if not request.is_json:
            return jsonify({"error": "Content-Type must be application/json"}), 400

        data = request.json
        all_buyers = json.load(open(BUYERS_FILE, 'r')) if os.path.exists(BUYERS_FILE) else {}
        buyers = all_buyers.get(str(raffle_id), [])
        
        # Generate buyer number
        buyer_number = len(buyers) + 1
        data["buyerNumber"] = buyer_number
        
        # Generate unique ticket numbers
        existing_tickets = []
        for buyer in buyers:
            existing_tickets.extend(buyer.get("ticket_numbers", []))
        
        new_tickets = []
        tickets_needed = data["tickets"]
        while len(new_tickets) < tickets_needed:
            ticket_num = random.randint(100000, 999999)
            if ticket_num not in existing_tickets and ticket_num not in new_tickets:
                new_tickets.append(ticket_num)
        
        data["ticket_numbers"] = new_tickets
        buyers.append(data)
        
        all_buyers[str(raffle_id)] = buyers
        save_buyers(all_buyers)
        
        return jsonify({"message": "Buyer added successfully", "buyer": data})
    except Exception as e:
        app.logger.error(f"Error adding buyer: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/draw/<raffle_id>', methods=['POST'])
def draw_winner(raffle_id):
    try:
        buyers = load_buyers(raffle_id)
        if not buyers:
            return jsonify({"error": "No tickets available for draw"}), 400

        tickets = []
        for buyer in buyers:
            for ticket in buyer["ticket_numbers"]:
                tickets.append({
                    "number": ticket,
                    "name": f"{buyer['name']} {buyer['surname']}"
                })

        winner = random.choice(tickets)
        winner_text = f"Winner: Ticket #{str(winner['number']).zfill(6)} - {winner['name']}"

        # Save the winner in the raffle data
        raffles_data = load_raffles()
        for raffle in raffles_data['raffles']:
            if raffle['id'] == raffle_id:
                raffle['winner'] = winner_text
                raffle['drawn'] = True
                break
        save_raffles(raffles_data)

        return jsonify({"winner": winner_text})
    except Exception as e:
        app.logger.error(f"Error drawing winner: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/raffles/<raffle_id>', methods=['DELETE'])
def delete_raffle(raffle_id):
    try:
        # Load raffles
        raffles_data = load_raffles()
        
        # Find and remove the raffle
        raffles_data['raffles'] = [r for r in raffles_data['raffles'] if r['id'] != raffle_id]
        save_raffles(raffles_data)
        
        # Remove associated buyers
        if os.path.exists(BUYERS_FILE):
            with open(BUYERS_FILE, 'r') as f:
                buyers_data = json.load(f)
            
            if str(raffle_id) in buyers_data:
                del buyers_data[str(raffle_id)]
                save_buyers(buyers_data)
        
        return jsonify({"message": "Raffle deleted successfully"}), 200
    except Exception as e:
        app.logger.error(f"Error deleting raffle {raffle_id}: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/buyers/<raffle_id>/<buyer_number>', methods=['DELETE'])
def delete_buyer(raffle_id, buyer_number):
    try:
        # Load all buyers data
        if not os.path.exists(BUYERS_FILE):
            return jsonify({"error": "No buyers found"}), 404
            
        with open(BUYERS_FILE, 'r') as f:
            buyers_data = json.load(f)
        
        # Get buyers for this raffle
        raffle_buyers = buyers_data.get(str(raffle_id), [])
        
        # Find and remove buyer with matching number
        buyer_number = int(buyer_number)  # Convert to integer for comparison
        updated_buyers = [b for b in raffle_buyers if b.get('buyerNumber') != buyer_number]
        
        if len(updated_buyers) == len(raffle_buyers):
            return jsonify({"error": f"Buyer #{buyer_number} not found"}), 404
            
        # Update the buyers data
        buyers_data[str(raffle_id)] = updated_buyers
        
        # Save updated data
        with open(BUYERS_FILE, 'w') as f:
            json.dump(buyers_data, f, indent=2)
        
        return jsonify({"message": f"Buyer #{buyer_number} deleted successfully"}), 200
        
    except Exception as e:
        app.logger.error(f"Error deleting buyer: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/buyers/<raffle_id>/<buyer_number>', methods=['GET'])
def get_buyer(raffle_id, buyer_number):
    try:
        buyers = load_buyers(raffle_id)
        buyer_number = int(buyer_number)  # Convert to integer for comparison
        buyer = next((b for b in buyers if b.get('buyerNumber') == buyer_number), None)
        
        if not buyer:
            return jsonify({"error": f"Buyer #{buyer_number} not found"}), 404
            
        return jsonify(buyer)
    except Exception as e:
        app.logger.error(f"Error getting buyer: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/open-chrome', methods=['POST'])
def open_chrome():
    try:
        data = request.get_json()
        url = data.get('url')
        if not url:
            return jsonify({"error": "URL is required"}), 400
            
        # Use direct path to Chrome and proper command formatting
        chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
        if not os.path.exists(chrome_path):
            chrome_path = r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe'
        
        if not os.path.exists(chrome_path):
            return jsonify({"error": "Chrome not found"}), 404

        subprocess.Popen([chrome_path, '--new-window', url])
        return jsonify({"message": "Chrome launched successfully"}), 200
    except Exception as e:
        app.logger.error(f"Error launching Chrome: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/winners/<raffle_id>', methods=['GET'])
def get_winner_details(raffle_id):
    try:
        # Load raffle data to get winning ticket
        raffles_data = load_raffles()
        raffle = next((r for r in raffles_data['raffles'] if r['id'] == raffle_id), None)
        
        if not raffle or not raffle.get('winner'):
            return jsonify({"error": "No winner found for this raffle"}), 404
            
        # Extract ticket number from winner string
        ticket_number = int(raffle['winner'].split('#')[1].split(' ')[0])
        
        # Load buyers to find winner details
        buyers = load_buyers(raffle_id)
        winner = next(
            (buyer for buyer in buyers 
             if ticket_number in buyer['ticket_numbers']),
            None
        )
        
        if not winner:
            return jsonify({"error": "Winner details not found"}), 404
            
        return jsonify({
            "name": winner['name'],
            "surname": winner['surname'],
            "email": winner['email'],
            "mobile": winner.get('mobile'),
            "ticket": ticket_number
        })
        
    except Exception as e:
        app.logger.error(f"Error getting winner details: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/buyers/<raffle_id>/<buyer_number>/payment', methods=['POST'])
def update_payment_status(raffle_id, buyer_number):
    try:
        data = request.get_json()
        if 'paymentReceived' not in data:
            return jsonify({"error": "Payment status required"}), 400

        with open(BUYERS_FILE, 'r') as f:
            buyers_data = json.load(f)

        raffle_buyers = buyers_data.get(str(raffle_id), [])
        buyer_number = int(buyer_number)
        
        for buyer in raffle_buyers:
            if buyer.get('buyerNumber') == buyer_number:
                buyer['paymentReceived'] = data['paymentReceived']
                break

        buyers_data[str(raffle_id)] = raffle_buyers
        
        with open(BUYERS_FILE, 'w') as f:
            json.dump(buyers_data, f, indent=2)
        
        return jsonify({"message": "Payment status updated successfully"}), 200
        
    except Exception as e:
        app.logger.error(f"Error updating payment status: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/payment-qr/<raffle_id>/<buyer_number>', methods=['GET'])
def generate_payment_qr(raffle_id, buyer_number):
    try:
        # Get buyer and raffle details
        buyers = load_buyers(raffle_id)
        buyer = next((b for b in buyers if b.get('buyerNumber') == int(buyer_number)), None)
        
        if not buyer:
            return jsonify({"error": "Buyer not found"}), 404
            
        raffles_data = load_raffles()
        raffle = next((r for r in raffles_data['raffles'] if r['id'] == raffle_id), None)
        
        if not raffle:
            return jsonify({"error": "Raffle not found"}), 404
            
        # Create payment info
        total_amount = buyer['tickets'] * raffle['ticketCost']
        reference = f"RAFFLE-{raffle_id}-{buyer['buyerNumber']}"
        
        # Add reference to payment link if it's a URL
        payment_url = raffle.get('paymentLink', '')
        
        payment_info = (
            f"Payment for {raffle['name']}\n"
            f"Amount: R{total_amount:.2f}\n"
            f"Reference: {reference}\n"
            f"Link: {payment_url}"
        )
        
        # Generate QR code with payment link
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(payment_url)
        qr.make(fit=True)
        
        # Create image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return jsonify({
            "qr_code": img_str,
            "payment_info": payment_info,
            "payment_url": payment_url
        })
        
    except Exception as e:
        app.logger.error(f"Error generating QR code: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Add these routes to serve PWA files
@app.route('/manifest.json')
def serve_manifest():
    return send_from_directory('.', 'manifest.json')

@app.route('/sw.js')
def serve_sw():
    response = send_from_directory('.', 'sw.js')
    response.headers['Service-Worker-Allowed'] = '/'
    return response

@app.route('/style.css')
def serve_css():
    response = send_from_directory('.', 'style.css')
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@app.route('/script.js')
def serve_js():
    response = send_from_directory('.', 'script.js')
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@app.route('/icons/<path:filename>')
def serve_icon(filename):
    return send_from_directory('icons', filename)

@app.route('/config.js')
def serve_config():
    return send_from_directory('.', 'config.js')

if __name__ == '__main__':
    app.run(debug=True)
