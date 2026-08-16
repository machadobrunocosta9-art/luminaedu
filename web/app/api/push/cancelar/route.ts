import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await getAuthContext();

  if (!auth || auth.kind !== "user" || !auth.usuarioId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = (await request.json()) as { endpoint?: string };
  const endpoint = body.endpoint?.trim();

  if (!endpoint) {
    return NextResponse.json({ error: "Inscrição inválida." }, { status: 400 });
  }

  await prisma.inscricaoPush.deleteMany({
    where: { endpoint, usuarioId: auth.usuarioId },
  });

  return NextResponse.json({ ok: true });
}
