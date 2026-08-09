# EPiC Playground — Propagación de Evidencia en Lógica de Cuatro Valores de Belnap

**Materia:** Análisis y Diseño de Software (ADS)  
**Institución:** IPN — ESCOM  
**Semestre:** 2025-B

---

## Descripción

EPiC Playground es un sistema web interactivo para construir y simular redes lógicas basadas en el **Cálculo de Propagación de Evidencias (EPiC)**, implementado sobre la **lógica de cuatro valores de Belnap**:

| Valor | Símbolo | Significado |
|-------|---------|-------------|
| Verdadero | **T** | Solo evidencia positiva |
| Falso | **F** | Solo evidencia negativa |
| Contradicción | **B** | Evidencia positiva y negativa simultánea |
| Sin evidencia | **N** | Ningún tipo de evidencia |

El motor propaga evidencia a través de grafos informacionales usando aristas tipadas (AND / OR / NOT / UI) que siguen la semántica de la teoría de conjuntos del paper *EPiC: A Four-Valued Evidential Constraint Calculus for First-Order Reasoning* (Olmedo-Aguirre et al., 2026).

---

## Equipo de desarrollo

| Subequipo | Integrantes | Responsabilidad |
|-----------|-------------|-----------------|
| **Subequipo 1** | De La Riva Martínez Héctor Josué<br>Bernal Linares César Arturo<br>Montaño Sánchez Daniela<br>García López Andrés Adad | Editor · Frontend (React + TypeScript + Vite) |
| **Subequipo 2** | Cortés Avilez Yoshua<br>Gutiérrez López Samuel<br>Luciano Alvarado Ana Cristina<br>Pérez Montaño Sergio Patricio | Motor de cálculo · Backend (propagación de bits, tablas Belnap) |
| **Subequipo 3** | Aldama Nava Nadir Ibrain<br>Peralta Llera Elizabeth<br>Toribio Segura Alma Jessica<br>Varillas Figueroa Enrique Uriel | Simulador · Backend (historial granular, estado de sesión) |
| **Todos** | 12 personas | Compartido · Modelos de datos · Validadores · Visualizador |

---

## Arquitectura

```
┌────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                        │
│                       localhost:5173                           │
│                                                                │
│   ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│   │  Editor     │  │  Canvas SVG  │  │  Simulador/Panel   │  │
│   │ Variables   │  │  Aristas     │  │  Paso a paso       │  │
│   │ Fórmulas    │  │  Inferencia  │  │  Regla disparada   │  │
│   └─────────────┘  └──────────────┘  └────────────────────┘  │
└───────────────────────────┬────────────────────────────────────┘
                            │ HTTP REST (JSON)
                            ▼
┌────────────────────────────────────────────────────────────────┐
│                       Backend (FastAPI)                        │
│                       localhost:8000                           │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                    compartido/                          │   │
│  │  modelos.py  contratos.py  validadores.py              │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                │
│  ┌─────────────────────────┐  ┌────────────────────────────┐  │
│  │       motor/            │  │        simulador/          │  │
│  │  MotorBitpair           │  │  GestorEstadoSimulacion    │  │
│  │  · _primer_cambio()     │  │  SimulacionServicio        │  │
│  │  · 1 paso = 1 regla     │  │  · historial granular      │  │
│  │  · AND/OR/NOT/UI        │  │  · navegación paso a paso  │  │
│  └─────────────────────────┘  └────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

**Modelo de aristas (la semántica vive en las aristas, no en los nodos):**

| Tipo | Color | Dirección | Semántica |
|------|-------|-----------|-----------|
| `and` | 🟢 Verde | Compound → Componente | A∧B → A (A∧B ⊆ A) |
| `or`  | 🟢 Verde | Componente → Compound | A → A∨B (A ⊆ A∨B) |
| `not` | 🔴 Rojo  | Bidireccional ↔ | A ↔ ¬A |
| `ui`  | 🟢 Verde | Origen → Destino | A → B (inclusión / implicación) |

---

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 · TypeScript · Vite · SVG |
| Backend | Python 3.11 · FastAPI · Uvicorn |
| Protocolo | HTTP REST · JSON |
| Deploy | Railway (PaaS) |
| Lógica | Belnap 4-valores · Bitpair · Propagación de punto fijo |

---

## Ejecución local

### Prerequisitos

- Python ≥ 3.11
- Node.js ≥ 18

### Backend

```bash
cd ads-final/backend
pip install -r requerimientos.txt

# Opcional: copiar variables de entorno
cp .env.example .env

uvicorn principal:app --reload --port 8000
```

Documentación interactiva disponible en `http://localhost:8000/docs`

### Frontend

```bash
cd ads-final/frontend
npm install

# Opcional: apuntar al backend
cp .env.example .env.local
# Editar VITE_API_URL si es necesario

npm run dev
# → http://localhost:5173
```

### Tests del backend

```bash
cd ads-final/backend
python -m pytest motor/test_motor.py simulador/test_simulador.py -v
```

---

## Variables de entorno

### Backend (`ads-final/backend/.env`)

| Variable | Valor por defecto | Descripción |
|----------|-------------------|-------------|
| `PORT` | `8000` | Puerto del servidor (Railway lo asigna automáticamente) |
| `CORS_ORIGIN` | `*` | URL(s) del frontend permitidas (separadas por coma en producción) |

### Frontend (`ads-final/frontend/.env.local`)

| Variable | Valor por defecto | Descripción |
|----------|-------------------|-------------|
| `VITE_API_URL` | `http://localhost:8000` | URL del backend |

---

## Despliegue en Railway

Railway es una plataforma PaaS (Platform as a Service) que permite desplegar aplicaciones desde un repositorio de GitHub. Se crean **dos servicios separados**: uno para el backend y otro para el frontend.

### 1. Subir el código a GitHub

```bash
# En la raíz del repositorio
git init
git add .
git commit -m "feat: EPiC Playground v3"
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

### 2. Crear el proyecto en Railway

1. Ir a [railway.app](https://railway.app) e iniciar sesión con GitHub.
2. Click en **New Project → Deploy from GitHub repo**.
3. Seleccionar el repositorio.

### 3. Configurar el servicio Backend

En Railway, después de agregar el repositorio:

1. Click en el servicio creado → **Settings**.
2. En **Root Directory** escribir: `ads-final/backend`
3. En **Build Command** verificar que Railway detecte Python (usa nixpacks automáticamente).
4. En **Start Command** escribir:
   ```
   uvicorn principal:app --host 0.0.0.0 --port $PORT
   ```
5. En la pestaña **Variables** agregar:
   ```
   CORS_ORIGIN=https://TU-FRONTEND.up.railway.app
   ```
   _(puedes dejarlo en `*` mientras configuras el frontend)_
6. Click en **Deploy** y esperar a que el build termine.
7. Copiar la URL pública del backend (ej: `https://epic-backend-prod.up.railway.app`).

### 4. Agregar el servicio Frontend

1. En el mismo proyecto Railway, click en **+ New → GitHub Repo** (el mismo repo).
2. Click en el nuevo servicio → **Settings**.
3. En **Root Directory** escribir: `ads-final/frontend`
4. En **Build Command**:
   ```
   npm install && npm run build
   ```
5. En **Start Command**:
   ```
   npx serve dist --listen $PORT --single
   ```
6. En la pestaña **Variables** agregar:
   ```
   VITE_API_URL=https://epic-backend-prod.up.railway.app
   ```
   _(la URL que copiaste en el paso anterior)_
7. Click en **Deploy**.

### 5. Conectar los servicios

1. Volver al servicio **backend** → **Variables**.
2. Actualizar `CORS_ORIGIN` con la URL del frontend:
   ```
   CORS_ORIGIN=https://epic-frontend-prod.up.railway.app
   ```
3. Railway redesplegará automáticamente.

### Resultado

| Servicio | URL de ejemplo |
|----------|----------------|
| Backend API | `https://epic-backend-prod.up.railway.app/docs` |
| Frontend | `https://epic-frontend-prod.up.railway.app` |

> **Nota:** Las URLs exactas las asigna Railway al crear cada servicio. Se pueden personalizar en **Settings → Networking → Custom Domain**.

---

## Estructura del proyecto

```
ads-final/
│
├── README.md
│
├── backend/
│   ├── .env.example          ← variables de entorno (copiar a .env)
│   ├── railway.toml          ← configuración de despliegue Railway
│   ├── principal.py          ← arranque FastAPI, CORS
│   ├── requerimientos.txt    ← dependencias Python
│   │
│   ├── compartido/           ← Todos los subequipos
│   │   ├── modelos.py        ← Nodo, Arista, Red, ResultadoPropagacion
│   │   ├── contratos.py      ← Interfaces abstractas (IMotorCalculo, etc.)
│   │   └── validadores.py    ← Validación de la red antes de calcular
│   │
│   ├── motor/                ← Subequipo 2
│   │   ├── algoritmos.py     ← MotorBitpair: 1 paso = 1 regla (AND/OR/NOT/UI)
│   │   ├── api.py            ← POST /api/v1/redes/{id}/calcular
│   │   └── test_motor.py     ← 15 tests
│   │
│   └── simulador/            ← Subequipo 3
│       ├── estado.py         ← GestorEstadoSimulacion (historial en memoria)
│       ├── servicio.py       ← SimulacionServicio (DIP sobre IMotorCalculo)
│       ├── api.py            ← POST/GET/PUT /api/v1/simulaciones/...
│       └── test_simulador.py ← Tests con mocks del motor
│
└── frontend/
    ├── .env.example          ← variables de entorno (copiar a .env.local)
    ├── railway.toml          ← configuración de despliegue Railway
    ├── package.json
    └── src/
        ├── App.tsx           ← Estado global, routing de tabs
        │
        ├── compartido/       ← Todos los subequipos
        │   ├── tipos.ts      ← Interfaces TypeScript (Nodo, Arista, etc.)
        │   ├── api.ts        ← Llamadas HTTP al backend
        │   ├── constantes.ts ← Colores Belnap, presets, paleta
        │   └── inferirConexion.ts ← Deduce tipo/dir de arista por etiquetas
        │
        ├── editor/           ← Subequipo 1
        │   ├── FormularioVariable.tsx  ← Declarar A=T, B=F…
        │   ├── FormularioNodo.tsx      ← Constructor de fórmulas por botones
        │   ├── FormularioArista.tsx    ← Conectar nodos (tipo inferido)
        │   └── CanvasEditor.tsx        ← SVG drag-and-drop, selección
        │
        └── visualizador/     ← Todos
            ├── ControlesSimulacion.tsx ← Play/Pause/⏮/⏭
            └── PanelResultados.tsx     ← Regla disparada, nodo que cambió
```

---

## Principios de diseño aplicados

- **S** — Responsabilidad única: cada archivo tiene una sola razón para cambiar.
- **O** — Abierto/cerrado: agregar un tipo de arista no modifica el motor existente.
- **L** — Sustitución de Liskov: `MotorBitpair` implementa `IMotorCalculoIterativo`; cualquier otro motor sería transparente al simulador.
- **I** — Segregación de interfaces: `IMotorCalculo` (solo resultado final) vs `IMotorCalculoIterativo` (historial completo).
- **D** — Inversión de dependencias: `SimulacionServicio` depende de `IMotorCalculoIterativo`, nunca de `MotorBitpair` directamente.

---

## Referencia

Olmedo-Aguirre J.O., Machorro-Cano I., Alor-Hernández G., Rodríguez-Mazahua L., Sánchez-Cervantes J.L., Kantún-Montiel A.L. (2026).  
*EPiC: A Four-Valued Evidential Constraint Calculus for First-Order Reasoning.*  
Submitted to *Axioms*. https://doi.org/10.3390/axioms1010000
