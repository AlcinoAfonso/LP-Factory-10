import { LoginForm } from '@/components/login-form'

type LoginSearchParams = {
  next?: string
}

export default async function Page(props: any) {
  const searchParams = (props.searchParams
    ? await props.searchParams
    : undefined) as LoginSearchParams | undefined

  const nextValue = searchParams?.next ?? null

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm next={nextValue} />
      </div>
    </div>
  )
}
