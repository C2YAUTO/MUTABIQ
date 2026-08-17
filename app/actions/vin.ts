"use server"

import crypto from "crypto"
import { isAdminAuthenticated } from "@/lib/admin-auth"

const API_PREFIX = "https://api.vindecoder.eu/3.2"

/** Result returned to the admin form: a map of certificate field name -> value. */
export type DecodedVin = {
  ok: boolean
  error?: string
  /** Fields mapped onto our certificate schema, ready to pre-fill the form. */
  fields?: Record<string, string>
  /** Human-readable list of the fields we managed to fill. */
  filled?: string[]
}

/** Title Case helper: "FORD" -> "Ford", "united states" -> "United States". */
function titleCase(s: string) {
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

/**
 * Decode a VIN through the Vincario (vindecoder.eu) API and map the result
 * onto our certificate fields. Runs on the server so the API/secret keys are
 * never exposed to the browser.
 */
export async function decodeVin(rawVin: string): Promise<DecodedVin> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Unauthorized" }
  }

  const apiKey = process.env.VINCARIO_API_KEY
  const secretKey = process.env.VINCARIO_SECRET_KEY
  if (!apiKey || !secretKey) {
    return {
      ok: false,
      error: "Vincario keys are missing (VINCARIO_API_KEY / VINCARIO_SECRET_KEY).",
    }
  }

  const vin = rawVin.trim().toUpperCase()
  if (vin.length < 11) {
    return { ok: false, error: "Enter a valid VIN (usually 17 characters)." }
  }

  const id = "decode"
  const controlSum = crypto
    .createHash("sha1")
    .update(`${vin}|${id}|${apiKey}|${secretKey}`)
    .digest("hex")
    .slice(0, 10)

  const url = `${API_PREFIX}/${apiKey}/${controlSum}/${id}/${vin}.json`

  let json: any
  try {
    const res = await fetch(url, { cache: "no-store" })
    json = await res.json()
  } catch {
    return { ok: false, error: "Could not reach the Vincario service. Try again." }
  }

  // Vincario returns { decode: [ { label, value }, ... ] } on success.
  const decode: Array<{ label?: string; value?: unknown }> = Array.isArray(json?.decode)
    ? json.decode
    : []

  if (decode.length === 0) {
    const apiError = json?.error || json?.message
    return {
      ok: false,
      error: apiError
        ? `Vincario: ${String(apiError)}`
        : "This VIN could not be decoded. Fill in the fields manually.",
    }
  }

  // Build a case-insensitive lookup of label -> value.
  const map = new Map<string, string>()
  for (const item of decode) {
    if (!item?.label) continue
    const v = item.value
    if (v === null || v === undefined || v === "") continue
    map.set(item.label.toLowerCase(), String(v).trim())
  }
  const get = (label: string) => map.get(label.toLowerCase()) ?? ""

  const fields: Record<string, string> = {}
  const filled: string[] = []
  const set = (name: string, value: string, humanLabel?: string) => {
    if (!value) return
    fields[name] = value
    if (humanLabel) filled.push(humanLabel)
  }

  // Always normalise the VIN and mark the certificate as valid + fresh CCR.
  set("vin", vin)
  set("status", "Valid")
  const randomCcr = String(Math.floor(100000 + Math.random() * 900000))
  set("ccrNumber", randomCcr, `CCR (${randomCcr})`)

  // Fixed default values applied on every decode.
  set("certificateType", "Motor vehicles", "certificate type")
  set("fuelVehicleClass", "Passenger car", "vehicle class")
  set("feRating", "Excellent", "rating")
  set("ecallSystem", "Provided", "eCall SOS")

  const make = get("Make")
  const model = get("Model")
  const year = get("Model Year")

  if (make) {
    set("brand", titleCase(make), "brand")
    set("manufacturer", titleCase(get("Manufacturer") || make))
  }
  if (model) set("model", titleCase(model), "model")
  if (make || model) {
    set("vehicleType", [make, model].filter(Boolean).join(" ").toUpperCase())
  }
  if (year) set("modelYear", year, "year")

  // Category / body
  set("vehicleCategory", titleCase(get("Body") || get("Product Type")))
  set("chassisBodyType", titleCase(get("Body")))

  // Origin & production
  set("countryOfProduction", titleCase(get("Plant Country")), "country of production")
  set("manufacturerAddress", get("Manufacturer Address"), "manufacturer address")

  // Emission standard -> manufacturer ref + pollutant limit
  const emission = get("Emission Standard")
  set("manufacturerRef", emission)
  set("pollutantLimit", emission)

  // Engine
  set("fuelType", titleCase(get("Fuel Type - Primary") || get("Fuel Type")), "fuel type")
  set("numberOfCylinders", get("Number of Cylinders") || get("Engine Cylinders"))
  const displCcm = get("Engine Displacement (ccm)") || get("Engine Displacement (cc)")
  const displL = get("Engine Displacement (l)") || get("Engine Displacement (L)")
  if (displCcm) set("engineCapacity", `${displCcm} cc`, "displacement")
  else if (displL) set("engineCapacity", `${displL} L`, "displacement")
  const powerKw = get("Engine Power (kW)") || get("Engine Power (kw)")
  if (powerKw) set("netEnginePower", powerKw)
  set("engineRpm", get("Engine Power RPM") || get("Max Power RPM"))

  // Transmission (best effort from gears / drive)
  const gears = get("Number of Gears")
  const drive = get("Drive")
  const transmissionParts = [gears ? `${gears} gears` : "", drive].filter(Boolean)
  if (transmissionParts.length) set("transmission", transmissionParts.join(", "))

  // Brakes
  set("serviceBrakes", titleCase(get("Front Brakes")))
  set("emergencyBrakes", titleCase(get("Rear Brakes")))

  // Doors & seats
  const doors = get("Number of Doors")
  const seats = get("Number of Seats")
  set("numDoors", doors)
  set("numSeats", seats)
  if (seats) set("numPassengers", seats)

  // Weights (kg)
  set("curbWeight", get("Weight Empty (kg)"))
  set("maxVehicleWeight", get("Max Weight (kg)"))

  // Dimensions (mm)
  set("lengthMm", get("Length (mm)"), "dimensions")
  set("widthMm", get("Width (mm)"))
  set("heightMm", get("Height (mm)"))
  set("wheelbaseMm", get("Wheelbase (mm)"))
  set("trackFront", get("Track Front (mm)"))
  set("trackRear", get("Track Rear (mm)"))

  const meaningful = filled.length > 0 || Object.keys(fields).length > 2
  if (!meaningful) {
    return {
      ok: false,
      error: "VIN recognized but no usable data. Fill in the fields manually.",
    }
  }

  return { ok: true, fields, filled }
}
