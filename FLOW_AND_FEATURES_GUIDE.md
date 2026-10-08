# Healix - Decentralized Federated Healthcare AI Platform
## Comprehensive Architecture, Features & Demonstration Flow Guide

---

## 1. Executive Summary

**Healix** is a decentralized, privacy-preserving machine learning platform designed for hospitals and healthcare networks. It solves the critical medical data silo dilemma: **hospitals cannot legally or ethically pool patient electronic health records (EHR)** due to HIPAA, GDPR, and data governance restrictions, yet machine learning models require large, diverse datasets to generalize accurately.

Through **Federated Learning (FedAvg)**, Healix allows multiple hospital silos to train collaborative AI models for cardiovascular disease risk prediction **without ever moving or exposing raw patient data**. Only encrypted model parameters ($\theta_k$) are shared with the Central Coordinator.

---

## 2. End-to-End Federated Learning Architecture

```
[ Hospital A Silo ]  ─── Local Gradients θ_A ───┐
(300 Patient EHRs)                               │
                                                 ▼
[ Hospital B Silo ]  ─── Local Gradients θ_B ───► [ Central Coordinator ] ───► Global Model θ_global
(250 Patient EHRs)                               ▲  (Federated Averaging)     (Broadcast to Silos)
                                                 │
[ Hospital C Silo ]  ─── Local Gradients θ_C ───┘
(200 Patient EHRs)
```

### The 5-Step Closed-Loop Lifecycle:
1. **Local Data Ingestion**: Each hospital maintains private EHR datasets in its secure boundary.
2. **Local Silo Training**: The hospital trains a local model on its EHR data and inspects epoch loss/accuracy telemetry.
3. **Parameter Submission**: The hospital sends only mathematical coefficients and intercept $(\theta_k)$ to the coordinator.
4. **Federated Averaging (FedAvg)**: The coordinator fuses parameters weighted by sample volume:
   $$\theta_{\text{global}} = \sum_{k=1}^K \frac{n_k}{N} \theta_k$$
5. **Global Model Broadcast & Sync**: The coordinator distributes $\theta_{\text{global}}$ downstream; hospitals download it into their local models, observing immediate diagnostic accuracy gains ($\Delta \text{Gain}$) and warm-starting subsequent rounds.

---

## 3. Detailed Features Implemented

### 🏥 Feature 1: Dynamic Hospital Management & Onboarding (Admin)
- **Multi-Hospital Creation**: Admin can register any number of new hospital silos with custom IDs, names, credentials, and geographic locations.
- **Automated Clinical Cohort Synthesis**: Realistic patient datasets (UCI Heart Disease standard) are automatically generated upon hospital registration with customizable cohort sizes (100–600 records).
- **Client Lifecycle Management**: Admin can monitor connected silos, inspect dataset sizes, review training statuses, and decommission silos on demand.

### ⚡ Feature 2: Detailed Training Studio (Hospital & Admin)
- **Live Epoch-by-Epoch Progress Curves**: Interactive Recharts telemetry displaying **Train Loss vs. Validation Loss** and **Train Accuracy vs. Validation Accuracy** per epoch.
- **Hyperparameter Tuning Controls**: Custom controls for **Epochs (5–50)**, **Learning Rate ($\eta$)**, **Batch Size (16/32/64)**, and **Warm-Start from Global Model**.
- **Diagnostic Confusion Matrix**: Breakdown of True Positives, False Positives, True Negatives, and False Negatives.
- **Learned Feature Weights**: Visual bar chart ranking local risk-escalating factors vs. protective factors.
- **Silo Terminal Logs Console**: Step-by-step real-time execution logs.
- **Central Coordinator FedAvg Studio**: Step-by-step aggregation breakdown with hospital contribution weight distribution and per-feature cross-silo variance.

### 🔮 Feature 3: Transparent SHAP & Clinical Explainability (XAI)
- **Exact Mathematical SHAP Attributions**: $\phi_i = \beta_i \cdot x_i^*$ computed on normalized patient biomarkers.
- **Diverging SHAP Bar Chart**:
  - **Red / Rose Bars (+)**: Clinical biomarkers increasing heart disease risk (e.g., typical angina, elevated cholesterol, exercise ST depression).
  - **Green / Emerald Bars (-)**: Protective biomarkers lowering risk (e.g., high peak heart rate, young age, normal resting ECG).
- **Comprehensive Feature Impact Table**: Compares patient values against standard clinical reference ranges with individual percentage impact calculations.
- **Dynamic AI Clinical Summary**: Plain-English narrative explaining the primary clinical factors driving the diagnostic outcome.
- **Counterfactual Lifestyle Simulator**: Actionable recommendations demonstrating how modifying blood pressure or cholesterol reduces cardiovascular risk.

### 🔄 Feature 4: Downstream Global Model Distribution & Local Synchronization
- **Central Broadcast Protocol**: Admin broadcasts the latest global model round to all participating hospital clients.
- **Hospital Sync Hub**: Hospital clients can view global model release notes, download the latest global weights, and evaluate them on local patient cohorts.
- **Performance Delta ($\Delta \text{Accuracy}$)**: Displays local accuracy improvement after ingesting global intelligence.
- **Warm-Start Transfer Learning**: Local training sessions automatically initialize with latest global weights for faster convergence.

---

## 4. Default Demo Accounts

| Role | Username | Password | Notes |
| :--- | :--- | :--- | :--- |
| **Central Admin** | `admin` | `admin123` | Central Coordinator (FedAvg Aggregator) |
| **Hospital A** | `hospital_a` | `hospA123` | Metro Heart Institute (300 EHR Records) |
| **Hospital B** | `hospital_b` | `hospB123` | Pacific Cardio Center (250 EHR Records) |
| **Hospital C** | `hospital_c` | `hospC123` | Midwest Health System (200 EHR Records) |

*1-Click quick login buttons are available on the login page for seamless demonstration.*

---

## 5. Step-by-Step Suggested Demonstration Flow

### Step 1: Hospital A Training & Update Submission
1. Navigate to **http://localhost:5173/login** and click **Hospital A** (or login with `hospital_a` / `hospA123`).
2. Go to **Clinical Dataset** to inspect the 300 patient EHR records.
3. Go to **Local Model Training**, adjust epochs if desired, and click **Execute Local Training Run**.
4. Observe the live epoch loss curve, accuracy progression, and confusion matrix.
5. Click **Submit Update to Coordinator**.
6. Logout.

### Step 2: Hospital B and Hospital C Participation
1. Login as **Hospital B** (`hospital_b` / `hospB123`).
2. Go to **Local Model Training**, click **Execute Local Training Run**, then click **Submit Update to Coordinator**. Logout.
3. Login as **Hospital C** (`hospital_c` / `hospC123`), train, and submit update. Logout.

### Step 3: Admin Dynamic Hospital Onboarding & Federated Averaging
1. Login as **Admin** (`admin` / `admin123`).
2. Go to **Manage Hospitals** $\to$ click **Register New Hospital**. Enter name (e.g. `Hospital D - Apollo Care`) and click **Create & Onboard Hospital**.
3. Go to **Federated Averaging** $\to$ click **Execute Federated Averaging**.
4. Review the hospital contribution weights ($w_k$) and feature parameter fusion table.
5. Click **Distribute to Hospitals** to broadcast the global model downstream.
6. Check **Performance & Baseline** to see the multi-round trajectory against the centralized benchmark.

### Step 4: Hospital Global Model Synchronization
1. Login as **Hospital A** (or any hospital).
2. Note the banner: **"New Global Model Available for Broadcast"**.
3. Go to **Global Model Sync** $\to$ click **Synchronize Latest Global Weights**.
4. Verify that local accuracy is updated with global weights and positive accuracy delta is achieved.

### Step 5: Clinical Prediction & Deep SHAP Explainability
1. Go to **Prediction & SHAP** (available on both Hospital and Admin navigation).
2. Click **Typical High Risk Profile** preset $\to$ click **Run AI Diagnostic & Explain (SHAP)**.
3. View the **High Risk** diagnosis and the **Diverging SHAP Feature Impact Chart** highlighting top risk drivers (Chest Pain Type, ST Depression, Cholesterol).
4. Review the **Clinical AI Synthesis Narrative** and the **Cardiologist Action Plan & Counterfactuals**.
5. Click **Healthy / Low Risk Profile** preset and observe how protective factors drive risk probability down.
