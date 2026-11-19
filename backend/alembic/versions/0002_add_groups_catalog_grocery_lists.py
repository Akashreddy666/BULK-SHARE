"""add groups catalog and grocery lists

Revision ID: 0002
Revises: 0001
Create Date: 2026-11-19 23:25:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0002'
down_revision: Union[str, None] = '0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create buying_groups table
    op.create_table(
        'buying_groups',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('neighborhood_id', sa.String(length=36), nullable=False),
        sa.Column('organizer_id', sa.String(length=36), nullable=False),
        sa.Column('visibility', sa.String(length=20), nullable=False, server_default='PUBLIC'),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='OPEN'),
        sa.Column('deadline', sa.DateTime(timezone=True), nullable=False),
        sa.Column('close_rule', sa.String(length=50), nullable=False, server_default='DEADLINE_OR_TARGET'),
        sa.Column('min_members', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('max_members', sa.Integer(), nullable=True),
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['neighborhood_id'], ['neighborhoods.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['organizer_id'], ['users.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_buying_groups_id'), 'buying_groups', ['id'], unique=False)
    op.create_index(op.f('ix_buying_groups_name'), 'buying_groups', ['name'], unique=False)
    op.create_index(op.f('ix_buying_groups_neighborhood_id'), 'buying_groups', ['neighborhood_id'], unique=False)
    op.create_index(op.f('ix_buying_groups_organizer_id'), 'buying_groups', ['organizer_id'], unique=False)
    op.create_index(op.f('ix_buying_groups_status'), 'buying_groups', ['status'], unique=False)
    op.create_index(op.f('ix_buying_groups_visibility'), 'buying_groups', ['visibility'], unique=False)

    # 2. Create group_members table
    op.create_table(
        'group_members',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('group_id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('is_organizer', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('joined_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['group_id'], ['buying_groups.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('group_id', 'user_id', name='uq_group_member'),
    )
    op.create_index(op.f('ix_group_members_id'), 'group_members', ['id'], unique=False)
    op.create_index(op.f('ix_group_members_group_id'), 'group_members', ['group_id'], unique=False)
    op.create_index(op.f('ix_group_members_user_id'), 'group_members', ['user_id'], unique=False)

    # 3. Create group_invitations table
    op.create_table(
        'group_invitations',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('group_id', sa.String(length=36), nullable=False),
        sa.Column('token', sa.String(length=64), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('max_uses', sa.Integer(), nullable=False, server_default='10'),
        sa.Column('uses_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_revoked', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_by_id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['group_id'], ['buying_groups.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_group_invitations_id'), 'group_invitations', ['id'], unique=False)
    op.create_index(op.f('ix_group_invitations_group_id'), 'group_invitations', ['group_id'], unique=False)
    op.create_index(op.f('ix_group_invitations_token'), 'group_invitations', ['token'], unique=True)

    # 4. Create products table
    op.create_table(
        'products',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('base_unit', sa.String(length=20), nullable=False, server_default='kg'),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_products_id'), 'products', ['id'], unique=False)
    op.create_index(op.f('ix_products_name'), 'products', ['name'], unique=False)
    op.create_index(op.f('ix_products_category'), 'products', ['category'], unique=False)

    # 5. Create product_variants table
    op.create_table(
        'product_variants',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('product_id', sa.String(length=36), nullable=False),
        sa.Column('brand', sa.String(length=100), nullable=False),
        sa.Column('pack_quantity', sa.Integer(), nullable=False),
        sa.Column('pack_unit', sa.String(length=20), nullable=False, server_default='kg'),
        sa.Column('sku', sa.String(length=100), nullable=False),
        sa.Column('reference_retail_price', sa.Float(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_product_variants_id'), 'product_variants', ['id'], unique=False)
    op.create_index(op.f('ix_product_variants_product_id'), 'product_variants', ['product_id'], unique=False)
    op.create_index(op.f('ix_product_variants_brand'), 'product_variants', ['brand'], unique=False)
    op.create_index(op.f('ix_product_variants_sku'), 'product_variants', ['sku'], unique=True)

    # 6. Create grocery_list_items table
    op.create_table(
        'grocery_list_items',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('group_id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('variant_id', sa.String(length=36), nullable=False),
        sa.Column('pack_quantity', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('brand_preference', sa.String(length=20), nullable=False, server_default='EXACT'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['group_id'], ['buying_groups.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['variant_id'], ['product_variants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('group_id', 'user_id', 'variant_id', name='uq_user_group_variant'),
    )
    op.create_index(op.f('ix_grocery_list_items_id'), 'grocery_list_items', ['id'], unique=False)
    op.create_index(op.f('ix_grocery_list_items_group_id'), 'grocery_list_items', ['group_id'], unique=False)
    op.create_index(op.f('ix_grocery_list_items_user_id'), 'grocery_list_items', ['user_id'], unique=False)
    op.create_index(op.f('ix_grocery_list_items_variant_id'), 'grocery_list_items', ['variant_id'], unique=False)


def downgrade() -> None:
    op.drop_table('grocery_list_items')
    op.drop_table('product_variants')
    op.drop_table('products')
    op.drop_table('group_invitations')
    op.drop_table('group_members')
    op.drop_table('buying_groups')
