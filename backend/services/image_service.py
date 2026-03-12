# backend/services/image_service.py
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from config import settings

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    api_key=settings.GEMINI_API_KEY
)

def analyze_complaint_image(image_url: str, text: str):

    prompt = f"""
You are analyzing a civic infrastructure complaint.

Complaint text:
{text}

Analyze the image and identify:
- infrastructure type
- severity
- possible department

Return JSON:
{{
 "asset_type": "...",
 "urgency": "...",
 "department_hint": "..."
}}
"""

    response = llm.invoke([
        HumanMessage(content=[
            {"type": "text", "text": prompt},
            {"type": "image_url", "image_url": image_url}
        ])
    ])

    return response.content