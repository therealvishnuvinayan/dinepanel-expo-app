from fastapi import APIRouter

from app.api.routes import auth, bills, claims, me, merchant, restaurants, rewards


api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(me.router)
api_router.include_router(restaurants.router)
api_router.include_router(rewards.router)
api_router.include_router(bills.router)
api_router.include_router(claims.router)
api_router.include_router(merchant.router)
