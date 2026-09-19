import os
import sys
from pathlib import Path
root_dir = str(Path(__file__).resolve().parent.parent)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

import datetime
from backend.app.database import init_db, SessionLocal
from backend.app.models import Complaint, StatusHistory

SAMPLE_COMPLAINTS = [
    {
        "complaint_id": "GRV-20260918-00010",
        "name": "Vikram Malhotra",
        "phone": "+91 9823011223",
        "address": "45 Park Avenue, Colaba, Mumbai 400005",
        "complaint_text": "Immediate help needed! Over $2,800 was transferred out of my fixed deposit account through unauthorized wire transfers within 10 minutes. My phone SIM was cloned.",
        "issue": "SIM cloning and unauthorized wire transfer",
        "department": "Fraud & Security",
        "priority": "CRITICAL",
        "confidence": 0.96,
        "needs_human_review": False,
        "reason": "Describes active severe financial identity theft and unauthorized large transfer.",
        "status": "Submitted",
        "days_ago": 0,
    },
    {
        "complaint_id": "GRV-20260918-00011",
        "name": "Sunita Sen",
        "phone": "+91 9845099887",
        "address": "Flat 12B, Salt Lake Sector 3, Kolkata 700091",
        "complaint_text": "A debt recovery agency is calling my elderly parents at 11 PM shouting abusive threats for a loan I never signed or guaranteed. They threatened to visit tomorrow.",
        "issue": "Abusive debt collection harassment",
        "department": "Debt Collection",
        "priority": "HIGH",
        "confidence": 0.91,
        "needs_human_review": False,
        "reason": "Threats of physical harm and illegal night-time debt recovery intimidation.",
        "status": "Assigned",
        "days_ago": 1,
    },
    {
        "complaint_id": "GRV-20260918-00012",
        "name": "Rahul Verma",
        "phone": "+91 9711223344",
        "address": "House 108, Model Town, Delhi 110009",
        "complaint_text": "An erroneous default status of 90+ days overdue is appearing on my CIBIL bureau credit report for an account closed 2 years ago. It has blocked my home loan sanction.",
        "issue": "Credit score dispute on closed account",
        "department": "Credit Reporting",
        "priority": "HIGH",
        "confidence": 0.88,
        "needs_human_review": False,
        "reason": "Inaccurate adverse reporting on credit file impacting loan approval.",
        "status": "In Progress",
        "days_ago": 2,
    },
    {
        "complaint_id": "GRV-20260918-00013",
        "name": "Priya Nambiar",
        "phone": "+91 9900112233",
        "address": "B-404, Indiranagar, Bengaluru 560038",
        "complaint_text": "My digital wallet payment of Rs 12,500 at the hospital merchant timed out but the money was debited from my bank. Neither merchant nor wallet acknowledges the funds.",
        "issue": "Failed digital payment debit without reversal",
        "department": "Digital Wallet",
        "priority": "MEDIUM",
        "confidence": 0.85,
        "needs_human_review": False,
        "reason": "Payment gateway timeout reconciliation failure.",
        "status": "Under Review",
        "days_ago": 2,
    },
    {
        "complaint_id": "GRV-20260918-00014",
        "name": "Amitabh Joshi",
        "phone": "+91 9422012345",
        "address": "Plot 18, Shivaji Nagar, Pune 411005",
        "complaint_text": "The bank deducted annual card maintenance fee of Rs 999 plus GST on a card that was explicitly promised lifetime free during credit sales promotion.",
        "issue": "Misleading card annual fee billing",
        "department": "Fees & Charges",
        "priority": "MEDIUM",
        "confidence": 0.84,
        "needs_human_review": False,
        "reason": "Fee dispute regarding lifetime free promotional terms.",
        "status": "Resolved",
        "days_ago": 4,
    },
    {
        "complaint_id": "GRV-20260918-00015",
        "name": "Fatima Sheikh",
        "phone": "+91 9167823456",
        "address": "702 Marine Crest, Bandra West, Mumbai 400050",
        "complaint_text": "Applied for home loan balance transfer 45 days ago. Property original documents submitted to branch manager are missing and staff cannot locate the file.",
        "issue": "Lost title deed documents by loan servicing branch",
        "department": "Mortgage",
        "priority": "HIGH",
        "confidence": 0.89,
        "needs_human_review": False,
        "reason": "Loss of critical citizen property documents during mortgage processing.",
        "status": "Under Review",
        "days_ago": 3,
    },
    {
        "complaint_id": "GRV-20260918-00016",
        "name": "Karan Singhania",
        "phone": "+91 9810198765",
        "address": "Villa 14, Sector 54, Gurugram 122002",
        "complaint_text": "I keep getting automated promotional loan spam calls despite registering on the national Do-Not-Call (DND) registry multiple times.",
        "issue": "Violation of DND commercial telemarketing regulations",
        "department": "Advertising & Communications",
        "priority": "LOW",
        "confidence": 0.79,
        "needs_human_review": False,
        "reason": "Commercial telemarketing compliance grievance.",
        "status": "Resolved",
        "days_ago": 5,
    },
    {
        "complaint_id": "GRV-20260918-00017",
        "name": "Meera Krishnan",
        "phone": "+91 9444012987",
        "address": "12 Anna Salai, T. Nagar, Chennai 600017",
        "complaint_text": "Strange charge of $1.50 from a foreign vendor appearing on card, not sure if this is a recurring subscription or a test probe by hackers.",
        "issue": "Ambiguous micro-transaction probe",
        "department": "Other / Human Review",
        "priority": "MEDIUM",
        "confidence": 0.62,
        "needs_human_review": True,
        "reason": "Confidence below threshold (0.62); ambiguous merchant probe requiring intake officer verification.",
        "status": "Submitted",
        "days_ago": 0,
    },
    {
        "complaint_id": "GRV-20260918-00018",
        "name": "Devendra Patil",
        "phone": "+91 9822098712",
        "address": "Survey 44, Hadapsar, Pune 411028",
        "complaint_text": "ATM dispensed Rs 2,000 less than requested amount during cash withdrawal at City Center ATM, but receipt and account statement show full debit.",
        "issue": "ATM cash cash-out shortfall",
        "department": "Banking & Accounts",
        "priority": "MEDIUM",
        "confidence": 0.86,
        "needs_human_review": False,
        "reason": "ATM cash journal shortfall dispute.",
        "status": "Assigned",
        "days_ago": 1,
    },
    {
        "complaint_id": "GRV-20260918-00019",
        "name": "Ananya Roy",
        "phone": "+91 9830045612",
        "address": "Flat 5C, Alipore Road, Kolkata 700027",
        "complaint_text": "Need clarification regarding interest calculation methodology on flexible overdraft account facility.",
        "issue": "Inquiry regarding loan interest computation",
        "department": "Loans & Lending",
        "priority": "LOW",
        "confidence": 0.82,
        "needs_human_review": False,
        "reason": "Informational request on loan product terms.",
        "status": "Resolved",
        "days_ago": 6,
    }
]


def seed():
    init_db()
    db = SessionLocal()
    try:
        now = datetime.datetime.utcnow()
        for data in SAMPLE_COMPLAINTS:
            existing = db.query(Complaint).filter(Complaint.complaint_id == data["complaint_id"]).first()
            if existing:
                continue

            created_time = now - datetime.timedelta(days=data["days_ago"], hours=data["days_ago"] * 2)

            comp = Complaint(
                complaint_id=data["complaint_id"],
                name=data["name"],
                phone=data["phone"],
                address=data["address"],
                complaint_text=data["complaint_text"],
                issue=data["issue"],
                department=data["department"],
                priority=data["priority"],
                confidence=data["confidence"],
                needs_human_review=data["needs_human_review"],
                reason=data["reason"],
                status=data["status"],
                created_at=created_time,
                updated_at=created_time,
            )
            db.add(comp)
            db.flush()

            history = StatusHistory(
                complaint_id=comp.complaint_id,
                old_status="None",
                new_status=comp.status,
                admin_note="Complaint auto-triaged and assigned to administrative roster.",
                changed_by="Intake Automation",
                created_at=created_time,
            )
            db.add(history)

        db.commit()
        print(f"Seeded {len(SAMPLE_COMPLAINTS)} sample complaints successfully.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
