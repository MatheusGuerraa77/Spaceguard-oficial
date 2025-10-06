# 🌍 SpaceGuard — Defend Tomorrow, Understand Today

## ✨ Storytelling Pitch

On a quiet morning, astronomers flag a new Near-Earth Object: **“Impactor-2025.”**  
It’s not panic — yet. But mayors, emergency managers, teachers, and curious citizens all ask the same question:  

> “If this hits, what happens here?”

**SpaceGuard** turns raw data into clear insight.  
It blends **NASA’s NEO parameters** (size, speed, orbit) with **USGS environmental layers** (elevation, seismic catalogs, coastline risk) to:

- Simulate meteor impacts  
- Visualize consequences  
- Test mitigation strategies  

With an **accessible UI**, **dynamic 3D scenes**, and **intuitive maps**, SpaceGuard bridges the gap between **rigorous science** and **public understanding**.  
It’s not just a demo; it’s a **decision-support & education tool** that helps the world prepare — *before the sky falls*.

---

## 🧭 What the App Does

### 🚀 3D Home (Hero)
- Orbiting Earth with a subtle asteroid field built using **Three.js** / `@react-three/fiber`.

### 🌎 Scenario (Impact Simulator)
- Input: diameter, density, velocity, angle, and location (map click).
- Output:  
  - **Impact energy** (Joules / Mt TNT)  
  - **Crater size**  
  - **Seismic magnitude (Mw)**  
  - **Impact zones** on a Leaflet map  
- Resilient: works with demo data if APIs are unavailable.

### 🛡️ Mitigation (Deflection ∆v)
- Apply a small ∆v days in advance.
- Visualize the **shifted impact point** — original vs. mitigated.

### ☄️ Asteroids (Design-Only UI)
- Browse & search asteroids without needing live API.
- Ready to integrate with NASA NeoWs in the future.

### ℹ️ About
- Context, assumptions, credits, and roadmap.

---

## 🧪 Science (Simplified but Faithful)

- **Kinetic Energy:** calculated from mass (diameter + density) & velocity. Reported in Joules and Mt TNT.  
- **Crater Scaling:** uses empirical educational models.  
- **Seismic Magnitude (Mw):** impact–earthquake analogy.  
- **Environmental Effects:** blast/thermal/wave zones via GeoJSON. Future: integrate **USGS datasets** for higher realism.

> ⚖️ *Note: Models are simplified for education & rapid decision support. The architecture can ingest richer physics & data layers.*

---

## 🧩 Tech Stack

### Frontend
- React + TypeScript + Vite
- Tailwind CSS + [shadcn/ui](https://ui.shadcn.com/)
- Three.js + `@react-three/fiber` (Earth & asteroid field)
- Leaflet (maps & impact zones)
- Framer Motion (micro-interactions, hero transitions)
- D3.js (HUD/radar & counters)
- AbortController + debounce (responsive search UX)

### Backend
- Node.js + Express (`POST /simulate` — mock-friendly, API-ready)

### Data Integrations
- **NASA NeoWs** (asteroid data — when keys/quotas allow)  
- **USGS** (elevation & seismic catalogs — enrich impact/environment modeling)

---

## 🗺️ App Pages — Deep Dive

### 🏠 Home
- Narrative hero (“Return to SpaceGuard”)
- Orbiting Earth animation
- Asteroid background
- CTA to **Scenario** & **Mitigation**
- Info card explaining *Impactor-2025*

### 🌍 Scenario
- **Form:** diameter (m), density (kg/m³), velocity (m/s), angle (°), lat/lon (typed or map click), terrain (ocean/land).  
- **Map:** impact zones (GeoJSON) + selected point.  
- **Results:** energy (J, Mt), crater (km), Mw estimate, notes.  
- **Fallback:** demo data if APIs fail.

### 🛡️ Mitigation
- Controls for ∆v & lead time (days).
- Map compares **original vs. mitigated points** (red vs. green) with dashed displacement line + summary.

### ☄️ Asteroids
- API-optional exploration UI.  
- Integrates **NASA NeoWs** when key provided (`VITE_NASA_KEY`).

### ℹ️ About
- Challenge context, limitations, credits, and roadmap.

---

## 🚀 How to Run (Local)

### Requirements
- **Node 18+** and **npm**  
- Install dependencies when prompted

### 1️⃣ Backend (server)

cd server
npm install
npm run dev


2️⃣ Frontend (repo root)

npm install
npm run dev
Open the URL shown (commonly http://localhost:5173).

Optional: Environment Variables
Create a .env file in the repo root:

## 🗺️ Architecture Notes

- Clear separation: **frontend (visualization)** vs **backend (simulation)**.
- Progressive enhancement: runs with demo data, upgrades when APIs are live.
- Extensible: ready for population exposure, tsunami models, multi-language UI.

---

## 📌 Accuracy & Limitations

- Educational scaling laws (not full n-body/CFD/tsunami solvers).
- API quotas/outages handled gracefully.
- Units & assumptions documented.
- Future work: deeper validation with **USGS datasets**.

---

## 🧭 Potential Applications

- Public risk communication during asteroid news cycles.
- STEM education (impact physics & risk literacy).
- Policy tabletop exercises (deflection timing “what-ifs”).
- Rapid planning for emergency drills & outreach.

---

## 📚 Repository

Public code & prototype:  
🔗 [https://github.com/MatheusGuerraa77/Spaceguard-oficial](https://github.com/MatheusGuerraa77/Spaceguard-oficial)

---

## 🧠 Conclusion

**SpaceGuard** is a bridge between complex celestial risk and **actionable, visual knowledge**.  
It empowers **students, scientists, and decision-makers** to experiment, simulate, and prepare —  
because *the best time to understand an impact is before it happens*.



