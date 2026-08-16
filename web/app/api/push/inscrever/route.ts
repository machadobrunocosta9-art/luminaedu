import { getAuthContext, resolveAuthSchoolId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Body = {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
};

export async function POST(request: Request) {
  const auth = await getAuthContext();

  if (!auth || auth.kind !== "user" || !auth.usuarioId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const escolaId = await resolveAuthSchoolId(auth);
  const body = (await request.json()) as Body;

  const endpoint = body.endpoint?.trim();
  const p256dh = body.keys?.p256dh?.trim();
  const authKey = body.keys?.auth?.trim();

  if (!endpoint || !p256dh || !authKey) {
    return NextResponse.json(
      { error: "Inscrição inválida." },
      { status: 400 },
    );
  }

  await prisma.inscricaoPush.upsert({
    where: { endpoint },
    update: {
      p256dh,
      auth: authKey,
      usuarioId: auth.usuarioId,
      escolaId,
      ultimoUsoEm: new Date(),
    },
    create: {
      endpoint,
      p256dh,
      auth: authKey,
      usuarioId: auth.usuarioId,
      escolaId,
    },
  });

  return NextResponse.json({ ok: true });
}
