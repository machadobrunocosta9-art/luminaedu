# Lumina Architecture v1.0

## Objetivo

O Lumina será um ERP Escolar moderno, focado em escolas de Educação Infantil e Ensino Fundamental.

A arquitetura foi projetada para ser escalável, modular e preparada para IA.

---

# Tecnologias

Frontend

- Next.js
- React
- TypeScript
- TailwindCSS

Backend

- Next.js Server Actions
- Prisma ORM

Banco

- PostgreSQL

Hospedagem

- Vercel

Banco Produção

- Neon PostgreSQL

---

# Estrutura

web/

app/

components/

services/

hooks/

lib/

types/

utils/

prisma/

docs/

public/

---

# Módulos

Dashboard

Alunos

Responsáveis

Funcionários

Professores

Turmas

Financeiro

Agenda

Comunicação

Documentos

Relatórios

Configurações

Lumina AI

---

# Princípios

Todo componente deve ser reutilizável.

Nenhuma página deve conter regras de negócio.

Toda regra ficará em Services.

Toda comunicação com banco utilizará Prisma.

Toda alteração importante deverá atualizar a documentação.

---

# Objetivo Final

Criar um ERP Escolar preparado para atender centenas de escolas mantendo alta performance e excelente experiência do usuário.