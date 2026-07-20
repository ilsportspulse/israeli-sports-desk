from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "ilsp-founding-partner-brief.pdf"

pdfmetrics.registerFont(TTFont("ILSPRegular", "/System/Library/Fonts/Supplemental/Arial.ttf"))
pdfmetrics.registerFont(TTFont("ILSPBold", "/System/Library/Fonts/Supplemental/Arial Bold.ttf"))
pdfmetrics.registerFont(TTFont("ILSPBoldItalic", "/System/Library/Fonts/Supplemental/Arial Bold Italic.ttf"))

NAVY = HexColor("#061631")
DEEP_BLUE = HexColor("#0C2A59")
BLUE = HexColor("#1E63F3")
SKY = HexColor("#DCE9FF")
INK = HexColor("#101827")
MUTED = HexColor("#586579")
LINE = HexColor("#D8E0EB")
PAPER = HexColor("#F7F9FC")
PALE = HexColor("#EDF3FF")


def wrap(text, font, size, width):
    words = text.split()
    lines = []
    current = ""
    for word in words:
        attempt = f"{current} {word}".strip()
        if stringWidth(attempt, font, size) <= width:
            current = attempt
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def paragraph(pdf, text, x, y, width, font="ILSPRegular", size=8.5, leading=12, color=INK, max_lines=None):
    pdf.setFont(font, size)
    pdf.setFillColor(color)
    lines = wrap(text, font, size, width)
    if max_lines:
        lines = lines[:max_lines]
    for line in lines:
        pdf.drawString(x, y, line)
        y -= leading
    return y


def section_title(pdf, number, title, x, y):
    pdf.setFillColor(BLUE)
    pdf.roundRect(x, y - 2, 19, 19, 6, fill=1, stroke=0)
    pdf.setFillColor(white)
    pdf.setFont("ILSPBold", 8)
    pdf.drawCentredString(x + 9.5, y + 4.3, number)
    pdf.setFillColor(NAVY)
    pdf.setFont("ILSPBold", 11)
    pdf.drawString(x + 27, y + 3, title.upper())


def bullet(pdf, text, x, y, width, size=8.1, leading=11):
    pdf.setFillColor(BLUE)
    pdf.circle(x + 3, y + 2, 2.1, fill=1, stroke=0)
    return paragraph(pdf, text, x + 12, y + 6, width - 12, size=size, leading=leading, color=INK)


def build():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    width, height = A4
    pdf = canvas.Canvas(str(OUTPUT), pagesize=A4)
    pdf.setTitle("Israel Sports Pulse - Founding Partner Brief")
    pdf.setAuthor("Israel Sports Pulse")
    pdf.setFillColor(PAPER)
    pdf.rect(0, 0, width, height, fill=1, stroke=0)

    # Hero
    pdf.setFillColor(NAVY)
    pdf.rect(0, height - 178, width, 178, fill=1, stroke=0)
    pdf.setFillColor(DEEP_BLUE)
    pdf.circle(width - 16, height - 18, 108, fill=1, stroke=0)
    pdf.setFillColor(BLUE)
    pdf.roundRect(38, height - 82, 49, 49, 14, fill=1, stroke=0)
    pdf.setFillColor(white)
    pdf.setFont("ILSPBoldItalic", 17)
    pdf.drawCentredString(62.5, height - 63, "ILSP")
    pdf.setFillColor(SKY)
    pdf.setFont("ILSPBold", 7.5)
    pdf.drawString(101, height - 44, "ISRAEL SPORTS PULSE")
    pdf.setFillColor(white)
    pdf.setFont("ILSPBold", 25)
    pdf.drawString(101, height - 74, "THE ENGLISH-LANGUAGE")
    pdf.drawString(101, height - 103, "HOME OF ISRAELI SPORT")
    pdf.setFillColor(SKY)
    pdf.setFont("ILSPRegular", 9.5)
    pdf.drawString(101, height - 125, "Independent reporting. Live utility. Israeli sport without borders.")

    pdf.setFillColor(BLUE)
    pdf.roundRect(38, height - 164, width - 76, 30, 8, fill=1, stroke=0)
    pdf.setFillColor(white)
    pdf.setFont("ILSPBold", 9.5)
    pdf.drawString(51, height - 153, "FOUNDING PARTNER")
    pdf.setFont("ILSPRegular", 9)
    pdf.drawRightString(width - 51, height - 153, "12 MONTHS  |  USD 30,000  |  UP TO 3 POSITIONS")

    left = 38
    gutter = 24
    column = (width - 76 - gutter) / 2
    right = left + column + gutter

    # Opportunity
    y = height - 211
    section_title(pdf, "01", "The opportunity", left, y)
    y -= 27
    y = paragraph(
        pdf,
        "ILSP is building a premium English-language destination for Israeli sport: professionally gated reporting, live match utility, original columns, a daily quiz and a growing historical archive.",
        left,
        y,
        column,
        size=8.7,
        leading=12.2,
    )
    y -= 8
    pdf.setFillColor(PALE)
    pdf.roundRect(left, y - 62, column, 62, 9, fill=1, stroke=0)
    pdf.setFillColor(NAVY)
    pdf.setFont("ILSPBold", 9)
    pdf.drawString(left + 13, y - 17, "A PRODUCT, NOT A PROMISE")
    paragraph(pdf, "The polished local preview already combines news, scores, columns, archives and reader engagement. Public launch remains gated by rights, data and legal readiness.", left + 13, y - 32, column - 26, size=7.8, leading=10.5, color=MUTED)

    # Partner receives
    y2 = height - 211
    section_title(pdf, "02", "Partner receives", right, y2)
    y2 -= 25
    benefits = [
        "Clearly labelled recognition across agreed launch surfaces.",
        "Launch-campaign, partner-page and agreed product presence.",
        "Quarterly delivery and engagement reporting once analytics are live.",
        "First renewal discussion on a relevant product package - never editorial control.",
    ]
    for item in benefits:
        y2 = bullet(pdf, item, right, y2, column)
        y2 -= 5

    # Funding unlocks
    card_top = height - 397
    section_title(pdf, "03", "What funding unlocks", left, card_top)
    card_y = card_top - 107
    card_gap = 10
    card_width = (width - 76 - card_gap * 2) / 3
    cards = [
        ("DATA + UTILITY", "Licensed scores, fixtures, tables and statistics across Israeli and major global sport."),
        ("REPORTING + MEDIA", "Rights-cleared action photography and professional coverage beyond the biggest leagues."),
        ("RELIABLE DELIVERY", "Hosting, security, monitoring, backups, apps and language-neutral foundations."),
    ]
    for index, (title, copy) in enumerate(cards):
        x = left + index * (card_width + card_gap)
        pdf.setFillColor(white)
        pdf.roundRect(x, card_y, card_width, 76, 10, fill=1, stroke=0)
        pdf.setStrokeColor(LINE)
        pdf.roundRect(x, card_y, card_width, 76, 10, fill=0, stroke=1)
        pdf.setFillColor(BLUE)
        pdf.rect(x, card_y + 72, card_width, 4, fill=1, stroke=0)
        pdf.setFillColor(NAVY)
        pdf.setFont("ILSPBold", 8)
        pdf.drawString(x + 12, card_y + 54, title)
        paragraph(pdf, copy, x + 12, card_y + 39, card_width - 24, size=7.4, leading=9.5, color=MUTED)

    # Funding context and audience proposition
    context_y = card_y - 35
    section_title(pdf, "04", "Funding context", left, context_y)
    context_y -= 29
    pdf.setFillColor(NAVY)
    pdf.roundRect(left, context_y - 73, width - 76, 73, 10, fill=1, stroke=0)
    stats = [
        ("USD 213,790", "12-month professional cash target"),
        ("USD 30,000", "in-kind infrastructure target"),
        ("30 MIN", "source discovery cadence"),
    ]
    stat_width = (width - 102) / 3
    for index, (value, label) in enumerate(stats):
        x = left + 13 + stat_width * index
        pdf.setFillColor(white)
        pdf.setFont("ILSPBold", 15)
        pdf.drawString(x, context_y - 28, value)
        paragraph(pdf, label, x, context_y - 44, stat_width - 14, size=7.3, leading=9.5, color=SKY)

    audience_y = context_y - 104
    section_title(pdf, "05", "Audience proposition", left, audience_y)
    audience_y -= 25
    paragraph(pdf, "Built for English-reading sports audiences in Israel and for Jewish and Israel-connected communities worldwide. No reach figures are claimed before production analytics exist.", left, audience_y, width - 76, size=7.8, leading=10, color=INK)

    # Editorial firewall
    firewall_y = 57
    pdf.setFillColor(PALE)
    pdf.roundRect(left, firewall_y, width - 76, 46, 10, fill=1, stroke=0)
    pdf.setFillColor(BLUE)
    pdf.setFont("ILSPBold", 9)
    pdf.drawString(left + 14, firewall_y + 30, "EDITORIAL FIREWALL")
    paragraph(pdf, "Funding never includes story approval, favourable coverage, source selection, ranking influence, corrections control or subscriber-data access. Sponsored inventory is clearly labelled. Youth products carry no betting promotion.", left + 14, firewall_y + 16, width - 104, size=7.1, leading=8.8, color=INK)

    pdf.setStrokeColor(LINE)
    pdf.line(left, 42, width - left, 42)
    pdf.setFillColor(NAVY)
    pdf.setFont("ILSPBold", 8)
    pdf.drawString(left, 27, "NEXT STEP: 30-MINUTE LAUNCH, INVENTORY AND STRATEGIC-FIT REVIEW")
    pdf.setFillColor(MUTED)
    pdf.setFont("ILSPRegular", 6.8)
    pdf.drawRightString(width - left, 27, "Draft inventory and pricing - owner approval required before outreach")

    pdf.showPage()
    pdf.save()


if __name__ == "__main__":
    build()
