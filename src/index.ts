import * as net from "node:net";
import quit from "./quit";
import help from "./help";
import tokenize from "./lib/libtokenize";
import client from "./client";
import show from "./show";
import define from "./define";
import match from "./match";
import status from "./status";

const DICT_PORT = 2628;
const server = net.createServer((socket) => {
  socket.write(
    `220 RAE DICT en ${process.platform} a tu servicio - Funciona con <https://rae-api.com>\r\n`
  );

  let buffer = ""; // per-connection buffer

  socket.on("data", async (chunk) => {
    buffer += chunk.toString("utf8");

    // Process each full line
    let index;
    while ((index = buffer.indexOf("\r\n")) !== -1) {
      const line = buffer.slice(0, index);
      buffer = buffer.slice(index + 2); // remove processed line

      await handleCommand(line.trim(), socket);
    }
  });

  socket.on("end", () => {
    // connection closed
  });
});

// Example command handler
async function handleCommand(line: string, socket: net.Socket) {
  console.log("Received command:", line);
  if (!line.trim()) {
    socket.write("500 Línea vacía\r\n");
    return;
  }

  // Extract verb only (before any whitespace)
  const verb = line.split(/\s+/, 1)[0].toUpperCase();
  let tokens: string[] | null = null;
  switch (verb) {
    case "QUIT":
      return quit(socket);

    case "HELP":
      return help(socket);

    case "CLIENT":
      tokens = tokenize(line);
      return client(socket, tokens);

    case "SHOW":
      tokens = tokenize(line);
      return show(socket, tokens);

    case "DEFINE":
      tokens = tokenize(line);
      await define(socket, tokens);
      return;

    case "MATCH":
      tokens = tokenize(line);
      await match(socket, tokens);
      return;
    case "STATUS":
      await status(socket);
      return;
    case "OPTION":
      socket.write('501 No se admite el comando "OPTION"\r\n');
      return;
    case "AUTH":
      socket.write('501 No se admite el comando "AUTH"; este es un servidor público\r\n');
      return;
  }

  socket.write("500 Comando no implementado\r\n");
}

server.listen(DICT_PORT, () => {
  console.log(`Listo en: dict://127.0.0.1:${DICT_PORT}`);
});
