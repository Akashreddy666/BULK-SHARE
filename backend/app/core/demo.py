"""Account identities for the public demonstration personas."""

from app.models.user import UserRole

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
