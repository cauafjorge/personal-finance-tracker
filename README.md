# Personal Finance Tracker

A full-stack personal finance application with JWT authentication, transaction management, and monthly analytics.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI + Python 3.12 |
| Frontend | React 18 + TypeScript + Vite |
| Database | PostgreSQL 16 |
| Auth | JWT (python-jose + bcrypt) |
| Charts | Recharts |
| Containerization | Docker + Docker Compose |

## Features

- User registration and login with JWT authentication
- Add and delete income/expense transactions
- Filter transactions by type (income/expense)
- Monthly summary with income, expenses, and balance
- Bar chart for visual monthly overview
- Protected routes (unauthenticated users redirected to login)
- Pagination on transaction queries

## Architecture

```
frontend/          # React + TypeScript SPA
  src/
  ├── api/         # Axios client + API service functions
  ├── components/  # AuthContext (global auth state)
  └── pages/       # LoginPage, RegisterPage, DashboardPage

backend/           # FastAPI REST API
  app/
  ├── routers/     # HTTP layer (auth, transactions, summary)
  ├── services/    # Business logic (pure functions)
  ├── models.py    # SQLAlchemy ORM models
  └── schemas.py   # Pydantic request/response validation
```

## Getting Started

### Prerequisites
- Docker and Docker Compose

```bash
git clone https://github.com/cauafjorge/personal-finance-tracker
cd personal-finance-tracker
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API docs: http://localhost:8000/docs

## API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Get JWT token |
| GET | `/auth/me` | Get current user |

### Transactions (JWT required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/transactions/` | List transactions (paginated) |
| POST | `/transactions/` | Add transaction |
| DELETE | `/transactions/{id}` | Delete transaction |

### Summary (JWT required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/summary/monthly` | Monthly income/expense summary |

## Running Tests

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```

## Engineering Decisions

**JWT over sessions:** Stateless authentication scales horizontally — no shared session store needed. Every instance can validate tokens independently using the shared secret key.

**Row-level isolation:** Every database query filters by `user_id` — users can never access each other's data, even if they guess a transaction ID.

**bcrypt for passwords:** Intentionally slow hashing algorithm that makes brute-force attacks computationally expensive. `passlib` handles the salt automatically.

**Axios interceptors:** JWT is attached to every request via a request interceptor, and 401 responses trigger automatic logout — centralized auth logic with no repetition.

**Pagination by default:** Transaction queries always use `skip/limit` — never return unbounded result sets, which would cause memory and latency issues at scale.

## License

MIT
