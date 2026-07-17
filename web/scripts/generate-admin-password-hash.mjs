import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import readline from "node:readline";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const envPath = new URL("../.env.local", import.meta.url);

readline.emitKeypressEvents(process.stdin);

function readHidden(label) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error("Execute este comando em um terminal interativo.");
  }

  return new Promise((resolve, reject) => {
    let value = "";

    function finish(error) {
      process.stdin.off("keypress", onKeypress);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\n");

      if (error) reject(error);
      else resolve(value);
    }

    function onKeypress(character, key) {
      if (key?.ctrl && key.name === "c") {
        finish(new Error("Operação cancelada."));
        return;
      }

      if (key?.name === "return" || key?.name === "enter") {
        finish();
        return;
      }

      if (key?.name === "backspace") {
        value = Array.from(value).slice(0, -1).join("");
        return;
      }

      if (character && !key?.ctrl && !key?.meta) value += character;
    }

    process.stdout.write(label);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("keypress", onKeypress);
  });
}

function updateLocalEnvironment(passwordHash) {
  const existing = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  const newline = existing.includes("\r\n") ? "\r\n" : "\n";
  const entry = `ADMIN_PASSWORD_HASH=${passwordHash}`;
  const lines = existing ? existing.split(/\r?\n/u) : [];
  const index = lines.findIndex((line) => line.startsWith("ADMIN_PASSWORD_HASH="));

  if (index >= 0) lines[index] = entry;
  else lines.push(entry);

  const content = lines.filter((line, lineIndex) => line || lineIndex < lines.length - 1).join(newline);
  writeFileSync(envPath, `${content}${newline}`, { encoding: "utf8", mode: 0o600 });
}

try {
  const password = await readHidden("Nova senha administrativa: ");
  const confirmation = await readHidden("Confirme a nova senha: ");

  if (password.length < 12) {
    throw new Error("Use uma senha com pelo menos 12 caracteres.");
  }

  if (password !== confirmation) {
    throw new Error("As senhas não coincidem.");
  }

  const salt = randomBytes(16);
  const derivedKey = await scrypt(password, salt, 64, {
    N: 16_384,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  const passwordHash = [
    "scrypt",
    "16384",
    "8",
    "1",
    salt.toString("base64url"),
    derivedKey.toString("base64url"),
  ].join("$");

  updateLocalEnvironment(passwordHash);
  console.log("Hash atualizado com segurança no arquivo .env.local.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Não foi possível gerar o hash.");
  process.exitCode = 1;
}
