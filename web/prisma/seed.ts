import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const escola = await prisma.escola.upsert({
    where: { id: "lumina-demo-school" },
    update: {},
    create: {
      id: "lumina-demo-school",
      nome: "Jardim Escola Girassol Encantado",
    },
  });

  const turma = await prisma.turma.create({
    data: {
      nome: "5º Ano A",
      segmento: "Ensino Fundamental",
      turno: "Manhã",
      capacidade: 30,
      escolaId: escola.id,
    },
  });

  const responsavel = await prisma.responsavel.create({
    data: {
      nome: "Maria Silva",
      telefone: "(21) 99999-0000",
      email: "maria@email.com",
      escolaId: escola.id,
    },
  });

  const aluno = await prisma.aluno.create({
    data: {
      nome: "João Pedro Silva",
      dataNascimento: new Date("2015-05-10"),
      responsavelId: responsavel.id,
      turmaId: turma.id,
      escolaId: escola.id,
    },
  });

  const matricula = await prisma.matricula.create({
    data: {
      anoLetivo: 2026,
      status: "PENDENTE",
      alunoId: aluno.id,
      escolaId: escola.id,
    },
  });

  await prisma.tarefa.createMany({
    data: [
      {
        titulo: "Conferir documentos da matrícula",
        descricao: "Verificar RG, CPF e comprovante de residência.",
        setor: "Secretaria",
        prioridade: "ALTA",
        escolaId: escola.id,
        alunoId: aluno.id,
        matriculaId: matricula.id,
      },
      {
        titulo: "Confirmar pagamento da matrícula",
        descricao: "Validar pagamento inicial no financeiro.",
        setor: "Financeiro",
        prioridade: "MEDIA",
        escolaId: escola.id,
        alunoId: aluno.id,
        matriculaId: matricula.id,
      },
    ],
  });

  console.log("Seed concluído com sucesso.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });