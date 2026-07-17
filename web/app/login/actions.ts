"use server";

import { redirect } from "next/navigation";
import {
  createAdminSession,
  destroyAdminSession,
  isAdminConfigured,
  verifyAdminCredentials,
} from "@/lib/auth";

export type LoginState = {
  error: string | null;
};

function getSafeDestination(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (!isAdminConfigured()) {
    return {
      error:
        "A autenticação ainda não foi configurada. Defina ADMIN_EMAIL e ADMIN_PASSWORD_HASH no ambiente.",
    };
  }

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !(await verifyAdminCredentials(email, password))
  ) {
    return { error: "E-mail ou senha inválidos." };
  }

  await createAdminSession();
  redirect(getSafeDestination(formData.get("next")));
}

export async function logoutAction() {
  await destroyAdminSession();
  redirect("/login");
}
