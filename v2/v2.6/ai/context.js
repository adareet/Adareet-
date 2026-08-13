/* =========================================================
   ADAREET v2.6
   AI / CONTEXT
   ========================================================= */

export const CONTEXT_VERSION = "1.0.0";

function normalizeText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function formatSection(name, content) {
  const text = normalizeText(content);

  if (!text) {
    return "";
  }

  return `## ${name}\n${text}`;
}

export function buildContext({
  project = null,
  memories = [],
  knowledge = [],
  conversation = [],
} = {}) {
  const sections = [];

  if (project) {
    sections.push(
      formatSection(
        "PROJECT",
        [
          project.name
            ? `Name: ${project.name}`
            : "",
          project.description
            ? `Description: ${project.description}`
            : "",
        ]
          .filter(Boolean)
          .join("\n")
      )
    );
  }

  if (memories.length > 0) {
    sections.push(
      formatSection(
        "MEMORY",
        memories
          .map(memory => {
            const status = memory.status
              ? `[${memory.status}] `
              : "";

            return `- ${status}${memory.content || ""}`;
          })
          .join("\n")
      )
    );
  }

  if (knowledge.length > 0) {
    sections.push(
      formatSection(
        "KNOWLEDGE",
        knowledge
          .map(item => {
            const source = item.sourceId
              ? ` (source: ${item.sourceId})`
              : "";

            return `- ${item.content || ""}${source}`;
          })
          .join("\n")
      )
    );
  }

  if (conversation.length > 0) {
    sections.push(
      formatSection(
        "CONVERSATION",
        conversation
          .map(message => {
            const role = message.role || "unknown";

            return `${role}: ${message.content || ""}`;
          })
          .join("\n")
      )
    );
  }

  return sections
    .filter(Boolean)
    .join("\n\n");
}

export function getContextVersion() {
  return CONTEXT_VERSION;
}
