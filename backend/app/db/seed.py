import logging
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, init_db
from app.models.neighborhood import Neighborhood
from app.models.user import User, UserRole

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DEMO_NEIGHBORHOODS = [
    {
        "id": "11111111-1111-1111-1111-111111111111",
        "name": "Indiranagar Central",
        "city": "Bengaluru",
        "postal_code": "560038",
        "is_active": True,
    },
    {
        "id": "22222222-2222-2222-2222-222222222222",
        "name": "Koramangala 4th Block",
        "city": "Bengaluru",
        "postal_code": "560034",
        "is_active": True,
    },
]

DEMO_USERS = [
    {
        "id": "aaaaaaa1-1111-1111-1111-111111111111",
        "supabase_uid": "demo-customer-priya-01",
        "email": "priya.customer@bulkshare.com",
        "full_name": "Priya Sharma",
        "phone": "+91 98765 43210",
        "role": UserRole.CUSTOMER.value,
        "neighborhood_id": "11111111-1111-1111-1111-111111111111",
    },
    {
        "id": "aaaaaaa2-2222-2222-2222-222222222222",
        "supabase_uid": "demo-organizer-rahul-02",
        "email": "rahul.organizer@bulkshare.com",
        "full_name": "Rahul Verma",
        "phone": "+91 98765 43211",
        "role": UserRole.CUSTOMER.value,
        "neighborhood_id": "11111111-1111-1111-1111-111111111111",
    },
    {
        "id": "aaaaaaa3-3333-3333-3333-333333333333",
        "supabase_uid": "demo-supplier-kisan-03",
        "email": "kisan.wholesaler@bulkshare.com",
        "full_name": "Kisan Wholesale Supplies",
        "phone": "+91 98765 43212",
        "role": UserRole.SUPPLIER.value,
        "neighborhood_id": "11111111-1111-1111-1111-111111111111",
    },
    {
        "id": "aaaaaaa4-4444-4444-4444-444444444444",
        "supabase_uid": "demo-admin-system-04",
        "email": "admin@bulkshare.com",
        "full_name": "Platform Administrator",
        "phone": "+91 98765 43213",
        "role": UserRole.ADMIN.value,
        "neighborhood_id": "11111111-1111-1111-1111-111111111111",
    },
]


def seed_data(session: Session) -> None:
    logger.info("Checking and seeding default neighborhoods...")
    for n_data in DEMO_NEIGHBORHOODS:
        stmt = select(Neighborhood).where(Neighborhood.id == n_data["id"])
        existing = session.execute(stmt).scalar_one_or_none()
        if not existing:
            neighborhood = Neighborhood(**n_data)
            session.add(neighborhood)
            logger.info("Added neighborhood: %s", n_data["name"])

    session.commit()

    logger.info("Checking and seeding demo users...")
    for u_data in DEMO_USERS:
        stmt = select(User).where(User.supabase_uid == u_data["supabase_uid"])
        existing = session.execute(stmt).scalar_one_or_none()
        if not existing:
            user = User(**u_data)
            session.add(user)
            logger.info("Added demo user: %s (%s)", u_data["full_name"], u_data["role"])

    session.commit()
    logger.info("Database seeding completed successfully.")


def main() -> None:
    init_db()
    with SessionLocal() as session:
        seed_data(session)


if __name__ == "__main__":
    main()
