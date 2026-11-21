"""add payments, procurement orders, member fulfillments, notifications, and disputes

Revision ID: 0005
Revises: 0004
Create Date: 2026-11-21 14:00:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0005'
down_revision: Union[str, None] = '0004'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. payment_transactions
    op.create_table(
        'payment_transactions',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('group_order_id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('currency', sa.String(length=10), nullable=False, server_default='INR'),
        sa.Column('payment_method', sa.String(length=30), nullable=False, server_default='UPI'),
        sa.Column('transaction_ref', sa.String(length=64), nullable=False),
        sa.Column('receipt_number', sa.String(length=64), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='COMPLETED'),
        sa.Column('paid_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['group_order_id'], ['group_orders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_payment_transactions_group_order_id', 'payment_transactions', ['group_order_id'])
    op.create_index('ix_payment_transactions_user_id', 'payment_transactions', ['user_id'])
    op.create_index('ix_payment_transactions_transaction_ref', 'payment_transactions', ['transaction_ref'], unique=True)
    op.create_index('ix_payment_transactions_receipt_number', 'payment_transactions', ['receipt_number'], unique=True)
    op.create_index('ix_payment_transactions_status', 'payment_transactions', ['status'])

    # 2. procurement_orders
    op.create_table(
        'procurement_orders',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('group_order_id', sa.String(length=36), nullable=False),
        sa.Column('supplier_id', sa.String(length=36), nullable=False),
        sa.Column('po_number', sa.String(length=64), nullable=False),
        sa.Column('status', sa.String(length=40), nullable=False, server_default='PLACED'),
        sa.Column('total_amount', sa.Float(), nullable=False),
        sa.Column('estimated_delivery_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('dispatched_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('delivered_to_hub_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['group_order_id'], ['group_orders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['supplier_id'], ['supplier_profiles.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('group_order_id', name='uq_procurement_group_order'),
    )
    op.create_index('ix_procurement_orders_supplier_id', 'procurement_orders', ['supplier_id'])
    op.create_index('ix_procurement_orders_po_number', 'procurement_orders', ['po_number'], unique=True)
    op.create_index('ix_procurement_orders_status', 'procurement_orders', ['status'])

    # 3. member_fulfillments
    op.create_table(
        'member_fulfillments',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('group_order_id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('fulfillment_type', sa.String(length=30), nullable=False, server_default='PICKUP'),
        sa.Column('pickup_code', sa.String(length=20), nullable=True),
        sa.Column('delivery_address', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=40), nullable=False, server_default='PENDING_PROCUREMENT'),
        sa.Column('dispatched_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('verified_by_user_id', sa.String(length=36), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['group_order_id'], ['group_orders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['verified_by_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('group_order_id', 'user_id', name='uq_order_member_fulfillment'),
    )
    op.create_index('ix_member_fulfillments_group_order_id', 'member_fulfillments', ['group_order_id'])
    op.create_index('ix_member_fulfillments_user_id', 'member_fulfillments', ['user_id'])
    op.create_index('ix_member_fulfillments_pickup_code', 'member_fulfillments', ['pickup_code'])
    op.create_index('ix_member_fulfillments_status', 'member_fulfillments', ['status'])

    # 4. notifications
    op.create_table(
        'notifications',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('title', sa.String(length=120), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('type', sa.String(length=40), nullable=False, server_default='ORDER_LOCKED'),
        sa.Column('link', sa.String(length=255), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_notifications_user_id', 'notifications', ['user_id'])
    op.create_index('ix_notifications_type', 'notifications', ['type'])
    op.create_index('ix_notifications_is_read', 'notifications', ['is_read'])

    # 5. order_disputes
    op.create_table(
        'order_disputes',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('group_order_id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('category', sa.String(length=40), nullable=False, server_default='DAMAGED_PACKS'),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='OPEN'),
        sa.Column('refund_amount', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('resolution_notes', sa.Text(), nullable=True),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('resolved_by_user_id', sa.String(length=36), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['group_order_id'], ['group_orders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['resolved_by_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_order_disputes_group_order_id', 'order_disputes', ['group_order_id'])
    op.create_index('ix_order_disputes_user_id', 'order_disputes', ['user_id'])
    op.create_index('ix_order_disputes_category', 'order_disputes', ['category'])
    op.create_index('ix_order_disputes_status', 'order_disputes', ['status'])


def downgrade() -> None:
    op.drop_table('order_disputes')
    op.drop_table('notifications')
    op.drop_table('member_fulfillments')
    op.drop_table('procurement_orders')
    op.drop_table('payment_transactions')
