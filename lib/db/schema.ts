import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core"

// One-time login codes for admin two-factor authentication (sent by email).
export const adminLoginCode = pgTable("admin_login_code", {
  id: serial("id").primaryKey(),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  attempts: integer("attempts").notNull().default(0),
  consumed: boolean("consumed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const certificate = pgTable("certificate", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  ccrNumber: text("ccr_number").notNull().default(""),
  status: text("status").notNull().default("Valid"),
  certificateType: text("certificate_type").notNull().default("Motor Vehicle"),
  applicant: text("applicant").notNull().default(""),
  manufacturer: text("manufacturer").notNull().default(""),
  brand: text("brand").notNull().default(""),
  model: text("model").notNull().default(""),
  modelYear: text("model_year").notNull().default(""),
  vehicleCategory: text("vehicle_category").notNull().default(""),
  countryOfOrigin: text("country_of_origin").notNull().default(""),
  vin: text("vin").notNull().default(""),
  engineNumber: text("engine_number").notNull().default(""),
  fuelType: text("fuel_type").notNull().default(""),
  numberOfCylinders: text("number_of_cylinders").notNull().default(""),
  engineCapacity: text("engine_capacity").notNull().default(""),
  color: text("color").notNull().default(""),
  issueDate: text("issue_date").notNull().default(""),
  expiryDate: text("expiry_date").notNull().default(""),
  notes: text("notes").notNull().default(""),
  // Détails de l'en-tête et identification
  manufacturerAddress: text("manufacturer_address").notNull().default(""),
  countryOfProduction: text("country_of_production").notNull().default(""),
  vehicleType: text("vehicle_type").notNull().default(""),
  manufacturerRef: text("manufacturer_ref").notNull().default(""),
  producedAfter: text("produced_after").notNull().default(""),
  techRegulations: text("tech_regulations").notNull().default(""),
  // Poids
  maxVehicleWeight: text("max_vehicle_weight").notNull().default(""),
  curbWeight: text("curb_weight").notNull().default(""),
  maxAxleFront: text("max_axle_front").notNull().default(""),
  maxAxleRear: text("max_axle_rear").notNull().default(""),
  // Dimensions
  lengthMm: text("length_mm").notNull().default(""),
  widthMm: text("width_mm").notNull().default(""),
  heightMm: text("height_mm").notNull().default(""),
  wheelbaseMm: text("wheelbase_mm").notNull().default(""),
  trackFront: text("track_front").notNull().default(""),
  trackRear: text("track_rear").notNull().default(""),
  // Châssis & passagers
  chassisBodyType: text("chassis_body_type").notNull().default(""),
  numPassengers: text("num_passengers").notNull().default(""),
  // Moteur (compléments)
  airIntake: text("air_intake").notNull().default(""),
  netEnginePower: text("net_engine_power").notNull().default(""),
  engineRpm: text("engine_rpm").notNull().default(""),
  pollutantLimit: text("pollutant_limit").notNull().default(""),
  transmission: text("transmission").notNull().default(""),
  ecallSystem: text("ecall_system").notNull().default(""),
  // Freins
  serviceBrakes: text("service_brakes").notNull().default(""),
  emergencyBrakes: text("emergency_brakes").notNull().default(""),
  // Économie de carburant
  fuelVehicleClass: text("fuel_vehicle_class").notNull().default(""),
  feCafeCombined: text("fe_cafe_combined").notNull().default(""),
  feRating: text("fe_rating").notNull().default(""),
  // Export / facturation (dossier complet)
  exporterName: text("exporter_name").notNull().default("JAWHARAT AL BAKHEET FZCO"),
  exporterAddress: text("exporter_address").notNull().default("UNITED ARAB EMIRATES"),
  consigneeName: text("consignee_name").notNull().default(""),
  consigneeAddress: text("consignee_address").notNull().default(""),
  destinationCountry: text("destination_country").notNull().default(""),
  meansOfTransport: text("means_of_transport").notNull().default("By Sea"),
  portOfDischarge: text("port_of_discharge").notNull().default(""),
  departureDate: text("departure_date").notNull().default(""),
  invoiceNumber: text("invoice_number").notNull().default(""),
  invoiceDate: text("invoice_date").notNull().default(""),
  originCertNumber: text("origin_cert_number").notNull().default(""),
  originCertDate: text("origin_cert_date").notNull().default(""),
  priceUsd: text("price_usd").notNull().default(""),
  priceWords: text("price_words").notNull().default(""),
  numDoors: text("num_doors").notNull().default(""),
  numSeats: text("num_seats").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export type Certificate = typeof certificate.$inferSelect
