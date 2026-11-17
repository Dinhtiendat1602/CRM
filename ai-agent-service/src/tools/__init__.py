"""Khởi tạo và tổng hợp các công cụ CRM (LangChain Tools & Raw Functions) theo phân quyền vai trò (RBAC)."""
from typing import List, Any
from langchain_core.tools import tool
from .admin_tools import ADMIN_TOOLS, get_admin_system_overview
from .query_tools import (
    QUERY_TOOLS,
    get_leads_summary,
    get_revenue_and_forecast,
    get_products_and_inventory,
    get_opportunities_overview,
    get_campaigns_overview,
    get_orders_summary,
    search_customer,
)
from .lead_tools import LEAD_ACTION_TOOLS, create_lead
from .order_tools import ORDER_ACTION_TOOLS, create_opportunity

# Danh sách hàm nguyên bản theo từng vai trò (thuận tiện cho unit tests)
RAW_ADMIN_TOOLS = ADMIN_TOOLS
RAW_SALESMAN_TOOLS = [
    get_leads_summary,
    get_products_and_inventory,
    get_opportunities_overview,
    get_orders_summary,
    search_customer,
    create_lead,
    create_opportunity
]
RAW_CRM_TOOLS = QUERY_TOOLS + LEAD_ACTION_TOOLS + ORDER_ACTION_TOOLS

# Danh sách công cụ chuẩn hóa cho LangGraph / LangChain Agent theo Role
ADMIN_LANGCHAIN_TOOLS = [tool(f) for f in RAW_ADMIN_TOOLS]
SALESMAN_LANGCHAIN_TOOLS = [tool(f) for f in RAW_SALESMAN_TOOLS]
MANAGER_LANGCHAIN_TOOLS = [tool(f) for f in RAW_CRM_TOOLS]
ALL_CRM_TOOLS = MANAGER_LANGCHAIN_TOOLS

ROLE_TOOLS_MAPPING = {
    "ADMIN": ADMIN_LANGCHAIN_TOOLS,
    "SALE_MANAGER": MANAGER_LANGCHAIN_TOOLS,
    "SALESMAN": SALESMAN_LANGCHAIN_TOOLS
}

def get_tools_for_role(role: str = "SALE_MANAGER") -> List[Any]:
    """Lấy danh sách LangChain Tools được phân quyền cho vai trò tương ứng."""
    clean_role = (role or "SALE_MANAGER").upper()
    return ROLE_TOOLS_MAPPING.get(clean_role, MANAGER_LANGCHAIN_TOOLS)

__all__ = [
    "QUERY_TOOLS",
    "LEAD_ACTION_TOOLS",
    "ORDER_ACTION_TOOLS",
    "ADMIN_TOOLS",
    "RAW_ADMIN_TOOLS",
    "RAW_SALESMAN_TOOLS",
    "RAW_CRM_TOOLS",
    "ADMIN_LANGCHAIN_TOOLS",
    "SALESMAN_LANGCHAIN_TOOLS",
    "MANAGER_LANGCHAIN_TOOLS",
    "ALL_CRM_TOOLS",
    "ROLE_TOOLS_MAPPING",
    "get_tools_for_role",
    "get_admin_system_overview",
    "get_leads_summary",
    "get_revenue_and_forecast",
    "get_products_and_inventory",
    "get_opportunities_overview",
    "get_campaigns_overview",
    "get_orders_summary",
    "search_customer",
    "create_lead",
    "create_opportunity",
]
