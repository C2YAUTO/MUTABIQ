import type { Certificate } from "@/lib/db/schema"

type Part = { t: string; b?: boolean }

function loadImageEl(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** Fetch the brand logo via our same-origin proxy and rasterize it to a PNG data URL. */
async function fetchLogoPng(brand: string): Promise<{ data: string; ar: number } | null> {
  if (!brand.trim()) return null
  try {
    const res = await fetch(`/api/brand-logo?brand=${encodeURIComponent(brand)}`)
    if (!res.ok) return null
    const svg = await res.text()

    // Determine aspect ratio from the viewBox so we can size the raster correctly
    let ar = 2
    const vb = svg.match(/viewBox=["']([\d.\s-]+)["']/)
    if (vb) {
      const nums = vb[1].split(/[\s,]+/).map(Number)
      if (nums.length === 4 && nums[2] && nums[3]) ar = nums[2] / nums[3]
    }

    const svg64 = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)))
    const img = await loadImageEl(svg64)

    const h = 240
    const w = Math.round(h * ar)
    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) return null
    ctx.drawImage(img, 0, 0, w, h)
    return { data: canvas.toDataURL("image/png"), ar }
  } catch {
    return null
  }
}

/** Load a decorative asset and downscale it to a compact PNG data URL to keep the PDF small. */
async function loadAssetPng(src: string): Promise<{ data: string; ar: number } | null> {
  try {
    const img = await loadImageEl(src)
    const ar = (img.naturalWidth || 1) / (img.naturalHeight || 1)
    const h = 200
    const w = Math.round(h * ar)
    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) return null
    ctx.drawImage(img, 0, 0, w, h)
    // PNG keeps the transparent background of the stamps/seal
    return { data: canvas.toDataURL("image/png"), ar }
  } catch {
    return null
  }
}

type Geo = { pageW: number; pageH: number; mx: number; rightEdge: number }

const C_NAVY: [number, number, number] = [23, 43, 92]
const C_DARK: [number, number, number] = [17, 24, 39]
const C_GRAY: [number, number, number] = [90, 98, 112]
const C_LINE: [number, number, number] = [150, 156, 166]
const C_BLUE: [number, number, number] = [30, 64, 150]

/* eslint-disable @typescript-eslint/no-explicit-any */
function vehicleDescLines(cert: Certificate): string[] {
  return [
    (cert.vehicleType || `${cert.brand} ${cert.model}`).trim().toUpperCase(),
    cert.color ? `COLOR: ${cert.color.toUpperCase()}` : "",
    cert.modelYear ? `MODEL: ${cert.modelYear}` : "",
    cert.vin ? `CHASSIS: ${cert.vin}` : "",
  ].filter(Boolean)
}

type PdfImageAsset = { data: string; ar: number } | null

/** Real Jawhart Al Bakheet FZCO stamp used on seller documents. */
function drawCompanyStamp(doc: any, stamp: PdfImageAsset, cx: number, cy: number, size = 34) {
  if (!stamp) return
  const h = size
  const w = h * stamp.ar
  doc.addImage(stamp.data, "PNG", cx - w / 2, cy - h / 2, w, h)
}

/** Draw the "DUBAI CHAMBER / COMMERCE" wordmark used on the chamber documents. */
function drawDubaiChamberMark(doc: any, x: number, y: number) {
  doc.setTextColor(...C_NAVY)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(20)
  doc.text("DUBAI CHAMBER", x, y, { align: "right" })
  doc.setTextColor(180, 30, 40)
  doc.setFontSize(10)
  doc.text("COMMERCE", x, y + 5, { align: "right" })
}

// ---- Document 1: Dubai Chamber Certificate of Origin ----
function drawCertificateOfOrigin(
  doc: any,
  cert: Certificate,
  g: Geo,
  dubaiChamberSeal: PdfImageAsset,
  iccOriginSeal: PdfImageAsset,
) {
  const { mx, rightEdge, pageH } = g
  const midX = (mx + rightEdge) / 2
  let top = 12
  doc.setDrawColor(...C_LINE)
  doc.setLineWidth(0.2)

  const label = (t: string, x: number, y: number) => {
    doc.setTextColor(...C_DARK)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(7.5)
    doc.text(t, x, y)
  }
  const val = (lines: string[], x: number, y: number) => {
    doc.setTextColor(...C_DARK)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.text(lines, x, y)
  }
  const arabic = (text: string, right: number, y: number, width = 32, height = 4) => {
    if (typeof document === "undefined") return
    const canvas = document.createElement("canvas")
    canvas.width = Math.max(320, Math.round(width * 12))
    canvas.height = 52
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = "#111827"
    ctx.font = "700 30px Arial, sans-serif"
    ctx.textAlign = "right"
    ctx.textBaseline = "middle"
    ctx.direction = "rtl"
    ctx.fillText(text, canvas.width - 4, canvas.height / 2)
    doc.addImage(canvas.toDataURL("image/png"), "PNG", right - width, y - height + 0.5, width, height)
  }

  // Visible safeguard: this bilingual page is a non-official sample.
  doc.setTextColor(205, 45, 45)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(30)
  doc.text("SAMPLE / NON OFFICIAL", (mx + rightEdge) / 2, pageH / 2, { align: "center", angle: 35 })

  // Left column: exporter + consignee boxes
  const leftW = midX - mx
  doc.rect(mx, top, leftW, 40)
  label("1. EXPORTER (NAME, ADDRESS, COUNTRY)", mx + 2, top + 5)
  arabic("المصدر: الاسم والعنوان والدولة", midX - 2, top + 5, 35)
  val([cert.exporterName || "—", ...doc.splitTextToSize(cert.exporterAddress || "", leftW - 6)], mx + 2, top + 10)
  doc.rect(mx, top + 40, leftW, 40)
  label("2. CONSIGNEE (NAME, ADDRESS, COUNTRY)", mx + 2, top + 45)
  arabic("المرسل إليه: الاسم والعنوان والدولة", midX - 2, top + 45, 39)
  val(
    [cert.consigneeName || "—", ...doc.splitTextToSize(cert.consigneeAddress || "", leftW - 6), cert.destinationCountry || ""],
    mx + 2,
    top + 50,
  )

  // Right column header
  const rightW = rightEdge - midX
  label("UNITED ARAB EMIRATES", midX + 2, top + 5)
  arabic("دولة الإمارات العربية المتحدة", rightEdge - 2, top + 5, 37)
  drawDubaiChamberMark(doc, rightEdge - 2, top + 16)
  doc.setTextColor(...C_NAVY)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.text("Certificate of Origin", midX + rightW / 2 - 13, top + 24, { align: "center" })
  arabic("شهادة المنشأ", rightEdge - 2, top + 24, 24)
  doc.rect(midX, top + 27, rightW, 9)
  doc.setTextColor(...C_DARK)
  doc.setFontSize(8)
  doc.text(`Certificate No. ${cert.originCertNumber || "—"}`, midX + 2, top + 32.5)
  arabic("رقم الشهادة", midX + 42, top + 32.5, 21)
  doc.text(`Date ${cert.originCertDate || "—"}`, rightEdge - 2, top + 32.5, { align: "right" })
  arabic("تاريخ الإصدار", rightEdge - 2, top + 37, 22)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text("ORIGINAL", midX + 2, top + 42)
  arabic("أصلية", midX + 42, top + 42, 14)

  // Transport / destination grid
  let gy = top + 80
  const rowH = 11
  const rows: [string, string, string, string, string, string][] = [
    ["3. Means of Transport", "وسيلة النقل", cert.meansOfTransport || "—", "6. Country of Final Destination", "بلد الوجهة الأخيرة", cert.destinationCountry || "—"],
    ["4. Estimated Date of Departure", "التاريخ المتوقع للمغادرة", cert.departureDate || "—", "7. Invoice No. and Date", "رقم وتاريخ الفاتورة", `${cert.invoiceNumber || "—"}${cert.invoiceDate ? ", " + cert.invoiceDate : ""}`],
    ["5. Port of Discharge", "ميناء / مكان التفريغ", cert.portOfDischarge || "—", "8. Country of Origin of Goods", "بلد منشأ البضاعة", (cert.countryOfOrigin || "—").toUpperCase()],
  ]
  for (const [l1, ar1, v1, l2, ar2, v2] of rows) {
    doc.rect(mx, gy, leftW, rowH)
    doc.rect(midX, gy, rightW, rowH)
    label(l1, mx + 2, gy + 4)
    arabic(ar1, midX - 2, gy + 4, 31)
    val([v1], mx + 2, gy + 9)
    label(l2, midX + 2, gy + 4)
    arabic(ar2, rightEdge - 2, gy + 4, 31)
    val([v2], midX + 2, gy + 9)
    gy += rowH
  }

  // Description box
  const descTop = gy
  const descH = 82
  doc.rect(mx, descTop, rightEdge - mx, descH)
  doc.line(midX + 30, descTop, midX + 30, descTop + descH)
  const col11 = midX + 30
  label("9. Marks & Numbers", mx + 2, descTop + 5)
  arabic("العلامات والأرقام", mx + 46, descTop + 5, 25)
  label("10. Packages and description of goods", mx + 50, descTop + 5)
  arabic("رقم ونوع الطرود وبيان البضاعة", col11 - 2, descTop + 5, 39)
  label("11. Quantity & Unit", col11 + 2, descTop + 5)
  arabic("الكمية والوحدة", rightEdge - 2, descTop + 5, 25)
  val(vehicleDescLines(cert), mx + 2, descTop + 13)
  val(["1 Unit"], col11 + 2, descTop + 13)
  doc.setTextColor(...C_GRAY)
  doc.setFont("helvetica", "italic")
  doc.setFontSize(8)
  doc.text("As per the attached invoice", (mx + col11) / 2, descTop + descH / 2, { align: "center" })
  doc.text("--- End of Description ---", (mx + col11) / 2, descTop + descH / 2 + 5, { align: "center" })

  // Certification block: bilingual text above, seals in a dedicated lower area.
  const certTop = descTop + descH
  const certH = 59
  doc.rect(mx, certTop, rightEdge - mx, certH)
  label("12. CERTIFICATION BY THE COMPETENT AUTHORITY", mx + 2, certTop + 5)
  arabic("تصديق جهة الإصدار", rightEdge - 2, certTop + 5, 30)
  doc.setTextColor(...C_DARK)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7)
  doc.text(
    doc.splitTextToSize(
      "We certify that the information supplied for this sample indicates that the goods originate in, or were processed in, the country shown in box 8. This non-official sample is provided for dossier presentation only.",
      (rightEdge - mx) / 2 - 8,
    ),
    mx + 2,
    certTop + 11,
  )
  arabic("تشهد هذه النسخة التجريبية بأن بيانات البضاعة تشير إلى بلد المنشأ الموضح في الخانة رقم 8.", rightEdge - 2, certTop + 12, 77, 5)
  arabic("هذه الصفحة نموذج غير رسمي ومخصصة لعرض ملف المستندات فقط.", rightEdge - 2, certTop + 19, 67, 5)

  const sealCenterY = certTop + 41
  if (dubaiChamberSeal) {
    const h = 25
    const w = h * dubaiChamberSeal.ar
    doc.addImage(dubaiChamberSeal.data, "PNG", mx + 47 - w / 2, sealCenterY - h / 2, w, h)
  }
  if (iccOriginSeal) {
    const h = 27
    const w = h * iccOriginSeal.ar
    doc.addImage(iccOriginSeal.data, "PNG", rightEdge - 38 - w / 2, sealCenterY - h / 2, w, h)
  }

  // Footer
  doc.setDrawColor(...C_LINE)
  doc.line(mx, pageH - 12, rightEdge, pageH - 12)
  doc.setTextColor(...C_GRAY)
  doc.setFontSize(6.5)
  doc.text("Dubai Chamber of Commerce — P.O.Box 1457 Dubai, U.A.E — www.dubaichamber.com", mx, pageH - 8)
  doc.text("Page 1 of 1", rightEdge, pageH - 8, { align: "right" })
}

// ---- Document 2: Dubai Chamber Tax Invoice ----
function drawTaxInvoice(doc: any, cert: Certificate, g: Geo) {
  const { mx, rightEdge, pageH } = g
  const year = new Date().getFullYear()
  doc.setDrawColor(...C_LINE)
  doc.setLineWidth(0.2)

  doc.setTextColor(...C_DARK)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.text("Tax Invoice", (mx + rightEdge) / 2, 20, { align: "center" })
  drawDubaiChamberMark(doc, rightEdge, 18)

  // Info grid
  let y = 40
  const rowH = 8
  const infoRows: [string, string][] = [
    ["DCCI VAT Registration #", "100008773200045"],
    ["Invoice / Receipt No", cert.invoiceNumber || "—"],
    ["Date & Time", String(year)],
    ["Membership No", "22*****"],
    ["Payment Type", "Online"],
  ]
  for (const [l, v] of infoRows) {
    doc.rect(mx, y, rightEdge - mx, rowH)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(...C_DARK)
    doc.text(l, mx + 2, y + 5.5)
    doc.setFont("helvetica", "normal")
    doc.text(v, rightEdge - 2, y + 5.5, { align: "right" })
    y += rowH
  }

  // Fees table
  y += 6
  const tableTop = y
  const colFee = mx + 28
  const colYear = mx + 56
  const tableH = 60
  doc.rect(mx, tableTop, rightEdge - mx, tableH)
  doc.line(colFee, tableTop, colFee, tableTop + tableH)
  doc.line(colYear, tableTop, colYear, tableTop + tableH)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.setTextColor(...C_DARK)
  doc.text("Fees (EURO)", mx + 2, tableTop + 5)
  doc.text("Year", colFee + 2, tableTop + 5)
  doc.text("Description", colYear + 2, tableTop + 5)
  doc.setFont("helvetica", "normal")
  doc.text("100", mx + 2, tableTop + 14)
  doc.text(String(year), colFee + 2, tableTop + 14)
  doc.setFont("helvetica", "bold")
  doc.text("New COO", colYear + 2, tableTop + 14)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7)
  doc.text(`100 SR 1-${Math.floor(10000000 + Math.random() * 89999999)}`, colYear + 2, tableTop + 19)

  // Total row
  const totalY = tableTop + tableH
  doc.rect(mx, totalY, rightEdge - mx, 10)
  doc.line(colFee, totalY, colFee, totalY + 10)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text("100", mx + 2, totalY + 6.5)
  doc.text("Total", colFee + 2, totalY + 6.5)

  // Note
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.5)
  doc.setTextColor(...C_GRAY)
  doc.text(
    "Any cheque returned from the bank due to insufficient funds or other reasons will incur a charge of AED 500 which is nonrefundable.",
    mx,
    totalY + 22,
  )

  // Bank details
  let by = totalY + 32
  const bank: [string, string][] = [
    ["A/C Name", "Dubai Chamber of Commerce & Industry"],
    ["IBAN", "AE420260001012000257201"],
    ["A/c No", "1012000257201"],
    ["Bank Name", "Emirates NBD"],
    ["Swift code", "EBILAEAD"],
  ]
  for (const [l, v] of bank) {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(...C_DARK)
    doc.text(`${l}:`, mx, by)
    doc.setFont("helvetica", "normal")
    doc.text(v, mx + 30, by)
    by += 6
  }

  doc.setDrawColor(...C_LINE)
  doc.line(mx, pageH - 12, rightEdge, pageH - 12)
  doc.setTextColor(...C_GRAY)
  doc.setFontSize(6.5)
  doc.text("United Arab Emirates, P.O.Box 1457, Dubai — www.dubaichamber.ae", (mx + rightEdge) / 2, pageH - 8, {
    align: "center",
  })
}

// ---- Document 3: Seller Commercial Invoice ----
function drawCommercialInvoice(doc: any, cert: Certificate, g: Geo, companyStamp: PdfImageAsset) {
  const { mx, rightEdge, pageH } = g
  doc.setDrawColor(...C_LINE)
  doc.setLineWidth(0.2)

  // Seller header
  doc.setTextColor(...C_DARK)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(15)
  doc.text("JAWHART AL BAKHEET FZCO", (mx + rightEdge) / 2, 20, { align: "center" })
  doc.setFontSize(10)
  doc.setTextColor(...C_GRAY)
  doc.text("ALBAKHET GROUP — MOBCO - UAE", (mx + rightEdge) / 2, 26, { align: "center" })

  doc.setTextColor(...C_DARK)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.text("INVOICE", (mx + rightEdge) / 2, 44, { align: "center" })

  // Date / invoice no box
  const boxTop = 52
  doc.rect(rightEdge - 70, boxTop, 70, 14)
  doc.line(rightEdge - 40, boxTop, rightEdge - 40, boxTop + 14)
  doc.line(rightEdge - 70, boxTop + 7, rightEdge, boxTop + 7)
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.text("DATE", rightEdge - 68, boxTop + 5)
  doc.text("INVOICE NO", rightEdge - 68, boxTop + 12)
  doc.setFont("helvetica", "normal")
  doc.text(cert.invoiceDate || "—", rightEdge - 38, boxTop + 5)
  doc.text(cert.invoiceNumber || "—", rightEdge - 38, boxTop + 12)

  // Customer box
  doc.rect(mx, boxTop, 90, 22)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.text(`Customer: ${cert.consigneeName || "—"}`, mx + 2, boxTop + 6)
  doc.setFont("helvetica", "normal")
  doc.text(`Address: ${cert.consigneeAddress || cert.destinationCountry || "—"}`, mx + 2, boxTop + 12)
  doc.text(`Export: ${cert.destinationCountry || "—"}`, mx + 2, boxTop + 18)

  // Goods table
  const tTop = boxTop + 34
  const cSno = mx
  const cDesc = mx + 16
  const cQty = rightEdge - 60
  const cAmt = rightEdge - 34
  const tH = 60
  doc.rect(mx, tTop, rightEdge - mx, tH)
  for (const x of [cDesc, cQty, cAmt]) doc.line(x, tTop, x, tTop + tH)
  doc.line(mx, tTop + 8, rightEdge, tTop + 8)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.text("SNO", cSno + 2, tTop + 5.5)
  doc.text("DESCRIPTION OF GOODS", cDesc + 2, tTop + 5.5)
  doc.text("QTY", cQty + 2, tTop + 5.5)
  doc.text("AMOUNT (USD)", cAmt + 2, tTop + 5.5)
  doc.setFont("helvetica", "normal")
  doc.text("1", cSno + 2, tTop + 14)
  doc.text(vehicleDescLines(cert), cDesc + 2, tTop + 14)
  doc.text("1", cQty + 2, tTop + 14)
  doc.setFont("helvetica", "bold")
  doc.text(cert.priceUsd || "—", cAmt + 2, tTop + 14)

  // Grand total
  const gtY = tTop + tH
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text(`Grand Total (USD): ${cert.priceUsd || "—"}`, rightEdge - 2, gtY + 8, { align: "right" })
  if (cert.priceWords) {
    doc.setFontSize(9)
    doc.text(`Grand Total (USD): ${cert.priceWords}`, mx, gtY + 20)
  }

  // Company + stamp
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text("JAWHARAT AL BAKHEET FZCO", mx, gtY + 36)
  drawCompanyStamp(doc, companyStamp, mx + 30, gtY + 55)

  // Footer
  doc.setDrawColor(...C_DARK)
  doc.setLineWidth(0.6)
  doc.line(mx, pageH - 22, rightEdge, pageH - 22)
  doc.setLineWidth(0.2)
  doc.setTextColor(...C_DARK)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.5)
  doc.text("Tel: +971 4 333 023  |  Mob: +971 52 255 542", (mx + rightEdge) / 2, pageH - 16, { align: "center" })
  doc.text("Showroom No. 243, DAZ, Ras Al Khor, Al Aweer, P.O. Box 410327, Dubai-U.A.E", (mx + rightEdge) / 2, pageH - 11, {
    align: "center",
  })
  doc.text("info@albakhet.com  |  www.jawhartalbakeet.com", (mx + rightEdge) / 2, pageH - 6, { align: "center" })
}

// ---- Document 4: Seller Certificate of Conformity ----
function drawConformity(doc: any, cert: Certificate, g: Geo, companyStamp: PdfImageAsset) {
  const { mx, rightEdge, pageH } = g
  doc.setDrawColor(...C_LINE)
  doc.setLineWidth(0.2)

  doc.setTextColor(...C_DARK)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(15)
  doc.text("JAWHART AL BAKHEET FZCO", (mx + rightEdge) / 2, 20, { align: "center" })
  doc.setFontSize(10)
  doc.setTextColor(...C_GRAY)
  doc.text("ALBAKHET GROUP — MOBCO - UAE", (mx + rightEdge) / 2, 26, { align: "center" })

  doc.setTextColor(...C_DARK)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(15)
  doc.text("CERTIFICATE OF CONFORMITY", (mx + rightEdge) / 2, 46, { align: "center" })

  doc.setFontSize(9)
  doc.text(`INVOICE NO: ${cert.invoiceNumber || "—"}`, rightEdge - 2, 60, { align: "right" })
  doc.text(`INVOICE DATE: ${cert.invoiceDate || "—"}`, rightEdge - 2, 66, { align: "right" })

  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text("TO", mx, 60)
  doc.text(`CUSTOMER NAME: ${cert.consigneeName || "—"}`, mx + 10, 66)
  doc.text(`EXPORT: ${cert.destinationCountry || "—"}`, rightEdge - 2, 78, { align: "right" })
  doc.text("DETAILED DESCRIPTION:", mx + 10, 78)

  const rows: [string, string][] = [
    ["MAKE:", (cert.brand || "—").toUpperCase()],
    ["SUB MAKE:", (cert.model || "—").toUpperCase()],
    ["CATEGORY:", (cert.fuelVehicleClass || cert.vehicleCategory || "—").toUpperCase()],
    ["COLOR:", (cert.color || "—").toUpperCase()],
    ["YEAR:", cert.modelYear || "—"],
    ["NO. SEAT:", cert.numSeats || cert.numPassengers || "—"],
    ["ENGINE:", (cert.fuelType || "—").toUpperCase()],
    ["NO. DOORS:", cert.numDoors || "—"],
    ["DISPLACEMENT:", cert.engineCapacity || "—"],
    ["TOTAL QUANTITY:", `1 UNIT ${(cert.vehicleType || cert.model || "").toUpperCase()}`],
    ["MAXIMUM VEHICLE WEIGHT:", cert.maxVehicleWeight || "—"],
    ["CHASSIS NUMBER:", cert.vin || "—"],
  ]
  let y = 90
  for (const [l, v] of rows) {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setTextColor(...C_DARK)
    doc.text(l, mx + 10, y)
    doc.text(v, mx + 70, y)
    y += 7
  }

  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text("JAWHARAT AL BAKHEET FZCO", mx + 10, y + 8)
  drawCompanyStamp(doc, companyStamp, mx + 40, y + 28)

  doc.setDrawColor(...C_DARK)
  doc.setLineWidth(0.6)
  doc.line(mx, pageH - 22, rightEdge, pageH - 22)
  doc.setLineWidth(0.2)
  doc.setTextColor(...C_DARK)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.5)
  doc.text("Tel: +971 4 333 023  |  Mob: +971 52 255 542", (mx + rightEdge) / 2, pageH - 16, { align: "center" })
  doc.text("Showroom No. 243, DAZ, Ras Al Khor, Al Aweer, P.O. Box 410327, Dubai-U.A.E", (mx + rightEdge) / 2, pageH - 11, {
    align: "center",
  })
  doc.text("info@albakhet.com  |  www.jawhartalbakeet.com", (mx + rightEdge) / 2, pageH - 6, { align: "center" })
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function generateCertificatePdf(
  cert: Certificate,
  qrDataUrl: string,
  certUrl: string,
  fileName: string,
  mode: "download" | "preview" = "download",
) {
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const mx = 14
  const rightEdge = pageW - mx

  const navy: [number, number, number] = [23, 43, 92]
  const dark: [number, number, number] = [17, 24, 39]
  const gray: [number, number, number] = [90, 98, 112]

  // Load images in parallel
  const [logo, stamp, roundSeal, companyStamp, dubaiChamberSeal, iccOriginSeal] = await Promise.all([
    fetchLogoPng(cert.brand || cert.manufacturer),
    loadAssetPng("/gso-approved-stamp.png"),
    loadAssetPng("/gso-approved-round-seal.png"),
    loadAssetPng("/jawhart-al-bakheet-stamp.png"),
    loadAssetPng("/dubai-chamber-seal.png"),
    loadAssetPng("/icc-origin-seal.png"),
  ])

  const setColor = (c: [number, number, number]) => doc.setTextColor(c[0], c[1], c[2])

  // Draw a sequence of styled parts on one line, advancing x by measured width
  function drawParts(parts: Part[], x: number, y: number, size = 9) {
    let cx = x
    doc.setFontSize(size)
    for (const p of parts) {
      doc.setFont("helvetica", p.b ? "bold" : "normal")
      doc.text(p.t, cx, y)
      cx += doc.getTextWidth(p.t)
    }
    return cx
  }

  // ---- Header: logo + manufacturer block ----
  const headerTop = 12
  if (logo) {
    const boxW = 26
    const boxH = 18
    let lw = boxW
    let lh = boxW / logo.ar
    if (lh > boxH) {
      lh = boxH
      lw = boxH * logo.ar
    }
    doc.addImage(logo.data, "PNG", mx, headerTop, lw, lh)
  }
  // Vertical divider
  doc.setDrawColor(200, 205, 214)
  doc.line(mx + 30, headerTop, mx + 30, headerTop + 20)
  // Manufacturer name + address
  setColor(dark)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.text(cert.manufacturer || cert.brand || "—", mx + 35, headerTop + 5)
  setColor(gray)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  const manufacturerAddress = (cert.manufacturerAddress || "").trim()
  const addrLines = manufacturerAddress
    ? doc.splitTextToSize(manufacturerAddress, 105).slice(0, 4)
    : ["Address not provided"]
  doc.text(addrLines, mx + 35, headerTop + 11)

  // Header rule
  doc.setDrawColor(120, 128, 140)
  doc.line(mx, headerTop + 24, rightEdge, headerTop + 24)

  // ---- Title + CCR ----
  let y = headerTop + 33
  setColor(navy)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.text("GSO Conformity Certificate", mx, y)
  setColor(dark)
  doc.setFontSize(12)
  doc.text(`CCR NO. ${cert.ccrNumber || "—"}`, rightEdge, y, { align: "right" })

  // Certificate type
  y += 7
  doc.setFontSize(11)
  doc.text(cert.certificateType || "Motor Vehicles", mx, y)

  // QR code top-right
  const qrSize = 30
  doc.addImage(qrDataUrl, "PNG", rightEdge - qrSize, y - 4, qrSize, qrSize)

  // Body top block (kept left of the QR)
  const col1Right = rightEdge - qrSize - 6
  setColor(dark)
  y += 8
  drawParts([{ t: "Manufacturer: " }, { t: cert.manufacturer || "—", b: true }], mx, y)
  y += 6
  drawParts(
    [
      { t: "Country of Origin: " },
      { t: cert.countryOfOrigin || "—", b: true },
      { t: "   Country of Production: " },
      { t: cert.countryOfProduction || "—", b: true },
    ],
    mx,
    y,
  )
  y += 6
  drawParts([{ t: "To: GCC Standardization Organization (GSO)", b: true }], mx, y)
  y += 6
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  const certifyLines = doc.splitTextToSize(
    `We hereby certify that the vehicles manufactured by ${cert.manufacturer || cert.brand || ""}`,
    col1Right - mx,
  )
  doc.text(certifyLines, mx, y)
  y += certifyLines.length * 5 + 1

  // Bullet list
  const bullets: Part[][] = [
    [{ t: "Type: " }, { t: cert.vehicleType || cert.model || "—", b: true }],
    [{ t: "VIN Number: " }, { t: cert.vin || "—", b: true }],
    [{ t: "Manufacturer Ref No. " }, { t: cert.manufacturerRef || "—", b: true }],
    [{ t: "Model Year: " }, { t: cert.modelYear || "—", b: true }],
    [{ t: "Produced in and after: " }, { t: cert.producedAfter || "—", b: true }],
    [{ t: "Category: " }, { t: cert.vehicleCategory || "—", b: true }],
  ]
  for (const b of bullets) {
    setColor(navy)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text("•", mx, y)
    setColor(dark)
    drawParts(b, mx + 4, y)
    y += 6
  }

  // Regulations paragraph
  if (cert.techRegulations) {
    y += 1
    setColor(gray)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    const regLines = doc.splitTextToSize(cert.techRegulations, rightEdge - mx)
    doc.text(regLines, mx, y)
    y += regLines.length * 3.4 + 2
  }

  // ---- Technical data ----
  setColor(dark)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9.5)
  doc.text("All the essential technical data are as follows:", mx, y)
  y += 6

  const lh = 4.5
  function tech(parts: Part[], indent = 0) {
    setColor(dark)
    drawParts(parts, mx + indent, y, 8.5)
    y += lh
  }

  tech([{ t: "1. Weights", b: true }])
  tech(
    [
      { t: "a. Maximum Vehicle Weight: " },
      { t: cert.maxVehicleWeight || "—", b: true },
      { t: "  b. Curb: " },
      { t: cert.curbWeight || "—", b: true },
    ],
    3,
  )
  tech(
    [
      { t: "c. Maximum Axle Weight: Front: " },
      { t: cert.maxAxleFront || "—", b: true },
      { t: ", Rear: " },
      { t: cert.maxAxleRear || "—", b: true },
    ],
    3,
  )
  tech([{ t: "2. Dimensions", b: true }])
  tech(
    [
      { t: "a. Length: " },
      { t: cert.lengthMm || "—", b: true },
      { t: " b. Width: " },
      { t: cert.widthMm || "—", b: true },
      { t: " c. Height: " },
      { t: cert.heightMm || "—", b: true },
      { t: " d. Wheelbase: " },
      { t: cert.wheelbaseMm || "—", b: true },
    ],
    3,
  )
  tech(
    [
      { t: "e. Track: Front " },
      { t: cert.trackFront || "—", b: true },
      { t: ", Rear " },
      { t: cert.trackRear || "—", b: true },
    ],
    3,
  )
  tech([{ t: "3. Type of chassis and body: " }, { t: cert.chassisBodyType || "—", b: true }])
  tech([
    { t: "4. Number of passengers including the driver: " },
    { t: cert.numPassengers || "—", b: true },
  ])
  tech([{ t: "5. Engine: " }, { t: cert.fuelType || "—", b: true }])
  tech(
    [
      { t: "a. Cylinders: " },
      { t: cert.numberOfCylinders || "—", b: true },
      { t: " b. Displacement: " },
      { t: cert.engineCapacity || "—", b: true },
      { t: " c. Air intake: " },
      { t: cert.airIntake || "—", b: true },
    ],
    3,
  )
  tech(
    [
      { t: "d. Net Engine Power: " },
      { t: cert.netEnginePower || "—", b: true },
      { t: " at " },
      { t: cert.engineRpm || "—", b: true },
    ],
    3,
  )
  tech([{ t: `e. Comply at least with ${cert.pollutantLimit || "—"} Pollutant limits` }], 3)
  tech([{ t: "6. Transmission: " }, { t: cert.transmission || "—", b: true }])
  tech([{ t: "7. eCall (SOS) System: " }, { t: cert.ecallSystem || "—", b: true }])
  tech([{ t: "8. Brakes", b: true }])
  tech(
    [
      { t: "a. Service Brakes: " },
      { t: cert.serviceBrakes || "—", b: true },
      { t: " b. Emergency Brakes: " },
      { t: cert.emergencyBrakes || "—", b: true },
    ],
    3,
  )
  tech([{ t: "9. Fuel Economy", b: true }])
  tech(
    [
      { t: "a. Vehicle Class: " },
      { t: cert.fuelVehicleClass || "—", b: true },
      { t: " b. FE (CAFE) Combined: " },
      { t: cert.feCafeCombined || "—", b: true },
      { t: " — " },
      { t: cert.feRating || "—", b: true },
    ],
    3,
  )
  tech([{ t: "10. And other information" }])
  if (cert.notes) {
    setColor(gray)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    const noteLines = doc.splitTextToSize(cert.notes, rightEdge - mx - 3)
    doc.text(noteLines, mx + 3, y)
    y += noteLines.length * 3.6
  }

  // ---- Footer approval marks, kept on this single page ----
  // Official rectangular stamp on the left, below the certificate text.
  if (stamp) {
    const h = 43
    const w = h * stamp.ar
    doc.addImage(stamp.data, "PNG", mx, pageH - 12 - h, w, h)
  }

  // Circular GSO "Approved Type" seal on the right.
  if (roundSeal) {
    const h = 39
    const w = h * roundSeal.ar
    doc.addImage(roundSeal.data, "PNG", rightEdge - w, pageH - 12 - h, w, h)
  }

  // Verification URL footer
  doc.setDrawColor(200, 205, 214)
  doc.line(mx, pageH - 8, rightEdge, pageH - 8)
  setColor(gray)
  doc.setFontSize(7)
  doc.text(`Verification: ${certUrl}`, rightEdge, pageH - 4, { align: "right" })

  // ---- Additional dossier documents, each on its own page ----
  const geo: Geo = { pageW, pageH, mx, rightEdge }
  doc.addPage()
  drawCertificateOfOrigin(doc, cert, geo, dubaiChamberSeal, iccOriginSeal)
  doc.addPage()
  drawTaxInvoice(doc, cert, geo)
  doc.addPage()
  drawCommercialInvoice(doc, cert, geo, companyStamp)
  doc.addPage()
  drawConformity(doc, cert, geo, companyStamp)

  if (mode === "preview") return doc.output("blob")

  doc.save(`${fileName}.pdf`)
}
