import LoginForm from "@/components/admin/LoginForm";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-marca-cream px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow">
        <h1 className="mb-6 text-center font-heading text-2xl text-marca-700">Panel Admin</h1>
        <LoginForm />
      </div>
    </main>
  );
}
