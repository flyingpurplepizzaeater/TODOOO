from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from database import get_db
from models import User, Team, TeamMember
from schemas import TeamCreate, TeamResponse, TeamWithMembers, JoinTeam, MemberResponse
from auth import get_current_user
from typing import List

router = APIRouter(prefix="/teams", tags=["teams"])

async def get_team_or_404(team_id: int, db: AsyncSession) -> Team:
    result = await db.execute(select(Team).where(Team.id == team_id))
    team = result.scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team

async def verify_team_member(user_id: int, team_id: int, db: AsyncSession):
    result = await db.execute(
        select(TeamMember).where(
            TeamMember.user_id == user_id,
            TeamMember.team_id == team_id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not a team member")

@router.post("", response_model=TeamResponse)
async def create_team(
    team_data: TeamCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    team = Team(name=team_data.name)
    db.add(team)
    await db.flush()

    # Add creator as member
    member = TeamMember(user_id=current_user.id, team_id=team.id)
    db.add(member)
    await db.commit()
    await db.refresh(team)
    return team

@router.get("", response_model=List[TeamResponse])
async def list_my_teams(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Team)
        .join(TeamMember)
        .where(TeamMember.user_id == current_user.id)
    )
    return result.scalars().all()

@router.get("/{team_id}", response_model=TeamWithMembers)
async def get_team(
    team_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check team exists first, then membership
    result = await db.execute(
        select(Team)
        .options(selectinload(Team.members).selectinload(TeamMember.user))
        .where(Team.id == team_id)
    )
    team = result.scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    await verify_team_member(current_user.id, team_id, db)

    # Transform to response
    members = [
        MemberResponse(
            id=m.user.id,
            username=m.user.username,
            joined_at=m.joined_at
        ) for m in team.members
    ]

    return TeamWithMembers(
        id=team.id,
        name=team.name,
        invite_code=team.invite_code,
        created_at=team.created_at,
        members=members
    )

@router.post("/join", response_model=TeamResponse)
async def join_team(
    join_data: JoinTeam,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Team).where(Team.invite_code == join_data.invite_code)
    )
    team = result.scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=404, detail="Invalid invite code")

    # Check if already member
    result = await db.execute(
        select(TeamMember).where(
            TeamMember.user_id == current_user.id,
            TeamMember.team_id == team.id
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already a member")

    member = TeamMember(user_id=current_user.id, team_id=team.id)
    db.add(member)
    await db.commit()
    return team

@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_team(
    team_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await verify_team_member(current_user.id, team_id, db)
    team = await get_team_or_404(team_id, db)
    await db.delete(team)
    await db.commit()
