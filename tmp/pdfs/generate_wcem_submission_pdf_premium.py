from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


ROOT = Path("/Users/shubhamsingh/Documents/New project/homepage")
OUT_DIR = ROOT / "output" / "pdf"
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUT_PATH = OUT_DIR / "wcem-one-page-letter-premium.pdf"


def styles():
    base = getSampleStyleSheet()
    return {
        "micro": ParagraphStyle(
            "micro",
            parent=base["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=8.2,
            leading=10,
            textColor=colors.HexColor("#6a7b93"),
            alignment=TA_LEFT,
            spaceAfter=2,
        ),
        "brand": ParagraphStyle(
            "brand",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=16.5,
            leading=18,
            textColor=colors.white,
            alignment=TA_LEFT,
            spaceAfter=2,
        ),
        "brand_sub": ParagraphStyle(
            "brand_sub",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=8.8,
            leading=10,
            textColor=colors.HexColor("#dbe7f5"),
            alignment=TA_LEFT,
            spaceAfter=0,
        ),
        "label": ParagraphStyle(
            "label",
            parent=base["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=8.8,
            leading=11,
            textColor=colors.HexColor("#0f1c2f"),
            spaceAfter=2,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=9.1,
            leading=12.6,
            alignment=TA_JUSTIFY,
            textColor=colors.HexColor("#223248"),
            spaceAfter=4,
        ),
        "body_left": ParagraphStyle(
            "body_left",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=9.1,
            leading=12.6,
            alignment=TA_LEFT,
            textColor=colors.HexColor("#223248"),
            spaceAfter=3,
        ),
        "subject": ParagraphStyle(
            "subject",
            parent=base["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=10.2,
            leading=12.4,
            textColor=colors.HexColor("#11233c"),
            spaceAfter=6,
        ),
        "section": ParagraphStyle(
            "section",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=9.8,
            leading=11.8,
            textColor=colors.HexColor("#11233c"),
            spaceBefore=2,
            spaceAfter=3,
        ),
        "bullet": ParagraphStyle(
            "bullet",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=8.95,
            leading=11.7,
            leftIndent=10,
            bulletIndent=0,
            textColor=colors.HexColor("#223248"),
            spaceAfter=1,
        ),
        "sign": ParagraphStyle(
            "sign",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=8.9,
            leading=11.4,
            textColor=colors.HexColor("#223248"),
            spaceAfter=1,
        ),
    }


def header_block(s):
    left = [
        Paragraph("SrS Logics", s["brand"]),
        Paragraph("Institutional Software and Internal Systems", s["brand_sub"]),
    ]
    t = Table([[left]], colWidths=[176 * mm])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#12243f")),
                ("BOX", (0, 0), (-1, -1), 0, colors.white),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    return t


def highlight_box(s, title, items):
    rows = [[Paragraph(f"<b>{title}</b>", s["section"])]]
    for item in items:
        rows.append([Paragraph(item, s["bullet"], bulletText="-")])
    t = Table(rows, colWidths=[168 * mm])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f3f7fb")),
                ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#d3dfec")),
                ("LINEBEFORE", (0, 0), (0, -1), 3, colors.HexColor("#2d5b93")),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return t


def generate():
    s = styles()
    doc = SimpleDocTemplate(
        str(OUT_PATH),
        pagesize=A4,
        leftMargin=17 * mm,
        rightMargin=17 * mm,
        topMargin=11 * mm,
        bottomMargin=11 * mm,
    )

    story = []
    story.append(header_block(s))
    story.append(Spacer(1, 7))

    story.append(Paragraph("To", s["label"]))
    story.append(
        Paragraph(
            "The Director / Management<br/>"
            "Wainganga College of Engineering and Management (WCEM)<br/>"
            "Near Gumgaon Railway Station, Dongargaon, Wardha Road,<br/>"
            "Nagpur, Maharashtra 441108",
            s["body_left"],
        )
    )
    story.append(Spacer(1, 2))
    story.append(
        Paragraph(
            "Subject: Proposal for Institutional Software Audit and Integrated Management Platform",
            s["subject"],
        )
    )

    paragraphs = [
        "Respected Sir/Madam,",
        "This submission is made to respectfully propose a structured institutional software initiative for Wainganga College of Engineering and Management.",
        "WCEM reflects the scale and operational maturity of a serious higher-education institution, with visible academic, examination, placement, compliance, and student-facing digital processes. In such an environment, the core challenge is often not the absence of software, but the fragmentation of systems, data, approvals, reporting, and department-level coordination.",
        "In view of this, SrS Logics proposes a <b>Unified Institutional Management Platform</b> for WCEM, aligned to the college's operational structure rather than to a generic ERP template.",
        "The proposed platform may be structured to support admissions, student records, examinations, departmental administration, placement operations, compliance workflows, and management reporting.",
    ]
    for p in paragraphs:
        story.append(Paragraph(p, s["body"]))

    story.append(
        highlight_box(
            s,
            "Recommended First Stage: Institutional Software Audit and System Blueprint for WCEM",
            [
                "current-process and system review",
                "workflow and approval mapping",
                "identification of operational gaps",
                "module and dashboard recommendations",
                "phase-wise implementation roadmap",
            ],
        )
    )

    story.append(Spacer(1, 5))
    story.append(
        Paragraph(
            "This approach gives the institution a low-risk and professional basis for evaluating whether a larger integrated platform should be pursued.",
            s["body"],
        )
    )
    story.append(
        Paragraph(
            "SrS Logics builds internal systems around real operating requirements, with emphasis on workflow clarity, administrative control, and phased deployment.",
            s["body"],
        )
    )
    story.append(
        Paragraph(
            "We would be grateful for an opportunity to present this proposal and discuss whether WCEM may consider an initial institutional software audit and blueprint exercise.",
            s["body"],
        )
    )

    story.append(Spacer(1, 5))
    story.append(Paragraph("Regards,", s["sign"]))
    story.append(Paragraph("<b>Shubham Singh</b> | <b>SrS Logics</b> | Custom Software and Institutional Systems", s["sign"]))
    story.append(Paragraph("shubhamsingh@srslogics.com | +91 9270925106 | https://srslogics.com/", s["sign"]))

    doc.build(story)


if __name__ == "__main__":
    generate()
    print(OUT_PATH)
