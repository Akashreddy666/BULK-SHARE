"""add confirmation rounds, member confirmations, group orders, and audit logs

Revision ID: 0004
Revises: 0003
Create Date: 2026-11-20 12:20:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0004'
down_revision: Union[str, None] = '0003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. confirmation_rounds
    op.create_table(
        'confirmation_rounds',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('group_id', sa.String(length=36), nullable=False),
        sa.Column('selected_quotation_id', sa.String(length=36), nullable=False),
        sa.Column('round_number', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='OPEN'),
        sa.Column('deadline', sa.DateTime(timezone=True), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['group_id'], ['buying_groups.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['selected_quotation_id'], ['supplier_quotations.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_confirmation_rounds_id'), 'confirmation_rounds', ['id'], unique=False)
    op.create_index(op.f('ix_confirmation_rounds_group_id'), 'confirmation_rounds', ['group_id'], unique=False)
    op.create_index(op.f('ix_confirmation_rounds_selected_quotation_id'), 'confirmation_rounds', ['selected_quotation_id'], unique=False)
    op.create_index(op.f('ix_confirmation_rounds_status'), 'confirmation_rounds', ['status'], unique=False)

    # 2. member_confirmations
    op.create_table(
        'member_confirmations',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('confirmation_round_id', sa.String(length=36), nullable=False),
        sa.Column('group_id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='PENDING'),
        sa.Column('rejection_reason', sa.Text(), nullable=True),
        sa.Column('total_household_cost', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('total_household_savings', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('confirmed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('fulfillment_preference', sa.String(length=30), nullable=False, server_default='PICKUP'),
        sa.Column('delivery_address', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['confirmation_round_id'], ['confirmation_rounds.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['group_id'], ['buying_groups.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('confirmation_round_id', 'user_id', name='uq_round_member_confirmation'),
    )
    op.create_index(op.f('ix_member_confirmations_id'), 'member_confirmations', ['id'], unique=False)
    op.create_index(op.f('ix_member_confirmations_confirmation_round_id'), 'member_confirmations', ['confirmation_round_id'], unique=False)
    op.create_index(op.f('ix_member_confirmations_group_id'), 'member_confirmations', ['group_id'], unique=False)
    op.create_index(op.f('ix_member_confirmations_user_id'), 'member_confirmations', ['user_id'], unique=False)
    op.create_index(op.f('ix_member_confirmations_status'), 'member_confirmations', ['status'], unique=False)

    # 3. group_orders
    op.create_table(
        'group_orders',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('group_id', sa.String(length=36), nullable=False),
        sa.Column('selected_quotation_id', sa.String(length=36), nullable=False),
        sa.Column('confirmation_round_id', sa.String(length=36), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='LOCKED'),
        sa.Column('total_retail_amount', sa.Float(), nullable=False),
        sa.Column('total_wholesale_amount', sa.Float(), nullable=False),
        sa.Column('total_savings_amount', sa.Float(), nullable=False),
        sa.Column('total_packs', sa.Integer(), nullable=False),
        sa.Column('locked_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('locked_by_user_id', sa.String(length=36), nullable=False),
        sa.Column('order_allocations_data', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['group_id'], ['buying_groups.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['selected_quotation_id'], ['supplier_quotations.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['confirmation_round_id'], ['confirmation_rounds.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['locked_by_user_id'], ['users.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('group_id', name='uq_group_order_group_id'),
    )
    op.create_index(op.f('ix_group_orders_id'), 'group_orders', ['id'], unique=False)
    op.create_index(op.f('ix_group_orders_group_id'), 'group_orders', ['group_id'], unique=True)
    op.create_index(op.f('ix_group_orders_status'), 'group_orders', ['status'], unique=False)

    # 4. audit_logs
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=False),
        sa.Column('entity_id', sa.String(length=36), nullable=False),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('actor_user_id', sa.String(length=36), nullable=True),
        sa.Column('actor_role', sa.String(length=30), nullable=True),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['actor_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_audit_logs_id'), 'audit_logs', ['id'], unique=False)
    op.create_index(op.f('ix_audit_logs_entity_type'), 'audit_logs', ['entity_type'], unique=False)
    op.create_index(op.f('ix_audit_logs_entity_id'), 'audit_logs', ['entity_id'], unique=False)
    op.create_index(op.f('ix_audit_logs_action'), 'audit_logs', ['action'], unique=False)


def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('group_orders')
    op.drop_table('member_confirmations')
    op.drop_table('confirmation_rounds')
