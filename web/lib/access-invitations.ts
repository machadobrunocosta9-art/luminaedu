export type AccessInvitationState = {
  status: "PENDENTE" | "UTILIZADO" | "CANCELADO" | "EXPIRADO";
  expiresAt: Date;
  usedAt: Date | null;
  canceledAt: Date | null;
};

export type AccessInvitationAvailability =
  | "valid"
  | "expired"
  | "canceled"
  | "used";

export function getAccessInvitationAvailability(
  invitation: AccessInvitationState,
  now = new Date(),
): AccessInvitationAvailability {
  if (invitation.status === "UTILIZADO" || invitation.usedAt) {
    return "used";
  }

  if (invitation.status === "CANCELADO" || invitation.canceledAt) {
    return "canceled";
  }

  if (
    invitation.status === "EXPIRADO" ||
    invitation.expiresAt.getTime() <= now.getTime()
  ) {
    return "expired";
  }

  return "valid";
}
