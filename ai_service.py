import os
import time
import random
import sqlite3
import jwt
import bcrypt
import requests
import google.generativeai as genai
from functools import wraps
from collections import defaultdict
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

JWT_SECRET = 'rescue-mission-secret-key'

# Determine absolute path of directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
dist_folder = os.path.join(BASE_DIR, 'dist')
db_path = os.path.join(BASE_DIR, 'rescue.db')

app = Flask(__name__, static_folder=dist_folder, static_url_path='')
CORS(app, resources={r"/*": {"origins": "*"}})

# Lightweight IP Rate Limiter
IP_LIMITS = defaultdict(list)

def limit_ip(max_requests=5, window_seconds=900):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            # Trust X-Forwarded-For header in proxied environments (e.g. GitHub Codespaces)
            ip_header = request.headers.get('X-Forwarded-For')
            if ip_header:
                ip = ip_header.split(',')[0].strip()
            else:
                ip = request.remote_addr
            now = time.time()
            IP_LIMITS[ip] = [t for t in IP_LIMITS[ip] if now - t < window_seconds]
            if len(IP_LIMITS[ip]) >= max_requests:
                return jsonify({"error": "Too many requests from this IP, please try again after 15 minutes."}), 429
            IP_LIMITS[ip].append(now)
            return f(*args, **kwargs)
        return decorated
    return decorator

# Database Connection Helper
def get_db_connection():
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

# Authentication Middleware Decorator
def authenticate_token(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        token = None
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({"error": "Unauthorized"}), 401
            
        try:
            user = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            request.user = user
        except Exception as e:
            print(f"[Auth Middleware] JWT decode error: {e}")
            return jsonify({"error": "Forbidden"}), 403
            
        return f(*args, **kwargs)
    return decorated

# Seeding Helper
def seed_admin_user():
    try:
        conn = get_db_connection()
        user_count = conn.execute('SELECT COUNT(*) as count FROM users').fetchone()
        if user_count['count'] == 0:
            print("[Flask Database] Seeding default admin user...")
            hashed_password = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            conn.execute("INSERT INTO users (email, password, role) VALUES (?, ?, ?)", ('admin@rescue.org', hashed_password, 'admin'))
            conn.commit()
        conn.close()
    except Exception as e:
        print(f"[Flask Database] Error seeding admin: {e}")

# --- AUTH ROUTES ---

@app.route('/api/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json(silent=True) or {}
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400
            
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute('INSERT INTO users (email, password) VALUES (?, ?)', (email, hashed_password))
            user_id = cursor.lastrowid
            conn.commit()
        except sqlite3.IntegrityError:
            conn.close()
            return jsonify({"error": "Email already exists"}), 400
            
        conn.close()
        
        token = jwt.encode({"id": user_id, "email": email, "role": "citizen"}, JWT_SECRET, algorithm='HS256')
        return jsonify({"token": token, "user": {"id": user_id, "email": email, "role": "citizen"}})
        
    except Exception as e:
        print(f"Signup Error: {e}")
        return jsonify({"error": "Server error"}), 500

@app.route('/api/login', methods=['POST'])
def login_route():
    try:
        data = request.get_json(silent=True) or {}
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400
            
        conn = get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
        conn.close()
        
        if not user or not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
            return jsonify({"error": "Invalid credentials"}), 401
            
        role = user['role']
        if role in ['admin', 'rescuer']:
            return jsonify({"error": "Staff members must use the Staff Portal to log in."}), 403
            
        token = jwt.encode({"id": user['id'], "email": user['email'], "role": role}, JWT_SECRET, algorithm='HS256')
        return jsonify({"token": token, "user": {"id": user['id'], "email": user['email'], "role": role}})
        
    except Exception as e:
        print(f"Login Error: {e}")
        return jsonify({"error": "Server error"}), 500

@app.route('/api/staff/login', methods=['POST'])
def staff_login_route():
    try:
        data = request.get_json(silent=True) or {}
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400
            
        conn = get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
        conn.close()
        
        if not user or not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
            return jsonify({"error": "Invalid credentials"}), 401
            
        role = user['role']
        if role not in ['admin', 'rescuer']:
            return jsonify({"error": "Citizens are not authorized to access the Staff Portal."}), 403
            
        token = jwt.encode({"id": user['id'], "email": user['email'], "role": role}, JWT_SECRET, algorithm='HS256')
        return jsonify({"token": token, "user": {"id": user['id'], "email": user['email'], "role": role}})
        
    except Exception as e:
        print(f"Staff Login Error: {e}")
        return jsonify({"error": "Server error"}), 500

# --- REPORT ROUTES ---

@app.route('/api/reports/public-active', methods=['GET'])
def public_active_reports():
    try:
        conn = get_db_connection()
        reports = conn.execute(
            "SELECT id, title, description, location, latitude, longitude, status, animal_type, created_at "
            "FROM reports WHERE status IN ('pending', 'verified', 'assigned', 'in-progress') "
            "ORDER BY created_at DESC"
        ).fetchall()
        conn.close()
        return jsonify([dict(r) for r in reports])
    except Exception as e:
        print(f"Public Active Reports Error: {e}")
        return jsonify({"error": "Failed to fetch active reports"}), 500

@app.route('/api/reports', methods=['GET'])
@authenticate_token
def get_reports():
    try:
        conn = get_db_connection()
        user = request.user
        role = user.get('role')
        user_id = user.get('id')
        
        if role == 'admin':
            reports = conn.execute('SELECT * FROM reports ORDER BY created_at DESC').fetchall()
        elif role == 'rescuer':
            reports = conn.execute(
                'SELECT * FROM reports WHERE assigned_to = ? OR status = "verified" ORDER BY created_at DESC', 
                (user_id,)
            ).fetchall()
        else:
            reports = conn.execute('SELECT * FROM reports WHERE user_id = ? ORDER BY created_at DESC', (user_id,)).fetchall()
            
        conn.close()
        return jsonify([dict(r) for r in reports])
    except Exception as e:
        print(f"Get Reports Error: {e}")
        return jsonify({"error": "Failed to fetch reports"}), 500

@app.route('/api/logs', methods=['GET'])
@authenticate_token
def get_logs():
    try:
        conn = get_db_connection()
        logs = conn.execute('SELECT * FROM reports WHERE status = "resolved" ORDER BY created_at DESC').fetchall()
        conn.close()
        return jsonify([dict(l) for l in logs])
    except Exception as e:
        print(f"Get Logs Error: {e}")
        return jsonify({"error": "Failed to fetch logs"}), 500

@app.route('/api/reports/<int:id>', methods=['PATCH'])
@authenticate_token
def patch_report(id):
    try:
        data = request.get_json(silent=True) or {}
        status = data.get('status')
        priority = data.get('priority')
        rejection_reason = data.get('rejection_reason')
        assigned_to = data.get('assigned_to')
        title = data.get('title')
        description = data.get('description')
        location = data.get('location')
        animal_type = data.get('animal_type')
        
        conn = get_db_connection()
        
        if status == 'resolved':
            rescuer_id = request.user.get('id')
            res_count = conn.execute('SELECT COUNT(*) as count FROM reports WHERE status = "resolved" AND assigned_to = ?', (rescuer_id,)).fetchone()
            if res_count and res_count['count'] == 0:
                conn.execute('INSERT INTO achievements (user_id, badge_name, icon) VALUES (?, ?, ?)', (rescuer_id, 'Elite Rescuer', 'shield'))
                
        updates = []
        params = []
        fields = {
            "status": status, "priority": priority, "rejection_reason": rejection_reason,
            "assigned_to": assigned_to, "title": title, "description": description,
            "location": location, "animal_type": animal_type
        }
        
        for k, v in fields.items():
            if v is not None:
                updates.append(f"{k} = ?")
                params.append(v)
                
        if len(updates) > 0:
            params.append(id)
            conn.execute(f"UPDATE reports SET {', '.join(updates)} WHERE id = ?", tuple(params))
            
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    except Exception as e:
        print(f"Patch Report Error: {e}")
        return jsonify({"error": "Failed to update report"}), 500

@app.route('/api/reports/anonymous', methods=['POST'])
@limit_ip(max_requests=5, window_seconds=900)
def post_anonymous_report():
    try:
        data = request.get_json(silent=True) or {}
        title = data.get('title')
        description = data.get('description')
        location = data.get('location')
        priority = data.get('priority', 'medium')
        image_url = data.get('image_url')
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        animal_type = data.get('animal_type')
        ai_confidence = data.get('ai_confidence')
        facial_expression = data.get('facial_expression')
        
        if not image_url or latitude is None or longitude is None:
            return jsonify({"error": "Photo and location are required."}), 400
            
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO reports (user_id, title, description, location, priority, image_url, latitude, longitude, animal_type, ai_confidence, facial_expression) '
            'VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            (title, description, location, priority, image_url, latitude, longitude, animal_type, ai_confidence, facial_expression)
        )
        report_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({"id": report_id, "success": True})
    except Exception as e:
        print(f"Anonymous Report Error: {e}")
        return jsonify({"error": "Failed to submit report"}), 500

@app.route('/api/reports', methods=['POST'])
@authenticate_token
def post_report():
    try:
        data = request.get_json(silent=True) or {}
        title = data.get('title')
        description = data.get('description')
        location = data.get('location')
        priority = data.get('priority', 'medium')
        image_url = data.get('image_url')
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        animal_type = data.get('animal_type')
        ai_confidence = data.get('ai_confidence')
        facial_expression = data.get('facial_expression')
        
        user_id = request.user.get('id')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO reports (user_id, title, description, location, priority, image_url, latitude, longitude, animal_type, ai_confidence, facial_expression) '
            'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            (user_id, title, description, location, priority, image_url, latitude, longitude, animal_type, ai_confidence, facial_expression)
        )
        report_id = cursor.lastrowid
        
        report_count = conn.execute('SELECT COUNT(*) as count FROM reports WHERE user_id = ?', (user_id,)).fetchone()
        
        # Badge: First Responder
        if report_count and report_count['count'] == 1:
            conn.execute('INSERT INTO achievements (user_id, badge_name, icon) VALUES (?, ?, ?)', (user_id, 'First Responder', 'medal'))
            
        # Badge: Vigilant Guardian
        if report_count and report_count['count'] == 5:
            conn.execute('INSERT INTO achievements (user_id, badge_name, icon) VALUES (?, ?, ?)', (user_id, 'Vigilant Guardian', 'eye'))
            
        conn.commit()
        conn.close()
        
        return jsonify({"id": report_id})
    except Exception as e:
        print(f"Post Report Error: {e}")
        return jsonify({"error": "Failed to submit report"}), 500

# --- USER INFO ---

@app.route('/api/me', methods=['GET'])
@authenticate_token
def get_me():
    try:
        conn = get_db_connection()
        user = conn.execute('SELECT id, email, role FROM users WHERE id = ?', (request.user.get('id'),)).fetchone()
        conn.close()
        if user:
            return jsonify(dict(user))
        return jsonify({"error": "User not found"}), 404
    except Exception as e:
        print(f"Get Me Error: {e}")
        return jsonify({"error": "Failed to fetch user info"}), 500

@app.route('/api/users', methods=['GET'])
@authenticate_token
def get_users():
    try:
        if request.user.get('role') != 'admin':
            return jsonify({"error": "Forbidden"}), 403
            
        conn = get_db_connection()
        users = conn.execute('SELECT id, email, role, created_at FROM users').fetchall()
        conn.close()
        return jsonify([dict(u) for u in users])
    except Exception as e:
        print(f"Get Users Error: {e}")
        return jsonify({"error": "Failed to fetch users"}), 500

@app.route('/api/users/<int:id>', methods=['PATCH'])
@authenticate_token
def patch_user(id):
    try:
        if request.user.get('role') != 'admin':
            return jsonify({"error": "Forbidden"}), 403
            
        data = request.get_json(silent=True) or {}
        role = data.get('role')
        
        conn = get_db_connection()
        conn.execute('UPDATE users SET role = ? WHERE id = ?', (role, id))
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    except Exception as e:
        print(f"Patch User Error: {e}")
        return jsonify({"error": "Failed to update user"}), 500

@app.route('/api/users/<int:id>', methods=['DELETE'])
@authenticate_token
def delete_user(id):
    try:
        if request.user.get('role') != 'admin':
            return jsonify({"error": "Forbidden"}), 403
            
        conn = get_db_connection()
        conn.execute('DELETE FROM users WHERE id = ?', (id,))
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    except Exception as e:
        print(f"Delete User Error: {e}")
        return jsonify({"error": "Failed to delete user"}), 500

@app.route('/api/reports/<int:id>', methods=['DELETE'])
@authenticate_token
def delete_report(id):
    try:
        if request.user.get('role') != 'admin':
            return jsonify({"error": "Forbidden"}), 403
            
        conn = get_db_connection()
        conn.execute('DELETE FROM reports WHERE id = ?', (id,))
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    except Exception as e:
        print(f"Delete Report Error: {e}")
        return jsonify({"error": "Failed to delete report"}), 500

# --- GAMIFICATION ROUTES ---

@app.route('/api/achievements', methods=['GET'])
@authenticate_token
def get_achievements():
    try:
        conn = get_db_connection()
        achievements = conn.execute('SELECT * FROM achievements WHERE user_id = ?', (request.user.get('id'),)).fetchall()
        conn.close()
        return jsonify([dict(a) for a in achievements])
    except Exception as e:
        print(f"Get Achievements Error: {e}")
        return jsonify({"error": "Failed to fetch achievements"}), 500

# --- AI PROXY ROUTE ---

@app.route('/api/ai/predict', methods=['POST'])
@limit_ip(max_requests=5, window_seconds=900)
def ai_predict():
    try:
        data = request.get_json(silent=True) or {}
        image = data.get('image')
        colab_url = data.get('colabUrl')
        
        gemini_api_key = os.environ.get('GEMINI_API_KEY')
        if gemini_api_key:
            try:
                print("[Backend AI Proxy] Using Gemini API...")
                genai.configure(api_key=gemini_api_key)
                model = genai.GenerativeModel("gemini-1.5-flash")
                
                header, base64_data = image.split(',', 1)
                mime_type = header.split(';')[0].split(':')[1]
                
                prompt = (
                    "Analyze this animal image in detail. Output ONLY a JSON object with these exact keys: "
                    "'animal_type' (string, e.g. 'Dog', 'Cat', 'Bird', etc.), 'expression' (string, analyze "
                    "their apparent mood/condition: Happy, Stressed, Scared, Aggressive, Neutral, Injured, Malnourished), "
                    "'confidence' (float 0.0-1.0), and 'description' (string, a detailed 2-3 sentence analysis of "
                    "the animal's physical condition, environment, and apparent needs)."
                )
                
                response = model.generate_content([
                    prompt,
                    {
                        "mime_type": mime_type,
                        "data": base64_data
                    }
                ])
                
                text = response.text
                import re
                json_match = re.search(r'\{[\s\S]*\}', text)
                if json_match:
                    import json
                    return jsonify(json.loads(json_match.group(0)))
                else:
                    return jsonify({
                        "animal_type": "Unknown", "expression": "Neutral", "confidence": 0.5,
                        "description": "AI was unable to process the image correctly."
                    })
            except Exception as e:
                print(f"[Backend AI Proxy] Gemini Error: {e}")
                return jsonify({"error": "Failed to analyze image with AI."}), 500
                
        if colab_url:
            print(f"[Backend AI Proxy] Connecting to Colab URL: {colab_url}")
            try:
                clean_url = colab_url.rstrip('/')
                payload = {
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                { "type": "text", "text": "Analyze this animal image in detail. Output ONLY a JSON object with these exact keys: 'animal_type' (string, e.g. 'Dog', 'Cat', 'Bird', etc.), 'expression' (string, analyze their apparent mood/condition: Happy, Stressed, Scared, Aggressive, Neutral, Injured, Malnourished), 'confidence' (float 0.0-1.0), and 'description' (string, a detailed 2-3 sentence analysis of the animal's physical condition, environment, and apparent needs)." },
                                { "type": "image_url", "image_url": { "url": image } }
                            ]
                        }
                    ]
                }
                
                res = requests.post(
                    f"{clean_url}/v1/chat/completions",
                    json=payload,
                    headers={
                        "Content-Type": "application/json",
                        "Bypass-Tunnel-Reminder": "true",
                        "User-Agent": "SmartStrayRescue-Backend/1.0"
                    },
                    timeout=60,
                    verify=False
                )
                
                if res.status_code == 200:
                    res_data = res.json()
                    if res_data.get('choices') and len(res_data['choices']) > 0:
                        content = res_data['choices'][0]['message']['content']
                        import re
                        json_match = re.search(r'\{[\s\S]*\}', content)
                        if json_match:
                            import json
                            return jsonify(json.loads(json_match.group(0)))
            except Exception as e:
                print(f"[Backend AI Proxy] Colab Connection Error: {e}")
                
        # Mock Fallback
        species = ['Dog', 'Cat']
        expressions = ['Happy', 'Stressed', 'Scared', 'Aggressive', 'Neutral']
        return jsonify({
            "animal_type": random.choice(species),
            "expression": random.choice(expressions),
            "confidence": round(random.uniform(0.85, 0.99), 2),
            "description": "This is a fallback mock description. The AI service is currently running in local template mode and has detected an animal in the provided image."
        })
    except Exception as e:
        print(f"AI Predict Error: {e}")
        return jsonify({"error": "Failed to analyze image"}), 500

# Catch-all route to serve static files and fall back to index.html for client-side routing
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    if not os.path.exists(dist_folder):
        return "Production build directory 'dist' not found. Please run 'npm run build' first.", 404
        
    # If the path matches an actual file in the dist directory, serve it
    if path != "" and os.path.exists(os.path.join(dist_folder, path)):
        return send_from_directory(dist_folder, path)
        
    # Otherwise, serve the main index.html file for React Router to handle
    return send_from_directory(dist_folder, 'index.html')

if __name__ == '__main__':
    print("------------------------------------------------")
    print(f"Starting Smart Stray Python Service (Port 5000)")
    print(f"Database Source: {db_path}")
    print(f"Static Folder: {dist_folder}")
    print("------------------------------------------------")
    seed_admin_user()
    app.run(host='0.0.0.0', port=5000)
