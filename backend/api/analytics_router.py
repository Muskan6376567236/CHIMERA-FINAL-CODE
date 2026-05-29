from fastapi import APIRouter, Query
from agents.analytics_agent import analytics_agent
from pipeline.gold import get_kpis

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/kpis")
def get_summary_kpis():
    return get_kpis()

@router.get("/revenue-by-month")
def revenue_by_month():
    return analytics_agent.revenue_by_month()

@router.get("/revenue-by-category")
def revenue_by_category():
    return analytics_agent.revenue_by_category()

@router.get("/revenue-by-region")
def revenue_by_region():
    return analytics_agent.revenue_by_region()

@router.get("/top-products")
def top_products(limit: int = Query(default=10, ge=1, le=50)):
    return analytics_agent.top_products(limit)

@router.get("/top-customers")
def top_customers(limit: int = Query(default=10, ge=1, le=50)):
    return analytics_agent.top_customers(limit)

@router.get("/returns")
def returns_analysis():
    return analytics_agent.returns_analysis()

@router.get("/yoy")
def yoy():
    return analytics_agent.revenue_yoy()

@router.get("/customer-segments")
def customer_segments():
    return analytics_agent.customer_segments()

@router.get("/monthly-returns")
def monthly_returns():
    return analytics_agent.monthly_returns()
