import { Button } from "@/components/ui/button"
import { Lock, MailCheck } from "lucide-react"

export function AdminLoginForm({
  step = "password",
  error,
}: {
  step?: "password" | "code"
  error?: "password" | "code" | "expired"
}) {
  if (step === "code") {
    return (
      <form
        method="POST"
        action="/api/admin/login"
        className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm"
      >
        <input type="hidden" name="step" value="code" />

        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <MailCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-lg font-bold text-foreground">Enter your code</h1>
            <p className="text-sm text-muted-foreground">We emailed you a 6-digit code</p>
          </div>
        </div>

        <label htmlFor="code" className="mb-1 block text-sm font-medium text-foreground">
          Verification code
        </label>
        <input
          id="code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={6}
          required
          autoFocus
          className="mb-4 w-full rounded-md border border-input bg-background px-3 py-2 text-center text-lg font-semibold tracking-[0.4em] text-foreground outline-none ring-ring focus:ring-2"
        />

        {error === "code" ? (
          <p className="mb-4 text-sm text-destructive" role="alert">
            Invalid code. Please check your email and try again.
          </p>
        ) : null}

        <Button type="submit" className="w-full">
          Verify and sign in
        </Button>

        <a href="/admin/login" className="mt-4 block text-center text-sm text-muted-foreground hover:text-foreground">
          Start over
        </a>
      </form>
    )
  }

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

      {error === "password" ? (
        <p className="mb-4 text-sm text-destructive" role="alert">
          Incorrect password.
        </p>
      ) : null}

      {error === "expired" ? (
        <p className="mb-4 text-sm text-destructive" role="alert">
          Your code expired or was entered too many times. Please sign in again.
        </p>
      ) : null}

      <Button type="submit" className="w-full">
        Continue
      </Button>
    </form>
  )
}
