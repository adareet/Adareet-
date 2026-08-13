/* =========================================================
   ADAREET v2.6
   DATA / REPOSITORY
   ========================================================= */

import {
  save,
  load,
  remove,
} from "./storage.js";

const KEYS = {
  projects: "projects",
  chats: "chats",
  messages: "messages",
  memories: "memories",
};

function getCollection(key) {
  return load(key, []);
}

function saveCollection(key, collection) {
  return save(key, collection);
}

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

/* =========================================================
   PROJECTS
   ========================================================= */

export function getProjects() {
  return getCollection(KEYS.projects);
}

export function getProject(id) {
  return getProjects().find(
    project => project.id === id
  ) || null;
}

export function createProject(data = {}) {
  const projects = getProjects();

  const now = new Date().toISOString();

  const project = {
    id: createId("project"),
    name: data.name || "Untitled Project",
    description: data.description || "",
    createdAt: now,
    updatedAt: now,
  };

  projects.push(project);
  saveCollection(KEYS.projects, projects);

  return project;
}

export function updateProject(id, changes = {}) {
  const projects = getProjects();

  const index = projects.findIndex(
    project => project.id === id
  );

  if (index === -1) {
    return null;
  }

  projects[index] = {
    ...projects[index],
    ...changes,
    id: projects[index].id,
    updatedAt: new Date().toISOString(),
  };

  saveCollection(KEYS.projects, projects);

  return projects[index];
}

export function deleteProject(id) {
  const projects = getProjects();

  const filtered = projects.filter(
    project => project.id !== id
  );

  saveCollection(KEYS.projects, filtered);

  return filtered.length !== projects.length;
}

/* =========================================================
   CHATS
   ========================================================= */

export function getChats(projectId = null) {
  const chats = getCollection(KEYS.chats);

  if (!projectId) {
    return chats;
  }

  return chats.filter(
    chat => chat.projectId === projectId
  );
}

export function getChat(id) {
  return getCollection(KEYS.chats).find(
    chat => chat.id === id
  ) || null;
}

export function createChat(data = {}) {
  const chats = getCollection(KEYS.chats);

  const now = new Date().toISOString();

  const chat = {
    id: createId("chat"),
    projectId: data.projectId || null,
    title: data.title || "New Chat",
    createdAt: now,
    updatedAt: now,
  };

  chats.push(chat);
  saveCollection(KEYS.chats, chats);

  return chat;
}

/* =========================================================
   MESSAGES
   ========================================================= */

export function getMessages(chatId) {
  return getCollection(KEYS.messages).filter(
    message => message.chatId === chatId
  );
}

export function addMessage(data = {}) {
  const messages = getCollection(KEYS.messages);

  const message = {
    id: createId("message"),
    chatId: data.chatId || null,
    role: data.role || "user",
    content: data.content || "",
    createdAt: new Date().toISOString(),
  };

  messages.push(message);
  saveCollection(KEYS.messages, messages);

  return message;
}

/* =========================================================
   MEMORY
   ========================================================= */

export function getMemories(projectId = null) {
  const memories = getCollection(KEYS.memories);

  if (!projectId) {
    return memories;
  }

  return memories.filter(
    memory => memory.projectId === projectId
  );
}

export function addMemory(data = {}) {
  const memories = getCollection(KEYS.memories);

  const now = new Date().toISOString();

  const memory = {
    id: createId("memory"),
    projectId: data.projectId || null,
    type: data.type || "fact",
    content: data.content || "",
    status: data.status || "unconfirmed",
    sourceId: data.sourceId || null,
    createdAt: now,
    updatedAt: now,
  };

  memories.push(memory);
  saveCollection(KEYS.memories, memories);

  return memory;
}

export function updateMemory(id, changes = {}) {
  const memories = getCollection(KEYS.memories);

  const index = memories.findIndex(
    memory => memory.id === id
  );

  if (index === -1) {
    return null;
  }

  memories[index] = {
    ...memories[index],
    ...changes,
    id: memories[index].id,
    updatedAt: new Date().toISOString(),
  };

  saveCollection(KEYS.memories, memories);

  return memories[index];
}

export function deleteMemory(id) {
  const memories = getCollection(KEYS.memories);

  const filtered = memories.filter(
    memory => memory.id !== id
  );

  saveCollection(KEYS.memories, filtered);

  return filtered.length !== memories.length;
}
