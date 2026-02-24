from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict
from app.models import TransactionType


# --- Auth ---

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# --- Transactions ---

class TransactionCreate(BaseModel):
    title: str
    amount: float
    type: TransactionType
    category: str
    description: str | None = None
    date: datetime


class TransactionResponse(TransactionCreate):
    id: int
    user_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# --- Summary ---

class MonthlySummary(BaseModel):
    total_income: float
    total_expenses: float
    balance: float
    transaction_count: int
