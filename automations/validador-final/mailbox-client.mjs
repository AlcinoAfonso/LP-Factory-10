import tls from "node:tls";

const POP3_HOST = "pop.gmail.com";
const POP3_PORT = 995;

function requireEnv(name) {
  const value = process.env[name];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`env obrigatório ausente: ${name}`);
  }
  return value.trim();
}

function normalizeHeaderValue(rawValue) {
  return String(rawValue || "").replace(/\r?\n[ \t]+/g, " ").trim();
}

function parseHeaders(rawMessage) {
  const [rawHeaders = ""] = String(rawMessage || "").split(/\r?\n\r?\n/, 1);
  const lines = rawHeaders.split(/\r?\n/);
  const headerMap = new Map();
  let currentKey = null;

  for (const line of lines) {
    if (!line) continue;
    if (/^[ \t]/.test(line) && currentKey) {
      headerMap.set(currentKey, `${headerMap.get(currentKey) || ""} ${line.trim()}`);
      continue;
    }

    const idx = line.indexOf(":");
    if (idx <= 0) continue;

    currentKey = line.slice(0, idx).trim().toLowerCase();
    headerMap.set(currentKey, line.slice(idx + 1).trim());
  }

  return {
    to: normalizeHeaderValue(headerMap.get("to") || ""),
    subject: normalizeHeaderValue(headerMap.get("subject") || ""),
    date: normalizeHeaderValue(headerMap.get("date") || ""),
  };
}

function extractLinksFromText(rawText) {
  const normalized = String(rawText || "")
    .replace(/=\r?\n/g, "")
    .replace(/&amp;/g, "&");

  const matches = normalized.match(/https?:\/\/[^\s<>"')]+/gi) || [];
  return matches.map((entry) => entry.replace(/[.,;!?]+$/g, ""));
}

function pickLink(links, linkIncludes) {
  if (!Array.isArray(links) || links.length === 0) return null;
  if (typeof linkIncludes !== "string" || linkIncludes.trim() === "") return links[0] ?? null;
  return links.find((link) => link.includes(linkIncludes.trim())) ?? null;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class Pop3Client {
  constructor({ host, port }) {
    this.host = host;
    this.port = port;
    this.socket = null;
    this.buffer = "";
    this.waiters = [];
  }

  async connect() {
    this.socket = tls.connect({ host: this.host, port: this.port, servername: this.host });
    this.socket.setEncoding("utf8");
    this.socket.on("data", (chunk) => {
      this.buffer += chunk;
      this.resolveWaiters();
    });

    this.socket.on("error", (error) => {
      while (this.waiters.length > 0) {
        const waiter = this.waiters.shift();
        waiter.reject(error);
      }
    });

    await this.readLine(); // greeting
  }

  resolveWaiters() {
    const pending = [...this.waiters];
    this.waiters = [];

    for (const waiter of pending) {
      waiter.tryResolve();
    }
  }

  readUntil(predicate) {
    return new Promise((resolve, reject) => {
      const tryResolve = () => {
        if (predicate(this.buffer)) {
          const output = this.buffer;
          this.buffer = "";
          resolve(output);
          return true;
        }
        this.waiters.push({ tryResolve, reject });
        return false;
      };

      tryResolve();
    });
  }

  async readLine() {
    const data = await this.readUntil((buffer) => buffer.includes("\r\n"));
    return data.split("\r\n")[0];
  }

  async sendCommand(command, { multiline = false } = {}) {
    this.socket.write(`${command}\r\n`);
    const response = multiline
      ? await this.readUntil((buffer) => /\r\n\.\r\n$/.test(buffer))
      : await this.readLine();

    const firstLine = response.split("\r\n")[0] || "";
    if (!firstLine.startsWith("+OK")) {
      throw new Error(`comando POP3 falhou (${command}): ${firstLine}`);
    }

    return response;
  }

  async auth(user, pass) {
    await this.sendCommand(`USER ${user}`);
    await this.sendCommand(`PASS ${pass}`);
  }

  async getMessageCount() {
    const line = await this.sendCommand("STAT");
    const [, countRaw] = line.split(" ");
    const count = Number.parseInt(countRaw, 10);
    return Number.isFinite(count) ? count : 0;
  }

  async retrieveMessage(messageNumber) {
    const response = await this.sendCommand(`RETR ${messageNumber}`, { multiline: true });
    const lines = response.split("\r\n");
    const contentLines = lines.slice(1, -2).map((line) => (line.startsWith("..") ? line.slice(1) : line));
    return contentLines.join("\n");
  }

  async quit() {
    if (!this.socket) return;
    await this.sendCommand("QUIT").catch(() => {});
    this.socket.end();
    this.socket.destroy();
    this.socket = null;
  }
}

function messageMatchesAlias(rawMessage, aliasEmail) {
  const headers = parseHeaders(rawMessage);
  const normalizedAlias = aliasEmail.toLowerCase();
  return headers.to.toLowerCase().includes(normalizedAlias);
}

function parseDateToIso(dateHeader) {
  const date = new Date(dateHeader);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

export async function findLatestEmailLinkForAlias({
  aliasEmail,
  timeoutMs = 120000,
  intervalMs = 5000,
  linkIncludes,
}) {
  if (typeof aliasEmail !== "string" || aliasEmail.trim() === "") {
    throw new Error("aliasEmail obrigatório");
  }

  const normalizedAlias = aliasEmail.trim();
  const mailboxEmail = requireEnv("MAILBOX_EMAIL");
  const mailboxPassword = requireEnv("MAILBOX_PASSWORD");
  const startedAt = Date.now();

  while (Date.now() - startedAt <= timeoutMs) {
    const client = new Pop3Client({ host: POP3_HOST, port: POP3_PORT });

    try {
      await client.connect();
      await client.auth(mailboxEmail, mailboxPassword);

      const count = await client.getMessageCount();
      if (count === 0) {
        await delay(intervalMs);
        continue;
      }

      for (let msgNumber = count; msgNumber >= 1; msgNumber -= 1) {
        const rawMessage = await client.retrieveMessage(msgNumber);
        if (!messageMatchesAlias(rawMessage, normalizedAlias)) {
          continue;
        }

        const headers = parseHeaders(rawMessage);
        const links = extractLinksFromText(rawMessage);
        const matchedLink = pickLink(links, linkIncludes);

        if (!matchedLink) {
          if (typeof linkIncludes === "string" && linkIncludes.trim() !== "") {
            throw new Error(`e-mail encontrado sem link compatível com linkIncludes para ${normalizedAlias}`);
          }
          throw new Error(`e-mail encontrado sem link HTTP/HTTPS para ${normalizedAlias}`);
        }

        return {
          matched_email: normalizedAlias,
          matched_subject: headers.subject,
          matched_received_at: parseDateToIso(headers.date),
          matched_link: matchedLink,
        };
      }
    } finally {
      await client.quit().catch(() => {});
    }

    await delay(intervalMs);
  }

  throw new Error(`timeout ao localizar e-mail/link para ${normalizedAlias}`);
}
