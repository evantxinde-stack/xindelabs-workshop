export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <div className="grid-bg min-h-screen flex items-center justify-center">
      <div className="panel p-6">
        <h1 className="text-xl font-bold">Admin Login</h1>
        <p className="text-sm text-white/50 mt-2">Basic Auth diperlukan. Gunakan kredensial admin.</p>
      </div>
    </div>
  );
}
