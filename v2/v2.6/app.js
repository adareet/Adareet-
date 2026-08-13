/*
============================================================
ADAREET v2.6
APPLICATION BOOTSTRAP
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

function renderShell() {
  app.innerHTML = `
    <div class="app-shell">
      <aside class="app-sidebar">
        <div class="empty-state">
          <div class="empty-state__inner">
            <strong>${APP_CONFIG.name}</strong>
          </div>
        </div>
      </aside>

      <main class="app-main">
        <div class="app-content">
          <section class="empty-state">
            <div class="empty-state__inner">
              <h1>${APP_CONFIG.name} v${APP_CONFIG.version}</h1>

              <div class="app-status">
                <span>
                  Projects: ${getProjects().length}
                </span>

                <span>
                  Chats: ${getChats().length}
                </span>

                <span>
                  Memories: ${getMemories().length}
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
  setState({
    app: {
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

  window.Adareet = {
    config: APP_CONFIG,
    getState,
  };
}

initialize();
