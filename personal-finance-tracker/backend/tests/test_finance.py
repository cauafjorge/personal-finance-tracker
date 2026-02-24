import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db

SQLALCHEMY_TEST_URL = "sqlite:///./test_finance.db"
engine = create_engine(SQLALCHEMY_TEST_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
Base.metadata.create_all(bind=engine)
client = TestClient(app)

# Shared state across tests
auth_token = {}


def test_register_user():
    response = client.post("/auth/register", json={
        "email": "test@example.com",
        "password": "securepassword",
        "full_name": "Test User",
    })
    assert response.status_code == 201
    assert response.json()["email"] == "test@example.com"


def test_login():
    response = client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "securepassword",
    })
    assert response.status_code == 200
    auth_token["value"] = response.json()["access_token"]


def test_create_transaction():
    headers = {"Authorization": f"Bearer {auth_token['value']}"}
    response = client.post("/transactions/", json={
        "title": "Salary",
        "amount": 5000.0,
        "type": "income",
        "category": "Work",
        "date": "2025-03-01T00:00:00",
    }, headers=headers)
    assert response.status_code == 201
    assert response.json()["amount"] == 5000.0


def test_list_transactions():
    headers = {"Authorization": f"Bearer {auth_token['value']}"}
    response = client.get("/transactions/", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) >= 1


def test_monthly_summary():
    headers = {"Authorization": f"Bearer {auth_token['value']}"}
    response = client.get("/summary/monthly?year=2025&month=3", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_income" in data
    assert "balance" in data


def test_unauthorized_access():
    response = client.get("/transactions/")
    assert response.status_code == 403
