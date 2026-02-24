from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, TransactionType
from app.schemas import TransactionCreate, TransactionResponse
from app.services.auth import get_current_user
from app.services.transactions import (
    get_user_transactions,
    create_transaction,
    delete_transaction,
)

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.get("/", response_model=list[TransactionResponse])
def list_transactions(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, le=100),
    type: TransactionType | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List user's transactions with pagination and optional type filter.
    Query params: ?skip=0&limit=20&type=expense
    """
    return get_user_transactions(db, current_user.id, skip, limit, type)


@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def add_transaction(
    payload: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_transaction(db, current_user.id, payload)


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deleted = delete_transaction(db, current_user.id, transaction_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
