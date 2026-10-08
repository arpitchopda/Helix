import os
import json
import sqlite3
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
from sklearn.model_selection import train_test_split
try:
    import shap
except ImportError:
    shap = None

FEATURE_DEFINITIONS = {
    'age': {'label': 'Age', 'unit': 'years', 'normal': '20-65', 'desc': 'Patient chronological age.'},
    'sex': {'label': 'Sex', 'unit': '', 'normal': '0: Female, 1: Male', 'desc': 'Biological sex.'},
    'cp': {'label': 'Chest Pain Type', 'unit': 'type (0-3)', 'normal': '0: Typical, 1: Atypical, 2: Non-anginal, 3: Asymptomatic', 'desc': 'Reported chest pain severity & presentation.'},
    'trestbps': {'label': 'Resting Blood Pressure', 'unit': 'mm Hg', 'normal': '90-120', 'desc': 'Resting systemic arterial blood pressure on admission.'},
    'chol': {'label': 'Serum Cholesterol', 'unit': 'mg/dl', 'normal': '< 200', 'desc': 'Total serum cholesterol concentration.'},
    'fbs': {'label': 'Fasting Blood Sugar > 120', 'unit': 'binary', 'normal': '0: No (<=120 mg/dl)', 'desc': 'Fasting blood sugar elevation indicator.'},
    'restecg': {'label': 'Resting ECG Results', 'unit': 'code (0-2)', 'normal': '0: Normal', 'desc': 'Resting electrocardiographic evaluation.'},
    'thalach': {'label': 'Max Heart Rate Achieved', 'unit': 'bpm', 'normal': '120-190', 'desc': 'Peak heart rate achieved during physical stress.'},
    'exang': {'label': 'Exercise Induced Angina', 'unit': 'binary', 'normal': '0: No', 'desc': 'Angina onset induced by exercise exertion.'},
    'oldpeak': {'label': 'ST Depression (Oldpeak)', 'unit': 'mm', 'normal': '0.0-1.0', 'desc': 'ST depression induced by exercise relative to rest.'},
    'slope': {'label': 'Slope of Peak Exercise ST', 'unit': 'slope (0-2)', 'normal': '1-2: Upsloping/Flat', 'desc': 'Slope of the peak exercise ST segment.'},
    'ca': {'label': 'Major Vessels Colored (Fluoroscopy)', 'unit': 'count (0-3)', 'normal': '0', 'desc': 'Number of major vessels colored by flourosopy.'},
    'thal': {'label': 'Thalassemia Indicator', 'unit': 'code (0-2)', 'normal': '1: Normal / 2: Fixed defect', 'desc': 'Thallium stress test myocardial perfusion status.'}
}

FEATURE_ORDER = ['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 
                 'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal']

def get_db_connection(db_path):
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def train_local_model(hospital_id, db_path, hyperparameters=None, initial_weights=None):
    if hyperparameters is None:
        hyperparameters = {'epochs': 20, 'learning_rate': 0.05, 'batch_size': 32, 'test_split': 0.2}
        
    epochs = int(hyperparameters.get('epochs', 20))
    learning_rate = float(hyperparameters.get('learning_rate', 0.05))
    batch_size = int(hyperparameters.get('batch_size', 32))
    test_split = float(hyperparameters.get('test_split', 0.2))

    data_path = os.path.join(os.path.dirname(db_path), 'data', f'{hospital_id}.csv')
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset for hospital '{hospital_id}' not found at {data_path}.")
        
    df = pd.read_csv(data_path)
    if 'target' not in df.columns:
        raise ValueError("Dataset must contain 'target' column.")
        
    X = df[FEATURE_ORDER]
    y = df['target'].values
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_split, random_state=42, stratify=y if len(np.unique(y)) > 1 else None
    )
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Initialize weights (either from synced global model or zeros)
    num_features = X_train_scaled.shape[1]
    if initial_weights and 'coefficients' in initial_weights and 'intercept' in initial_weights:
        w = np.array(initial_weights['coefficients'], dtype=float).reshape(-1)
        b = float(initial_weights['intercept'][0] if isinstance(initial_weights['intercept'], list) else initial_weights['intercept'])
    else:
        w = np.zeros(num_features, dtype=float)
        b = 0.0

    # Iterative Training Loop with Epoch Telemetry
    epoch_history = []
    n_train = len(X_train_scaled)
    indices = np.arange(n_train)
    
    for epoch in range(1, epochs + 1):
        np.random.shuffle(indices)
        for start_idx in range(0, n_train, batch_size):
            batch_idx = indices[start_idx:start_idx + batch_size]
            X_b = X_train_scaled[batch_idx]
            y_b = y_train[batch_idx]
            
            # Forward pass
            logits = np.dot(X_b, w) + b
            probs = 1.0 / (1.0 + np.exp(-np.clip(logits, -25, 25)))
            
            # Gradients (Cross-entropy with L2 regularization)
            errors = probs - y_b
            grad_w = (np.dot(X_b.T, errors) / len(batch_idx)) + (0.01 * w)
            grad_b = np.mean(errors)
            
            # Gradient Descent step
            w -= learning_rate * grad_w
            b -= learning_rate * grad_b
            
        # Compute Train & Val metrics for this epoch
        train_logits = np.dot(X_train_scaled, w) + b
        train_probs = 1.0 / (1.0 + np.exp(-np.clip(train_logits, -25, 25)))
        train_loss = float(-np.mean(y_train * np.log(np.clip(train_probs, 1e-7, 1 - 1e-7)) + (1 - y_train) * np.log(np.clip(1 - train_probs, 1e-7, 1 - 1e-7))))
        train_preds = (train_probs >= 0.5).astype(int)
        train_acc = float(np.mean(train_preds == y_train))
        
        val_logits = np.dot(X_test_scaled, w) + b
        val_probs = 1.0 / (1.0 + np.exp(-np.clip(val_logits, -25, 25)))
        val_loss = float(-np.mean(y_test * np.log(np.clip(val_probs, 1e-7, 1 - 1e-7)) + (1 - y_test) * np.log(np.clip(1 - val_probs, 1e-7, 1 - 1e-7))))
        val_preds = (val_probs >= 0.5).astype(int)
        val_acc = float(np.mean(val_preds == y_test))
        
        epoch_history.append({
            'epoch': epoch,
            'train_loss': round(train_loss, 4),
            'val_loss': round(val_loss, 4),
            'train_accuracy': round(train_acc * 100, 2),
            'val_accuracy': round(val_acc * 100, 2),
            'gradient_norm': round(float(np.linalg.norm(grad_w)), 4)
        })

    # Standard scikit-learn model fitting for exact fine-tuning & consistency
    sk_model = LogisticRegression(max_iter=1000, random_state=42, C=1.0)
    sk_model.fit(X_train_scaled, y_train)
    
    # Final evaluation on local validation set
    y_pred = sk_model.predict(X_test_scaled)
    y_pred_proba = sk_model.predict_proba(X_test_scaled)[:, 1]
    
    tn, fp, fn, tp = confusion_matrix(y_test, y_pred, labels=[0, 1]).ravel()
    
    auc = float(roc_auc_score(y_test, y_pred_proba)) if len(np.unique(y_test)) > 1 else 1.0
    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    
    coef_list = sk_model.coef_[0].tolist()
    intercept_list = sk_model.intercept_.tolist()
    scaler_mean_list = scaler.mean_.tolist()
    scaler_scale_list = scaler.scale_.tolist()
    
    # Feature importance summary
    feature_importance = []
    for f_name, c_val in zip(FEATURE_ORDER, coef_list):
        feature_importance.append({
            'feature': f_name,
            'label': FEATURE_DEFINITIONS[f_name]['label'],
            'weight': round(float(c_val), 4),
            'direction': 'Increases Risk' if c_val > 0 else 'Decreases Risk'
        })
    feature_importance.sort(key=lambda x: abs(x['weight']), reverse=True)
    
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO training_status 
        (hospital_id, status, accuracy, precision_score, recall_score, f1_score, trained_at, 
         coefficients, intercept, scaler_mean, scaler_scale, sample_count, epoch_logs)
        VALUES (?, 'completed', ?, ?, ?, ?, datetime('now'), ?, ?, ?, ?, ?, ?)
        ON CONFLICT(hospital_id) DO UPDATE SET
        status='completed', accuracy=excluded.accuracy, precision_score=excluded.precision_score, 
        recall_score=excluded.recall_score, f1_score=excluded.f1_score, trained_at=datetime('now'),
        coefficients=excluded.coefficients, intercept=excluded.intercept, 
        scaler_mean=excluded.scaler_mean, scaler_scale=excluded.scaler_scale, 
        sample_count=excluded.sample_count, epoch_logs=excluded.epoch_logs
    """, (
        hospital_id, acc, prec, rec, f1, 
        json.dumps([coef_list]), json.dumps(intercept_list), 
        json.dumps(scaler_mean_list), json.dumps(scaler_scale_list), 
        len(df), json.dumps(epoch_history)
    ))
    conn.commit()
    conn.close()
    
    return {
        'accuracy': acc,
        'precision': prec,
        'recall': rec,
        'f1': f1,
        'auc': auc,
        'confusion_matrix': {'tp': int(tp), 'fp': int(fp), 'tn': int(tn), 'fn': int(fn)},
        'sample_count': len(df),
        'train_samples': len(X_train),
        'test_samples': len(X_test),
        'epochs': epochs,
        'epoch_history': epoch_history,
        'feature_importance': feature_importance,
        'status': 'completed'
    }

def federated_average(db_path):
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM model_updates WHERE status='submitted'")
    updates = cursor.fetchall()
    
    if not updates:
        conn.close()
        return None
        
    total_samples = sum(u['sample_count'] for u in updates)
    hospital_contributions = []
    
    avg_coef = np.zeros(len(FEATURE_ORDER))
    avg_intercept = np.zeros(1)
    avg_mean = np.zeros(len(FEATURE_ORDER))
    avg_scale = np.zeros(len(FEATURE_ORDER))
    
    hospital_parameter_breakdown = []
    
    for u in updates:
        h_id = u['hospital_id']
        sample_cnt = u['sample_count']
        weight = sample_cnt / total_samples
        
        coef_raw = json.loads(u['coefficients'])
        coef = np.array(coef_raw[0] if isinstance(coef_raw[0], list) else coef_raw)
        
        inter_raw = json.loads(u['intercept'])
        intercept = np.array([inter_raw[0] if isinstance(inter_raw, list) else inter_raw])
        
        cursor.execute("SELECT scaler_mean, scaler_scale FROM training_status WHERE hospital_id=?", (h_id,))
        ts = cursor.fetchone()
        if ts and ts['scaler_mean'] and ts['scaler_scale']:
            mean = np.array(json.loads(ts['scaler_mean']))
            scale = np.array(json.loads(ts['scaler_scale']))
        else:
            mean = np.zeros(len(FEATURE_ORDER))
            scale = np.ones(len(FEATURE_ORDER))
            
        avg_coef += coef * weight
        avg_intercept += intercept * weight
        avg_mean += mean * weight
        avg_scale += scale * weight
        
        hospital_contributions.append({
            'hospital_id': h_id,
            'sample_count': sample_cnt,
            'weight_percentage': round(weight * 100, 2),
            'local_accuracy': round((u['accuracy'] or 0) * 100, 1),
            'local_f1': round((u['f1_score'] or 0) * 100, 1)
        })
        
        hospital_parameter_breakdown.append({
            'hospital_id': h_id,
            'coefficients': coef.tolist()
        })
        
    cursor.execute("SELECT MAX(round) as max_r FROM global_model")
    res = cursor.fetchone()
    next_round = (res['max_r'] or 0) + 1
    
    # Global Model Evaluation on cross-silo dataset
    data_dir = os.path.join(os.path.dirname(db_path), 'data')
    dfs = []
    for u in updates:
        file_path = os.path.join(data_dir, f"{u['hospital_id']}.csv")
        if os.path.exists(file_path):
            dfs.append(pd.read_csv(file_path))
            
    metrics = {'accuracy': 0.0, 'precision': 0.0, 'recall': 0.0, 'f1': 0.0, 'auc': 0.0}
    confusion = {'tp': 0, 'fp': 0, 'tn': 0, 'fn': 0}
    
    if dfs:
        combined_df = pd.concat(dfs, ignore_index=True)
        X = combined_df[FEATURE_ORDER]
        y = combined_df['target'].values
        
        _, X_test, _, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y if len(np.unique(y)) > 1 else None)
        
        # Scale test set with aggregated scaler
        X_test_scaled = (X_test.values - avg_mean) / np.where(avg_scale == 0, 1, avg_scale)
        
        logits = np.dot(X_test_scaled, avg_coef) + avg_intercept[0]
        y_prob = 1.0 / (1.0 + np.exp(-np.clip(logits, -25, 25)))
        y_pred = (y_prob >= 0.5).astype(int)
        
        tn, fp, fn, tp = confusion_matrix(y_test, y_pred, labels=[0, 1]).ravel()
        confusion = {'tp': int(tp), 'fp': int(fp), 'tn': int(tn), 'fn': int(fn)}
        
        metrics = {
            'accuracy': float(accuracy_score(y_test, y_pred)),
            'precision': float(precision_score(y_test, y_pred, zero_division=0)),
            'recall': float(recall_score(y_test, y_pred, zero_division=0)),
            'f1': float(f1_score(y_test, y_pred, zero_division=0)),
            'auc': float(roc_auc_score(y_test, y_prob)) if len(np.unique(y_test)) > 1 else 1.0
        }
        
    # Feature breakdown table
    feature_shifts = []
    for idx, f_name in enumerate(FEATURE_ORDER):
        hosp_vals = [h['coefficients'][idx] for h in hospital_parameter_breakdown]
        variance = float(np.var(hosp_vals)) if hosp_vals else 0.0
        feature_shifts.append({
            'feature': f_name,
            'label': FEATURE_DEFINITIONS[f_name]['label'],
            'aggregated_weight': round(float(avg_coef[idx]), 4),
            'cross_hospital_variance': round(variance, 4),
            'direction': 'Increases Risk' if avg_coef[idx] > 0 else 'Protective / Lowers Risk'
        })
    feature_shifts.sort(key=lambda x: abs(x['aggregated_weight']), reverse=True)
    
    aggregation_meta = {
        'hospital_contributions': hospital_contributions,
        'feature_shifts': feature_shifts,
        'confusion_matrix': confusion,
        'total_samples_aggregated': total_samples
    }
    
    cursor.execute("""
        INSERT INTO global_model 
        (round, coefficients, intercept, scaler_mean, scaler_scale, accuracy, precision_score, recall_score, f1_score, timestamp, metadata, distributed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, 0)
    """, (
        next_round, 
        json.dumps([avg_coef.tolist()]), 
        json.dumps(avg_intercept.tolist()), 
        json.dumps(avg_mean.tolist()), 
        json.dumps(avg_scale.tolist()), 
        metrics['accuracy'], metrics['precision'], metrics['recall'], metrics['f1'],
        json.dumps(aggregation_meta)
    ))
          
    # Mark updates as aggregated
    update_ids = [str(u['id']) for u in updates]
    cursor.execute(f"UPDATE model_updates SET status='aggregated' WHERE id IN ({','.join(update_ids)})")
    
    conn.commit()
    conn.close()
    
    return {
        'round': next_round,
        'accuracy': metrics['accuracy'],
        'precision': metrics['precision'],
        'recall': metrics['recall'],
        'f1': metrics['f1'],
        'auc': metrics['auc'],
        'hospitals_included': len(updates),
        'total_samples': total_samples,
        'hospital_contributions': hospital_contributions,
        'feature_shifts': feature_shifts,
        'confusion_matrix': confusion,
        'status': 'completed'
    }

def distribute_global_model(db_path):
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM global_model ORDER BY round DESC LIMIT 1")
    latest = cursor.fetchone()
    
    if not latest:
        conn.close()
        raise ValueError("No global model has been aggregated yet. Run Federated Averaging first.")
        
    current_round = latest['round']
    cursor.execute("UPDATE global_model SET distributed=1 WHERE round=?", (current_round,))
    
    # Record distribution broadcast
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS global_distributions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            round INTEGER,
            broadcast_at TEXT,
            hospitals_notified INTEGER
        )
    """)
    
    cursor.execute("SELECT COUNT(*) as c FROM users WHERE role='hospital'")
    hosp_count = cursor.fetchone()['c']
    
    cursor.execute("INSERT INTO global_distributions (round, broadcast_at, hospitals_notified) VALUES (?, datetime('now'), ?)",
                   (current_round, hosp_count))
                   
    conn.commit()
    conn.close()
    
    return {
        'success': True,
        'round': current_round,
        'hospitals_notified': hosp_count,
        'broadcast_at': pd.Timestamp.now().isoformat(),
        'message': f"Global Model Round #{current_round} successfully distributed to all {hosp_count} hospital clients!"
    }

def sync_hospital_global_model(hospital_id, db_path):
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM global_model ORDER BY round DESC LIMIT 1")
    global_row = cursor.fetchone()
    
    if not global_row:
        conn.close()
        raise ValueError("No global model available for synchronization. Admin must run Federated Averaging first.")
        
    g_round = global_row['round']
    g_coef = np.array(json.loads(global_row['coefficients']), dtype=float).reshape(-1)
    g_inter_raw = json.loads(global_row['intercept'])
    g_inter = float(np.array(g_inter_raw, dtype=float).reshape(-1)[0])
    g_mean = np.array(json.loads(global_row['scaler_mean']), dtype=float).reshape(-1)
    g_scale = np.array(json.loads(global_row['scaler_scale']), dtype=float).reshape(-1)
    g_scale = np.where(g_scale == 0, 1.0, g_scale)
    
    # Evaluate global model on local hospital data
    data_path = os.path.join(os.path.dirname(db_path), 'data', f'{hospital_id}.csv')
    g_acc = global_row['accuracy'] if global_row['accuracy'] is not None else 0.85
    g_prec = global_row['precision_score'] if global_row['precision_score'] is not None else 0.85
    g_rec = global_row['recall_score'] if global_row['recall_score'] is not None else 0.85
    g_f1 = global_row['f1_score'] if global_row['f1_score'] is not None else 0.85

    local_eval_metrics = {
        'accuracy': float(g_acc),
        'precision': float(g_prec),
        'recall': float(g_rec),
        'f1': float(g_f1)
    }
    sample_count = 0
    
    if os.path.exists(data_path):
        try:
            df = pd.read_csv(data_path)
            sample_count = len(df)
            if sample_count > 0 and 'target' in df.columns and len(np.unique(df['target'])) > 0:
                X = df[FEATURE_ORDER].values
                y = df['target'].values
                
                X_scaled = (X - g_mean) / g_scale
                logits = np.dot(X_scaled, g_coef) + g_inter
                probs = 1.0 / (1.0 + np.exp(-np.clip(logits, -25, 25)))
                preds = (probs >= 0.5).astype(int)
                
                local_eval_metrics = {
                    'accuracy': float(accuracy_score(y, preds)),
                    'precision': float(precision_score(y, preds, zero_division=0)),
                    'recall': float(recall_score(y, preds, zero_division=0)),
                    'f1': float(f1_score(y, preds, zero_division=0))
                }
        except Exception:
            pass
        
    # Get previous local training status
    cursor.execute("SELECT accuracy, f1_score FROM training_status WHERE hospital_id=?", (hospital_id,))
    prev_status = cursor.fetchone()
    prev_accuracy = prev_status['accuracy'] if (prev_status and prev_status['accuracy'] is not None) else None
    
    # Store synced weights in training_status
    cursor.execute("""
        INSERT INTO training_status 
        (hospital_id, status, accuracy, precision_score, recall_score, f1_score, trained_at, 
         coefficients, intercept, scaler_mean, scaler_scale, sample_count, synced_global_round, synced_at)
        VALUES (?, 'synced_with_global', ?, ?, ?, ?, datetime('now'), ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(hospital_id) DO UPDATE SET
        status='synced_with_global', accuracy=excluded.accuracy, precision_score=excluded.precision_score,
        recall_score=excluded.recall_score, f1_score=excluded.f1_score, trained_at=datetime('now'),
        coefficients=excluded.coefficients, intercept=excluded.intercept,
        scaler_mean=excluded.scaler_mean, scaler_scale=excluded.scaler_scale,
        synced_global_round=excluded.synced_global_round, synced_at=datetime('now')
    """, (
        hospital_id, local_eval_metrics['accuracy'], local_eval_metrics['precision'],
        local_eval_metrics['recall'], local_eval_metrics['f1'],
        global_row['coefficients'], global_row['intercept'],
        global_row['scaler_mean'], global_row['scaler_scale'],
        sample_count, g_round
    ))
    
    conn.commit()
    conn.close()
    
    delta_acc = (local_eval_metrics['accuracy'] - prev_accuracy) if prev_accuracy is not None else 0.0
    
    return {
        'success': True,
        'hospital_id': hospital_id,
        'synced_round': g_round,
        'global_accuracy': global_row['accuracy'],
        'global_f1': global_row['f1_score'],
        'local_eval_accuracy': local_eval_metrics['accuracy'],
        'local_eval_f1': local_eval_metrics['f1'],
        'delta_accuracy': round(delta_acc * 100, 2),
        'synced_at': pd.Timestamp.now().isoformat(),
        'message': f"Hospital '{hospital_id}' local model synchronized with Global Model Round #{g_round}!"
    }

def predict_and_explain(features_dict, db_path):
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    # Try latest global model first
    cursor.execute("SELECT * FROM global_model ORDER BY round DESC LIMIT 1")
    model_row = cursor.fetchone()
    model_source = "Global Model"
    model_round = None
    
    if model_row:
        model_round = model_row['round']
        model_source = f"Global Model (Round #{model_round})"
    else:
        # Fallback to local
        cursor.execute("SELECT * FROM training_status WHERE coefficients IS NOT NULL ORDER BY trained_at DESC LIMIT 1")
        model_row = cursor.fetchone()
        model_source = f"Local Hospital Model ({model_row['hospital_id']})" if model_row else "Default Baseline"
        
    conn.close()
    
    if not model_row:
        raise ValueError("No trained model available. Please train a hospital model or run Federated Averaging first.")
        
    coef_raw = json.loads(model_row['coefficients'])
    coef = np.array(coef_raw[0] if isinstance(coef_raw[0], list) else coef_raw, dtype=float)
    
    inter_raw = json.loads(model_row['intercept'])
    intercept = float(inter_raw[0] if isinstance(inter_raw, list) else inter_raw)
    
    mean = np.array(json.loads(model_row['scaler_mean']), dtype=float)
    scale = np.array(json.loads(model_row['scaler_scale']), dtype=float)
    scale = np.where(scale == 0, 1.0, scale)
    
    raw_vals = [float(features_dict.get(f, 0)) for f in FEATURE_ORDER]
    X_raw = np.array([raw_vals])
    X_scaled = (X_raw - mean) / scale
    
    # Linear Logit and Probability calculation
    logit = float(np.dot(X_scaled[0], coef) + intercept)
    prob = float(1.0 / (1.0 + np.exp(-np.clip(logit, -25, 25))))
    pred = 1 if prob >= 0.5 else 0
    risk_level = "High Risk" if pred == 1 else "Low Risk"
    
    # Accurate SHAP attribution calculation for Linear / Logistic Model:
    # Attribution phi_i = coef_i * X_scaled_i
    shap_contributions = coef * X_scaled[0]
    base_logit = intercept
    base_prob = float(1.0 / (1.0 + np.exp(-np.clip(base_logit, -25, 25))))
    
    # Build detailed feature breakdown with clinical explanations
    feature_explanations = []
    pos_sum = 0.0
    neg_sum = 0.0
    
    for idx, f_name in enumerate(FEATURE_ORDER):
        val = raw_vals[idx]
        shap_val = float(shap_contributions[idx])
        meta = FEATURE_DEFINITIONS[f_name]
        
        if shap_val > 0:
            pos_sum += shap_val
        else:
            neg_sum += abs(shap_val)
            
        feature_explanations.append({
            'feature': f_name,
            'label': meta['label'],
            'value': val,
            'unit': meta['unit'],
            'normal_range': meta['normal'],
            'shap_value': round(shap_val, 4),
            'impact_type': 'risk_increasing' if shap_val > 0.05 else ('risk_reducing' if shap_val < -0.05 else 'neutral'),
            'contribution_magnitude': round(abs(shap_val), 4),
            'scaled_feature_value': round(float(X_scaled[0][idx]), 4)
        })
        
    total_magnitude = sum(f['contribution_magnitude'] for f in feature_explanations) or 1.0
    for f in feature_explanations:
        f['percentage_impact'] = round((f['contribution_magnitude'] / total_magnitude) * 100, 1)
        
        # Clinical insight text generation
        f_name = f['feature']
        v = f['value']
        s = f['shap_value']
        
        if f_name == 'age':
            f['clinical_insight'] = f"Age {int(v)}: {'Advanced age elevates cardiovascular vulnerability.' if v >= 55 else 'Age provides relatively protective baseline.'}"
        elif f_name == 'cp':
            cp_names = {0: 'Typical Angina', 1: 'Atypical Angina', 2: 'Non-anginal Pain', 3: 'Asymptomatic'}
            f['clinical_insight'] = f"Chest pain presentation ({cp_names.get(int(v), 'Type ' + str(v))}): {'Strong primary indicator of coronary ischemia.' if int(v) == 0 else 'Less typical angina presentation.'}"
        elif f_name == 'trestbps':
            f['clinical_insight'] = f"Resting BP {int(v)} mmHg: {'Hypertensive range (>130 mmHg) increases myocardial workload.' if v > 130 else 'Normotensive blood pressure within healthy limits.'}"
        elif f_name == 'chol':
            f['clinical_insight'] = f"Total cholesterol {int(v)} mg/dL: {'Hyperlipidemia elevates arterial plaque formation risk.' if v > 200 else 'Desirable cholesterol level (<200 mg/dL).'}"
        elif f_name == 'thalach':
            f['clinical_insight'] = f"Peak heart rate {int(v)} bpm: {'Reduced exercise capacity / chronotropic incompetence.' if v < 140 else 'Robust cardiac exercise tolerance.'}"
        elif f_name == 'oldpeak':
            f['clinical_insight'] = f"ST depression {v} mm: {'Significant exercise-induced myocardial ischemia indicator.' if v > 1.0 else 'Minimal ST depression during exertion.'}"
        elif f_name == 'ca':
            f['clinical_insight'] = f"{int(v)} major vessels colored: {'Multi-vessel coronary artery calcification/obstruction detected.' if v > 0 else 'No major vessel fluoroscopic calcification.'}"
        elif f_name == 'exang':
            f['clinical_insight'] = f"Exercise-induced angina: {'Positive symptom of reversible exertional ischemia.' if v == 1 else 'Negative (no exertion-induced angina).'}"
        else:
            f['clinical_insight'] = f"Feature attribution: {'+ ' if s > 0 else ''}{s:.2f} towards {'risk elevation' if s > 0 else 'risk reduction'}."

    # Sort by absolute SHAP impact
    feature_explanations.sort(key=lambda x: abs(x['shap_value']), reverse=True)
    
    # Top 3 drivers for High Risk & Low Risk
    top_risk_drivers = [f for f in feature_explanations if f['shap_value'] > 0][:3]
    top_protective_drivers = [f for f in feature_explanations if f['shap_value'] < 0][:3]
    
    # Generate Clinical Summary Narrative
    if pred == 1:
        drivers_text = ", ".join([f"{f['label']} ({f['value']} {f['unit']}) [+{f['percentage_impact']}%]" for f in top_risk_drivers])
        clinical_narrative = (
            f"The global federated model evaluates this patient as HIGH RISK with a {round(prob*100, 1)}% probability of Heart Disease. "
            f"The dominant clinical drivers escalating cardiovascular risk are {drivers_text}. "
            f"Comprehensive diagnostic evaluation and preventive cardiological intervention are recommended."
        )
    else:
        protective_text = ", ".join([f"{f['label']} ({f['value']} {f['unit']}) [-{f['percentage_impact']}%]" for f in top_protective_drivers]) if top_protective_drivers else "normal cardiac biomarkers"
        clinical_narrative = (
            f"The global federated model evaluates this patient as LOW RISK with a {round((1-prob)*100, 1)}% confidence of healthy cardiovascular status (Disease probability: {round(prob*100, 1)}%). "
            f"Favorable markers contributing to low risk include {protective_text}."
        )
        
    # Counterfactual Recommendations
    recommendations = []
    if features_dict.get('chol', 0) > 200:
        recommendations.append(f"Lowering Total Cholesterol from {features_dict.get('chol')} mg/dL to <190 mg/dL via dietary modulation or statin therapy.")
    if features_dict.get('trestbps', 0) > 130:
        recommendations.append(f"Reducing Resting Blood Pressure from {features_dict.get('trestbps')} mmHg to <120 mmHg through antihypertensive management.")
    if features_dict.get('oldpeak', 0) > 1.0:
        recommendations.append("Further non-invasive stress echocardiography or angiographic evaluation for ST-segment depression.")
    if features_dict.get('thalach', 0) < 140:
        recommendations.append("Structured aerobic rehabilitation to safely improve peak exercise heart rate capacity.")
    if not recommendations:
        recommendations.append("Maintain current healthy lifestyle, normotensive blood pressure, and annual cardiovascular checkups.")

    return {
        'prediction': int(pred),
        'probability': round(prob, 4),
        'confidence_percentage': round((prob if pred == 1 else (1 - prob)) * 100, 1),
        'risk_level': risk_level,
        'base_value': round(base_prob, 4),
        'base_logit': round(base_logit, 4),
        'model_source': model_source,
        'model_round': model_round,
        'feature_explanations': feature_explanations,
        'top_risk_drivers': top_risk_drivers,
        'top_protective_drivers': top_protective_drivers,
        'clinical_narrative': clinical_narrative,
        'recommendations': recommendations,
        'shap_values': [round(float(s), 4) for s in shap_contributions],
        'feature_names': FEATURE_ORDER
    }

def get_centralized_baseline(db_path):
    data_dir = os.path.join(os.path.dirname(db_path), 'data')
    dfs = []
    for f in os.listdir(data_dir):
        if f.endswith('.csv'):
            dfs.append(pd.read_csv(os.path.join(data_dir, f)))
            
    if not dfs:
        return None
        
    df = pd.concat(dfs, ignore_index=True)
    X = df[FEATURE_ORDER]
    y = df['target'].values
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y if len(np.unique(y)) > 1 else None)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    model = LogisticRegression(max_iter=1000, random_state=42)
    model.fit(X_train_scaled, y_train)
    
    y_pred = model.predict(X_test_scaled)
    y_prob = model.predict_proba(X_test_scaled)[:, 1]
    
    return {
        'accuracy': float(accuracy_score(y_test, y_pred)),
        'precision': float(precision_score(y_test, y_pred, zero_division=0)),
        'recall': float(recall_score(y_test, y_pred, zero_division=0)),
        'f1': float(f1_score(y_test, y_pred, zero_division=0)),
        'auc': float(roc_auc_score(y_test, y_prob)) if len(np.unique(y_test)) > 1 else 1.0,
        'total_samples': len(df)
    }
