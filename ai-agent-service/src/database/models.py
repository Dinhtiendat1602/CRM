"""Định nghĩa cấu trúc các bảng CSDL trong Zen CRM PostgreSQL để tham chiếu và ánh xạ."""
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class RoleModel(BaseModel):
    id: int
    role_name: str
    description: Optional[str] = None

class UserModel(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role_id: int
    is_active: bool

class LeadModel(BaseModel):
    id: int
    first_name: str
    last_name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    job_title: Optional[str] = None
    campaign_id: Optional[int] = None
    entered_date: datetime

class OpportunityModel(BaseModel):
    id: int
    lead_id: int
    product_id: int
    expected_quantity: int
    expected_close_date: datetime
    stage: str
    estimated_revenue: float

class OrderModel(BaseModel):
    id: int
    order_code: str
    lead_id: int
    product_id: int
    quantity: int
    unit_price: float
    total_amount: float
    status: str
    payment_method: str
    created_at: datetime

