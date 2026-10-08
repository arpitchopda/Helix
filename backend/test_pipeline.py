import requests

BASE = 'http://localhost:5000/api'

# Train all 3 hospitals and submit updates
for hosp, pw in [('hospital_a','hospA123'),('hospital_b','hospB123'),('hospital_c','hospC123')]:
    r = requests.post(f'{BASE}/auth/login', json={'username':hosp,'password':pw})
    token = r.json()['token']
    h = {'Authorization': f'Bearer {token}'}
    
    r = requests.post(f'{BASE}/hospital/train', headers=h)
    acc = round(r.json()['accuracy']*100,1)
    print(f'{hosp}: trained, accuracy={acc}%')
    
    r = requests.post(f'{BASE}/hospital/submit-update', headers=h)
    rnd = r.json()['round']
    print(f'{hosp}: submitted round {rnd}')

# Admin: aggregate
r = requests.post(f'{BASE}/auth/login', json={'username':'admin','password':'admin123'})
h_admin = {'Authorization': f'Bearer {r.json()["token"]}'}

r = requests.post(f'{BASE}/admin/aggregate', headers=h_admin)
d = r.json()
print(f'AGGREGATE: round={d["round"]}, accuracy={round(d["accuracy"]*100,1)}%, hospitals={d["hospitals_included"]}')

# Performance
r = requests.get(f'{BASE}/admin/performance', headers=h_admin)
d = r.json()
print(f'PERFORMANCE: has_model={d["has_model"]}, rounds={len(d["rounds"])}')
print(f'  Global: acc={round(d["global_metrics"]["accuracy"]*100,1)}%')
print(f'  Baseline: acc={round(d["centralized_baseline"]["accuracy"]*100,1)}%')

# Prediction
r = requests.post(f'{BASE}/predict', headers=h_admin, json={
    'age':55,'sex':1,'cp':0,'trestbps':140,'chol':250,'fbs':0,
    'restecg':0,'thalach':150,'exang':0,'oldpeak':1.5,'slope':1,'ca':0,'thal':1
})
d = r.json()
print(f'PREDICT: risk={d["risk_level"]}, prob={round(d["probability"]*100,1)}%, shap_count={len(d["shap_values"])}')

print('FULL PIPELINE TEST PASSED!')
