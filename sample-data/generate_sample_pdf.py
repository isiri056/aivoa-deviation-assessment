"""
Simple standalone generator for a realistic pharmaceutical deviation PDF report.
Creates a valid PDF-1.4 file with standard streams readable by pypdf and any PDF viewer.
"""
from pathlib import Path

def create_sample_pdf(output_path: Path):
    lines = [
        "AIVOA PHARMACEUTICALS - DEVIATION INCIDENT REPORT",
        "Report ID: DEV-2026-0894 | Facility: API Synthesis Facility - Plant 1",
        "Date of Occurrence: 2026-09-24 | Source: Production Operator",
        "--------------------------------------------------------------------------------",
        "PRODUCT AND BATCH INFORMATION:",
        "Product: Paracetamol API (Acetaminophen BP/USP Grade)",
        "Batch / Lot Number: API-260924",
        "Affected Quantity: 500 kg",
        "Stage: Fluidized Bed Drying (Cleanroom Suite 104)",
        "",
        "INCIDENT DESCRIPTION:",
        "During the manufacturing and drying of Paracetamol API batch API-260924,",
        "the drying temperature exceeded the approved validated range of 70-75 C",
        "and reached 82 C for approximately 18 minutes.",
        "The event was detected by the production operator following a SCADA console alert.",
        "The operator initiated emergency cooling bypass to return temperature to 72 C.",
        "",
        "IMMEDIATE ACTIONS AND CONTAINMENT:",
        "The affected 500 kg batch has been placed on physical and electronic QA quarantine",
        "hold pending formal investigation. Yellow quarantine labels applied to IBC-401.",
        "Composite sampling requested for HPLC degradation impurity profiling.",
    ]

    # Generate PDF content stream
    content_stream = "BT\n/F1 10 Tf\n50 750 Td\n14 TL\n"
    for line in lines:
        escaped = line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
        content_stream += f"({escaped}) '\n"
    content_stream += "ET\n"

    stream_bytes = content_stream.encode("latin-1")
    stream_len = len(stream_bytes)

    # Assemble PDF objects
    pdf_parts = [
        b"%PDF-1.4\n",
        # Obj 1: Catalog
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
        # Obj 2: Pages
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
        # Obj 3: Page
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
        # Obj 4: Contents
        f"4 0 obj\n<< /Length {stream_len} >>\nstream\n".encode("latin-1") + stream_bytes + b"\nendstream\nendobj\n",
        # Obj 5: Font
        b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    ]

    # Calculate xref
    body = b"".join(pdf_parts)
    xref_offset = len(body)

    # Object offsets:
    # Obj 1 starts right after header (%PDF-1.4\n is 9 bytes)
    offsets = [0]
    curr = 9
    for part in pdf_parts[1:]:
        offsets.append(curr)
        curr += len(part)

    xref = f"xref\n0 {len(offsets)}\n0000000000 65535 f \n"
    for off in offsets[1:]:
        xref += f"{off:010d} 00000 n \n"

    trailer = f"trailer\n<< /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n"

    final_pdf = body + xref.encode("latin-1") + trailer.encode("latin-1")
    output_path.write_bytes(final_pdf)
    print(f"Generated sample PDF at {output_path} ({len(final_pdf)} bytes)")

if __name__ == "__main__":
    out = Path(__file__).resolve().parent / "sample_deviation.pdf"
    create_sample_pdf(out)
