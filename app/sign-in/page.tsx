import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="p-4">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Se7e Audio Base</h1>
          <p className="text-muted-foreground">Faça login para acessar o sistema</p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg",
            },
          }}
          redirectUrl="/"
        />
      </div>
    </div>
  )
}
