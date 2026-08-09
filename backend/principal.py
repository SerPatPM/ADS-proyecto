import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from motor.api import router as router_motor
from simulador.api import router as router_simulador

# En producción (Railway) coloca la URL del frontend en CORS_ORIGIN.
# Ej: CORS_ORIGIN=https://mi-frontend.up.railway.app
# En desarrollo se acepta cualquier origen.
_cors_raw = os.getenv("CORS_ORIGIN", "*")
CORS_ORIGINS = [o.strip() for o in _cors_raw.split(",")] if _cors_raw != "*" else ["*"]

app = FastAPI(title="ADS — EPiC Playground · Motor de Propagación Evidencial", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router_motor)
app.include_router(router_simulador)


@app.get("/")
def raiz():
    return {"status": "ok", "docs": "/docs"}
