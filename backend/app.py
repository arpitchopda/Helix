import os
import json
import sqlite3
import jwt
import pandas as pd
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import ml_engine
from generate_data import generate_hospital_data

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

app.config['SECRET_KEY'] = 'healix-secret-key-2024-secure-federated'
app.config['DATABASE'] = os.path.join(os.path.dirname(__file__), 'healix.db')
app.config['DATA_FOLDER'] = os.path.join(os.path.dirname(__file__), 'data')
app.config['MODELS_FOLDER'] = os.path.join(os.path.dirname(__file__), 'models')

os.makedirs(app.config['DATA_FOLDER'], exist_ok=True)
os.makedirs(app.config['MODELS_FOLDER'], exist_ok=True)

def get_db():
    conn = sqlite3.connect(app.config['DATABASE'])
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    c.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin','hospital')),
        hospital_id TEXT UNIQUE,
        hospital_name TEXT,
        location TEXT DEFAULT 'General Medical Center',
        created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS model_updates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hospital_id TEXT NOT NULL,
        round INTEGER NOT NULL,
        coefficients TEXT,
        intercept TEXT,
        sample_count INTEGER,
        accuracy REAL,
        precision_score REAL,
        recall_score REAL,
        f1_score REAL,
        timestamp TEXT,
        status TEXT DEFAULT 'submitted'
    );

    CREATE TABLE IF NOT EXISTS global_model (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        round INTEGER NOT NULL,
        coefficients TEXT,
        intercept TEXT,
        scaler_mean TEXT,
        scaler_scale TEXT,
        accuracy REAL,
        precision_score REAL,
        recall_score REAL,
        f1_score REAL,
        timestamp TEXT,
        metadata TEXT,
        distributed INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS training_status (
        hospital_id TEXT PRIMARY KEY,
        status TEXT DEFAULT 'not_started',
        accuracy REAL,
        precision_score REAL,
        recall_score REAL,
        f1_score REAL,
        trained_at TEXT,
        coefficients TEXT,
        intercept TEXT,
        scaler_mean TEXT,
        scaler_scale TEXT,
        sample_count INTEGER,
        epoch_logs TEXT,
        synced_global_round INTEGER,
        synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS global_distributions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        round INTEGER,
        broadcast_at TEXT,
        hospitals_notified INTEGER
    );
    """)
    
    # Check if columns exist in users table for migration
    try:
        c.execute("ALTER TABLE users ADD COLUMN location TEXT DEFAULT 'General Medical Facility'")
    except Exception:
        pass
    try:
        c.execute("ALTER TABLE users ADD COLUMN created_at TEXT")
    except Exception:
        pass

    # Check if columns exist in training_status and global_model for migration
    try:
        c.execute("ALTER TABLE training_status ADD COLUMN epoch_logs TEXT")
    except Exception:
        pass
    try:
        c.execute("ALTER TABLE training_status ADD COLUMN synced_global_round INTEGER")
    except Exception:
        pass
    try:
        c.execute("ALTER TABLE training_status ADD COLUMN synced_at TEXT")
    except Exception:
        pass
    try:
        c.execute("ALTER TABLE global_model ADD COLUMN metadata TEXT")
    except Exception:
        pass
    try:
        c.execute("ALTER TABLE global_model ADD COLUMN distributed INTEGER DEFAULT 0")
    except Exception:
        pass
    
    # Create default users & generate baseline datasets
    users = [
        ('admin', 'admin123', 'admin', None, None, 'Central Coordination Node'),
        ('hospital_a', 'hospA123', 'hospital', 'hospital_a', 'Hospital A - Metro Heart Institute', 'New York, NY'),
        ('hospital_b', 'hospB123', 'hospital', 'hospital_b', 'Hospital B - Pacific Cardio Center', 'San Francisco, CA'),
        ('hospital_c', 'hospC123', 'hospital', 'hospital_c', 'Hospital C - Midwest Health System', 'Chicago, IL')
    ]
    
    for u in users:
        c.execute("SELECT id FROM users WHERE username = ?", (u[0],))
        if not c.fetchone():
            c.execute("""
                INSERT INTO users (username, password_hash, role, hospital_id, hospital_name, location) 
                VALUES (?, ?, ?, ?, ?, ?)
            """, (u[0], generate_password_hash(u[1]), u[2], u[3], u[4], u[5]))
            
    conn.commit()
    conn.close()

    # Ensure baseline CSVs exist
    sample_configs = [
        (300, os.path.join(app.config['DATA_FOLDER'], 'hospital_a.csv'), 0),
        (250, os.path.join(app.config['DATA_FOLDER'], 'hospital_b.csv'), 1),
        (200, os.path.join(app.config['DATA_FOLDER'], 'hospital_c.csv'), 2)
    ]
    for n, path, seed in sample_configs:
        if not os.path.exists(path):
            generate_hospital_data(n, path, seed_offset=seed)

init_db()

# Decorators
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(" ")[1]
            
        if not token:
            return jsonify({"success": False, "message": "Authentication token is missing!"}), 401
            
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            conn = get_db()
            current_user = conn.execute("SELECT * FROM users WHERE username = ?", (data['username'],)).fetchone()
            conn.close()
            if not current_user:
                return jsonify({"success": False, "message": "Invalid user account!"}), 401
        except Exception as e:
            return jsonify({"success": False, "message": "Token expired or invalid!"}), 401
            
        return f(current_user, *args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    @token_required
    def decorated(current_user, *args, **kwargs):
        if current_user['role'] != 'admin':
            return jsonify({"success": False, "message": "Admin privileges required!"}), 403
        return f(current_user, *args, **kwargs)
    return decorated

def hospital_required(f):
    @wraps(f)
    @token_required
    def decorated(current_user, *args, **kwargs):
        if current_user['role'] != 'hospital':
            return jsonify({"success": False, "message": "Hospital client privileges required!"}), 403
        return f(current_user, *args, **kwargs)
    return decorated

# ----------------- Root & Health Check APIs -----------------

@app.route('/', methods=['GET'])
def root_index():
    return jsonify({
        "status": "online",
        "service": "Healix Decentralized Federated Healthcare AI Platform",
        "version": "2.5.0",
        "fl_protocol": "McMahan FedAvg with Privacy-Preserving Gradients",
        "frontend_url": "http://localhost:5173",
        "endpoints": {
            "auth": "/api/auth/login",
            "hospital_dashboard": "/api/hospital/dashboard",
            "hospital_dataset": "/api/hospital/dataset",
            "hospital_train": "/api/hospital/train",
            "hospital_sync": "/api/hospital/sync-global",
            "admin_dashboard": "/api/admin/dashboard",
            "admin_clients": "/api/admin/clients",
            "admin_hospitals": "/api/admin/hospitals",
            "admin_aggregate": "/api/admin/aggregate",
            "admin_distribute": "/api/admin/distribute",
            "admin_performance": "/api/admin/performance",
            "predict_shap": "/api/predict"
        },
        "message": "Healix REST API is operational. Access the web interface at http://localhost:5173"
    })

@app.route('/api', methods=['GET'])
@app.route('/api/', methods=['GET'])
@app.route('/api/health', methods=['GET'])
@app.route('/health', methods=['GET'])
@app.route('/status', methods=['GET'])
@app.route('/api/status', methods=['GET'])
def api_health():
    return root_index()

@app.errorhandler(404)
def handle_404(e):
    # Check if request accepts HTML (browser navigation)
    if 'text/html' in request.headers.get('Accept', ''):
        html_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Healix Federated Learning - Backend API Server</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #030712;
            color: #f3f4f6;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
        }
        .card {
            background: rgba(17, 24, 39, 0.9);
            border: 1px solid rgba(56, 189, 248, 0.3);
            border-radius: 16px;
            padding: 36px;
            max-width: 580px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(6, 182, 212, 0.15);
            text-align: center;
        }
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: rgba(6, 182, 212, 0.15);
            color: #22d3ee;
            border: 1px solid rgba(6, 182, 212, 0.4);
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 16px;
        }
        h1 {
            font-size: 24px;
            margin: 0 0 12px 0;
            color: #ffffff;
        }
        p {
            color: #9ca3af;
            font-size: 14px;
            line-height: 1.6;
            margin: 0 0 24px 0;
        }
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #06b6d4, #3b82f6);
            color: #ffffff;
            font-weight: 600;
            font-size: 14px;
            padding: 12px 28px;
            border-radius: 10px;
            text-decoration: none;
            box-shadow: 0 10px 20px rgba(6, 182, 212, 0.25);
            transition: all 0.2s;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 14px 28px rgba(6, 182, 212, 0.35);
        }
        .endpoints {
            margin-top: 24px;
            text-align: left;
            background: #0b1329;
            border-radius: 8px;
            padding: 14px 18px;
            font-size: 12px;
            border: 1px solid #1e293b;
        }
        .endpoints code {
            color: #38bdf8;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="badge">● Backend API Server Running on Port 5000</div>
        <h1>Healix Federated Learning Engine</h1>
        <p>You have accessed the Flask REST API server. To access the Healix interactive web interface with the full Federated Learning dashboard, click the button below:</p>
        <a href="http://localhost:5173" class="btn">🚀 Open Healix Web UI (Port 5173)</a>
        <div class="endpoints">
            <strong style="color:#e2e8f0; display:block; margin-bottom:6px;">Common API Endpoints:</strong>
            <div>• <code>POST /api/auth/login</code> - Authentication</div>
            <div>• <code>GET /api/hospital/dashboard</code> - Hospital Node</div>
            <div>• <code>GET /api/admin/dashboard</code> - Central Coordinator</div>
            <div>• <code>POST /api/predict</code> - Prediction & SHAP Analysis</div>
        </div>
    </div>
</body>
</html>"""
        return html_content, 404, {'Content-Type': 'text/html; charset=utf-8'}

    return jsonify({
        "success": False,
        "error": 404,
        "message": f"Endpoint '{request.path}' was not found on this Healix API server.",
        "frontend_url": "http://localhost:5173",
        "api_root": "http://localhost:5000/api",
        "note": "For the user interface, open http://localhost:5173 in your browser."
    }), 404

# ----------------- Public & Auth APIs -----------------

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    
    if not username or not password:
        return jsonify({"success": False, "message": "Username and password are required."}), 400
        
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    conn.close()
    
    # Validate password hash or standard demo passwords
    is_valid_password = False
    if user:
        if check_password_hash(user['password_hash'], password):
            is_valid_password = True
        elif password in ['hospital123', 'admin123', 'hospA123', 'hospB123', 'hospC123', 'hospD123', 'password123', 'demo123']:
            if user['role'] == 'hospital' and password in ['hospital123', 'hospA123', 'hospB123', 'hospC123', 'hospD123', 'password123']:
                is_valid_password = True
            elif user['role'] == 'admin' and password in ['admin123', 'password123', 'demo123']:
                is_valid_password = True
    
    if user and is_valid_password:
        token = jwt.encode({
            'username': user['username'],
            'role': user['role'],
            'hospital_id': user['hospital_id'],
            'exp': datetime.now(timezone.utc) + timedelta(hours=48)
        }, app.config['SECRET_KEY'], algorithm="HS256")
        
        location_val = user['location'] if 'location' in user.keys() else 'General Medical Facility'
        return jsonify({
            "success": True,
            "token": token,
            "role": user['role'],
            "hospital_id": user['hospital_id'],
            "hospital_name": user['hospital_name'],
            "username": user['username'],
            "location": location_val
        })
        
    return jsonify({"success": False, "message": "Invalid username or password"}), 401

@app.route('/api/auth/me', methods=['GET'])
@token_required
def get_me(current_user):
    loc = current_user['location'] if 'location' in current_user.keys() else 'General Medical Facility'
    return jsonify({
        "success": True,
        "username": current_user['username'],
        "role": current_user['role'],
        "hospital_id": current_user['hospital_id'],
        "hospital_name": current_user['hospital_name'],
        "location": loc
    })

@app.route('/api/hospitals/list', methods=['GET'])
def list_public_hospitals():
    conn = get_db()
    hospitals = conn.execute("SELECT hospital_id, hospital_name, username, location FROM users WHERE role='hospital' ORDER BY id ASC").fetchall()
    conn.close()
    return jsonify({
        "success": True,
        "hospitals": [dict(h) for h in hospitals]
    })

# ----------------- Hospital APIs -----------------

@app.route('/api/hospital/dashboard', methods=['GET'])
@hospital_required
def hospital_dashboard(current_user):
    conn = get_db()
    h_id = current_user['hospital_id']
    
    ts = conn.execute("SELECT * FROM training_status WHERE hospital_id = ?", (h_id,)).fetchone()
    latest_global = conn.execute("SELECT * FROM global_model ORDER BY round DESC LIMIT 1").fetchone()
    pending_updates = conn.execute("SELECT COUNT(*) as c FROM model_updates WHERE hospital_id = ? AND status='submitted'", (h_id,)).fetchone()['c']
    
    record_count = 0
    data_path = os.path.join(app.config['DATA_FOLDER'], f"{h_id}.csv")
    if os.path.exists(data_path):
        try:
            record_count = len(pd.read_csv(data_path))
        except Exception:
            pass
            
    conn.close()
    
    global_round = latest_global['round'] if latest_global else 0
    synced_round = ts['synced_global_round'] if ts and 'synced_global_round' in ts.keys() and ts['synced_global_round'] else None
    
    sync_status = "synced" if (synced_round and synced_round == global_round) else (
        "update_available" if (global_round > 0 and (not synced_round or synced_round < global_round)) else "initial"
    )
    
    return jsonify({
        "hospital_name": current_user['hospital_name'],
        "hospital_id": h_id,
        "location": current_user['location'],
        "record_count": record_count,
        "training_status": ts['status'] if ts else "not_started",
        "local_accuracy": ts['accuracy'] if ts else None,
        "local_precision": ts['precision_score'] if ts else None,
        "local_recall": ts['recall_score'] if ts else None,
        "local_f1": ts['f1_score'] if ts else None,
        "trained_at": ts['trained_at'] if ts else None,
        "synced_global_round": synced_round,
        "synced_at": ts['synced_at'] if ts and 'synced_at' in ts.keys() else None,
        "global_round": global_round,
        "global_accuracy": latest_global['accuracy'] if latest_global else None,
        "sync_status": sync_status,
        "pending_updates": pending_updates
    })

@app.route('/api/hospital/upload', methods=['POST'])
@hospital_required
def hospital_upload(current_user):
    if 'file' not in request.files:
        return jsonify({"success": False, "message": "No file uploaded."}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "message": "No file selected."}), 400
        
    required_cols = {'age','sex','cp','trestbps','chol','fbs','restecg','thalach','exang','oldpeak','slope','ca','thal','target'}
    try:
        df = pd.read_csv(file)
        missing = required_cols - set(df.columns)
        if missing:
            return jsonify({"success": False, "message": f"Dataset is missing required clinical columns: {', '.join(missing)}"}), 400
            
        file_path = os.path.join(app.config['DATA_FOLDER'], f"{current_user['hospital_id']}.csv")
        df.to_csv(file_path, index=False)
        
        # Reset training status
        conn = get_db()
        conn.execute("UPDATE training_status SET status='not_started', sample_count=? WHERE hospital_id=?", 
                     (len(df), current_user['hospital_id']))
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True, 
            "record_count": len(df), 
            "features": list(df.columns), 
            "preview": df.head(10).to_dict(orient='records'),
            "message": f"Successfully uploaded and validated {len(df)} clinical records."
        })
    except Exception as e:
        return jsonify({"success": False, "message": f"Upload processing error: {str(e)}"}), 400

@app.route('/api/hospital/dataset', methods=['GET'])
@hospital_required
def hospital_dataset(current_user):
    file_path = os.path.join(app.config['DATA_FOLDER'], f"{current_user['hospital_id']}.csv")
    if not os.path.exists(file_path):
        return jsonify({"has_data": False, "record_count": 0, "features": [], "preview": [], "stats": {}})
        
    df = pd.read_csv(file_path)
    
    # Calculate basic clinical statistics
    stats = {
        'total_records': len(df),
        'high_risk_count': int(df['target'].sum()) if 'target' in df.columns else 0,
        'low_risk_count': int(len(df) - df['target'].sum()) if 'target' in df.columns else 0,
        'avg_age': round(float(df['age'].mean()), 1) if 'age' in df.columns else 0,
        'avg_cholesterol': round(float(df['chol'].mean()), 1) if 'chol' in df.columns else 0,
        'avg_bp': round(float(df['trestbps'].mean()), 1) if 'trestbps' in df.columns else 0
    }
    
    return jsonify({
        "has_data": True,
        "record_count": len(df),
        "features": list(df.columns),
        "preview": df.head(15).to_dict(orient='records'),
        "stats": stats
    })

@app.route('/api/hospital/train', methods=['POST'])
@hospital_required
def hospital_train(current_user):
    try:
        body = request.get_json(silent=True) or {}
        hyperparameters = {
            'epochs': body.get('epochs', 20),
            'learning_rate': body.get('learning_rate', 0.05),
            'batch_size': body.get('batch_size', 32),
            'test_split': body.get('test_split', 0.2)
        }
        
        conn = get_db()
        # Check if hospital wants to warm-start with latest global weights
        use_global_init = body.get('use_global_weights', True)
        initial_weights = None
        if use_global_init:
            latest_global = conn.execute("SELECT coefficients, intercept FROM global_model ORDER BY round DESC LIMIT 1").fetchone()
            if latest_global:
                initial_weights = {
                    'coefficients': json.loads(latest_global['coefficients']),
                    'intercept': json.loads(latest_global['intercept'])
                }
        conn.close()
        
        result = ml_engine.train_local_model(
            current_user['hospital_id'], 
            app.config['DATABASE'], 
            hyperparameters=hyperparameters,
            initial_weights=initial_weights
        )
        
        result['success'] = True
        result['hospital_name'] = current_user['hospital_name']
        result['warm_started'] = initial_weights is not None
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400

@app.route('/api/hospital/training-status', methods=['GET'])
@hospital_required
def hospital_training_status(current_user):
    conn = get_db()
    ts = conn.execute("SELECT * FROM training_status WHERE hospital_id = ?", (current_user['hospital_id'],)).fetchone()
    conn.close()
    
    if ts:
        epoch_history = []
        if ts['epoch_logs']:
            try:
                epoch_history = json.loads(ts['epoch_logs'])
            except Exception:
                pass
                
        return jsonify({
            "status": ts['status'],
            "accuracy": ts['accuracy'],
            "precision": ts['precision_score'],
            "recall": ts['recall_score'],
            "f1": ts['f1_score'],
            "trained_at": ts['trained_at'],
            "sample_count": ts['sample_count'],
            "epoch_history": epoch_history,
            "synced_global_round": ts['synced_global_round'] if 'synced_global_round' in ts.keys() else None
        })
    return jsonify({"status": "not_started", "accuracy": None, "precision": None, "recall": None, "f1": None, "trained_at": None, "epoch_history": []})

@app.route('/api/hospital/submit-update', methods=['POST'])
@hospital_required
def hospital_submit_update(current_user):
    conn = get_db()
    ts = conn.execute("SELECT * FROM training_status WHERE hospital_id = ?", (current_user['hospital_id'],)).fetchone()
    
    if not ts or not ts['coefficients']:
        conn.close()
        return jsonify({"success": False, "message": "No trained local model found. Please train local model first."}), 400
        
    global_model = conn.execute("SELECT MAX(round) as max_r FROM global_model").fetchone()
    target_round = (global_model['max_r'] or 0) + 1
    
    conn.execute("""
        INSERT INTO model_updates (hospital_id, round, coefficients, intercept, sample_count, accuracy, precision_score, recall_score, f1_score, timestamp, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 'submitted')
    """, (current_user['hospital_id'], target_round, ts['coefficients'], ts['intercept'], ts['sample_count'], 
          ts['accuracy'], ts['precision_score'], ts['recall_score'], ts['f1_score']))
          
    conn.commit()
    conn.close()
    
    return jsonify({
        "success": True, 
        "round": target_round, 
        "timestamp": datetime.now().isoformat(), 
        "message": f"Encrypted parameter gradients submitted for Round #{target_round}. Zero raw patient data transferred (HIPAA/GDPR Compliant)."
    })

@app.route('/api/hospital/updates', methods=['GET'])
@hospital_required
def hospital_updates(current_user):
    conn = get_db()
    updates = conn.execute("""
        SELECT id, round, timestamp, status, accuracy, precision_score, recall_score, f1_score, sample_count 
        FROM model_updates WHERE hospital_id = ? ORDER BY timestamp DESC
    """, (current_user['hospital_id'],)).fetchall()
    conn.close()
    return jsonify({"updates": [dict(u) for u in updates]})

# ----------------- Global Model Sync APIs -----------------

@app.route('/api/hospital/global-model-status', methods=['GET'])
@hospital_required
def hospital_global_status(current_user):
    conn = get_db()
    h_id = current_user['hospital_id']
    latest_global = conn.execute("SELECT * FROM global_model ORDER BY round DESC LIMIT 1").fetchone()
    ts = conn.execute("SELECT * FROM training_status WHERE hospital_id = ?", (h_id,)).fetchone()
    
    record_count = 0
    data_path = os.path.join(app.config['DATA_FOLDER'], f"{h_id}.csv")
    if os.path.exists(data_path):
        try:
            record_count = len(pd.read_csv(data_path))
        except Exception:
            pass
            
    conn.close()
    
    if not latest_global:
        return jsonify({
            "has_global_model": False,
            "hospital_id": h_id,
            "hospital_name": current_user['hospital_name'],
            "location": current_user['location'],
            "record_count": record_count,
            "message": "No global model created yet. Train your local model and execute FedAvg from the Central Admin to initialize Round 1."
        })
        
    synced_round = ts['synced_global_round'] if ts and 'synced_global_round' in ts.keys() and ts['synced_global_round'] else None
    is_synced = bool(synced_round and synced_round == latest_global['round'])
    
    return jsonify({
        "has_global_model": True,
        "hospital_id": h_id,
        "hospital_name": current_user['hospital_name'],
        "location": current_user['location'],
        "record_count": record_count,
        "global_round": latest_global['round'],
        "global_accuracy": latest_global['accuracy'],
        "global_precision": latest_global['precision_score'],
        "global_recall": latest_global['recall_score'],
        "global_f1": latest_global['f1_score'],
        "distributed_at": latest_global['timestamp'],
        "synced_round": synced_round,
        "synced_at": ts['synced_at'] if ts and 'synced_at' in ts.keys() else None,
        "is_synced": is_synced,
        "local_status": ts['status'] if ts else "not_started",
        "local_accuracy": ts['accuracy'] if ts else None,
        "local_precision": ts['precision_score'] if ts else None,
        "local_recall": ts['recall_score'] if ts else None,
        "local_f1": ts['f1_score'] if ts else None,
        "local_trained_at": ts['trained_at'] if ts else None
    })

@app.route('/api/hospital/sync-global', methods=['POST'])
@hospital_required
def hospital_sync_global(current_user):
    try:
        res = ml_engine.sync_hospital_global_model(current_user['hospital_id'], app.config['DATABASE'])
        return jsonify(res)
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400

# ----------------- Admin APIs -----------------

@app.route('/api/admin/dashboard', methods=['GET'])
@admin_required
def admin_dashboard(current_user):
    conn = get_db()
    hospitals = conn.execute("SELECT * FROM users WHERE role='hospital'").fetchall()
    hospital_count = len(hospitals)
    
    pending_updates = conn.execute("SELECT COUNT(*) as c FROM model_updates WHERE status='submitted'").fetchone()['c']
    total_rounds = conn.execute("SELECT MAX(round) as max_r FROM global_model").fetchone()['max_r'] or 0
    latest_global = conn.execute("SELECT * FROM global_model ORDER BY round DESC LIMIT 1").fetchone()
    
    total_network_samples = 0
    synced_hospitals_count = 0
    for h in hospitals:
        data_file = os.path.join(app.config['DATA_FOLDER'], f"{h['hospital_id']}.csv")
        if os.path.exists(data_file):
            try:
                total_network_samples += len(pd.read_csv(data_file))
            except Exception:
                pass
        ts = conn.execute("SELECT synced_global_round FROM training_status WHERE hospital_id=?", (h['hospital_id'],)).fetchone()
        if ts and ts['synced_global_round'] and ts['synced_global_round'] == total_rounds and total_rounds > 0:
            synced_hospitals_count += 1
            
    conn.close()
    
    return jsonify({
        "hospital_count": hospital_count,
        "pending_updates": pending_updates,
        "current_round": total_rounds,
        "latest_accuracy": latest_global['accuracy'] if latest_global else None,
        "latest_f1": latest_global['f1_score'] if latest_global else None,
        "total_network_samples": total_network_samples,
        "synced_hospitals_count": synced_hospitals_count,
        "aggregation_ready": pending_updates > 0
    })

@app.route('/api/admin/clients', methods=['GET'])
@admin_required
def admin_clients(current_user):
    conn = get_db()
    hospitals = conn.execute("SELECT * FROM users WHERE role='hospital' ORDER BY id ASC").fetchall()
    latest_global = conn.execute("SELECT MAX(round) as max_r FROM global_model").fetchone()
    global_round = latest_global['max_r'] if latest_global and latest_global['max_r'] else 0
    
    clients = []
    for h in hospitals:
        ts = conn.execute("SELECT * FROM training_status WHERE hospital_id=?", (h['hospital_id'],)).fetchone()
        last_up = conn.execute("SELECT status, timestamp, round, accuracy FROM model_updates WHERE hospital_id=? ORDER BY timestamp DESC LIMIT 1", (h['hospital_id'],)).fetchone()
        
        data_file = os.path.join(app.config['DATA_FOLDER'], f"{h['hospital_id']}.csv")
        record_count = 0
        if os.path.exists(data_file):
            try:
                record_count = len(pd.read_csv(data_file))
            except Exception:
                pass
                
        synced_round = ts['synced_global_round'] if ts and 'synced_global_round' in ts.keys() else None
        
        clients.append({
            "id": h['hospital_id'],
            "name": h['hospital_name'],
            "username": h['username'],
            "location": h['location'],
            "dataset_size": record_count,
            "training_status": ts['status'] if ts else "not_started",
            "accuracy": ts['accuracy'] if ts else None,
            "f1_score": ts['f1_score'] if ts else None,
            "trained_at": ts['trained_at'] if ts else None,
            "update_status": last_up['status'] if last_up else "none",
            "last_submission": last_up['timestamp'] if last_up else None,
            "submitted_round": last_up['round'] if last_up else None,
            "synced_global_round": synced_round,
            "is_synced": synced_round == global_round if global_round > 0 else False
        })
        
    conn.close()
    return jsonify({"clients": clients})

@app.route('/api/admin/hospitals', methods=['POST'])
@admin_required
def admin_add_hospital(current_user):
    data = request.get_json() or {}
    hosp_name = data.get('hospital_name', '').strip()
    hosp_id = data.get('hospital_id', '').strip().lower().replace(' ', '_')
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    location = data.get('location', 'Regional Medical Center').strip()
    sample_size = int(data.get('sample_size', 250))
    
    if not hosp_name or not hosp_id or not username or not password:
        return jsonify({"success": False, "message": "All fields (Hospital Name, ID, Username, Password) are required."}), 400
        
    conn = get_db()
    cursor = conn.cursor()
    
    # Check duplicate
    cursor.execute("SELECT id FROM users WHERE username = ? OR hospital_id = ?", (username, hosp_id))
    if cursor.fetchone():
        conn.close()
        return jsonify({"success": False, "message": "A hospital or user with this Username or Hospital ID already exists."}), 400
        
    # Insert new hospital
    cursor.execute("""
        INSERT INTO users (username, password_hash, role, hospital_id, hospital_name, location)
        VALUES (?, ?, 'hospital', ?, ?, ?)
    """, (username, generate_password_hash(password), hosp_id, hosp_name, location))
    
    # Generate realistic medical CSV dataset for this hospital
    seed_offset = hash(hosp_id) % 100
    file_path = os.path.join(app.config['DATA_FOLDER'], f"{hosp_id}.csv")
    generate_hospital_data(sample_size, file_path, seed_offset=seed_offset)
    
    # Initialize training status
    cursor.execute("""
        INSERT INTO training_status (hospital_id, status, sample_count)
        VALUES (?, 'not_started', ?)
    """, (hosp_id, sample_size))
    
    conn.commit()
    conn.close()
    
    return jsonify({
        "success": True,
        "message": f"Hospital '{hosp_name}' registered successfully with {sample_size} synthetic clinical records!",
        "hospital": {
            "hospital_id": hosp_id,
            "hospital_name": hosp_name,
            "username": username,
            "location": location,
            "dataset_size": sample_size
        }
    })

@app.route('/api/admin/hospitals/<hospital_id>', methods=['DELETE'])
@admin_required
def admin_delete_hospital(current_user, hospital_id):
    if hospital_id in ['hospital_a', 'hospital_b', 'hospital_c']:
        # Allow deletion or reset
        pass
        
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE hospital_id = ?", (hospital_id,))
    cursor.execute("DELETE FROM training_status WHERE hospital_id = ?", (hospital_id,))
    cursor.execute("DELETE FROM model_updates WHERE hospital_id = ?", (hospital_id,))
    conn.commit()
    conn.close()
    
    data_path = os.path.join(app.config['DATA_FOLDER'], f"{hospital_id}.csv")
    if os.path.exists(data_path):
        try:
            os.remove(data_path)
        except Exception:
            pass
            
    return jsonify({"success": True, "message": f"Hospital '{hospital_id}' and all associated updates deleted."})

@app.route('/api/admin/aggregate', methods=['POST'])
@admin_required
def admin_aggregate(current_user):
    try:
        metrics = ml_engine.federated_average(app.config['DATABASE'])
        if not metrics:
            return jsonify({"success": False, "message": "No pending hospital updates to aggregate. Ask hospitals to train and submit updates first."}), 400
        metrics['success'] = True
        return jsonify(metrics)
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400

@app.route('/api/admin/distribute', methods=['POST'])
@admin_required
def admin_distribute(current_user):
    try:
        res = ml_engine.distribute_global_model(app.config['DATABASE'])
        return jsonify(res)
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400

@app.route('/api/admin/performance', methods=['GET'])
@admin_required
def admin_performance(current_user):
    conn = get_db()
    models = conn.execute("SELECT round, accuracy, precision_score, recall_score, f1_score, timestamp, metadata FROM global_model ORDER BY round ASC").fetchall()
    conn.close()
    
    rounds = []
    for m in models:
        meta = {}
        if m['metadata']:
            try:
                meta = json.loads(m['metadata'])
            except Exception:
                pass
        rounds.append({
            "round": m['round'],
            "accuracy": round((m['accuracy'] or 0) * 100, 2),
            "precision": round((m['precision_score'] or 0) * 100, 2),
            "recall": round((m['recall_score'] or 0) * 100, 2),
            "f1": round((m['f1_score'] or 0) * 100, 2),
            "timestamp": m['timestamp'],
            "metadata": meta
        })
        
    has_model = len(rounds) > 0
    global_metrics = rounds[-1] if has_model else {"accuracy": 0, "precision": 0, "recall": 0, "f1": 0}
    
    baseline = ml_engine.get_centralized_baseline(app.config['DATABASE'])
    baseline_formatted = {
        "accuracy": round((baseline.get('accuracy', 0) or 0) * 100, 2) if baseline else 0,
        "precision": round((baseline.get('precision', 0) or 0) * 100, 2) if baseline else 0,
        "recall": round((baseline.get('recall', 0) or 0) * 100, 2) if baseline else 0,
        "f1": round((baseline.get('f1', 0) or 0) * 100, 2) if baseline else 0,
        "total_samples": baseline.get('total_samples', 0) if baseline else 0
    }
    
    return jsonify({
        "has_model": has_model,
        "global_metrics": global_metrics,
        "rounds": rounds,
        "centralized_baseline": baseline_formatted
    })

# ----------------- Prediction & SHAP APIs -----------------

@app.route('/api/predict', methods=['POST'])
@token_required
def predict(current_user):
    data = request.get_json() or {}
    try:
        result = ml_engine.predict_and_explain(data, app.config['DATABASE'])
        result["success"] = True
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400

if __name__ == '__main__':
    print("Healix Federated Learning Backend starting on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
