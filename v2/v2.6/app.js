/*
============================================================
ADAREET v2.6
APPLICATION BOOTSTRAP
============================================================

หน้าที่:
- เริ่มต้นแอป
- เชื่อม core กับ data layer
- แสดงสถานะพื้นฐานของระบบ
- เป็นจุดประกอบ module
- ไม่เก็บ business logic ของ feature ไว้ที่นี่
============================================================
*/

import { APP_CONFIG } from "./core/config.js";
import {
  getState,
  setState,
} from "./core/state.js";
import {
  emit,
} from "./core/events.js";

import {
  getProjects,
  getChats,
  getMemories,
} from "./data/repository.js";

const app = document.querySelector("#app");

if (!app) {
  throw new Error(
    "Adareet: #app container was not found."
  );
}

function getSystemSummary() {
  return {
    version: APP_CONFIG.version,
    projects: getProjects().length,
    chats: getChats().length,
    memories: getMemories().length,
  };
}

function renderShell() {
  const summary = getSystemSummary();

  app.innerHTML = `
    <div class="app-shell">
      <aside class="app-sidebar">
        <div class="app-content">
          <strong>${APP_CONFIG.name}</strong>
        </div>
      </aside>

      <main class="app-main">
        <div class="app-content">
          <section class="empty-state">
            <div class="empty-state__inner">
              <h1>
                ${APP_CONFIG.name} v${APP_CONFIG.version}
              </h1>

              <div class="app-status">
                <span>
                  Projects: ${summary.projects}
                </span>

                <span>
                  Chats: ${summary.chats}
                </span>

                <span>
                  Memories: ${summary.memories}
                </span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  `;
}

function initializeState() {
  const currentState = getState();

  setState({
    app: {
      ...currentState.app,
      ready: true,
    },
  });

  emit("app:ready", {
    version: APP_CONFIG.version,
  });
}

function initialize() {
  renderShell();
  initializeState();

  window.Adareet = Object.freeze({
    config: APP_CONFIG,
    getState,
    getSystemSummary,
  });
}

initialize();
