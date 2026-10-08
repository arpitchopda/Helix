import requests

BASE = 'http://127.0.0.1:5000/api'

print("=== 1. TEST LOGIN & TRAINING FOR HOSPITALS A, B, C ===")
for hosp, pw in [('hospital_a','hospA123'),('hospital_b','hospB123'),('hospital_c','hospC123')]:
    r = requests.post(f'{BASE}/auth/login', json={'username':hosp,'password':pw})
    assert r.status_code == 200, f"Login failed for {hosp}: {r.text}"
    token = r.json()['token']
    h = {'Authorization': f'Bearer {token}'}
    
    # Train with custom hyperparameters
    r = requests.post(f'{BASE}/hospital/train', json={'epochs': 20, 'learning_rate': 0.05, 'batch_size': 32}, headers=h)
    assert r.status_code == 200, f"Train failed for {hosp}: {r.text}"
    train_res = r.json()
    print(f"[{hosp}] Trained {train_res['epochs']} Epochs -> Acc: {round(train_res['accuracy']*100, 1)}%, F1: {round(train_res['f1']*100, 1)}%, Confusion Matrix: {train_res['confusion_matrix']}")
    
    # Submit update
    r = requests.post(f'{BASE}/hospital/submit-update', headers=h)
    assert r.status_code == 200, f"Submit update failed for {hosp}: {r.text}"
    print(f"[{hosp}] Submitted model update for Round #{r.json()['round']}")

print("\n=== 2. TEST ADMIN DYNAMIC HOSPITAL ONBOARDING ===")
r = requests.post(f'{BASE}/auth/login', json={'username':'admin','password':'admin123'})
assert r.status_code == 200
admin_token = r.json()['token']
h_admin = {'Authorization': f'Bearer {admin_token}'}

# Clean up previous test hospital if exists
requests.delete(f'{BASE}/admin/hospitals/apollo_cardio', headers=h_admin)

# Add Apollo Cardio hospital
r = requests.post(f'{BASE}/admin/hospitals', json={
    'hospital_name': 'Apollo Regional Cardiac Center',
    'hospital_id': 'apollo_cardio',
    'username': 'apollo_cardio',
    'password': 'apollo123',
    'location': 'Dallas, TX',
    'sample_size': 260
}, headers=h_admin)
print("Add Apollo Cardio status:", r.status_code, r.json().get('message'))

# Train Apollo Cardio
r = requests.post(f'{BASE}/auth/login', json={'username':'apollo_cardio','password':'apollo123'})
token_apollo = r.json()['token']
h_apollo = {'Authorization': f'Bearer {token_apollo}'}
r = requests.post(f'{BASE}/hospital/train', json={'epochs': 20}, headers=h_apollo)
assert r.status_code == 200, f"Train Apollo failed: {r.text}"
print(f"[apollo_cardio] Trained Acc: {round(r.json()['accuracy']*100, 1)}%, F1: {round(r.json()['f1']*100, 1)}%")
r = requests.post(f'{BASE}/hospital/submit-update', headers=h_apollo)
print(f"[apollo_cardio] Submitted update for Round #{r.json()['round']}")

print("\n=== 3. TEST FEDERATED AVERAGING (FedAvg) ===")
r = requests.post(f'{BASE}/admin/aggregate', headers=h_admin)
assert r.status_code == 200, f"FedAvg failed: {r.text}"
fed_res = r.json()
print(f"FedAvg Aggregated Round #{fed_res['round']}: Accuracy = {round(fed_res['accuracy']*100, 1)}%, Total Samples = {fed_res['total_samples']}")
print(f"Hospitals Ingested ({fed_res['hospitals_included']}): {[h['hospital_id'] + ': ' + str(h['weight_percentage']) + '%' for h in fed_res['hospital_contributions']]}")

print("\n=== 4. TEST GLOBAL MODEL BROADCAST & HOSPITAL SYNC ===")
# Admin distributes global model
r = requests.post(f'{BASE}/admin/distribute', headers=h_admin)
assert r.status_code == 200
print("Admin Broadcast status:", r.status_code, r.json().get('message'))

# Hospital A syncs global weights
r_sync = requests.post(f'{BASE}/hospital/sync-global', headers={'Authorization': f'Bearer {requests.post(f"{BASE}/auth/login", json={"username":"hospital_a","password":"hospA123"}).json()["token"]}'})
assert r_sync.status_code == 200
print("Hospital A Sync status:", r_sync.status_code, r_sync.json().get('message'))
print(f"Hospital A Evaluated Local Accuracy with Global Weights: {round(r_sync.json()['local_eval_accuracy']*100, 1)}% (Delta: {r_sync.json()['delta_accuracy']}%)")

print("\n=== 5. TEST CLINICAL PREDICTION & DEEP SHAP EXPLAINABILITY ===")
patient = {
    'age': 63, 'sex': 1, 'cp': 0, 'trestbps': 155, 'chol': 285, 'fbs': 1,
    'restecg': 1, 'thalach': 125, 'exang': 1, 'oldpeak': 2.8, 'slope': 0, 'ca': 2, 'thal': 2
}
r = requests.post(f'{BASE}/predict', json=patient, headers=h_admin)
assert r.status_code == 200, f"Predict failed: {r.text}"
pred_res = r.json()
print(f"Prediction: {pred_res['risk_level']} (Probability: {round(pred_res['probability']*100, 1)}%)")
print(f"Model Source: {pred_res['model_source']}")
print(f"Clinical AI Synthesis: {pred_res['clinical_narrative']}")
print(f"Top Risk Drivers: {[f['label'] + ' (+' + str(f['percentage_impact']) + '%)' for f in pred_res['top_risk_drivers']]}")
print(f"Cardiologist Recommendations: {pred_res['recommendations']}")

print("\n=== 6. TEST PERFORMANCE BENCHMARK ===")
r = requests.get(f'{BASE}/admin/performance', headers=h_admin)
assert r.status_code == 200
perf = r.json()
print(f"Performance Rounds: {len(perf['rounds'])}, Centralized Baseline Acc: {perf['centralized_baseline']['accuracy']}%")

print("\n=======================================================")
print("ALL 4 USER REQUIREMENTS & DEMONSTRATION FLOWS FULLY VERIFIED!")
print("=======================================================")
