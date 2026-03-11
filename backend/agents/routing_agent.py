# backend/agents/routing_agent.py
import json
from langgraph.graph import StateGraph, END
from typing import TypedDict, Optional, Dict
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from services.geo_service import get_nearest_asset_tool
from config import settings
from db import SessionLocal

# 1. Define the State
class ComplaintState(TypedDict):
    complaint_id: int
    text: str
    lat: float
    lng: float
    extracted_asset_type: Optional[str]
    urgency: Optional[str]
    mapped_asset_id: Optional[int]
    department_id: Optional[int]
    reasoning_log: list

# Initialize LLM
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", api_key=settings.GEMINI_API_KEY, temperature=0.1)

# 2. Nodes
def extraction_node(state: ComplaintState):
    """Agent reasons about the text to extract parameters."""
    prompt = f"""
    Analyze the civic complaint: "{state['text']}"
    Extract the infrastructure type and urgency.
    Return strictly JSON: {{"asset_type": "Streetlight/Drain/Tree/Road/Electric Pole", "urgency": "LOW/MEDIUM/HIGH/CRITICAL"}}
    """
    response = llm.invoke([HumanMessage(content=prompt)])
    try:
        data = json.loads(response.content.replace("```json", "").replace("```", "").strip())
        state["extracted_asset_type"] = data.get("asset_type")
        state["urgency"] = data.get("urgency", "MEDIUM")
        state["reasoning_log"].append(f"AI Extracted: {data}")
    except:
        state["extracted_asset_type"] = None
        state["urgency"] = "MEDIUM"
    return state

def tool_execution_node(state: ComplaintState):
    """Uses the geo_service to find exact PostGIS asset based on LLM extraction."""
    db = SessionLocal()
    try:
        nearest = get_nearest_asset_tool(db, state["lat"], state["lng"], state["extracted_asset_type"])
        if nearest:
            state["mapped_asset_id"] = nearest["asset_id"]
            state["department_id"] = nearest["department_id"]
            state["reasoning_log"].append(f"GeoTool found asset: {nearest}")
    finally:
        db.close()
    return state

def finalize_routing_node(state: ComplaintState):
    """Commits the LangGraph reasoning back to the database."""
    from models import Complaint, WorkflowEvent, ComplaintAnalysis
    db = SessionLocal()
    try:
        # Update Complaint
        complaint = db.query(Complaint).filter(Complaint.id == state["complaint_id"]).first()
        complaint.status = 'CLASSIFIED'
        if state["mapped_asset_id"]:
            complaint.asset_id = state["mapped_asset_id"]
            complaint.department_id = state["department_id"]
        
        # Save Analysis & Workflow Event
        analysis = ComplaintAnalysis(
            complaint_id=state["complaint_id"],
            asset_type=state["extracted_asset_type"],
            urgency=state["urgency"],
            llm_output={"log": state["reasoning_log"]}
        )
        event = WorkflowEvent(
            complaint_id=state["complaint_id"],
            event_type="AI_ROUTED",
            agent_name="LangGraph_Router",
            payload={"assigned_dept": state["department_id"], "asset": state["mapped_asset_id"]}
        )
        
        db.add(analysis)
        db.add(event)
        db.commit()
    finally:
        db.close()
    return state

# 3. Build the Graph
workflow = StateGraph(ComplaintState)
workflow.add_node("extract", extraction_node)
workflow.add_node("geo_lookup", tool_execution_node)
workflow.add_node("finalize", finalize_routing_node)

workflow.set_entry_point("extract")
workflow.add_edge("extract", "geo_lookup")
workflow.add_edge("geo_lookup", "finalize")
workflow.add_edge("finalize", END)

routing_app = workflow.compile()

def run_routing_agent(complaint_id: int, text: str, lat: float, lng: float):
    """Entry point to trigger the graph async."""
    initial_state = {
        "complaint_id": complaint_id,
        "text": text,
        "lat": lat,
        "lng": lng,
        "reasoning_log": []
    }
    routing_app.invoke(initial_state)