import { prisma } from "@/lib/prisma";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  HeartPulse,
  Home,
  LockKeyhole,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    token: string;
  }>;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function formatarData(data: Date) {
  return data.toLocaleDateString("pt-BR");
}

async function concluirMatricula(formData: FormData) {
  "use server";

  const token = getString(formData, "token");

  const nomeAluno = getString(formData, "nomeAluno");
  const dataNascimento = getString(formData, "dataNascimento");
  const sexo = getString(formData, "sexo");
  const cpfAluno = getString(formData, "cpfAluno");
  const certidaoNascimento = getString(
    formData,
    "certidaoNascimento",
  );
  const alergias = getString(formData, "alergias");
  const observacoesAluno = getString(
    formData,
    "observacoesAluno",
  );

  const nomeResponsavel = getString(
    formData,
    "nomeResponsavel",
  );
  const cpfResponsavel = getString(
    formData,
    "cpfResponsavel",
  );
  const telefoneResponsavel = getString(
    formData,
    "telefoneResponsavel",
  );
  const emailResponsavel = getString(
    formData,
    "emailResponsavel",
  );
  const profissaoResponsavel = getString(
    formData,
    "profissaoResponsavel",
  );
  const enderecoResponsavel = getString(
    formData,
    "enderecoResponsavel",
  );

  const contatoEmergenciaNome = getString(
    formData,
    "contatoEmergenciaNome",
  );
  const contatoEmergenciaTelefone = getString(
    formData,
    "contatoEmergenciaTelefone",
  );
  const contatoEmergenciaParentesco = getString(
    formData,
    "contatoEmergenciaParentesco",
  );

  const autorizacaoImagem =
    formData.get("autorizacaoImagem") === "on";

  const confirmacaoDados =
    formData.get("confirmacaoDados") === "on";

  if (
    !token ||
    !nomeAluno ||
    !dataNascimento ||
    !nomeResponsavel ||
    !cpfResponsavel ||
    !telefoneResponsavel ||
    !enderecoResponsavel ||
    !confirmacaoDados
  ) {
    throw new Error(
      "Preencha todos os campos obrigatórios e confirme os dados.",
    );
  }

  const convite = await prisma.conviteMatricula.findUnique({
    where: {
      token,
    },
    include: {
      escola: true,
      turma: true,
      matricula: true,
    },
  });

  if (!convite) {
    throw new Error("Convite de matrícula não encontrado.");
  }

  if (convite.expiraEm <= new Date()) {
    await prisma.conviteMatricula.update({
      where: {
        id: convite.id,
      },
      data: {
        status: "EXPIRADO",
      },
    });

    throw new Error("Este convite de matrícula expirou.");
  }

  if (convite.status === "CANCELADO") {
    throw new Error("Este convite foi cancelado.");
  }

  if (
    convite.status === "CONCLUIDO" ||
    convite.matriculaId
  ) {
    redirect(`/matricula/convite/${token}`);
  }

  if (!convite.turma) {
    throw new Error(
      "A turma deste convite não está mais disponível.",
    );
  }

  const totalAlunosNaTurma = await prisma.aluno.count({
    where: {
      turmaId: convite.turma.id,
    },
  });

  if (
    totalAlunosNaTurma >= convite.turma.capacidade
  ) {
    throw new Error(
      "A turma selecionada atingiu a capacidade máxima. Entre em contato com a escola.",
    );
  }

  const observacoesCompletas = [
    observacoesAluno || null,
    contatoEmergenciaNome
      ? `Contato de emergência: ${contatoEmergenciaNome}`
      : null,
    contatoEmergenciaParentesco
      ? `Parentesco do contato de emergência: ${contatoEmergenciaParentesco}`
      : null,
    contatoEmergenciaTelefone
      ? `Telefone de emergência: ${contatoEmergenciaTelefone}`
      : null,
    `Autorização de uso de imagem: ${
      autorizacaoImagem ? "Sim" : "Não"
    }`,
  ]
    .filter(Boolean)
    .join("\n");

  await prisma.$transaction(async (tx) => {
    let responsavel = await tx.responsavel.findUnique({
      where: {
        cpf: cpfResponsavel,
      },
    });

    if (responsavel) {
      responsavel = await tx.responsavel.update({
        where: {
          id: responsavel.id,
        },
        data: {
          nome: nomeResponsavel,
          telefone: telefoneResponsavel,
          email: emailResponsavel || null,
          profissao: profissaoResponsavel || null,
          endereco: enderecoResponsavel,
        },
      });
    } else {
      responsavel = await tx.responsavel.create({
        data: {
          nome: nomeResponsavel,
          cpf: cpfResponsavel,
          telefone: telefoneResponsavel,
          email: emailResponsavel || null,
          profissao: profissaoResponsavel || null,
          endereco: enderecoResponsavel,
          escolaId: convite.escolaId,
        },
      });
    }

    const aluno = await tx.aluno.create({
      data: {
        nome: nomeAluno,
        dataNascimento: new Date(
          `${dataNascimento}T12:00:00`,
        ),
        sexo: sexo || null,
        cpf: cpfAluno || null,
        certidaoNascimento:
          certidaoNascimento || null,
        alergias: alergias || null,
        observacoes: observacoesCompletas || null,
        escolaId: convite.escolaId,
        responsavelId: responsavel.id,
        turmaId: convite.turmaId,
      },
    });

    const matricula = await tx.matricula.create({
      data: {
        anoLetivo: convite.anoLetivo,
        status: "EM_ANALISE",
        escolaId: convite.escolaId,
        alunoId: aluno.id,
      },
    });

    await tx.tarefa.createMany({
      data: [
        {
          titulo: "Analisar dados da matrícula",
          descricao: `Conferir os dados preenchidos pela família de ${aluno.nome}.`,
          setor: "Secretaria",
          prioridade: "ALTA",
          escolaId: convite.escolaId,
          alunoId: aluno.id,
          matriculaId: matricula.id,
        },
        {
          titulo: "Conferir documentos da matrícula",
          descricao: `Solicitar e analisar os documentos obrigatórios de ${aluno.nome}.`,
          setor: "Secretaria",
          prioridade: "ALTA",
          escolaId: convite.escolaId,
          alunoId: aluno.id,
          matriculaId: matricula.id,
        },
        {
          titulo: "Preparar contrato de matrícula",
          descricao: `Preparar o contrato para assinatura do responsável por ${aluno.nome}.`,
          setor: "Secretaria",
          prioridade: "ALTA",
          escolaId: convite.escolaId,
          alunoId: aluno.id,
          matriculaId: matricula.id,
        },
        {
          titulo: "Confirmar pagamento da matrícula",
          descricao: `Verificar o pagamento inicial da matrícula de ${aluno.nome}.`,
          setor: "Financeiro",
          prioridade: "MEDIA",
          escolaId: convite.escolaId,
          alunoId: aluno.id,
          matriculaId: matricula.id,
        },
      ],
    });

    await tx.conviteMatricula.update({
      where: {
        id: convite.id,
      },
      data: {
        status: "CONCLUIDO",
        preenchidoEm: new Date(),
        concluidoEm: new Date(),
        matriculaId: matricula.id,
        rascunhoDados: {
          autorizacaoImagem,
          contatoEmergenciaNome,
          contatoEmergenciaTelefone,
          contatoEmergenciaParentesco,
        },
      },
    });
  });

  redirect(`/matricula/convite/${token}`);
}

export default async function ConvitePublicoPage({
  params,
}: PageProps) {
  const { token } = await params;

  const convite =
    await prisma.conviteMatricula.findUnique({
      where: {
        token,
      },
      include: {
        escola: true,
        turma: true,
        matricula: {
          include: {
            aluno: true,
          },
        },
      },
    });

  if (!convite) {
    notFound();
  }

  const agora = new Date();

  if (
    convite.expiraEm <= agora &&
    ![
      "CONCLUIDO",
      "CANCELADO",
      "EXPIRADO",
    ].includes(convite.status)
  ) {
    await prisma.conviteMatricula.update({
      where: {
        id: convite.id,
      },
      data: {
        status: "EXPIRADO",
      },
    });

    convite.status = "EXPIRADO";
  }

  if (
    ["AGUARDANDO_ENVIO", "AGUARDANDO_RESPONSAVEL"].includes(
      convite.status,
    )
  ) {
    await prisma.conviteMatricula.update({
      where: {
        id: convite.id,
      },
      data: {
        status: "EM_PREENCHIMENTO",
        visualizadoEm:
          convite.visualizadoEm ?? new Date(),
      },
    });

    convite.status = "EM_PREENCHIMENTO";
  }

  const conviteConcluido =
    convite.status === "CONCLUIDO" &&
    convite.matricula;

  const conviteBloqueado = [
    "EXPIRADO",
    "CANCELADO",
  ].includes(convite.status);

  return (
    <main className="min-h-screen bg-[#fafafc] text-[#1f2937]">
      <header className="border-b border-[#e6e7ee] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5b3fd6] font-bold text-white shadow-sm">
              L
            </div>

            <div>
              <p className="font-semibold tracking-tight">
                Lumina
              </p>

              <p className="text-xs text-[#6b7280]">
                Matrícula digital segura
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 text-sm text-[#6b7280] sm:flex">
            <LockKeyhole size={16} />
            Ambiente protegido
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 lg:py-12">
        {conviteConcluido ? (
          <section className="mx-auto max-w-2xl rounded-[2rem] border border-[#e6e7ee] bg-white p-7 text-center shadow-sm lg:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 size={30} />
            </div>

            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-[#5b3fd6]">
              Preenchimento concluído
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Matrícula enviada com sucesso
            </h1>

            <p className="mt-4 text-sm leading-7 text-[#6b7280]">
              Os dados de{" "}
              <strong className="text-[#1f2937]">
                {convite.matricula?.aluno.nome}
              </strong>{" "}
              foram recebidos pela{" "}
              {convite.escola.nome}. A Secretaria agora
              fará a conferência das informações.
            </p>

            <div className="mt-7 rounded-3xl border border-[#e6e7ee] bg-[#fafafc] p-5 text-left">
              <div className="flex items-start gap-3">
                <ClipboardCheck
                  size={21}
                  className="mt-0.5 shrink-0 text-[#5b3fd6]"
                />

                <div>
                  <p className="font-semibold">
                    Próximas etapas
                  </p>

                  <p className="mt-2 text-sm leading-6 text-[#6b7280]">
                    A escola ainda poderá solicitar
                    documentos, assinatura do contrato e
                    confirmação do pagamento.
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-6 text-xs leading-5 text-[#6b7280]">
              Você já pode fechar esta página.
            </p>
          </section>
        ) : conviteBloqueado ? (
          <section className="mx-auto max-w-2xl rounded-[2rem] border border-[#e6e7ee] bg-white p-7 text-center shadow-sm lg:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-red-700">
              <AlertTriangle size={30} />
            </div>

            <h1 className="mt-6 text-3xl font-semibold tracking-tight">
              Convite indisponível
            </h1>

            <p className="mt-4 text-sm leading-7 text-[#6b7280]">
              {convite.status === "EXPIRADO"
                ? "O prazo deste convite terminou."
                : "Este convite foi cancelado pela escola."}
            </p>

            <p className="mt-4 text-sm leading-7 text-[#6b7280]">
              Entre em contato com a{" "}
              <strong className="text-[#1f2937]">
                {convite.escola.nome}
              </strong>{" "}
              para solicitar um novo link.
            </p>
          </section>
        ) : (
          <>
            <section className="mb-7 overflow-hidden rounded-[2rem] border border-[#dcd8fb] bg-[#f4f1ff] p-6 shadow-sm lg:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5b3fd6]">
                    Convite de matrícula
                  </p>

                  <h1 className="mt-3 text-3xl font-semibold tracking-tight lg:text-4xl">
                    Complete os dados de{" "}
                    {convite.nomeAluno}
                  </h1>

                  <p className="mt-4 max-w-3xl text-sm leading-7 text-[#6b7280]">
                    A {convite.escola.nome} iniciou este
                    processo. Preencha as informações abaixo
                    para enviar a matrícula à Secretaria.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/70 bg-white/70 p-5 backdrop-blur">
                  <p className="text-xs text-[#6b7280]">
                    Turma pretendida
                  </p>

                  <p className="mt-1 font-semibold">
                    {convite.turma?.nome ??
                      "A definir"}
                  </p>

                  <p className="mt-3 text-xs text-[#6b7280]">
                    Ano letivo
                  </p>

                  <p className="mt-1 font-semibold">
                    {convite.anoLetivo}
                  </p>
                </div>
              </div>
            </section>

            <form
              action={concluirMatricula}
              className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]"
            >
              <input
                type="hidden"
                name="token"
                value={convite.token}
              />

              <div className="space-y-6">
                <section className="rounded-[2rem] border border-[#e6e7ee] bg-white p-6 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f4f1ff] text-[#5b3fd6]">
                      <GraduationCap size={21} />
                    </div>

                    <div>
                      <h2 className="text-xl font-semibold">
                        Dados do aluno
                      </h2>

                      <p className="mt-1 text-sm text-[#6b7280]">
                        Informações pessoais e de saúde.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-5 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label
                        htmlFor="nomeAluno"
                        className="text-sm font-medium"
                      >
                        Nome completo *
                      </label>

                      <input
                        id="nomeAluno"
                        name="nomeAluno"
                        required
                        defaultValue={convite.nomeAluno}
                        className="mt-2 h-12 w-full rounded-2xl border border-[#e6e7ee] bg-[#fafafc] px-4 text-sm outline-none transition focus:border-[#5b3fd6] focus:ring-4 focus:ring-[#5b3fd6]/10"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="dataNascimento"
                        className="text-sm font-medium"
                      >
                        Data de nascimento *
                      </label>

                      <input
                        id="dataNascimento"
                        name="dataNascimento"
                        type="date"
                        required
                        className="mt-2 h-12 w-full rounded-2xl border border-[#e6e7ee] bg-[#fafafc] px-4 text-sm outline-none transition focus:border-[#5b3fd6] focus:ring-4 focus:ring-[#5b3fd6]/10"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="sexo"
                        className="text-sm font-medium"
                      >
                        Sexo
                      </label>

                      <select
                        id="sexo"
                        name="sexo"
                        className="mt-2 h-12 w-full rounded-2xl border border-[#e6e7ee] bg-[#fafafc] px-4 text-sm outline-none transition focus:border-[#5b3fd6]"
                      >
                        <option value="">
                          Não informado
                        </option>
                        <option value="Feminino">
                          Feminino
                        </option>
                        <option value="Masculino">
                          Masculino
                        </option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="cpfAluno"
                        className="text-sm font-medium"
                      >
                        CPF do aluno
                      </label>

                      <input
                        id="cpfAluno"
                        name="cpfAluno"
                        inputMode="numeric"
                        placeholder="000.000.000-00"
                        className="mt-2 h-12 w-full rounded-2xl border border-[#e6e7ee] bg-[#fafafc] px-4 text-sm outline-none transition placeholder:text-[#9ca3af] focus:border-[#5b3fd6]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="certidaoNascimento"
                        className="text-sm font-medium"
                      >
                        Número da certidão
                      </label>

                      <input
                        id="certidaoNascimento"
                        name="certidaoNascimento"
                        className="mt-2 h-12 w-full rounded-2xl border border-[#e6e7ee] bg-[#fafafc] px-4 text-sm outline-none transition focus:border-[#5b3fd6]"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label
                        htmlFor="alergias"
                        className="text-sm font-medium"
                      >
                        Alergias ou restrições
                      </label>

                      <input
                        id="alergias"
                        name="alergias"
                        placeholder="Ex.: Lactose, dipirona, amendoim..."
                        className="mt-2 h-12 w-full rounded-2xl border border-[#e6e7ee] bg-[#fafafc] px-4 text-sm outline-none transition placeholder:text-[#9ca3af] focus:border-[#5b3fd6]"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label
                        htmlFor="observacoesAluno"
                        className="text-sm font-medium"
                      >
                        Informações importantes
                      </label>

                      <textarea
                        id="observacoesAluno"
                        name="observacoesAluno"
                        rows={4}
                        placeholder="Medicamentos, acompanhamento médico ou outras observações..."
                        className="mt-2 w-full resize-none rounded-2xl border border-[#e6e7ee] bg-[#fafafc] px-4 py-3 text-sm outline-none transition placeholder:text-[#9ca3af] focus:border-[#5b3fd6]"
                      />
                    </div>
                  </div>
                </section>

                <section className="rounded-[2rem] border border-[#e6e7ee] bg-white p-6 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f4f1ff] text-[#5b3fd6]">
                      <UserRound size={21} />
                    </div>

                    <div>
                      <h2 className="text-xl font-semibold">
                        Responsável
                      </h2>

                      <p className="mt-1 text-sm text-[#6b7280]">
                        Dados pessoais e de contato.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-5 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label
                        htmlFor="nomeResponsavel"
                        className="text-sm font-medium"
                      >
                        Nome completo *
                      </label>

                      <input
                        id="nomeResponsavel"
                        name="nomeResponsavel"
                        required
                        defaultValue={
                          convite.nomeResponsavel
                        }
                        className="mt-2 h-12 w-full rounded-2xl border border-[#e6e7ee] bg-[#fafafc] px-4 text-sm outline-none transition focus:border-[#5b3fd6]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="cpfResponsavel"
                        className="text-sm font-medium"
                      >
                        CPF *
                      </label>

                      <input
                        id="cpfResponsavel"
                        name="cpfResponsavel"
                        required
                        inputMode="numeric"
                        placeholder="000.000.000-00"
                        className="mt-2 h-12 w-full rounded-2xl border border-[#e6e7ee] bg-[#fafafc] px-4 text-sm outline-none transition placeholder:text-[#9ca3af] focus:border-[#5b3fd6]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="telefoneResponsavel"
                        className="text-sm font-medium"
                      >
                        Telefone *
                      </label>

                      <input
                        id="telefoneResponsavel"
                        name="telefoneResponsavel"
                        required
                        type="tel"
                        defaultValue={
                          convite.telefoneResponsavel
                        }
                        className="mt-2 h-12 w-full rounded-2xl border border-[#e6e7ee] bg-[#fafafc] px-4 text-sm outline-none transition focus:border-[#5b3fd6]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="emailResponsavel"
                        className="text-sm font-medium"
                      >
                        E-mail
                      </label>

                      <input
                        id="emailResponsavel"
                        name="emailResponsavel"
                        type="email"
                        defaultValue={
                          convite.emailResponsavel ?? ""
                        }
                        className="mt-2 h-12 w-full rounded-2xl border border-[#e6e7ee] bg-[#fafafc] px-4 text-sm outline-none transition focus:border-[#5b3fd6]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="profissaoResponsavel"
                        className="text-sm font-medium"
                      >
                        Profissão
                      </label>

                      <input
                        id="profissaoResponsavel"
                        name="profissaoResponsavel"
                        className="mt-2 h-12 w-full rounded-2xl border border-[#e6e7ee] bg-[#fafafc] px-4 text-sm outline-none transition focus:border-[#5b3fd6]"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label
                        htmlFor="enderecoResponsavel"
                        className="text-sm font-medium"
                      >
                        Endereço completo *
                      </label>

                      <input
                        id="enderecoResponsavel"
                        name="enderecoResponsavel"
                        required
                        placeholder="Rua, número, complemento, bairro e cidade"
                        className="mt-2 h-12 w-full rounded-2xl border border-[#e6e7ee] bg-[#fafafc] px-4 text-sm outline-none transition placeholder:text-[#9ca3af] focus:border-[#5b3fd6]"
                      />
                    </div>
                  </div>
                </section>

                <section className="rounded-[2rem] border border-[#e6e7ee] bg-white p-6 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f4f1ff] text-[#5b3fd6]">
                      <Phone size={21} />
                    </div>

                    <div>
                      <h2 className="text-xl font-semibold">
                        Contato de emergência
                      </h2>

                      <p className="mt-1 text-sm text-[#6b7280]">
                        Pessoa que poderá ser acionada pela
                        escola.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-5 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label
                        htmlFor="contatoEmergenciaNome"
                        className="text-sm font-medium"
                      >
                        Nome
                      </label>

                      <input
                        id="contatoEmergenciaNome"
                        name="contatoEmergenciaNome"
                        className="mt-2 h-12 w-full rounded-2xl border border-[#e6e7ee] bg-[#fafafc] px-4 text-sm outline-none transition focus:border-[#5b3fd6]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="contatoEmergenciaTelefone"
                        className="text-sm font-medium"
                      >
                        Telefone
                      </label>

                      <input
                        id="contatoEmergenciaTelefone"
                        name="contatoEmergenciaTelefone"
                        type="tel"
                        className="mt-2 h-12 w-full rounded-2xl border border-[#e6e7ee] bg-[#fafafc] px-4 text-sm outline-none transition focus:border-[#5b3fd6]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="contatoEmergenciaParentesco"
                        className="text-sm font-medium"
                      >
                        Parentesco
                      </label>

                      <input
                        id="contatoEmergenciaParentesco"
                        name="contatoEmergenciaParentesco"
                        placeholder="Ex.: Avó, tio, madrinha"
                        className="mt-2 h-12 w-full rounded-2xl border border-[#e6e7ee] bg-[#fafafc] px-4 text-sm outline-none transition placeholder:text-[#9ca3af] focus:border-[#5b3fd6]"
                      />
                    </div>
                  </div>
                </section>
              </div>

              <aside className="space-y-6">
                <section className="rounded-[2rem] border border-[#e6e7ee] bg-white p-6 shadow-sm">
                  <HeartPulse
                    size={22}
                    className="text-[#5b3fd6]"
                  />

                  <h2 className="mt-4 font-semibold">
                    Informações de saúde
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-[#6b7280]">
                    Informe alergias, restrições e condições
                    importantes para o cuidado do aluno.
                  </p>
                </section>

                <section className="rounded-[2rem] border border-[#e6e7ee] bg-white p-6 shadow-sm">
                  <FileText
                    size={22}
                    className="text-[#5b3fd6]"
                  />

                  <h2 className="mt-4 font-semibold">
                    Documentos
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-[#6b7280]">
                    O envio de arquivos será solicitado na
                    próxima etapa da matrícula.
                  </p>
                </section>

                <section className="rounded-[2rem] border border-[#e6e7ee] bg-white p-6 shadow-sm">
                  <ShieldCheck
                    size={22}
                    className="text-[#5b3fd6]"
                  />

                  <h2 className="mt-4 font-semibold">
                    Autorizações
                  </h2>

                  <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-[#e6e7ee] bg-[#fafafc] p-4">
                    <input
                      type="checkbox"
                      name="autorizacaoImagem"
                      className="mt-1 h-4 w-4 accent-[#5b3fd6]"
                    />

                    <span className="text-sm leading-6">
                      Autorizo o uso de imagem do aluno em
                      atividades e comunicações institucionais
                      da escola.
                    </span>
                  </label>
                </section>

                <section className="sticky bottom-5 rounded-[2rem] border border-[#dcd8fb] bg-white/95 p-6 shadow-xl backdrop-blur">
                  <div className="flex items-start gap-3">
                    <CheckCircle2
                      size={21}
                      className="mt-0.5 shrink-0 text-[#5b3fd6]"
                    />

                    <div>
                      <p className="font-semibold">
                        Confirmação
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#6b7280]">
                        Revise os dados antes de enviar.
                      </p>
                    </div>
                  </div>

                  <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-[#e6e7ee] bg-[#fafafc] p-4">
                    <input
                      type="checkbox"
                      name="confirmacaoDados"
                      required
                      className="mt-1 h-4 w-4 accent-[#5b3fd6]"
                    />

                    <span className="text-sm leading-6">
                      Confirmo que as informações preenchidas
                      são verdadeiras e estão atualizadas.
                    </span>
                  </label>

                  <button
                    type="submit"
                    className="group mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#5b3fd6] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]"
                  >
                    <Save
                      size={17}
                      className="transition-transform duration-200 group-hover:scale-110"
                    />

                    Enviar matrícula
                  </button>

                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#6b7280]">
                    <LockKeyhole size={14} />
                    Seus dados serão enviados com segurança.
                  </div>
                </section>
              </aside>
            </form>

            <footer className="mt-10 border-t border-[#e6e7ee] py-6 text-center">
              <p className="text-xs text-[#6b7280]">
                Convite válido até{" "}
                {formatarData(convite.expiraEm)}.
              </p>
            </footer>
          </>
        )}
      </div>
    </main>
  );
}