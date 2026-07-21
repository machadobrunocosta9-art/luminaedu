"use server";

import { redirect } from "next/navigation";
import {
  createAdminSession,
  destroyAuthenticatedSession,
  verifyAdminCredentials,
} from "@/lib/auth";
import {
  authenticateDatabaseUser,
  createDatabaseUserSession,
} from "@/lib/user-auth";

export type LoginState = {
  error: string | null;
};

function getSafeDestination(value: FormDataEntryValue | null) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
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

  if (typeof email !== "string" || typeof password !== "string") {
    return { error: "E-mail ou senha inválidos." };
  }

  const databaseAuthentication = await authenticateDatabaseUser(
    email,
    password,
  );

  if (databaseAuthentication.status === "authenticated") {
    await createDatabaseUserSession(databaseAuthentication.user);
    redirect(
      databaseAuthentication.user.papel === "RESPONSAVEL"
        ? "/portal-familia"
        : getSafeDestination(formData.get("next")),
    );
  }

  if (
    (databaseAuthentication.status === "not_found" ||
      databaseAuthentication.status === "unavailable") &&
    (await verifyAdminCredentials(email, password))
  ) {
    await createAdminSession();
    redirect(getSafeDestination(formData.get("next")));
  }

  return { error: "E-mail ou senha inválidos." };
}

export async function logoutAction() {
  await destroyAuthenticatedSession();
  redirect("/login");
}
