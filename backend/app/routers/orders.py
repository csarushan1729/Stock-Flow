from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post(
    "/",
    response_model=schemas.OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new order with automatic stock reduction"
)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    # ── Validate customer ─────────────────────────────────────────────────────
    customer = db.query(models.Customer).filter(models.Customer.id == order.customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found.")

    # ── Validate products & check inventory ───────────────────────────────────
    resolved_items = []
    for item in order.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {item.product_id} not found."
            )
        if product.quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Insufficient stock for '{product.name}' (SKU: {product.sku}). "
                    f"Available: {product.quantity}, Requested: {item.quantity}."
                )
            )
        resolved_items.append({
            "product": product,
            "quantity": item.quantity,
            "unit_price": product.price,
        })

    # ── Calculate total ───────────────────────────────────────────────────────
    total_amount = round(
        sum(i["unit_price"] * i["quantity"] for i in resolved_items), 2
    )

    # ── Persist order ─────────────────────────────────────────────────────────
    db_order = models.Order(
        customer_id=order.customer_id,
        total_amount=total_amount,
        status="pending",
    )
    db.add(db_order)
    db.flush()  # assign PK without committing

    for item_data in resolved_items:
        db_item = models.OrderItem(
            order_id=db_order.id,
            product_id=item_data["product"].id,
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
        )
        db.add(db_item)
        # ── Reduce stock ──────────────────────────────────────────────────────
        item_data["product"].quantity -= item_data["quantity"]

    db.commit()

    # ── Reload with relationships ─────────────────────────────────────────────
    db_order = (
        db.query(models.Order)
        .options(
            joinedload(models.Order.customer),
            joinedload(models.Order.items).joinedload(models.OrderItem.product),
        )
        .filter(models.Order.id == db_order.id)
        .first()
    )
    return db_order


@router.get(
    "/",
    response_model=List[schemas.OrderResponse],
    summary="Retrieve all orders"
)
def get_orders(db: Session = Depends(get_db)):
    return (
        db.query(models.Order)
        .options(
            joinedload(models.Order.customer),
            joinedload(models.Order.items).joinedload(models.OrderItem.product),
        )
        .order_by(models.Order.created_at.desc())
        .all()
    )


@router.get(
    "/{order_id}",
    response_model=schemas.OrderResponse,
    summary="Retrieve an order by ID"
)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = (
        db.query(models.Order)
        .options(
            joinedload(models.Order.customer),
            joinedload(models.Order.items).joinedload(models.OrderItem.product),
        )
        .filter(models.Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")
    return order


@router.delete(
    "/{order_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Cancel/delete an order and restore stock"
)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = (
        db.query(models.Order)
        .options(joinedload(models.Order.items).joinedload(models.OrderItem.product))
        .filter(models.Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    # ── Restore stock on cancellation ─────────────────────────────────────────
    for item in order.items:
        if item.product:
            item.product.quantity += item.quantity

    db.delete(order)
    db.commit()
