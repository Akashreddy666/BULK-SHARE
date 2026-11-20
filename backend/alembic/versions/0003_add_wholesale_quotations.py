"""add wholesale price tiers, supplier profiles, offers, snapshots, and quotations

Revision ID: 0003
Revises: 0002
Create Date: 2026-11-20 10:10:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0003'
down_revision: Union[str, None] = '0002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. supplier_profiles table
    op.create_table(
        'supplier_profiles',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('company_name', sa.String(length=200), nullable=False),
        sa.Column('gstin', sa.String(length=20), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('city', sa.String(length=100), nullable=False, server_default='Bengaluru'),
        sa.Column('phone', sa.String(length=30), nullable=True),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', name='uq_supplier_user_id'),
    )
    op.create_index(op.f('ix_supplier_profiles_id'), 'supplier_profiles', ['id'], unique=False)
    op.create_index(op.f('ix_supplier_profiles_company_name'), 'supplier_profiles', ['company_name'], unique=False)
    op.create_index(op.f('ix_supplier_profiles_gstin'), 'supplier_profiles', ['gstin'], unique=False)

    # 2. wholesale_price_tiers table
    op.create_table(
        'wholesale_price_tiers',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('variant_id', sa.String(length=36), nullable=False),
        sa.Column('min_quantity', sa.Integer(), nullable=False),
        sa.Column('price_per_pack', sa.Float(), nullable=False),
        sa.Column('tier_label', sa.String(length=50), nullable=False, server_default='Tier 1'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['variant_id'], ['product_variants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_wholesale_price_tiers_id'), 'wholesale_price_tiers', ['id'], unique=False)
    op.create_index(op.f('ix_wholesale_price_tiers_variant_id'), 'wholesale_price_tiers', ['variant_id'], unique=False)

    # 3. supplier_product_offers table
    op.create_table(
        'supplier_product_offers',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('supplier_id', sa.String(length=36), nullable=False),
        sa.Column('variant_id', sa.String(length=36), nullable=False),
        sa.Column('offer_price_per_pack', sa.Float(), nullable=False),
        sa.Column('min_order_packs', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('max_order_packs', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['supplier_id'], ['supplier_profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['variant_id'], ['product_variants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('supplier_id', 'variant_id', name='uq_supplier_variant_offer'),
    )
    op.create_index(op.f('ix_supplier_product_offers_id'), 'supplier_product_offers', ['id'], unique=False)
    op.create_index(op.f('ix_supplier_product_offers_supplier_id'), 'supplier_product_offers', ['supplier_id'], unique=False)
    op.create_index(op.f('ix_supplier_product_offers_variant_id'), 'supplier_product_offers', ['variant_id'], unique=False)

    # 4. demand_snapshots table
    op.create_table(
        'demand_snapshots',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('group_id', sa.String(length=36), nullable=False),
        sa.Column('snapshot_version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('snapshot_data', sa.Text(), nullable=False),
        sa.Column('total_retail_value', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('total_packs', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['group_id'], ['buying_groups.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_demand_snapshots_id'), 'demand_snapshots', ['id'], unique=False)
    op.create_index(op.f('ix_demand_snapshots_group_id'), 'demand_snapshots', ['group_id'], unique=False)

    # 5. supplier_quotations table
    op.create_table(
        'supplier_quotations',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('demand_snapshot_id', sa.String(length=36), nullable=False),
        sa.Column('supplier_id', sa.String(length=36), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='SUBMITTED'),
        sa.Column('total_quoted_price', sa.Float(), nullable=False),
        sa.Column('valid_until', sa.DateTime(timezone=True), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['demand_snapshot_id'], ['demand_snapshots.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['supplier_id'], ['supplier_profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_supplier_quotations_id'), 'supplier_quotations', ['id'], unique=False)
    op.create_index(op.f('ix_supplier_quotations_demand_snapshot_id'), 'supplier_quotations', ['demand_snapshot_id'], unique=False)
    op.create_index(op.f('ix_supplier_quotations_supplier_id'), 'supplier_quotations', ['supplier_id'], unique=False)
    op.create_index(op.f('ix_supplier_quotations_status'), 'supplier_quotations', ['status'], unique=False)

    # 6. quotation_items table
    op.create_table(
        'quotation_items',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('quotation_id', sa.String(length=36), nullable=False),
        sa.Column('variant_id', sa.String(length=36), nullable=False),
        sa.Column('quoted_packs', sa.Integer(), nullable=False),
        sa.Column('quoted_price_per_pack', sa.Float(), nullable=False),
        sa.Column('line_total', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['quotation_id'], ['supplier_quotations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['variant_id'], ['product_variants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_quotation_items_id'), 'quotation_items', ['id'], unique=False)
    op.create_index(op.f('ix_quotation_items_quotation_id'), 'quotation_items', ['quotation_id'], unique=False)
    op.create_index(op.f('ix_quotation_items_variant_id'), 'quotation_items', ['variant_id'], unique=False)


def downgrade() -> None:
    op.drop_table('quotation_items')
    op.drop_table('supplier_quotations')
    op.drop_table('demand_snapshots')
    op.drop_table('supplier_product_offers')
    op.drop_table('wholesale_price_tiers')
    op.drop_table('supplier_profiles')
