import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from sqlalchemy.orm import Session

from .database import engine, Base, get_db, wait_for_db
from .routers import products, customers, orders
from . import models
from .schemas import DashboardStats, LowStockProduct

# ── Wait for DB then create tables ────────────────────────────────────────────
wait_for_db()
Base.metadata.create_all(bind=engine)

# ── App setup ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Inventory & Order Management API",
    description=(
        "Production-ready REST API for managing products, customers, orders, "
        "and inventory tracking."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ─────────────────────────────────────────────────────────────────────
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten in production via env var
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)


# ── Health & Root ─────────────────────────────────────────────────────────────
@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Inventory & Order Management API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}


# ── Dashboard ─────────────────────────────────────────────────────────────────
LOW_STOCK_THRESHOLD = int(os.getenv("LOW_STOCK_THRESHOLD", "10"))


@app.get("/dashboard/stats", response_model=DashboardStats, tags=["Dashboard"])
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_products = db.query(models.Product).count()
    total_customers = db.query(models.Customer).count()
    total_orders = db.query(models.Order).count()
    total_revenue = db.query(func.sum(models.Order.total_amount)).scalar() or 0.0

    low_stock = (
        db.query(models.Product)
        .filter(models.Product.quantity <= LOW_STOCK_THRESHOLD)
        .order_by(models.Product.quantity.asc())
        .limit(10)
        .all()
    )

    return DashboardStats(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        total_revenue=round(float(total_revenue), 2),
        low_stock_products=[
            LowStockProduct(id=p.id, name=p.name, sku=p.sku, quantity=p.quantity)
            for p in low_stock
        ],
    )
