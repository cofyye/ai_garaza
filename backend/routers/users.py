"""
User API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, Query

from dependencies.database import get_db
from schemas.user import UserCreate, UserInDB, UserUpdate
from services.user_service import UserService

router = APIRouter()


def get_user_service(db=Depends(get_db)) -> UserService:
    """Dependency to get user service."""
    return UserService(db)


@router.post("/", response_model=UserInDB, status_code=201)
async def create_user(
    user: UserCreate,
    service: UserService = Depends(get_user_service)
):
    """
    Create a new user (candidate).
    
    - **email**: Email address (must be unique)
    - **full_name**: Full name
    - **phone**: Phone number (optional)
    - **location**: Location (optional)
    """
    try:
        return await service.create_user(user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=list[UserInDB])
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    service: UserService = Depends(get_user_service)
):
    """Get list of users."""
    return await service.get_users(skip=skip, limit=limit)


@router.get("/{user_id}", response_model=UserInDB)
async def get_user(
    user_id: str,
    service: UserService = Depends(get_user_service)
):
    """Get a user by ID."""
    user = await service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/email/{email}", response_model=UserInDB)
async def get_user_by_email(
    email: str,
    service: UserService = Depends(get_user_service)
):
    """Get a user by email."""
    user = await service.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/{user_id}", response_model=UserInDB)
async def update_user(
    user_id: str,
    update: UserUpdate,
    service: UserService = Depends(get_user_service)
):
    """Update user information."""
    user = await service.update_user(user_id, update)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.delete("/{user_id}", status_code=204)
async def delete_user(
    user_id: str,
    service: UserService = Depends(get_user_service)
):
    """Delete a user."""
    success = await service.delete_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return None
