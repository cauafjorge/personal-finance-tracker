from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import MonthlySummary
from app.services.auth import get_current_user
from app.services.transactions import get_monthly_summary

router = APIRouter(prefix="/summary", tags=["Summary"])


@router.get("/monthly", response_model=MonthlySummary)
def monthly_summary(
    year: int = Query(default=datetime.now().year),
    month: int = Query(default=datetime.now().month, ge=1, le=12),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns aggregated income, expenses, and balance for a given month.
    Example: GET /summary/monthly?year=2025&month=3
    """
    return get_monthly_summary(db, current_user.id, year, month)
