from app.routes.health import router as health_router
from app.routes.deviations import router as deviations_router
from app.routes.ai import router as ai_router

__all__ = ["health_router", "deviations_router", "ai_router"]
