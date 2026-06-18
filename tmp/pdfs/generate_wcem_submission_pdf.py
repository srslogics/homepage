from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


ROOT = Path("/Users/shubhamsingh/Documents/New project/homepage")
OUT_DIR = ROOT / "output" / "pdf"
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUT_PATH = OUT_DIR / "wcem-one-page-letter.pdf"


def build_styles():
    styles = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "title",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=15,
            leading=18,
            textColor=colors.HexColor("#0f1c2f"),
            alignment=TA_CENTER,
            spaceAfter=4,
        ),
        "subtitle": ParagraphStyle(
            "subtitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9.2,
            leading=11,
            textColor=colors.HexColor("#3d516e"),
            alignment=TA_CENTER,
            spaceAfter=12,
        ),
        "label": ParagraphStyle(
            "label",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9.2,
            leading=11,
            textColor=colors.HexColor("#0f1c2f"),
            spaceAfter=2,
        ),
        "body": ParagraphStyle(
            "body",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=9.35,
            leading=13.1,
            alignment=TA_JUSTIFY,
            textColor=colors.HexColor("#223248"),
            spaceAfter=5,
        ),
        "body_left": ParagraphStyle(
            "body_left",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=9.35,
            leading=13.1,
            alignment=TA_LEFT,
            textColor=colors.HexColor("#223248"),
            spaceAfter=3,
        ),
        "section": ParagraphStyle(
            "section",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=10.2,
            leading=12,
            textColor=colors.HexColor("#0f1c2f"),
            spaceBefore=4,
            spaceAfter=4,
        ),
        "bullet": ParagraphStyle(
            "bullet",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=9.15,
            leading=12.1,
            leftIndent=10,
            firstLineIndent=0,
            bulletIndent=0,
            textColor=colors.HexColor("#223248"),
            spaceAfter=1,
        ),
        "signoff": ParagraphStyle(
            "signoff",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=9.2,
            leading=12,
            alignment=TA_LEFT,
            textColor=colors.HexColor("#223248"),
            spaceAfter=1,
        ),
    }


def hr(width_mm=165):
    line = "_" * 160
    return Paragraph(
        f'<font color="#d5dfec">{line[: int(width_mm)]}</font>',
        ParagraphStyle(
            "hr",
            fontName="Helvetica",
            fontSize=4,
            leading=4,
            alignment=TA_CENTER,
        ),
    )


def build_pdf():
    styles = build_styles()
    doc = SimpleDocTemplate(
        str(OUT_PATH),
        pagesize=A4,
        leftMargin=17 * mm,
        rightMargin=17 * mm,
        topMargin=11 * mm,
        bottomMargin=11 * mm,
    )

    story = []

    story.append(Paragraph("To", styles["label"]))
    story.append(
        Paragraph(
            "The Director / Management<br/>"
            "Wainganga College of Engineering and Management (WCEM)<br/>"
            "Near Gumgaon Railway Station, Dongargaon, Wardha Road,<br/>"
            "Nagpur, Maharashtra 441108",
            styles["body_left"],
        )
    )
    story.append(Spacer(1, 2))
    story.append(
        Paragraph(
            "<b>Subject:</b> Proposal for Institutional Software Audit and Integrated Management Platform",
            styles["body_left"],
        )
    )
    story.append(Spacer(1, 3))

    body_paragraphs = [
        "Respected Sir/Madam,",
        "This submission is made to respectfully propose a structured institutional software initiative for Wainganga College of Engineering and Management.",
        "WCEM reflects the scale and operational maturity of a serious higher-education institution, with visible academic, examination, placement, compliance, and student-facing digital processes. In such an environment, the core challenge is often not the absence of software, but the fragmentation of systems, data, approvals, reporting, and department-level coordination.",
        "In view of this, SrS Logics proposes a <b>Unified Institutional Management Platform</b> for WCEM, aligned to the college's operational structure rather than to a generic ERP template.",
    ]
    for text in body_paragraphs:
        story.append(Paragraph(text, styles["body"]))

    story.append(Paragraph("The proposed platform may be structured to support admissions, student records, examinations, departmental administration, placement operations, compliance workflows, and management reporting.", styles["body"]))

    story.append(Paragraph("Recommended First Stage", styles["section"]))
    story.append(
        Paragraph(
            "<b>Institutional Software Audit and System Blueprint for WCEM</b>",
            styles["body_left"],
        )
    )

    audit_items = [
        "current-process and system review",
        "workflow and approval mapping",
        "identification of operational gaps",
        "module and dashboard recommendations",
        "phase-wise implementation roadmap",
    ]
    for item in audit_items:
        story.append(Paragraph(item, styles["bullet"], bulletText="-"))

    closing_paragraphs = [
        "This approach gives the institution a low-risk and professional basis for evaluating whether a larger integrated platform should be pursued.",
        "SrS Logics builds internal systems around real operating requirements, with emphasis on workflow clarity, administrative control, and phased deployment.",
        "We would be grateful for an opportunity to present this proposal and discuss whether WCEM may consider an initial institutional software audit and blueprint exercise.",
    ]
    story.append(Spacer(1, 2))
    for text in closing_paragraphs:
        story.append(Paragraph(text, styles["body"]))

    story.append(Spacer(1, 5))
    signoff = [
        "Regards,",
        "<b>Shubham Singh</b> | <b>SrS Logics</b> | Custom Software and Institutional Systems",
        "shubhamsingh@srslogics.com | +91 9270925106 | https://srslogics.com/",
    ]
    for line in signoff:
        story.append(Paragraph(line, styles["signoff"]))

    doc.build(story)


if __name__ == "__main__":
    build_pdf()
    print(OUT_PATH)
