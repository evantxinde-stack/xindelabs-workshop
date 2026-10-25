import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="grid-bg flex min-h-screen items-center justify-center px-4">
      <LoginForm />
    </div>
  );
}
