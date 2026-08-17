import { neon } from "@neondatabase/serverless"
const sql = neon(process.env.DATABASE_URL)
const rows = await sql`select slug, brand, model from certificates order by "updatedAt" desc limit 5`
console.log(JSON.stringify(rows))
