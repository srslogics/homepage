from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path("/Users/shubhamsingh/Documents/New project/homepage")
OUT_DIR = ROOT / "output" / "pdf"
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUT_PATH = OUT_DIR / "wcem-prospect-premium.pdf"


def get_styles():
    base = getSampleStyleSheet()
    return {
        "cover_kicker": ParagraphStyle(
            "cover_kicker",
            parent=base["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=10,
            leading=12,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#89a8d8"),
            spaceAfter=10,
            tracking=0.6,
        ),
        "cover_title": ParagraphStyle(
            "cover_title",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=23,
            leading=27,
            alignment=TA_CENTER,
            textColor=colors.white,
            spaceAfter=12,
        ),
        "cover_sub": ParagraphStyle(
            "cover_sub",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=11,
            leading=15,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#d9e5f4"),
            spaceAfter=20,
        ),
        "section_kicker": ParagraphStyle(
            "section_kicker",
            parent=base["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=8.5,
            leading=10,
            textColor=colors.HexColor("#5579ab"),
            spaceAfter=4,
        ),
        "h1": ParagraphStyle(
            "h1",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=17,
            leading=21,
            textColor=colors.HexColor("#10223c"),
            spaceAfter=8,
        ),
        "h2": ParagraphStyle(
            "h2",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=11.2,
            leading=14,
            textColor=colors.HexColor("#10223c"),
            spaceBefore=8,
            spaceAfter=5,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=13.7,
            alignment=TA_JUSTIFY,
            textColor=colors.HexColor("#24364d"),
            spaceAfter=7,
        ),
        "body_left": ParagraphStyle(
            "body_left",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=13.7,
            alignment=TA_LEFT,
            textColor=colors.HexColor("#24364d"),
            spaceAfter=6,
        ),
        "callout_title": ParagraphStyle(
            "callout_title",
            parent=base["Heading3"],
            fontName="Helvetica-Bold",
            fontSize=10.2,
            leading=12.5,
            textColor=colors.HexColor("#10223c"),
            spaceAfter=4,
        ),
        "small": ParagraphStyle(
            "small",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=8.8,
            leading=12,
            textColor=colors.HexColor("#4b607b"),
            spaceAfter=4,
        ),
        "footer": ParagraphStyle(
            "footer",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=10,
            textColor=colors.HexColor("#6a7b92"),
            alignment=TA_CENTER,
        ),
    }


def header_box(title, subtitle):
    data = [[
        Paragraph("SrS Logics", ParagraphStyle(
            "brand",
            fontName="Helvetica-Bold",
            fontSize=17,
            leading=19,
            textColor=colors.white,
            alignment=TA_LEFT,
            spaceAfter=3,
        )),
        Paragraph("Institutional Software and Internal Systems", ParagraphStyle(
            "tag",
            fontName="Helvetica",
            fontSize=9,
            leading=11,
            textColor=colors.HexColor("#d8e4f4"),
            alignment=TA_RIGHT,
        )),
    ]]
    t = Table(data, colWidths=[95 * mm, 75 * mm])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#132742")),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 11),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )
    return t


def bullets(items, style):
    return ListFlowable(
        [ListItem(Paragraph(item, style), leftIndent=0) for item in items],
        bulletType="bullet",
        start="-",
        leftIndent=14,
        bulletFontName="Helvetica",
        bulletFontSize=9,
        bulletColor=colors.HexColor("#2d5b93"),
    )


def callout(title, text, styles):
    t = Table(
        [[Paragraph(title, styles["callout_title"])], [Paragraph(text, styles["body_left"])]],
        colWidths=[168 * mm],
    )
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f4f7fb")),
                ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#d5e0ec")),
                ("LINEBEFORE", (0, 0), (0, -1), 3, colors.HexColor("#2d5b93")),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return t


def add_page_frame(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#dbe3ef"))
    canvas.setLineWidth(0.6)
    canvas.rect(14 * mm, 12 * mm, A4[0] - 28 * mm, A4[1] - 24 * mm)
    canvas.setFont("Helvetica", 8.5)
    canvas.setFillColor(colors.HexColor("#72839a"))
    canvas.drawCentredString(A4[0] / 2, 8 * mm, f"WCEM Institutional Platform Prospect | Page {doc.page}")
    canvas.restoreState()


def build_pdf():
    s = get_styles()
    doc = SimpleDocTemplate(
        str(OUT_PATH),
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
    )

    story = []

    cover = Table(
        [[Paragraph("INSTITUTIONAL SOFTWARE PROSPECT", s["cover_kicker"])],
         [Paragraph("Integrated Institutional Management Platform for WCEM", s["cover_title"])],
         [Paragraph(
            "Prepared as a concept proposal for Wainganga College of Engineering and Management, Nagpur, "
            "with focus on academic administration, examinations, placements, compliance workflows, and management reporting.",
            s["cover_sub"],
         )],
         [Paragraph(
            "Submitted by SrS Logics<br/>Custom Software and Institutional Systems<br/>Nagpur, Maharashtra",
            ParagraphStyle(
                "cover_contact",
                fontName="Helvetica",
                fontSize=10,
                leading=14,
                alignment=TA_CENTER,
                textColor=colors.white,
            ),
         )]],
        colWidths=[170 * mm],
    )
    cover.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#132742")),
                ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#203c61")),
                ("LEFTPADDING", (0, 0), (-1, -1), 18),
                ("RIGHTPADDING", (0, 0), (-1, -1), 18),
                ("TOPPADDING", (0, 0), (-1, -1), 28),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 28),
            ]
        )
    )
    story.append(Spacer(1, 38 * mm))
    story.append(cover)
    story.append(Spacer(1, 18 * mm))
    story.append(
        Paragraph(
            "Confidential concept submission intended for institutional review. This document outlines the software vision, "
            "functional scope, and recommended first-stage engagement for WCEM.",
            s["small"],
        )
    )
    story.append(PageBreak())

    story.append(header_box("SrS Logics", "Institutional Software and Internal Systems"))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Executive Positioning", s["section_kicker"]))
    story.append(Paragraph("Why This Proposal Matters", s["h1"]))
    story.append(
        Paragraph(
            "WCEM already operates at the level of a serious higher-education institution, with broad academic programs, "
            "examination workflows, placement activities, committee structures, quality systems, compliance obligations, and "
            "student-facing digital processes. In such environments, the greater digital challenge is usually not the absence "
            "of tools, but the fragmentation of systems, reporting layers, approvals, and cross-department coordination.",
            s["body"],
        )
    )
    story.append(
        callout(
            "Strategic Position",
            "This proposal is not framed as a generic ERP sale. It is framed as an institutional integration and modernization "
            "proposal aligned to WCEM's academic and administrative reality.",
            s,
        )
    )
    story.append(Spacer(1, 8))
    story.append(Paragraph("Institutional Readiness Signals Observed Publicly", s["h2"]))
    story.append(
        bullets(
            [
                "multi-program structure across engineering, diploma, MBA, and MCA",
                "public examination notices, timetables, result-related processes, and verification references",
                "student portal-led digital activity",
                "Training and Placement Cell visibility and process claims",
                "IQAC, NAAC, AQAR, SSR, and committee-related documentation",
                "alumni, grievance, and institutional-cell structures",
            ],
            s["body_left"],
        )
    )
    story.append(Spacer(1, 5))
    story.append(
        Paragraph(
            "These signals indicate that WCEM has sufficient operational scale for a unified institutional software backbone "
            "to create meaningful value.",
            s["body"],
        )
    )
    story.append(PageBreak())

    story.append(header_box("Software Vision", "What the Platform Can Cover"))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Proposed Institutional Platform", s["section_kicker"]))
    story.append(Paragraph("Core Functional Scope", s["h1"]))
    story.append(
        Paragraph(
            "The proposed platform may be planned as a modular but connected management layer covering the institution's key "
            "operational functions. The objective is to move toward one coherent administrative environment rather than multiple disconnected process layers.",
            s["body"],
        )
    )

    module_table = Table(
        [
            ["Admissions and Enquiry", "enquiry capture, applicant movement, document control, communication workflow"],
            ["Student and Academic Records", "student master data, program mapping, profile and semester-wise visibility"],
            ["Examination Workflow", "exam coordination support, result process structure, marksheet issue tracking"],
            ["Department Administration", "department-level monitoring, approvals, faculty-role and activity structure"],
            ["Placement Operations", "recruiter tracking, student readiness, internships, shortlists, offer visibility"],
            ["Compliance and Committees", "IQAC, NAAC, committee composition, evidence repository, annual updates"],
            ["Management Reporting", "admissions, academic, placement, compliance, and pending-action dashboards"],
        ],
        colWidths=[49 * mm, 119 * mm],
    )
    module_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.HexColor("#f9fbfd"), colors.white]),
                ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#d6e0eb")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d6e0eb")),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 9.1),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#23354c")),
                ("LEADING", (0, 0), (-1, -1), 12),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    story.append(module_table)
    story.append(Spacer(1, 7))
    story.append(
        callout(
            "Important Positioning",
            "For WCEM, the software opportunity is not merely digitization. It is administrative integration, stronger visibility, "
            "better control, and improved institutional continuity.",
            s,
        )
    )
    story.append(PageBreak())

    story.append(header_box("Delivery Strategy", "How the Engagement Should Begin"))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Recommended Engagement Model", s["section_kicker"]))
    story.append(Paragraph("Phased Rather Than Abrupt", s["h1"]))
    story.append(
        Paragraph(
            "For a mature institution, the strongest implementation model is phased institutional integration rather than blind replacement. "
            "This lowers decision risk and allows the institution to validate relevance before moving into deeper execution.",
            s["body"],
        )
    )

    phase_table = Table(
        [
            ["Phase 1", "Institutional software audit and system blueprint"],
            ["Phase 2", "core data layer, workflow base, approvals, and dashboard foundation"],
            ["Phase 3", "functional rollout across admissions, records, exams, placements, and compliance"],
            ["Phase 4", "training, integration checks, controlled go-live, and refinement"],
        ],
        colWidths=[26 * mm, 142 * mm],
    )
    phase_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#173252")),
                ("TEXTCOLOR", (0, 0), (0, -1), colors.white),
                ("BACKGROUND", (1, 0), (1, -1), colors.HexColor("#f6f9fc")),
                ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#d6e0eb")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d6e0eb")),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 9.1),
                ("TEXTCOLOR", (1, 0), (1, -1), colors.HexColor("#23354c")),
                ("LEADING", (0, 0), (-1, -1), 12),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    story.append(phase_table)
    story.append(Spacer(1, 8))
    story.append(Paragraph("Why This Entry Point is Stronger", s["h2"]))
    story.append(
        bullets(
            [
                "it respects WCEM's existing systems instead of dismissing them",
                "it allows management to evaluate seriousness before full commitment",
                "it produces a blueprint, roadmap, and implementation basis",
                "it makes later platform approval easier and more credible",
            ],
            s["body_left"],
        )
    )
    story.append(PageBreak())

    story.append(header_box("Institutional Value", "Why WCEM May Consider the Proposal"))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Expected Value to the Institution", s["section_kicker"]))
    story.append(Paragraph("Administrative and Strategic Outcomes", s["h1"]))
    story.append(
        bullets(
            [
                "<b>Administrative coherence:</b> one connected process environment instead of multiple operational silos",
                "<b>Management visibility:</b> better reporting across admissions, academics, placements, and compliance",
                "<b>Departmental coordination:</b> stronger process discipline between administration, departments, and leadership",
                "<b>Compliance readiness:</b> better documentation continuity for IQAC, NAAC, committees, and annual cycles",
                "<b>Placement intelligence:</b> stronger oversight of student readiness, recruiters, offers, and internships",
                "<b>Scalable digital base:</b> a platform aligned with institutional growth rather than one-time patchwork",
            ],
            s["body_left"],
        )
    )
    story.append(Spacer(1, 6))
    story.append(
        callout(
            "Recommended First Approval",
            "Institutional Software Audit and System Blueprint for WCEM. This is the most credible first stage because it allows "
            "the institution to review process fit, software scope, dashboard planning, and implementation roadmap before full-scale execution.",
            s,
        )
    )
    story.append(Spacer(1, 10))
    story.append(
        Paragraph(
            "Submitted by<br/><b>Shubham Singh</b><br/>SrS Logics<br/>shubhamsingh@srslogics.com | +91 9270925106 | https://srslogics.com/",
            s["body_left"],
        )
    )

    doc.build(story, onFirstPage=add_page_frame, onLaterPages=add_page_frame)


if __name__ == "__main__":
    build_pdf()
    print(OUT_PATH)
