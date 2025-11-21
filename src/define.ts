import type { Socket } from "node:net";
import { processCategory, processVerbCategory } from "./lib/libwordcategories";
import { processConjugation } from "./lib/libconjugations";

export default async function command(socket: Socket, tokens: string[]) {
  try {
    const dictionary = tokens[1];
    const queryWord = tokens[2];

    if (!dictionary) {
      socket.write(
        '501 No has especificado el diccionario. Solamente tenemos "dle", por cierto\r\n'
      );
      return;
    }
    if (!queryWord) {
      socket.write("501 No has especificado la palabra a definir\r\n");
      return;
    }
    if (dictionary !== "dle") {
      socket.write('550 Solamente tenemos un diccionario: "dle"\r\n');
      return;
    }

    const request = await fetch(`https://rae-api.com/api/words/${queryWord}`);
    const result = await request.json();

    if (request.status === 404) {
      socket.write(
        `552 No hay coincidencia para la palabra "${queryWord}"${
          result.suggestions
            ? ". Puede(n) estar relacionada(s): ".concat(
                result.suggestions.join(", ")
              )
            : ""
        }\r\n`
      );
      return;
    }

    if (!request.ok) {
      socket.write(
        `554 Error del servidor al obtener la definición: ${request.status} ${request.statusText}\r\n`
      );
      return;
    }

    if (!result?.data?.meanings?.length) {
      socket.write(
        `552 No hay coincidencia para la palabra "${queryWord}"\r\n`
      );
      return;
    }

    const meanings = result.data.meanings;
    const headword = result.data.word ?? queryWord;

    const { origin, senses, conjugations } = meanings[0];

    const defCount = senses.length;
    socket.write(
      `150 ${defCount} ${
        defCount === 1 ? "definición encontrada" : "definiciones encontradas"
      } para "${headword}"\r\n`
    );

    //
    // FOR EACH SENSE, GENERATE A 151 BLOCK
    //
    for (const sense of senses) {
      socket.write(
        `151 "${headword}" dle "Diccionario de la Lengua Española"\r\n`
      );

      // --- Origin shared across senses ---
      if (origin?.raw) socket.write(`Origen: ${origin.raw}\r\n`);

      // --- Sense heading ---
      const category = processCategory(sense.category);
      const verbCategory =
        sense.category === "verb"
          ? processVerbCategory(sense.verbCategory)
          : "";

      const parts = [];
      if (category) parts.push(category);
      if (verbCategory) parts.push(verbCategory);

      const categoryString = parts.length ? `(${parts.join(" ")})` : "";

      socket.write(
        `${sense.meaning_number}. ${categoryString} ${sense.description}\r\n`
      );

      // --- Optional fields ---
      if (sense.usage) socket.write(`\tUso: ${sense.usage}\r\n`);
      if (sense.synonyms?.length)
        socket.write(`\tSinónimos: ${sense.synonyms.join(", ")}\r\n`);
      if (sense.antonyms?.length)
        socket.write(`\tAntónimos: ${sense.antonyms.join(", ")}\r\n`);

      // --- Conjugations (shared across senses) ---
      if (conjugations) {
        socket.write("Conjugaciones:\r\n");

        socket.write(`\tFormas no personales:\r\n`);
        for (const [conj, value] of Object.entries(conjugations.non_personal)) {
          socket.write(
            `\t\t ${processConjugation(conj)} : ${String(value)}\r\n`
          );
        }

        socket.write(`\tModo indicativo:\r\n`);
        for (const [tenseName, tense] of Object.entries(
          conjugations.indicative
        )) {
          socket.write(`\t\t ${processConjugation(tenseName)}:\r\n`);
          for (const [form, pn] of Object.entries(tense as any)) {
            socket.write(`\t\t\t ${processConjugation(form)} : ${pn}\r\n`);
          }
        }

        socket.write(`\tModo subjuntivo:\r\n`);
        for (const [tenseName, tense] of Object.entries(
          conjugations.subjunctive
        )) {
          socket.write(`\t\t ${processConjugation(tenseName)}:\r\n`);
          for (const [form, pn] of Object.entries(tense as any)) {
            socket.write(`\t\t\t ${processConjugation(form)} : ${pn}\r\n`);
          }
        }

        socket.write(`\tModo imperativo:\r\n`);
        for (const [form, value] of Object.entries(conjugations.imperative)) {
          socket.write(
            `\t\t ${processConjugation(form)} : ${String(value)}\r\n`
          );
        }
      }

      // End of this 151 block
      socket.write(".\r\n");
    }

    socket.write("250 OK\r\n");
  } catch (err) {
    console.error("Error al ejecutar comando DEFINE:", err);
    socket.write("554 Error interno al obtener las definiciones\r\n");
  }
}
