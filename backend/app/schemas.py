from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime


# ─── Product Schemas ─────────────────────────────────────────────────────────

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    sku: str = Field(..., min_length=1, max_length=100)
    price: float = Field(..., gt=0, description="Price must be greater than 0")
    quantity: int = Field(..., ge=0, description="Quantity cannot be negative")
    description: Optional[str] = None

    @field_validator("sku")
    @classmethod
    def sku_uppercase(cls, v: str) -> str:
        return v.strip().upper()


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    sku: Optional[str] = Field(None, min_length=1, max_length=100)
    price: Optional[float] = Field(None, gt=0)
    quantity: Optional[int] = Field(None, ge=0)
    description: Optional[str] = None

    @field_validator("sku")
    @classmethod
    def sku_uppercase(cls, v: Optional[str]) -> Optional[str]:
        return v.strip().upper() if v else v


class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ─── Customer Schemas ─────────────────────────────────────────────────────────

class CustomerBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., min_length=5, max_length=255)
    phone: str = Field(..., min_length=1, max_length=50)

    @field_validator("email")
    @classmethod
    def email_lowercase(cls, v: str) -> str:
        return v.strip().lower()


class CustomerCreate(CustomerBase):
    pass


class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Order Item Schemas ───────────────────────────────────────────────────────

class OrderItemCreate(BaseModel):
    product_id: int = Field(..., gt=0)
    quantity: int = Field(..., gt=0, description="Quantity must be at least 1")


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    subtotal: Optional[float] = None
    product: Optional[ProductResponse] = None

    model_config = {"from_attributes": True}

    def model_post_init(self, __context) -> None:
        object.__setattr__(self, "subtotal", round(self.unit_price * self.quantity, 2))


# ─── Order Schemas ────────────────────────────────────────────────────────────

class OrderCreate(BaseModel):
    customer_id: int = Field(..., gt=0)
    items: List[OrderItemCreate] = Field(..., min_length=1, description="Order must have at least one item")


class OrderResponse(BaseModel):
    id: int
    customer_id: int
    total_amount: float
    status: str
    created_at: datetime
    customer: Optional[CustomerResponse] = None
    items: List[OrderItemResponse] = []
    item_count: Optional[int] = None

    model_config = {"from_attributes": True}

    def model_post_init(self, __context) -> None:
        object.__setattr__(self, "item_count", len(self.items))


# ─── Dashboard Schema ─────────────────────────────────────────────────────────

class LowStockProduct(BaseModel):
    id: int
    name: str
    sku: str
    quantity: int

    model_config = {"from_attributes": True}


class DashboardStats(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    total_revenue: float
    low_stock_products: List[LowStockProduct]
