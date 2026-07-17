import Image from "next/image";
import { LoginForm } from "@/app/login/LoginForm";

type LoginPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const requestedNext = (await searchParams).next;
  const nextPath = typeof requestedNext === "string" ? requestedNext : "/dashboard";

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-8 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700 sm:px-6 lg:py-10">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_70%_42%_at_50%_0%,rgba(139,124,248,0.2),transparent_72%),linear-gradient(145deg,var(--background)_0%,var(--secondary)_50%,var(--background)_100%)]"
      />

      <section className="relative w-full max-w-[460px] rounded-[2rem] border border-white/80 bg-white/82 px-6 py-7 shadow-[0_24px_64px_rgba(42,31,79,0.1),0_1px_4px_rgba(42,31,79,0.04)] ring-1 ring-primary/5 backdrop-blur-xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700 sm:px-9 sm:py-8">
        <div className="mx-auto flex flex-col items-center motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-700 motion-safe:[animation-delay:120ms] motion-safe:[animation-fill-mode:both]">
          <div className="flex h-16 w-full max-w-[17rem] items-center justify-center sm:h-20 sm:max-w-[19rem]">
            <Image
              src="/brand/lumina-logo-transparent.png?v=20260716-transparent"
              alt="Lumina Edu"
              width={932}
              height={147}
              priority
              unoptimized
              className="h-auto w-full object-contain"
            />
          </div>
        </div>

        <div className="mt-4 text-center motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-700 motion-safe:[animation-delay:220ms] motion-safe:[animation-fill-mode:both]">
          <h1 className="text-[1.75rem] font-semibold tracking-[-0.035em] text-secondary-foreground sm:text-[2rem]">
            Bem-vindo à Lumina
          </h1>
          <p className="mx-auto mt-2.5 max-w-sm text-sm leading-6 text-muted-foreground sm:text-[15px]">
            A plataforma que devolve tempo para educar.
          </p>
        </div>

        <LoginForm nextPath={nextPath} />

        <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-muted-foreground/80 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700 motion-safe:[animation-delay:620ms] motion-safe:[animation-fill-mode:both]">
          <span className="h-1.5 w-1.5 rounded-full bg-primary/55 shadow-[0_0_8px_rgba(91,63,214,0.35)]" />
          <span>Ambiente seguro para a gestão escolar</span>
        </div>
      </section>
    </main>
  );
}

