"""
Analytics API endpoints - Interview Analysis Results
"""
import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from datetime import datetime

from dependencies.database import get_db

logger = logging.getLogger(__name__)
router = APIRouter()


class NotableMoment(BaseModel):
    time: str
    description: str
    type: str  # "positive" or "negative"


class CandidateAnalysis(BaseModel):
    id: str
    name: str
    position: str
    interviewDate: str
    duration: int
    technicalScore: int
    communicationScore: int
    overallScore: int
    verdict: str
    keyStrengths: List[str]
    keyInsights: str
    notableMoments: List[NotableMoment]


class AnalyticsResponse(BaseModel):
    candidates: List[CandidateAnalysis]
    total: int
    page: int
    pageSize: int


@router.get("", response_model=AnalyticsResponse)
async def get_analytics(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    verdict: Optional[str] = Query(None, description="Filter by verdict: STRONG_HIRE, HIRE, MAYBE, NO_HIRE"),
    search: Optional[str] = Query(None, description="Search by candidate name or position"),
    sort_by: str = Query("overallScore", description="Sort field"),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
    db=Depends(get_db)
):
    """
    Get interview analysis results for the analytics page.
    
    Returns a paginated list of candidate analyses sorted by score.
    """
    try:
        collection = db["interview_analyses"]
        
        # Build query filter
        query = {}
        
        if verdict:
            query["verdict"] = verdict
        
        if search:
            query["$or"] = [
                {"candidate_name": {"$regex": search, "$options": "i"}},
                {"position": {"$regex": search, "$options": "i"}}
            ]
        
        # Get total count
        total = await collection.count_documents(query)
        
        # Build sort
        sort_field_map = {
            "overallScore": "overall_score",
            "technicalScore": "technical_score",
            "communicationScore": "communication_score",
            "interviewDate": "interview_date",
            "name": "candidate_name"
        }
        sort_field = sort_field_map.get(sort_by, "overall_score")
        sort_direction = -1 if sort_order == "desc" else 1
        
        # Fetch paginated results
        skip = (page - 1) * page_size
        cursor = collection.find(query).sort(sort_field, sort_direction).skip(skip).limit(page_size)
        
        candidates = []
        async for doc in cursor:
            # Debug log to see what's actually in the document
            logger.info(f"Document keys: {list(doc.keys())}")
            logger.info(f"candidate_name: {doc.get('candidate_name')}, position: {doc.get('position')}")
            
            # Transform to frontend format
            # Ensure name and position are never None
            candidate_name = doc.get("candidate_name") or "Unknown Candidate"
            position = doc.get("position") or "Unknown Position"
            
            candidates.append(CandidateAnalysis(
                id=str(doc.get("_id", doc.get("session_id", ""))),
                name=candidate_name,
                position=position,
                interviewDate=doc.get("interview_date", datetime.utcnow().isoformat()),
                duration=doc.get("duration", 0),
                technicalScore=doc.get("technical_score", 0),
                communicationScore=doc.get("communication_score", 0),
                overallScore=doc.get("overall_score", 0),
                verdict=doc.get("verdict", "MAYBE"),
                keyStrengths=doc.get("key_strengths", []),
                keyInsights=doc.get("key_insights", ""),
                notableMoments=[
                    NotableMoment(
                        time=m.get("time", "00:00"),
                        description=m.get("description", ""),
                        type=m.get("type", "positive")
                    )
                    for m in doc.get("notable_moments", [])
                ]
            ))
        
        return AnalyticsResponse(
            candidates=candidates,
            total=total,
            page=page,
            pageSize=page_size
        )
        
    except Exception as e:
        logger.exception(f"Failed to fetch analytics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch analytics: {str(e)}")


@router.get("/{analysis_id}")
async def get_analysis_detail(
    analysis_id: str,
    db=Depends(get_db)
):
    """
    Get detailed analysis for a specific interview.
    
    Returns full analysis including conversation transcript and code.
    """
    try:
        collection = db["interview_analyses"]
        doc = await collection.find_one({"_id": analysis_id})
        
        if not doc:
            # Try finding by session_id
            doc = await collection.find_one({"session_id": analysis_id})
        
        if not doc:
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        # Return full document (excluding MongoDB _id)
        doc["id"] = str(doc.pop("_id", analysis_id))
        return doc
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Failed to fetch analysis detail: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch analysis: {str(e)}")


@router.get("/stats/summary")
async def get_analytics_summary(db=Depends(get_db)):
    """
    Get summary statistics for all interviews.
    """
    try:
        collection = db["interview_analyses"]
        
        # Count by verdict
        pipeline = [
            {"$group": {
                "_id": "$verdict",
                "count": {"$sum": 1},
                "avgTechnical": {"$avg": "$technical_score"},
                "avgCommunication": {"$avg": "$communication_score"},
                "avgOverall": {"$avg": "$overall_score"}
            }}
        ]
        
        verdict_stats = {}
        async for doc in collection.aggregate(pipeline):
            verdict_stats[doc["_id"]] = {
                "count": doc["count"],
                "avgTechnical": round(doc["avgTechnical"] or 0, 1),
                "avgCommunication": round(doc["avgCommunication"] or 0, 1),
                "avgOverall": round(doc["avgOverall"] or 0, 1)
            }
        
        # Get overall stats
        total = await collection.count_documents({})
        
        # Get averages
        avg_pipeline = [
            {"$group": {
                "_id": None,
                "avgTechnical": {"$avg": "$technical_score"},
                "avgCommunication": {"$avg": "$communication_score"},
                "avgOverall": {"$avg": "$overall_score"},
                "avgDuration": {"$avg": "$duration"}
            }}
        ]
        
        overall_stats = {
            "avgTechnical": 0,
            "avgCommunication": 0,
            "avgOverall": 0,
            "avgDuration": 0
        }
        
        async for doc in collection.aggregate(avg_pipeline):
            overall_stats = {
                "avgTechnical": round(doc["avgTechnical"] or 0, 1),
                "avgCommunication": round(doc["avgCommunication"] or 0, 1),
                "avgOverall": round(doc["avgOverall"] or 0, 1),
                "avgDuration": round(doc["avgDuration"] or 0, 1)
            }
        
        return {
            "total": total,
            "byVerdict": verdict_stats,
            "averages": overall_stats
        }
        
    except Exception as e:
        logger.exception(f"Failed to fetch analytics summary: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch summary: {str(e)}")
