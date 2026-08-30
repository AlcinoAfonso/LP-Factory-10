function requireNonEmptyString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} obrigatorio`);
  }

  return value.trim().toLowerCase();
}

export function normalizeMailboxBaseEmail(rawEmail) {
  const email = requireNonEmptyString(rawEmail, "MAILBOX_EMAIL");
  const match = /^([^@]+)@gmail\.com$/.exec(email);

  if (!match) {
    throw new Error("MAILBOX_EMAIL deve ser uma caixa base @gmail.com");
  }

  const localPart = match[1];
  if (localPart.includes("+")) {
    throw new Error("MAILBOX_EMAIL deve ser a caixa base, sem +tag");
  }

  return `${localPart}@gmail.com`;
}

export function buildMailboxAlias(rawEmail, rawTag) {
  const mailboxEmail = normalizeMailboxBaseEmail(rawEmail);
  const tag = requireNonEmptyString(rawTag, "alias tag");

  if (!/^[a-z0-9][a-z0-9._-]*$/.test(tag)) {
    throw new Error("alias tag deve conter apenas letras, numeros, ponto, hifen ou underscore");
  }

  const [localPart] = mailboxEmail.split("@");
  return `${localPart}+${tag}@gmail.com`;
}
