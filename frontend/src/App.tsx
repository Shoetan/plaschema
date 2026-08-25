import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const starterSchema = z.object({
  email: z.email('Enter a valid email address'),
})

type StarterFormValues = z.infer<typeof starterSchema>

export function App() {
  const [submittedEmail, setSubmittedEmail] = useState<string>()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StarterFormValues>({
    resolver: zodResolver(starterSchema),
    defaultValues: { email: '' },
  })

  function onSubmit(values: StarterFormValues) {
    setSubmittedEmail(values.email)
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-6">
      <section className="w-full max-w-md rounded-2xl border bg-card p-8 text-card-foreground shadow-sm">
        <p className="mb-2 text-sm font-medium text-muted-foreground">
          Plaschema workspace
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Frontend ready</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          React, TypeScript, Tailwind CSS, shadcn, Axios, TanStack Query,
          React Hook Form, and Zod are configured.
        </p>

        <form className="mt-8 space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <label className="block text-sm font-medium" htmlFor="email">
            Test the form setup
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            {...register('email')}
          />
          {errors.email ? (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          ) : null}
          <Button className="w-full" disabled={isSubmitting} type="submit">
            Verify setup
          </Button>
        </form>

        {submittedEmail ? (
          <p className="mt-4 text-sm text-muted-foreground" role="status">
            Form validation works for {submittedEmail}.
          </p>
        ) : null}
      </section>
    </main>
  )
}
