from typing import Optional
from pydantic import BaseModel, Field

class OpportunityCreateInput(BaseModel):
    lead_id: int = Field(..., description="ID khách hàng tiềm năng")
    product_code_or_name: str = Field(..., description="Tên hoặc mã sản phẩm khách muốn mua")
    expected_quantity: int = Field(1, description="Số lượng sản phẩm dự kiến", ge=1)
    expected_close_date: Optional[str] = Field(None, description="Ngày dự kiến chốt (YYYY-MM-DD)")

class OrderCreateInput(BaseModel):
    opportunity_id: int = Field(..., description="ID cơ hội bán hàng đã được chốt")
    payment_method: str = Field("Chuyển khoản", description="Phương thức thanh toán: Tiền mặt / Chuyển khoản")
    shipping_address: Optional[str] = Field(None, description="Địa chỉ giao hàng")

