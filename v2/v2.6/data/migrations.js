/* =========================================================
   ADAREET v2.6
   DATA / MIGRATIONS
   ========================================================= */

import { SCHEMA_VERSION } from "./schema.js";

export function migrate(data, fromVersion = 1) {
  let result = structuredClone(data);

  if (fromVersion < 1) {
    result = migrateToV1(result);
  }

  return {
    version: SCHEMA_VERSION,
    data: result,
  };
}

function migrateToV1(data) {
  return {
    projects: Array.isArray(data?.projects)
      ? data.projects
      : [],

    chats: Array.isArray(data?.chats)
      ? data.chats
      : [],

    messages: Array.isArray(data?.messages)
      ? data.messages
      : [],

    memories: Array.isArray(data?.memories)
      ? data.memories
      : [],
  };
}
