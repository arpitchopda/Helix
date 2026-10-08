# 🩺 Healix (Helix) - Decentralized Federated Healthcare AI Platform

[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Flask](https://img.shields.io/badge/Backend-Flask%20REST%20API-000000?logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Scikit-Learn](https://img.shields.io/badge/ML-Scikit--Learn-F7931E?logo=scikitlearn&logoColor=white)](https://scikit-learn.org/)
[![Federated Learning](https://img.shields.io/badge/FL%20Protocol-McMahan%20FedAvg-06B6D4)]()
[![Explainable AI](https://img.shields.io/badge/XAI-Exact%20SHAP-10B981)]()
[![Privacy](https://img.shields.io/badge/Privacy-HIPAA%20%2F%20GDPR%20Compliant-6366F1)]()

> **Healix** is a decentralized, privacy-preserving machine learning platform for multi-hospital healthcare networks. It enables hospitals to collaboratively train clinical predictive models for cardiovascular disease risk without ever sharing or exposing private patient electronic health records (EHR).

---

## 👥 Contributors & Collaborators

- **Arpit Chopda** - [@arpitchopda](https://github.com/arpitchopda)
- **Anvayee Gondhali** - [@anvayeegondhalii](https://github.com/anvayeegondhalii)
- **Mansi Gupta** - [@mansinavingupta](https://github.com/mansinavingupta)

---

## 🏗️ Architecture & Federated Learning Flow

```
┌─────────────────────────┐         Local Parameter Gradients (θ_A)
│     Hospital A Silo     │ ───────────────────────────────────────────┐
│   (300 Patient EHRs)    │                                            │
└─────────────────────────┘                                            │
                                                                       ▼
┌─────────────────────────┐         Local Parameter Gradients (θ_B)  ┌─────────────────────────┐
│     Hospital B Silo     │ ────────────────────────────────────────►│   Central Coordinator   │
│   (250 Patient EHRs)    │                                          │  (Federated Averaging)  │
└─────────────────────────┘                                          │  θ_global = Σ(w_k · θ_k)│
                                                                       └───────────┬─────────────┘
┌─────────────────────────┐         Local Parameter Gradients (θ_C)                │
│     Hospital C Silo     │ ───────────────────────────────────────────┘               │
│   (200 Patient EHRs)    │                                                            │
└─────────────────────────┘                                                            │
                                                                                       ▼
                                                    Encrypted Parameter Broadcast ◄────┘
                                                    (θ_global distributed downstream)
```

### The 5-Stage Closed-Loop Lifecycle:
1. **Local Data Isolation**: Each hospital maintains private EHR datasets in its secure, isolated boundary.
2. **Local Silo Training**: The hospital trains a local model on its EHR data and inspects live epoch loss/accuracy telemetry.
3. **Parameter Submission**: The hospital sends only mathematical coefficients and intercept $(\theta_k)$ to the coordinator.
4. **Federated Averaging (FedAvg)**: The coordinator fuses parameters weighted by sample volume:
   $$\theta_{\text{global}} = \sum_{k=1}^K \frac{n_k}{N} \theta_k$$
5. **Global Model Broadcast & Sync**: The coordinator broadcasts $\theta_{\text{global}}$ downstream; hospitals download it into their local inference engines, observing immediate diagnostic accuracy gains ($\Delta \text{Gain}$) and warm-starting subsequent rounds.

---

## ✨ Key Features

### 🏥 1. Dynamic Hospital Management & Onboarding (Admin)
- Multi-hospital registration with custom IDs, names, credentials, and geographic locations.
- Automated synthesis of realistic clinical cohorts (UCI Heart Disease standard) with customizable dataset sizes (100–600 records).
- Real-time client monitoring and lifecycle management.

### ⚡ 2. Local Training Studio (Hospital Silo)
- **Live Epoch Telemetry**: Interactive curves displaying **Train Loss vs. Validation Loss** and **Train Accuracy vs. Validation Accuracy** per epoch.
- **Hyperparameter Controls**: Configurable Epochs (5–50), Learning Rate ($\eta$), Batch Size (16/32/64), and Warm-Start initialization from global weights.
- **Confusion Matrix & Feature Weights**: Visual breakdown of TP, FP, TN, FN and ranking of risk-escalating vs. protective features.

### 🔄 3. Global Model Synchronization Hub
- Step-by-step weight ingestion pipeline (Download $\theta_{global}$ $\to$ Normalization $\to$ Local Cohort Evaluation $\to$ Ingestion Complete).
- Side-by-side comparison of Central Global Model benchmarks against local cohort performance.
- Accuracy delta ($\Delta \text{Accuracy}$) tracking and warm-start transfer learning.

### 🔮 4. Explainable AI (XAI) & SHAP Studio
- **Exact Mathematical SHAP Attributions**: $\phi_i = \beta_i \cdot x_i^*$ computed on normalized patient biomarkers.
- **Diverging SHAP Bar Chart**: Red/Rose bars indicate risk-increasing factors; Green/Emerald bars indicate protective factors.
- **Plain-English Clinical Narrative**: Diagnostic summary explaining key clinical drivers.
- **Counterfactual Lifestyle Simulator**: Actionable recommendations demonstrating how modifying clinical biomarkers lowers cardiovascular risk.

---

## 🚀 Quick Start & Installation

### Prerequisites
- **Python 3.8+**
- **Node.js 18+ & npm**

### Option A: 1-Click Launch (Windows)
Double-click `start.bat` or run:
```cmd
run_healix.bat
```

### Option B: Manual Setup

#### 1. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
python app.py
```
*Backend runs on `http://localhost:5000`*

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 🔑 Demo Accounts & Credentials

| Role | Username | Password | Details |
| :--- | :--- | :--- | :--- |
| **Central Admin** | `admin` | `admin123` | Central Coordinator (FedAvg Studio) |
| **Hospital A** | `hospital_a` | `hospA123` | Metro Heart Institute (300 EHR Records) |
| **Hospital B** | `hospital_b` | `hospB123` | Pacific Cardio Center (250 EHR Records) |
| **Hospital C** | `hospital_c` | `hospC123` | Midwest Health System (200 EHR Records) |

*(1-Click fast login buttons are built directly into the web login page.)*

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, TailwindCSS, Lucide Icons, Recharts
- **Backend**: Python 3, Flask, SQLite3, PyJWT, Werkzeug
- **Machine Learning**: Scikit-Learn (Logistic Regression, StandardScaler, Metrics), NumPy, Pandas
- **Explainability**: SHAP (Shapley Additive Explanations)
- **Federated Learning**: McMahan Federated Averaging (FedAvg)

---

## 📄 License
This project is licensed under the MIT License.
