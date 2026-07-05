export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#F6F4EF] flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl bg-white p-10 shadow-xl">

        <h1 className="text-4xl font-bold text-[#241D16]">
          Atlas
        </h1>

        <p className="mt-2 text-[#6B6B6B]">
          Sistema Operacional Escolar
        </p>

        <div className="mt-10 space-y-5">

          <div>
            <label>Email</label>

            <input
              className="mt-2 w-full rounded-xl border px-4 py-3"
              placeholder="email@escola.com"
            />
          </div>

          <div>
            <label>Senha</label>

            <input
              type="password"
              className="mt-2 w-full rounded-xl border px-4 py-3"
              placeholder="********"
            />
          </div>

          <button className="mt-6 w-full rounded-xl bg-[#F4B400] py-3 font-semibold">
            Entrar
          </button>

        </div>

      </div>
    </main>
  );
}

