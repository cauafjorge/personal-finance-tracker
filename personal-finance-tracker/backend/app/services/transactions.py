from sqlalchemy.orm import Session
from sqlalchemy import extract
from app.models import Transaction, TransactionType
from app.schemas import TransactionCreate
from datetime import datetime


def get_user_transactions(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 50,
    transaction_type: TransactionType | None = None,
) -> list[Transaction]:
    """
    Fetch paginated transactions for a specific user.
    
    Pagination (skip/limit) is critical at scale — never return unbounded queries.
    A user with 10,000 transactions would cause serious memory and latency issues
    without pagination. This is a common senior interview topic.
    """
    query = db.query(Transaction).filter(Transaction.user_id == user_id)
    if transaction_type:
        query = query.filter(Transaction.type == transaction_type)
    return query.order_by(Transaction.date.desc()).offset(skip).limit(limit).all()


def create_transaction(db: Session, user_id: int, data: TransactionCreate) -> Transaction:
    transaction = Transaction(**data.model_dump(), user_id=user_id)
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


def delete_transaction(db: Session, user_id: int, transaction_id: int) -> bool:
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == user_id,  # Critical: user can only delete their own
    ).first()
    if not transaction:
        return False
    db.delete(transaction)
    db.commit()
    return True


def get_monthly_summary(db: Session, user_id: int, year: int, month: int) -> dict:
    """
    Aggregate income and expenses for a given month.
    Uses SQLAlchemy's extract() to filter by year/month at the DB level —
    more efficient than loading all rows and filtering in Python.
    """
    transactions = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        extract("year", Transaction.date) == year,
        extract("month", Transaction.date) == month,
    ).all()

    total_income = sum(t.amount for t in transactions if t.type == TransactionType.INCOME)
    total_expenses = sum(t.amount for t in transactions if t.type == TransactionType.EXPENSE)

    return {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "balance": total_income - total_expenses,
        "transaction_count": len(transactions),
    }
