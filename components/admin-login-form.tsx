import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react"

export function AdminLoginForm({ error = false }: { error?: boolean }) {
  return (
    <form
      method="POST"
      action="/api/admin/login"
      className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm"
    >
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Lock className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-lg font-bold text-foreground">Admin area</h1>
          <p className="text-sm text-muted-foreground">Sign in required</p>
        </div>
      </div>

      <label htmlFor="password" className="mb-1 block text-sm font-medium text-foreground">
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        className="mb-4 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring focus:ring-2"
      />

      {error ? (
        <p className="mb-4 text-sm text-destructive" role="alert">
          Incorrect password.
        </p>
      ) : null}

      <Button type="submit" className="w-full">
        Sign in
      </Button>
    </form>
  )
}
