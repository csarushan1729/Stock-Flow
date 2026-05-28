# 📦 StockFlow — Inventory & Order Management System

A production-ready, fully containerized Inventory & Order Management System built with **FastAPI**, **React**, and **PostgreSQL**.

---

## 🚀 Tech Stack

| Layer        | Technology                        |
|--------------|-----------------------------------|
| Backend      | Python 3.12 · FastAPI · SQLAlchemy |
| Frontend     | React 18 · Vite · React Router v6  |
| Database     | PostgreSQL 16                      |
| Container    | Docker · Docker Compose            |
| Web Server   | Nginx (frontend)                   |

---

## ✨ Features

- **Product Management** — Create, read, update, delete products with SKU uniqueness enforcement
- **Customer Management** — Register and manage customers with unique email validation
- **Order Management** — Multi-product orders with live total calculation
- **Inventory Tracking** — Automatic stock reduction on order placement, stock restoration on cancellation
- **Dashboard** — Live stats: total products, customers, orders, revenue + low stock alerts
- **Business Rules** — Insufficient stock prevention, negative quantity prevention
- **API Docs** — Interactive Swagger UI at `/docs`

---

## 🏃 Quick Start (Docker)

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd inventory-system

# 2. Copy and configure environment
cp .env.example .env
# (edit .env if needed)

# 3. Build and start all services
docker compose up --build

# 4. Open the app
# Frontend:  http://localhost:3000
# API Docs:  http://localhost:8000/docs
```

---

## 💻 Local Development (without Docker)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL=postgresql://postgres:password@localhost:5432/inventory_db

uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install

# Create .env
echo "VITE_API_URL=http://localhost:8000" > .env

npm run dev
# Open http://localhost:5173
```

---

## 📡 API Endpoints

### Products
| Method | Endpoint           | Description              |
|--------|--------------------|--------------------------|
| POST   | /products          | Create a product         |
| GET    | /products          | List all products        |
| GET    | /products/{id}     | Get product by ID        |
| PUT    | /products/{id}     | Update product           |
| DELETE | /products/{id}     | Delete product           |

### Customers
| Method | Endpoint           | Description              |
|--------|--------------------|--------------------------|
| POST   | /customers         | Create a customer        |
| GET    | /customers         | List all customers       |
| GET    | /customers/{id}    | Get customer by ID       |
| DELETE | /customers/{id}    | Delete customer          |

### Orders
| Method | Endpoint           | Description                              |
|--------|--------------------|------------------------------------------|
| POST   | /orders            | Create order (reduces stock)             |
| GET    | /orders            | List all orders                          |
| GET    | /orders/{id}       | Get order with full detail               |
| DELETE | /orders/{id}       | Cancel order (restores stock)            |

### Dashboard
| Method | Endpoint               | Description          |
|--------|------------------------|----------------------|
| GET    | /dashboard/stats       | Aggregate statistics |

---

## 🏗️ Project Structure

```
inventory-system/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app + CORS + dashboard
│   │   ├── database.py      # SQLAlchemy engine + session
│   │   ├── models.py        # ORM models (Product, Customer, Order, OrderItem)
│   │   ├── schemas.py       # Pydantic request/response schemas
│   │   └── routers/
│   │       ├── products.py
│   │       ├── customers.py
│   │       └── orders.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Router + layout
│   │   ├── pages/           # Dashboard, Products, Customers, Orders, OrderDetail
│   │   ├── components/      # Sidebar, Modal, ConfirmDialog
│   │   ├── api/             # Axios modules per resource
│   │   ├── context/         # Toast notification context
│   │   └── index.css        # Design system (CSS variables)
│   ├── Dockerfile
│   └── nginx.conf
└── docker-compose.yml
```

---



## 🔧 Business Rules

- Product SKU must be **unique** (case-insensitive, stored as uppercase)
- Customer email must be **unique** (stored as lowercase)
- Product quantity **cannot be negative**
- Orders **cannot be placed** if stock is insufficient
- Creating an order **automatically reduces** available stock
- Cancelling an order **automatically restores** stock
- Order total is **calculated by the backend** (not trusted from client)

---

## 📋 Docker Hub

```bash
# Build and tag backend image
docker build -t yourdockerhub/stockflow-backend:latest ./backend
docker push yourdockerhub/stockflow-backend:latest

# Build and tag frontend image
docker build -t yourdockerhub/stockflow-frontend:latest ./frontend
docker push yourdockerhub/stockflow-frontend:latest
```
