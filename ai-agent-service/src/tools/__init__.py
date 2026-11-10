"""Khởi tạo và tổng hợp các công cụ CRM (LangChain Tools & Raw Functions)."""
from langchain_core.tools import tool
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

# Danh sách hàm nguyên bản (thuận tiện cho unit tests)
RAW_CRM_TOOLS = QUERY_TOOLS + LEAD_ACTION_TOOLS + ORDER_ACTION_TOOLS

# Danh sách công cụ chuẩn hóa cho LangGraph / LangChain Agent
ALL_CRM_TOOLS = [tool(f) for f in RAW_CRM_TOOLS]

__all__ = [
    "QUERY_TOOLS",
    "LEAD_ACTION_TOOLS",
    "ORDER_ACTION_TOOLS",
    "RAW_CRM_TOOLS",
    "ALL_CRM_TOOLS",
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
