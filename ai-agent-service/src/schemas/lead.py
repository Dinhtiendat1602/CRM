from typing import Optional
from pydantic import BaseModel, Field

class LeadCreateInput(BaseModel):
    first_name: str = Field(..., description="Tên của khách hàng (VD: Nam)")
    last_name: str = Field(..., description="Họ và tên đệm (VD: Nguyễn Văn)")
    phone: str = Field(..., description="Số điện thoại di động (VD: 0987112233)")
    email: Optional[str] = Field(None, description="Địa chỉ email cá nhân hoặc công việc")
    address: Optional[str] = Field(None, description="Địa chỉ liên hệ")
    job_title: Optional[str] = Field(None, description="Nghề nghiệp hoặc chức vụ")
    campaign_id: Optional[int] = Field(None, description="ID chiến dịch tiếp thị mang lại lead (nếu có)")

class LeadOutput(BaseModel):
    id: int
    full_name: str
    phone: str
    email: Optional[str]
    address: Optional[str]
    job_title: Optional[str]

