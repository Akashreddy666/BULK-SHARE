import os
import sys
import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker, Session

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
settings.ENVIRONMENT = "testing"

from app.core.database import Base, get_db
from app.core.security import create_demo_token
from app.models.neighborhood import Neighborhood
from app.models.user import User, UserRole
from app.main import app

# In-memory SQLite with StaticPool so all connections share the same memory DB
test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
    expire_on_commit=False,
)


@pytest.fixture(scope="function")
def db_session() -> Generator[Session, None, None]:
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()

    # Seed test neighborhood
    test_neighborhood = Neighborhood(
        id="test-neighborhood-01",
        name="Indiranagar Central",
        city="Bengaluru",
        postal_code="560038",
        is_active=True,
    )
    session.add(test_neighborhood)

    # Seed test customer
    test_customer = User(
        id="test-customer-01",
        supabase_uid="test-customer-uid",
        email="priya.customer@bulkshare.com",
        full_name="Priya Sharma",
        phone="+91 98765 43210",
        role=UserRole.CUSTOMER.value,
        neighborhood_id="test-neighborhood-01",
        is_active=True,
    )
    session.add(test_customer)

    # Seed test admin
    test_admin = User(
        id="test-admin-01",
        supabase_uid="test-admin-uid",
        email="admin@bulkshare.com",
        full_name="Platform Admin",
        phone="+91 98765 43211",
        role=UserRole.ADMIN.value,
        neighborhood_id="test-neighborhood-01",
        is_active=True,
    )
    session.add(test_admin)

    session.commit()

    yield session

    session.close()
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def customer_auth_headers() -> dict:
    token = create_demo_token(
        user_id="test-customer-01",
        email="priya.customer@bulkshare.com",
        role=UserRole.CUSTOMER.value,
        supabase_uid="test-customer-uid",
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_auth_headers() -> dict:
    token = create_demo_token(
        user_id="test-admin-01",
        email="admin@bulkshare.com",
        role=UserRole.ADMIN.value,
        supabase_uid="test-admin-uid",
    )
    return {"Authorization": f"Bearer {token}"}
