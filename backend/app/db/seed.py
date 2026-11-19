import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, init_db
from app.models.neighborhood import Neighborhood
from app.models.user import User, UserRole
from app.models.catalog import Product, ProductVariant, ProductCategory
from app.models.group import (
    BuyingGroup,
    GroupVisibility,
    GroupStatus,
    GroupMember,
    GroupInvitation,
)
from app.models.grocery_list import GroceryListItem, BrandPreference

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

DEMO_PRODUCTS = [
    {
        "id": "prod-rice-01",
        "name": "Sona Masoori Rice",
        "category": ProductCategory.RICE.value,
        "base_unit": "kg",
        "description": "High-grade polished Sona Masoori rice in sealed retail packages.",
        "variants": [
            {
                "id": "var-rice-01",
                "brand": "India Gate Premium",
                "pack_quantity": 5,
                "pack_unit": "kg",
                "sku": "RICE-IG-5KG",
                "reference_retail_price": 360.0,
            },
            {
                "id": "var-rice-02",
                "brand": "Daawat Rozana",
                "pack_quantity": 10,
                "pack_unit": "kg",
                "sku": "RICE-DAA-10KG",
                "reference_retail_price": 680.0,
            },
            {
                "id": "var-rice-03",
                "brand": "Fortune Everyday",
                "pack_quantity": 25,
                "pack_unit": "kg",
                "sku": "RICE-FOR-25KG",
                "reference_retail_price": 1600.0,
            },
        ],
    },
    {
        "id": "prod-oil-02",
        "name": "Refined Sunflower Cooking Oil",
        "category": ProductCategory.OIL.value,
        "base_unit": "L",
        "description": "Sealed pouches and cans of triple-refined sunflower cooking oil.",
        "variants": [
            {
                "id": "var-oil-01",
                "brand": "Fortune Sunlite",
                "pack_quantity": 1,
                "pack_unit": "L",
                "sku": "OIL-FOR-1L",
                "reference_retail_price": 150.0,
            },
            {
                "id": "var-oil-02",
                "brand": "Freedom Refined",
                "pack_quantity": 5,
                "pack_unit": "L",
                "sku": "OIL-FRE-5L",
                "reference_retail_price": 720.0,
            },
        ],
    },
    {
        "id": "prod-dal-03",
        "name": "Premium Toor Dal (Pigeon Pea)",
        "category": ProductCategory.DAL.value,
        "base_unit": "kg",
        "description": "Unpolished unadulterated high-protein Toor Dal.",
        "variants": [
            {
                "id": "var-dal-01",
                "brand": "Tata Sampann",
                "pack_quantity": 1,
                "pack_unit": "kg",
                "sku": "DAL-TAT-1KG",
                "reference_retail_price": 175.0,
            },
            {
                "id": "var-dal-02",
                "brand": "Organic Tattva",
                "pack_quantity": 2,
                "pack_unit": "kg",
                "sku": "DAL-ORG-2KG",
                "reference_retail_price": 340.0,
            },
        ],
    },
    {
        "id": "prod-sugar-04",
        "name": "Refined Crystal Sugar",
        "category": ProductCategory.SUGAR.value,
        "base_unit": "kg",
        "description": "Sulphur-free sparkling white refined cane sugar.",
        "variants": [
            {
                "id": "var-sug-01",
                "brand": "Madhur Pure",
                "pack_quantity": 1,
                "pack_unit": "kg",
                "sku": "SUG-MAD-1KG",
                "reference_retail_price": 50.0,
            },
            {
                "id": "var-sug-02",
                "brand": "Trust Classic",
                "pack_quantity": 5,
                "pack_unit": "kg",
                "sku": "SUG-TRU-5KG",
                "reference_retail_price": 240.0,
            },
        ],
    },
    {
        "id": "prod-flour-05",
        "name": "Chakki Fresh Whole Wheat Atta",
        "category": ProductCategory.FLOUR.value,
        "base_unit": "kg",
        "description": "100% whole wheat grain chakki fresh flour in tamper-evident sealed bags.",
        "variants": [
            {
                "id": "var-flo-01",
                "brand": "Aashirvaad Shudh",
                "pack_quantity": 5,
                "pack_unit": "kg",
                "sku": "FLO-AAS-5KG",
                "reference_retail_price": 255.0,
            },
            {
                "id": "var-flo-02",
                "brand": "Aashirvaad Select",
                "pack_quantity": 10,
                "pack_unit": "kg",
                "sku": "FLO-AAS-10KG",
                "reference_retail_price": 480.0,
            },
        ],
    },
]

DEMO_GROUPS = [
    {
        "id": "group-indiranagar-01",
        "name": "Indiranagar Essentials Group #1",
        "description": "Weekly community staple grocery pool for residents of 100 Feet Rd, 12th Main & surrounding layouts.",
        "neighborhood_id": "11111111-1111-1111-1111-111111111111",
        "organizer_id": "aaaaaaa2-2222-2222-2222-222222222222",
        "visibility": GroupVisibility.PUBLIC.value,
        "status": GroupStatus.OPEN.value,
        "days_ahead": 4,
        "close_rule": "DEADLINE_OR_TARGET",
        "min_members": 5,
        "max_members": 25,
    },
    {
        "id": "group-koramangala-02",
        "name": "Koramangala 4th Block Staples Club",
        "description": "Bi-weekly pooled procurement group for families near Maharaja signal & Sony World junction.",
        "neighborhood_id": "22222222-2222-2222-2222-222222222222",
        "organizer_id": "aaaaaaa2-2222-2222-2222-222222222222",
        "visibility": GroupVisibility.PUBLIC.value,
        "status": GroupStatus.OPEN.value,
        "days_ahead": 6,
        "close_rule": "DEADLINE_OR_TARGET",
        "min_members": 5,
        "max_members": 30,
    },
    {
        "id": "group-defense-03",
        "name": "Defense Colony Private Buying Circle",
        "description": "Exclusive invitation-only buying group for residents of Defense Colony Indiranagar.",
        "neighborhood_id": "11111111-1111-1111-1111-111111111111",
        "organizer_id": "aaaaaaa2-2222-2222-2222-222222222222",
        "visibility": GroupVisibility.PRIVATE.value,
        "status": GroupStatus.OPEN.value,
        "days_ahead": 5,
        "close_rule": "DEADLINE_OR_TARGET",
        "min_members": 3,
        "max_members": 15,
        "invite_token": "BS-DEFENSE2026",
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

    logger.info("Checking and seeding staple products catalog...")
    for p_data in DEMO_PRODUCTS:
        stmt = select(Product).where(Product.id == p_data["id"])
        existing_p = session.execute(stmt).scalar_one_or_none()
        if not existing_p:
            product = Product(
                id=p_data["id"],
                name=p_data["name"],
                category=p_data["category"],
                base_unit=p_data["base_unit"],
                description=p_data["description"],
                is_active=True,
            )
            session.add(product)
            session.flush()

            for v_data in p_data["variants"]:
                variant = ProductVariant(
                    id=v_data["id"],
                    product_id=product.id,
                    brand=v_data["brand"],
                    pack_quantity=v_data["pack_quantity"],
                    pack_unit=v_data["pack_unit"],
                    sku=v_data["sku"],
                    reference_retail_price=v_data["reference_retail_price"],
                    is_active=True,
                )
                session.add(variant)
            logger.info("Added product: %s with %d variants", product.name, len(p_data["variants"]))

    session.commit()

    logger.info("Checking and seeding demo buying groups...")
    now = datetime.now(timezone.utc)
    for g_data in DEMO_GROUPS:
        stmt = select(BuyingGroup).where(BuyingGroup.id == g_data["id"])
        existing_g = session.execute(stmt).scalar_one_or_none()
        if not existing_g:
            deadline = now + timedelta(days=g_data["days_ahead"])
            group = BuyingGroup(
                id=g_data["id"],
                name=g_data["name"],
                description=g_data["description"],
                neighborhood_id=g_data["neighborhood_id"],
                organizer_id=g_data["organizer_id"],
                visibility=g_data["visibility"],
                status=g_data["status"],
                deadline=deadline,
                close_rule=g_data["close_rule"],
                min_members=g_data["min_members"],
                max_members=g_data["max_members"],
                version=1,
            )
            session.add(group)
            session.flush()

            # Add organizer as member
            org_member = GroupMember(
                group_id=group.id,
                user_id=g_data["organizer_id"],
                is_organizer=True,
            )
            session.add(org_member)

            # Add customer Priya as member in public group
            if g_data["visibility"] == GroupVisibility.PUBLIC.value:
                priya_member = GroupMember(
                    group_id=group.id,
                    user_id="aaaaaaa1-1111-1111-1111-111111111111",
                    is_organizer=False,
                )
                session.add(priya_member)

            # Add invite token if private
            if g_data.get("invite_token"):
                invitation = GroupInvitation(
                    group_id=group.id,
                    token=g_data["invite_token"],
                    expires_at=now + timedelta(days=14),
                    max_uses=20,
                    uses_count=0,
                    is_revoked=False,
                    created_by_id=g_data["organizer_id"],
                )
                session.add(invitation)

            logger.info("Added buying group: %s (%s)", group.name, group.visibility)

    session.commit()

    logger.info("Checking and seeding sample household grocery items for Priya...")
    priya_items = [
        {
            "group_id": "group-indiranagar-01",
            "user_id": "aaaaaaa1-1111-1111-1111-111111111111",
            "variant_id": "var-rice-01",  # 5kg rice
            "pack_quantity": 2,
            "brand_preference": BrandPreference.EXACT.value,
        },
        {
            "group_id": "group-indiranagar-01",
            "user_id": "aaaaaaa1-1111-1111-1111-111111111111",
            "variant_id": "var-oil-02",  # 5L oil
            "pack_quantity": 1,
            "brand_preference": BrandPreference.FLEXIBLE.value,
        },
    ]

    for item_data in priya_items:
        stmt = select(GroceryListItem).where(
            GroceryListItem.group_id == item_data["group_id"],
            GroceryListItem.user_id == item_data["user_id"],
            GroceryListItem.variant_id == item_data["variant_id"],
        )
        existing_item = session.execute(stmt).scalar_one_or_none()
        if not existing_item:
            item = GroceryListItem(**item_data)
            session.add(item)
            logger.info("Added grocery item: %s packs for Priya in %s", item.pack_quantity, item.group_id)

    session.commit()
    logger.info("Database seeding completed successfully.")


def main() -> None:
    init_db()
    with SessionLocal() as session:
        seed_data(session)


if __name__ == "__main__":
    main()
