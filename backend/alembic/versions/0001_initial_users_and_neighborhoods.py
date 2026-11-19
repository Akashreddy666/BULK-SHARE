"""initial users and neighborhoods

Revision ID: 0001
Revises: 
Create Date: 2026-11-19 22:30:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create neighborhoods table
    op.create_table(
        'neighborhoods',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('city', sa.String(length=100), nullable=False),
        sa.Column('postal_code', sa.String(length=20), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_neighborhoods_id'), 'neighborhoods', ['id'], unique=False)
    op.create_index(op.f('ix_neighborhoods_name'), 'neighborhoods', ['name'], unique=False)
    op.create_index(op.f('ix_neighborhoods_postal_code'), 'neighborhoods', ['postal_code'], unique=False)

    # 2. Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('supabase_uid', sa.String(length=128), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=150), nullable=False),
        sa.Column('phone', sa.String(length=30), nullable=True),
        sa.Column('role', sa.String(length=30), nullable=False, server_default='CUSTOMER'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('neighborhood_id', sa.String(length=36), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['neighborhood_id'], ['neighborhoods.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_supabase_uid'), 'users', ['supabase_uid'], unique=True)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_neighborhood_id'), 'users', ['neighborhood_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_users_neighborhood_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_index(op.f('ix_users_supabase_uid'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_table('users')

    op.drop_index(op.f('ix_neighborhoods_postal_code'), table_name='neighborhoods')
    op.drop_index(op.f('ix_neighborhoods_name'), table_name='neighborhoods')
    op.drop_index(op.f('ix_neighborhoods_id'), table_name='neighborhoods')
    op.drop_table('neighborhoods')
