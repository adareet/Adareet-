/* =========================================================
   ADAREET v2.6
   DATA / SCHEMA
   ========================================================= */

export const SCHEMA_VERSION = 1;

export const SCHEMA = {
  project: {
    id: "",
    name: "",
    description: "",
    createdAt: "",
    updatedAt: "",
  },

  chat: {
    id: "",
    projectId: "",
    title: "",
    createdAt: "",
    updatedAt: "",
  },

  message: {
    id: "",
    chatId: "",
    role: "",
    content: "",
    createdAt: "",
  },

  memory: {
    id: "",
    projectId: "",
    type: "",
    content: "",
    status: "",
    sourceId: null,
    createdAt: "",
    updatedAt: "",
  },
};
