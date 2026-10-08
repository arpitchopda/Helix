import os
import numpy as np
import pandas as pd

def generate_hospital_data(n_samples, filename, seed_offset=0):
    np.random.seed(42 + abs(seed_offset) % 10000)
    
    # Realistic distributions based on UCI Heart Disease dataset
    age = np.clip(np.random.normal(55, 9, n_samples), 29, 77).astype(int)
    sex = np.random.choice([0, 1], n_samples, p=[0.35, 0.65])
    cp = np.random.choice([0, 1, 2, 3], n_samples, p=[0.45, 0.20, 0.25, 0.10])
    trestbps = np.clip(np.random.normal(131, 17, n_samples), 94, 200).astype(int)
    chol = np.clip(np.random.normal(246, 48, n_samples), 126, 564).astype(int)
    fbs = np.random.choice([0, 1], n_samples, p=[0.85, 0.15])
    restecg = np.random.choice([0, 1, 2], n_samples, p=[0.49, 0.50, 0.01])
    thalach = np.clip(np.random.normal(149, 23, n_samples), 71, 202).astype(int)
    exang = np.random.choice([0, 1], n_samples, p=[0.67, 0.33])
    oldpeak = np.clip(np.random.exponential(1.0, n_samples), 0, 6.2)
    slope = np.random.choice([0, 1, 2], n_samples, p=[0.07, 0.46, 0.47])
    ca = np.random.choice([0, 1, 2, 3], n_samples, p=[0.58, 0.21, 0.13, 0.08])
    thal = np.random.choice([0, 1, 2], n_samples, p=[0.01, 0.55, 0.44])
    
    # Balanced logit for balanced positive & negative targets
    risk_score = (
        (age - 55) * 0.04 +
        ((sex - 0.5) * 0.8) +
        ((cp - 1.5) * -0.6) +
        ((trestbps - 130) * 0.02) +
        ((chol - 240) * 0.01) +
        (fbs * 0.3) +
        ((150 - thalach) * 0.03) +
        (exang * 0.8) +
        ((oldpeak - 1.0) * 0.7) +
        (ca * 0.6) +
        ((thal - 1) * 0.5)
    )
    
    prob = 1 / (1 + np.exp(-risk_score))
    target = (np.random.rand(n_samples) < prob).astype(int)
    
    # Ensure both classes exist
    if target.sum() <= 5:
        target[:10] = 1
    elif target.sum() >= n_samples - 5:
        target[:10] = 0
        
    df = pd.DataFrame({
        'age': age, 'sex': sex, 'cp': cp, 'trestbps': trestbps, 'chol': chol,
        'fbs': fbs, 'restecg': restecg, 'thalach': thalach, 'exang': exang,
        'oldpeak': np.round(oldpeak, 1), 'slope': slope, 'ca': ca, 'thal': thal,
        'target': target
    })
    
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    df.to_csv(filename, index=False)
    print(f"Generated {n_samples} records in {filename} (Class 1: {target.sum()}, Class 0: {len(target)-target.sum()})")

if __name__ == "__main__":
    data_dir = os.path.join(os.path.dirname(__file__), 'data')
    os.makedirs(data_dir, exist_ok=True)
    
    generate_hospital_data(300, os.path.join(data_dir, 'hospital_a.csv'), seed_offset=0)
    generate_hospital_data(250, os.path.join(data_dir, 'hospital_b.csv'), seed_offset=1)
    generate_hospital_data(200, os.path.join(data_dir, 'hospital_c.csv'), seed_offset=2)
    print("Baseline datasets generated.")
