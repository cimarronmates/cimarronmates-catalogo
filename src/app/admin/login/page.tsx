import Image from "next/image";
import LoginForm from "@/components/admin/LoginForm";
import { siteConfig } from "@/lib/config";

export default function AdminLoginPage() {
  return (
    <main className="surface-oscura textura-papel relative flex min-h-screen items-center justify-center bg-marca-900 px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60"
        style={{
          background:
            "radial-gradient(circle, rgba(230,198,95,0.22) 0%, rgba(13,33,22,0) 65%)",
        }}
      />

      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt=""
            width={786}
            height={800}
            priority
            className="h-20 w-20 object-contain"
          />
          <h1 className="mt-4 font-display text-xl font-semibold text-crema">
            {siteConfig.brandName}
          </h1>
          <p className="mt-1 text-sm text-crema/60">Panel de productos</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white p-6 shadow-2xl sm:p-7">
          <LoginForm />
        </div>

        <p className="mt-5 text-center text-xs text-crema/45">
          Acceso restringido. Si perdiste el acceso, recuperalo desde Supabase.
        </p>
      </div>
    </main>
  );
}
