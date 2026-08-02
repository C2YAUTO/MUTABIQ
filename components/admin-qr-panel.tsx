"use client"

import Image from "next/image"
import { useState, useTransition } from "react"
import { Download, Printer, FileText, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Certificate } from "@/lib/db/schema"
import { generateCertificatePdf } from "@/lib/certificate-pdf"

export function AdminQrPanel({
  qrDataUrl,
  certUrl,
  cert,
  fileName = "certificat-qr",
}: {
  qrDataUrl: string
  certUrl: string
  cert: Certificate
  fileName?: string
}) {
  function handleDownload() {
    const link = document.createElement("a")
    link.href = qrDataUrl
    link.download = `${fileName}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function handlePrint() {
    const win = window.open("", "_blank", "width=600,height=700")
    if (!win) return
    win.document.write(`
      <html>
        <head>
          <title>Certificate QR code</title>
          <style>
            body { font-family: system-ui, sans-serif; text-align: center; padding: 40px; color: #1f2937; }
            h1 { font-size: 18px; margin-bottom: 4px; }
            p { font-size: 12px; color: #6b7280; word-break: break-all; margin-top: 16px; }
            img { width: 280px; height: 280px; }
          </style>
        </head>
        <body>
          <h1>Conformity Certificate — GSO Mutabiq</h1>
          <img src="${qrDataUrl}" alt="QR code" />
          <p>${certUrl}</p>
          <script>window.onload = () => { window.print(); }</script>
        </body>
      </html>
    `)
    win.document.close()
  }

  const [generating, startGenerate] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleGeneratePdf() {
    setError(null)
    startGenerate(async () => {
      try {
        await generateCertificatePdf(cert, qrDataUrl, certUrl, fileName)
      } catch (err) {
        console.log("[v0] PDF generation error:", err)
        setError("PDF generation failed. Please try again.")
      }
    })
  }

  function handleViewPdf() {
    setError(null)
    const previewWindow = window.open("", "_blank")
    if (!previewWindow) {
      setError("Allow pop-ups to preview the PDF.")
      return
    }
    previewWindow.document.write("<p style='font-family:system-ui;padding:24px'>Generating PDF preview…</p>")

    startGenerate(async () => {
      try {
        const blob = await generateCertificatePdf(cert, qrDataUrl, certUrl, fileName, "preview")
        if (!blob) throw new Error("PDF preview was not created")
        const previewUrl = URL.createObjectURL(blob)
        previewWindow.location.href = previewUrl
        window.setTimeout(() => URL.revokeObjectURL(previewUrl), 60_000)
      } catch (err) {
        previewWindow.close()
        console.log("[v0] PDF preview error:", err)
        setError("PDF preview failed. Please try again.")
      }
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-foreground">QR code &amp; full dossier</h2>
      <p className="mt-1 text-sm text-muted-foreground text-pretty">
        This QR code always points to the public page. The PDF is a full dossier: the GSO certificate plus the
        Certificate of Origin, Tax Invoice, Commercial Invoice and Certificate of Conformity, merged into one file.
      </p>
      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-center">
        <div className="rounded-lg border border-border bg-background p-2">
          <Image
            src={qrDataUrl || "/placeholder.svg"}
            alt="Certificate QR code"
            width={140}
            height={140}
            className="h-35 w-35"
          />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <p className="break-all text-xs text-muted-foreground">{certUrl}</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={handleGeneratePdf} disabled={generating}>
              <FileText className="mr-1 h-4 w-4" />
              {generating ? "Generating…" : "Download dossier"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={handleViewPdf} disabled={generating}>
              <Eye className="mr-1 h-4 w-4" />
              View dossier
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={handleDownload}>
              <Download className="mr-1 h-4 w-4" />
              QR (PNG)
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={handlePrint}>
              <Printer className="mr-1 h-4 w-4" />
              Print QR
            </Button>
          </div>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
      </div>
    </div>
  )
}
