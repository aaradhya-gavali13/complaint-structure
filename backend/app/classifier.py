import json
import logging
import requests
from backend.app.config import settings

logger = logging.getLogger("classifier")

ALLOWED_DEPARTMENTS = {
    "Fraud & Security",
    "Credit Reporting",
    "Debt Collection",
    "Mortgage",
    "Loans & Lending",
    "Credit Cards",
    "Banking & Accounts",
    "Payments & Transactions",
    "Fees & Charges",
    "Digital Wallet",
    "Customer Service",
    "Advertising & Communications",
    "Other / Human Review"
}

ALLOWED_PRIORITIES = {
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL"
}

SYSTEM_PROMPT = """You are an AI government grievance classification system.
Analyze the citizen complaint and classify it.
Return ONLY valid JSON with exactly these fields:
{
    "issue": "short description of the actual problem",
    "department": "department name",
    "priority": "LOW, MEDIUM, HIGH, or CRITICAL",
    "confidence": 0.0,
    "needs_human_review": true,
    "reason": "short explanation"
}

Allowed departments:
1. Fraud & Security
2. Credit Reporting
3. Debt Collection
4. Mortgage
5. Loans & Lending
6. Credit Cards
7. Banking & Accounts
8. Payments & Transactions
9. Fees & Charges
10. Digital Wallet
11. Customer Service
12. Advertising & Communications
13. Other / Human Review

PRIORITY RULES:
CRITICAL: Active financial fraud, large unauthorized transactions, identity theft in progress, immediate security danger.
HIGH: Unauthorized transactions, fraud or scams, identity theft, serious debt collection threats, missing money.
MEDIUM: Payment problems, account problems, card problems, unexpected fees, customer service problems.
LOW: General information, account opening, product inquiries, advertising, routine service requests.

IMPORTANT RULES:
1. Select the closest department from the allowed list.
2. If department cannot be determined reliably, use "Other / Human Review".
3. If confidence is below 0.70 or complaint is ambiguous, set needs_human_review to true.
4. Confidence must be between 0.0 and 1.0.
5. Return ONLY JSON without markdown fences."""


def _fallback_classification(complaint: str, reason_note: str = "Awaiting manual triage") -> dict:
    """Provides a safe, rule-guided fallback if Ollama is slow or unreachable."""
    lower = complaint.lower()

    dept = "Other / Human Review"
    prio = "MEDIUM"
    issue = "Citizen Grievance Submission"

    if any(w in lower for w in ["stolen", "scam", "fraud", "unauthorized", "hacked", "identity theft"]):
        dept = "Fraud & Security"
        prio = "HIGH"
        issue = "Suspected fraud or unauthorized activity"
    elif any(w in lower for w in ["credit card", "card stolen", "cvv", "charge on card"]):
        dept = "Credit Cards"
        prio = "HIGH"
        issue = "Credit card grievance"
    elif any(w in lower for w in ["loan", "lending", "interest rate", "emi", "mortgage"]):
        dept = "Loans & Lending"
        prio = "MEDIUM"
        issue = "Loan or lending issue"
    elif any(w in lower for w in ["debt", "collector", "harassment", "recovery agent"]):
        dept = "Debt Collection"
        prio = "HIGH"
        issue = "Debt collection grievance"
    elif any(w in lower for w in ["upi", "wallet", "paytm", "gpay", "phonepe"]):
        dept = "Digital Wallet"
        prio = "MEDIUM"
        issue = "Digital payment or wallet dispute"
    elif any(w in lower for w in ["fee", "charge", "penalty", "deduction"]):
        dept = "Fees & Charges"
        prio = "MEDIUM"
        issue = "Fee dispute"
    elif any(w in lower for w in ["bank", "atm", "branch", "account balance", "deposit"]):
        dept = "Banking & Accounts"
        prio = "MEDIUM"
        issue = "Banking service dispute"

    return {
        "issue": issue,
        "department": dept,
        "priority": prio,
        "confidence": 0.65,
        "needs_human_review": True,
        "reason": f"{reason_note}. Flagged for review by civic intake officer."
    }


def classify_complaint(complaint: str) -> dict:
    """
    Sends the complaint text to Ollama (qwen2.5:3b).
    Validates output and falls back cleanly if LLM is offline or times out.
    """
    prompt = f"""{SYSTEM_PROMPT}

Citizen complaint:
"{complaint}"

Return ONLY JSON."""

    payload = {
        "model": settings.OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "format": "json",
        "options": {
            "temperature": 0.0,
            "num_predict": 160
        }
    }

    try:
        response = requests.post(
            settings.OLLAMA_URL,
            json=payload,
            timeout=settings.OLLAMA_TIMEOUT_SECONDS
        )
        response.raise_for_status()
        data = response.json()
        raw_output = data.get("response", "").strip()

        # Handle markdown fence stripping if any
        if raw_output.startswith("```json"):
            raw_output = raw_output[7:]
        if raw_output.startswith("```"):
            raw_output = raw_output[3:]
        if raw_output.endswith("```"):
            raw_output = raw_output[:-3]

        result = json.loads(raw_output.strip())

        department = result.get("department", "Other / Human Review")
        if department not in ALLOWED_DEPARTMENTS:
            department = "Other / Human Review"

        priority = result.get("priority", "MEDIUM")
        if priority not in ALLOWED_PRIORITIES:
            priority = "MEDIUM"

        try:
            confidence = float(result.get("confidence", 0.0))
        except (ValueError, TypeError):
            confidence = 0.0

        confidence = max(0.0, min(1.0, confidence))

        needs_human_review = bool(result.get("needs_human_review", False))
        if confidence < 0.70:
            needs_human_review = True

        return {
            "issue": str(result.get("issue", "Citizen Grievance"))[:255],
            "department": department,
            "priority": priority,
            "confidence": confidence,
            "needs_human_review": needs_human_review,
            "reason": str(result.get("reason", "Standard classification"))[:500]
        }

    except requests.exceptions.Timeout:
        logger.warning("Ollama classification timed out. Utilizing safe civic intake fallback.")
        return _fallback_classification(complaint, "Automated classification timed out on intake")
    except Exception as e:
        logger.warning(f"Ollama classification error: {e}. Utilizing safe civic intake fallback.")
        return _fallback_classification(complaint, "Automated classification unavailable")
