import json
import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.demo import DEMO_USERS
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
from app.models.wholesale import (
    SupplierProfile,
    WholesalePriceTier,
    SupplierProductOffer,
)
from app.models.quotation import (
    DemandSnapshot,
    SupplierQuotation,
    QuotationItem,
    QuotationStatus,
)

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

    logger.info("Checking and seeding wholesale price tiers...")
    # Tier structure: Tier 1 (5+ packs, ~15% off), Tier 2 (15+ packs, ~22% off), Tier 3 (30+ packs, ~30% off)
    variants = session.execute(select(ProductVariant)).scalars().all()
    for v in variants:
        t1_exists = session.execute(
            select(WholesalePriceTier).where(
                WholesalePriceTier.variant_id == v.id,
                WholesalePriceTier.tier_label == "Tier 1 (5+ packs)",
            )
        ).scalar_one_or_none()

        if not t1_exists:
            p_retail = v.reference_retail_price
            t1 = WholesalePriceTier(
                variant_id=v.id,
                min_quantity=5,
                price_per_pack=round(p_retail * 0.85, 2),
                tier_label="Tier 1 (5+ packs)",
                is_active=True,
            )
            t2 = WholesalePriceTier(
                variant_id=v.id,
                min_quantity=15,
                price_per_pack=round(p_retail * 0.78, 2),
                tier_label="Tier 2 (15+ packs)",
                is_active=True,
            )
            t3 = WholesalePriceTier(
                variant_id=v.id,
                min_quantity=30,
                price_per_pack=round(p_retail * 0.70, 2),
                tier_label="Tier 3 (30+ packs)",
                is_active=True,
            )
            session.add_all([t1, t2, t3])
    session.commit()

    logger.info("Checking and seeding demo supplier profile & offers...")
    supplier_user_id = "aaaaaaa3-3333-3333-3333-333333333333"
    supplier_prof = session.execute(
        select(SupplierProfile).where(SupplierProfile.user_id == supplier_user_id)
    ).scalar_one_or_none()

    if not supplier_prof:
        supplier_prof = SupplierProfile(
            id="supp-prof-kisan-01",
            user_id=supplier_user_id,
            company_name="Kisan Wholesale Agro Supplies Pvt Ltd",
            gstin="29ABCDE1234F1Z5",
            address="Plot 42, APMC Yard, Yeshwanthpur",
            city="Bengaluru",
            phone="+91 98765 43212",
            is_verified=True,
            description="APMC licensed bulk distributor supplying premium grains, pulses, and edible oils across Bengaluru.",
        )
        session.add(supplier_prof)
        session.flush()

        # Add sample supplier product offers
        for v in variants[:6]:
            offer = SupplierProductOffer(
                supplier_id=supplier_prof.id,
                variant_id=v.id,
                offer_price_per_pack=round(v.reference_retail_price * 0.80, 2),
                min_order_packs=5,
                max_order_packs=200,
                is_active=True,
            )
            session.add(offer)

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

    logger.info("Checking and seeding sample household grocery items...")
    # Add grocery items for Priya and Rahul so group total reaches tier thresholds (5+ packs)
    demo_items = [
        # Priya's items
        {
            "group_id": "group-indiranagar-01",
            "user_id": "aaaaaaa1-1111-1111-1111-111111111111",
            "variant_id": "var-rice-01",  # 5kg rice
            "pack_quantity": 3,
            "brand_preference": BrandPreference.EXACT.value,
        },
        {
            "group_id": "group-indiranagar-01",
            "user_id": "aaaaaaa1-1111-1111-1111-111111111111",
            "variant_id": "var-oil-02",  # 5L oil
            "pack_quantity": 2,
            "brand_preference": BrandPreference.FLEXIBLE.value,
        },
        {
            "group_id": "group-indiranagar-01",
            "user_id": "aaaaaaa1-1111-1111-1111-111111111111",
            "variant_id": "var-dal-01",  # 1kg Toor Dal
            "pack_quantity": 4,
            "brand_preference": BrandPreference.EXACT.value,
        },
        # Rahul's items in the same group (pools demand to unlock Tier 1)
        {
            "group_id": "group-indiranagar-01",
            "user_id": "aaaaaaa2-2222-2222-2222-222222222222",
            "variant_id": "var-rice-01",  # 3 + 3 = 6 packs (unlocks Tier 1 >= 5)
            "pack_quantity": 3,
            "brand_preference": BrandPreference.EXACT.value,
        },
        {
            "group_id": "group-indiranagar-01",
            "user_id": "aaaaaaa2-2222-2222-2222-222222222222",
            "variant_id": "var-oil-02",  # 2 + 4 = 6 packs (unlocks Tier 1 >= 5)
            "pack_quantity": 4,
            "brand_preference": BrandPreference.EXACT.value,
        },
        {
            "group_id": "group-indiranagar-01",
            "user_id": "aaaaaaa2-2222-2222-2222-222222222222",
            "variant_id": "var-dal-01",  # 4 + 2 = 6 packs (unlocks Tier 1 >= 5)
            "pack_quantity": 2,
            "brand_preference": BrandPreference.FLEXIBLE.value,
        },
    ]

    for item_data in demo_items:
        stmt = select(GroceryListItem).where(
            GroceryListItem.group_id == item_data["group_id"],
            GroceryListItem.user_id == item_data["user_id"],
            GroceryListItem.variant_id == item_data["variant_id"],
        )
        existing_item = session.execute(stmt).scalar_one_or_none()
        if not existing_item:
            item = GroceryListItem(**item_data)
            session.add(item)
        else:
            existing_item.pack_quantity = item_data["pack_quantity"]
            session.add(existing_item)

    session.commit()

    logger.info("Checking and seeding sample demand snapshot and quotation for Indiranagar...")
    existing_snap = session.execute(
        select(DemandSnapshot).where(DemandSnapshot.group_id == "group-indiranagar-01")
    ).scalar_one_or_none()

    if not existing_snap:
        from app.services.aggregation import create_demand_snapshot
        snapshot = create_demand_snapshot("group-indiranagar-01", session)
        logger.info("Created demand snapshot #%d for Indiranagar", snapshot.snapshot_version)

        # Seed sample quotation from Kisan Wholesale
        quote = SupplierQuotation(
            id="quote-kisan-01",
            demand_snapshot_id=snapshot.id,
            supplier_id="supp-prof-kisan-01",
            status=QuotationStatus.SUBMITTED.value,
            total_quoted_price=6420.0,
            valid_until=now + timedelta(days=3),
            notes="Ready stock available in Yeshwanthpur APMC yard. Same-day dispatch upon order confirmation.",
        )
        session.add(quote)
        session.flush()

        # Line items
        quote_items = [
            QuotationItem(
                quotation_id=quote.id,
                variant_id="var-rice-01",
                quoted_packs=6,
                quoted_price_per_pack=295.0,  # Retail: 360 -> Wholesale: 295 (18% off)
                line_total=1770.0,
            ),
            QuotationItem(
                quotation_id=quote.id,
                variant_id="var-oil-02",
                quoted_packs=6,
                quoted_price_per_pack=600.0,  # Retail: 720 -> Wholesale: 600 (17% off)
                line_total=3600.0,
            ),
            QuotationItem(
                quotation_id=quote.id,
                variant_id="var-dal-01",
                quoted_packs=6,
                quoted_price_per_pack=145.0,  # Retail: 175 -> Wholesale: 145 (17% off)
                line_total=870.0,
            ),
        ]
        session.add_all(quote_items)
        session.commit()
        logger.info("Created sample quotation from Kisan Wholesale Supplies")

    session.commit()
    logger.info("Database seeding completed successfully.")


def main() -> None:
    init_db()
    with SessionLocal() as session:
        seed_data(session)


if __name__ == "__main__":
    main()
