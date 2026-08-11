/* =========================================================
   ADAREET v2.5
   Application Core
   =========================================================
   หน้าที่ของไฟล์นี้:
   - จัดการสถานะของแอป
   - บันทึกข้อมูลใน LocalStorage
   - Login แบบ prototype / Guest
   - Quick Chat
   - Project
   - Project Chat
   - Knowledge
   - Chapters
   - History
   - Settings
   - AI Router สำหรับต่อ API หลายตัวภายหลัง

   หมายเหตุ:
   ตอนนี้ยังไม่มี API ภายนอก
   AI จึงใช้ mock response เพื่อทดสอบระบบก่อน
   ========================================================= */

(() => {
  "use strict";

  /* =========================================================
     1. CONSTANTS
     ========================================================= */

  const STORAGE_KEY = "adareet_v25_state";

  const APP_VERSION = "2.5";

  const VIEW_META = {
    home: {
      title: "Adareet",
      subtitle: "พื้นที่สำหรับคิดและจัดความคิดทีหลัง",
      breadcrumb: "หน้าหลัก"
    },

    projects: {
      title: "โปรเจกต์",
      subtitle: "Project คือพื้นที่หลักของงานใน Adareet",
      breadcrumb: "โปรเจกต์"
    },

    recent: {
      title: "แชทล่าสุด",
      subtitle: "ทั้ง Quick Chat และ Chat ใน Project",
      breadcrumb: "แชทล่าสุด"
    },

    settings: {
      title: "ตั้งค่า",
      subtitle: "ปรับ Adareet ให้เหมาะกับวิธีทำงานของคุณ",
      breadcrumb: "ตั้งค่า"
    },

    project: {
      title: "Project",
      subtitle: "",
      breadcrumb: "Project"
    }
  };

  const SETTINGS_DEFAULTS = {
    appearance: "light",
    font: "system",
    autoSave: true,
    aiProvider: "mock"
  };

  const AI_PROVIDERS = {
    mock: {
      id: "mock",
      name: "Adareet Mock AI",
      type: "local"
    },

    gemini: {
      id: "gemini",
      name: "Google Gemini",
      type: "api"
    },

    openai: {
      id: "openai",
      name: "OpenAI",
      type: "api"
    },

    custom: {
      id: "custom",
      name: "Custom Provider",
      type: "api"
    }
  };

  /* =========================================================
     2. DOM HELPERS
     ========================================================= */

  const $ = (selector) => document.querySelector(selector);

  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  const byId = (id) => document.getElementById(id);

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function now() {
    return new Date().toISOString();
  }

  function createId(prefix = "id") {
    return `${prefix}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }

  function formatDate(dateString) {
    if (!dateString) return "";

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function countWords(text) {
    const value = String(text || "").trim();

    if (!value) return 0;

    return value
      .split(/\s+/)
      .filter(Boolean)
      .length;
  }

  /* =========================================================
     3. DEFAULT STATE
     ========================================================= */

  function createDefaultState() {
    return {
      version: APP_VERSION,

      user: null,

      currentView: "home",

      currentProjectId: null,

      currentProjectSubview: "overview",

      currentChatId: null,

      currentSettingsTab: "appearance",

      pendingDeleteChatId: null,

      projects: [],

      quickChats: [],

      settings: {
        ...SETTINGS_DEFAULTS
      },

      ai: {
        providers: AI_PROVIDERS,
        activeProvider: "mock",
        consentedProjectIds: []
      },

      history: []
    };
  }

  /* =========================================================
     4. STORAGE
     ========================================================= */

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return createDefaultState();
      }

      const saved = JSON.parse(raw);

      const base = createDefaultState();

      return {
        ...base,
        ...saved,

        settings: {
          ...base.settings,
          ...(saved.settings || {})
        },

        ai: {
          ...base.ai,
          ...(saved.ai || {}),
          providers: AI_PROVIDERS
        },

        projects: Array.isArray(saved.projects)
          ? saved.projects
          : [],

        quickChats: Array.isArray(saved.quickChats)
          ? saved.quickChats
          : [],

        history: Array.isArray(saved.history)
          ? saved.history
          : []
      };
    } catch (error) {
      console.error("Adareet: cannot load state", error);

      return createDefaultState();
    }
  }

  let state = loadState();

  function saveState(reason = "บันทึกข้อมูล") {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state)
      );

      updateSaveStatus(reason);
    } catch (error) {
      console.error("Adareet: cannot save state", error);
    }
  }

  function updateSaveStatus(text = "บันทึกแล้ว") {
    const element = byId("chatSaveStatus");

    if (!element) return;

    element.textContent = text;

    window.clearTimeout(updateSaveStatus.timer);

    updateSaveStatus.timer = window.setTimeout(() => {
      element.textContent = "บันทึกแล้ว";
    }, 1200);
  }

  /* =========================================================
     5. HISTORY
     ========================================================= */

  function addHistory(
    action,
    description,
    projectId = null
  ) {
    state.history.unshift({
      id: createId("history"),
      action,
      description,
      projectId,
      createdAt: now()
    });

    if (state.history.length > 200) {
      state.history.length = 200;
    }
  }

  function getProjectHistory(projectId) {
    return state.history.filter(
      (item) => item.projectId === projectId
    );
  }

  /* =========================================================
     6. USER / LOGIN
     ========================================================= */

  function loginUser(name, email = "", provider = "guest") {
    const cleanName =
      String(name || "").trim() || "Guest";

    state.user = {
      id: createId("user"),
      name: cleanName,
      email: String(email || "").trim(),
      provider,
      loggedInAt: now()
    };

    saveState("เข้าสู่ระบบแล้ว");

    showWelcome();
  }

  function logoutUser() {
    state.user = null;
    state.currentProjectId = null;
    state.currentChatId = null;
    state.currentView = "home";

    saveState("ออกจากระบบแล้ว");

    renderApp();
  }

  function showWelcome() {
    const loginScreen = byId("loginScreen");
    const welcomeScreen = byId("welcomeScreen");

    if (loginScreen) {
      loginScreen.classList.add("is-hidden");
    }

    if (welcomeScreen) {
      welcomeScreen.classList.remove("is-hidden");
    }

    window.setTimeout(() => {
      if (welcomeScreen) {
        welcomeScreen.classList.add("is-hidden");
      }

      renderApp();
    }, 850);
  }

  /* =========================================================
     7. PROJECT HELPERS
     ========================================================= */

  function getProject(projectId) {
    return state.projects.find(
      (project) => project.id === projectId
    );
  }

  function getCurrentProject() {
    return getProject(state.currentProjectId);
  }

  function createProject({
    name,
    description = "",
    cover = ""
  }) {
    const project = {
      id: createId("project"),

      name:
        String(name || "").trim() ||
        "Untitled Project",

      description:
        String(description || "").trim(),

      cover:
        String(cover || "").trim(),

      createdAt: now(),
      updatedAt: now(),

      chats: [],

      knowledge: [],

      chapters: [],

      settings: {
        aiEnabled: false
      }
    };

    state.projects.unshift(project);

    addHistory(
      "project_created",
      `สร้าง Project "${project.name}"`,
      project.id
    );

    saveState("สร้าง Project แล้ว");

    return project;
  }

  function updateProject(projectId, changes) {
    const project = getProject(projectId);

    if (!project) return null;

    Object.assign(project, changes);

    project.updatedAt = now();

    addHistory(
      "project_updated",
      `แก้ไข Project "${project.name}"`,
      project.id
    );

    saveState();

    return project;
  }

  /* =========================================================
     8. CHAT HELPERS
     ========================================================= */

  function createChat({
    projectId = null,
    title = "แชทใหม่",
    type = "quick"
  } = {}) {
    const chat = {
      id: createId("chat"),

      projectId,

      title:
        String(title || "").trim() ||
        "แชทใหม่",

      type,

      createdAt: now(),
      updatedAt: now(),

      messages: []
    };

    if (projectId) {
      const project = getProject(projectId);

      if (!project) return null;

      project.chats.unshift(chat);
      project.updatedAt = now();

      addHistory(
        "chat_created",
        `สร้าง Chat "${chat.title}"`,
        projectId
      );
    } else {
      state.quickChats.unshift(chat);

      addHistory(
        "quick_chat_created",
        `สร้าง Quick Chat "${chat.title}"`
      );
    }

    saveState("สร้าง Chat แล้ว");

    return chat;
  }

  function getQuickChat(chatId) {
    return state.quickChats.find(
      (chat) => chat.id === chatId
    );
  }

  function getProjectChat(projectId, chatId) {
    const project = getProject(projectId);

    if (!project) return null;

    return project.chats.find(
      (chat) => chat.id === chatId
    );
  }

  function getChat(projectId, chatId) {
    if (projectId) {
      return getProjectChat(projectId, chatId);
    }

    return getQuickChat(chatId);
  }

  function getAllChats() {
    const quickChats = state.quickChats.map((chat) => ({
      ...chat,
      source: "quick"
    }));

    const projectChats = [];

    state.projects.forEach((project) => {
      project.chats.forEach((chat) => {
        projectChats.push({
          ...chat,
          source: "project",
          projectName: project.name
        });
      });
    });

    return [
      ...quickChats,
      ...projectChats
    ].sort(
      (a, b) =>
        new Date(b.updatedAt) -
        new Date(a.updatedAt)
    );
  }

  function addMessage(
    chat,
    role,
    content
  ) {
    if (!chat) return null;

    const message = {
      id: createId("message"),
      role,
      content: String(content || ""),
      createdAt: now()
    };

    chat.messages.push(message);

    chat.updatedAt = now();

    return message;
  }

  /* =========================================================
     9. CHAT DELETE
     ========================================================= */

  function requestDeleteChat(
    chatId,
    projectId = null
  ) {
    const chat = getChat(projectId, chatId);

    if (!chat) return;

    state.pendingDeleteChatId = chatId;

    const text = byId("chatDeleteText");

    if (text) {
      text.textContent =
        `Chat "${chat.title}" จะถูกลบถาวรจาก Adareet`;
    }

    const dialog = byId("chatDeleteDialog");

    if (dialog) {
      dialog.showModal();
    }

    dialog.dataset.projectId =
      projectId || "";
  }

  function deleteChat(
    chatId,
    projectId = null
  ) {
    if (projectId) {
      const project = getProject(projectId);

      if (!project) return;

      const index = project.chats.findIndex(
        (chat) => chat.id === chatId
      );

      if (index === -1) return;

      const deleted = project.chats[index];

      project.chats.splice(index, 1);

      project.updatedAt = now();

      addHistory(
        "chat_deleted",
        `ลบ Chat "${deleted.title}"`,
        projectId
      );
    } else {
      const index =
        state.quickChats.findIndex(
          (chat) => chat.id === chatId
        );

      if (index === -1) return;

      const deleted =
        state.quickChats[index];

      state.quickChats.splice(index, 1);

      addHistory(
        "quick_chat_deleted",
        `ลบ Quick Chat "${deleted.title}"`
      );
    }

    if (
      state.currentChatId === chatId
    ) {
      state.currentChatId = null;
    }

    state.pendingDeleteChatId = null;

    saveState("ลบ Chat แล้ว");

    renderApp();
  }

  /* =========================================================
     10. OPEN CHAT
     ========================================================= */

  function openQuickChat(chatId) {
    const chat = getQuickChat(chatId);

    if (!chat) return;

    state.currentProjectId = null;
    state.currentChatId = chat.id;
    state.currentView = "recent";
    state.currentProjectSubview = "overview";

    saveState();

    renderApp();

    window.setTimeout(() => {
      openQuickChatInterface(chat);
    }, 0);
  }

  function openQuickChatInterface(chat) {
    const existingProject =
      state.projects.find(
        (project) =>
          project.chats.some(
            (item) => item.id === chat.id
          )
      );

    if (existingProject) return;

    state.currentView = "recent";

    renderRecentChats();
  }

  function openProject(projectId) {
    const project = getProject(projectId);

    if (!project) return;

    state.currentProjectId = project.id;
    state.currentView = "project";
    state.currentProjectSubview = "overview";

    state.currentChatId =
      project.chats[0]?.id || null;

    saveState();

    renderApp();
  }

  function openProjectChat(
    projectId,
    chatId
  ) {
    const project = getProject(projectId);

    if (!project) return;

    const chat = project.chats.find(
      (item) => item.id === chatId
    );

    if (!chat) return;

    state.currentProjectId = projectId;
    state.currentChatId = chatId;
    state.currentView = "project";
    state.currentProjectSubview = "chat";

    saveState();

    renderApp();
  }

  /* =========================================================
     11. VIEWS
     ========================================================= */

  function setView(view) {
    state.currentView = view;

    if (view !== "project") {
      state.currentProjectId = null;
    }

    saveState();

    renderApp();
  }

  function setProjectSubview(subview) {
    state.currentProjectSubview =
      subview;

    saveState();

    renderProjectWorkspace();
  }

  function updateTopbar() {
    const meta =
      VIEW_META[state.currentView] ||
      VIEW_META.home;

    const title =
      byId("viewTitle");

    const subtitle =
      byId("viewSubtitle");

    const breadcrumbs =
      byId("breadcrumbs");

    if (title) {
      title.textContent =
        meta.title;
    }

    if (subtitle) {
      subtitle.textContent =
        meta.subtitle;
    }

    if (breadcrumbs) {
      breadcrumbs.textContent =
        meta.breadcrumb;
    }

    if (
      state.currentView === "project"
    ) {
      const project =
        getCurrentProject();

      if (project) {
        if (title) {
          title.textContent =
            project.name;
        }

        if (subtitle) {
          subtitle.textContent =
            project.description ||
            "พื้นที่ทำงานของ Project";
        }

        if (breadcrumbs) {
          breadcrumbs.textContent =
            `โปรเจกต์ / ${project.name}`;
        }
      }
    }
  }

  function renderApp() {
    updateAuthenticationVisibility();

    if (!state.user) {
      return;
    }

    updateTopbar();

    renderNavigation();

    renderHome();

    renderProjects();

    renderRecentChats();

    renderSettings();

    renderProjectWorkspace();

    renderQuickChats();

    renderProjectTree();

    applyAppearance();
  }

  function updateAuthenticationVisibility() {
    const login =
      byId("loginScreen");

    const app =
      byId("appShell");

    if (!state.user) {
      login?.classList.remove(
        "is-hidden"
      );

      app?.classList.add(
        "is-hidden"
      );

      return;
    }

    login?.classList.add(
      "is-hidden"
    );

    app?.classList.remove(
      "is-hidden"
    );
  }

  function renderNavigation() {
    $$("[data-view]").forEach(
      (button) => {
        const active =
          button.dataset.view ===
          state.currentView;

        button.classList.toggle(
          "active",
          active
        );
      }
    );

    const views = [
      "home",
      "projects",
      "recent",
      "settings"
    ];

    views.forEach((view) => {
      const element =
        byId(`${view}View`);

      if (!element) return;

      element.classList.toggle(
        "is-hidden",
        state.currentView !== view
      );
    });

    const projectView =
      byId("projectView");

    if (projectView) {
      projectView.classList.toggle(
        "is-hidden",
        state.currentView !==
          "project"
      );
    }
  }

  /* =========================================================
     12. HOME
     ========================================================= */

  function renderHome() {
    renderHomeProjects();

    renderContinueList();
  }

  function renderHomeProjects() {
    const container =
      byId("homeProjectGrid");

    if (!container) return;

    renderProjectCards(
      container,
      state.projects.slice(0, 6)
    );
  }

  function renderContinueList() {
    const container =
      byId("continueList");

    if (!container) return;

    const chats =
      getAllChats().slice(0, 5);

    if (
      !state.projects.length &&
      !chats.length
    ) {
      container.innerHTML = `
        <div class="empty-state">
          ยังไม่มีงานค้างอยู่ เริ่มด้วย Quick Chat หรือสร้าง Project ได้เลย
        </div>
      `;

      return;
    }

    const projectItems =
      state.projects
        .slice(0, 3)
        .map(
          (project) => `
            <button
              class="continue-item"
              data-open-project="${escapeHTML(
                project.id
              )}"
              type="button"
            >
              <div class="continue-item-main">
                <div class="continue-item-title">
                  ${escapeHTML(project.name)}
                </div>
                <div class="continue-item-meta">
                  Project · ${
                    project.chats.length
                  } Chat · ${
                    project.knowledge.length
                  } Knowledge
                </div>
              </div>
              <span>→</span>
            </button>
          `
        )
        .join("");

    const chatItems =
      chats
        .slice(0, 3)
        .map(
          (chat) => `
            <button
              class="continue-item"
              data-open-chat="${
                chat.id
              }"
              data-chat-project="${
                chat.projectId || ""
              }"
              type="button"
            >
              <div class="continue-item-main">
                <div class="continue-item-title">
                  ${escapeHTML(chat.title)}
                </div>
                <div class="continue-item-meta">
                  ${
                    chat.projectName ||
                    "Quick Chat"
                  } · ${
                    chat.messages.length
                  } ข้อความ
                </div>
              </div>
              <span>→</span>
            </button>
          `
        )
        .join("");

    container.innerHTML =
      projectItems +
      chatItems;
  }

  /* =========================================================
     13. PROJECT CARDS
     ========================================================= */

  function renderProjectCards(
    container,
    projects
  ) {
    if (!projects.length) {
      container.innerHTML = `
        <div class="project-empty">
          ยังไม่มี Project
          <br />
          เริ่มจากการสร้าง Project แรกของคุณ
        </div>
      `;

      return;
    }

    container.innerHTML =
      projects
        .map(
          (project) => `
            <article
              class="project-card"
              data-open-project="${
                project.id
              }"
            >
              <div class="project-cover">
                ${
                  project.cover
                    ? `
                      <img
                        src="${escapeHTML(
                          project.cover
                        )}"
                        alt=""
                        loading="lazy"
                        onerror="this.style.display='none'"
                      />
                    `
                    : ""
                }
              </div>

              <h3>
                ${escapeHTML(
                  project.name
                )}
              </h3>

              <p>
                ${escapeHTML(
                  project.description ||
                    "ยังไม่มีคำอธิบาย"
                )}
              </p>

              <div class="project-meta">
                <span>
                  ${project.chats.length}
                  Chat
                </span>
                <span>·</span>
                <span>
                  ${project.knowledge.length}
                  Knowledge
                </span>
                <span>·</span>
                <span>
                  ${project.chapters.length}
                  Chapter
                </span>
              </div>
            </article>
          `
        )
        .join("");
  }

  /* =========================================================
     14. PROJECT LIST
     ========================================================= */

  function renderProjects() {
    const container =
      byId("projectsGrid");

    if (!container) return;

    renderProjectCards(
      container,
      state.projects
    );
  }

  /* =========================================================
     15. RECENT CHATS
     ========================================================= */

  function renderRecentChats() {
    const container =
      byId("recentChatList");

    if (!container) return;

    const chats =
      getAllChats();

    if (!chats.length) {
      container.innerHTML = `
        <div class="empty-state">
          ยังไม่มี Chat
          <br />
          กด Quick Chat เพื่อเริ่มคุยได้ทันที
        </div>
      `;

      return;
    }

    container.innerHTML =
      chats
        .map(
          (chat) => `
            <div
              class="recent-chat-item"
              data-open-chat="${
                chat.id
              }"
              data-chat-project="${
                chat.projectId || ""
              }"
            >
              <div class="recent-chat-main">
                <div class="recent-chat-title">
                  ${escapeHTML(
                    chat.title
                  )}
                </div>

                <div class="recent-chat-meta">
                  ${
                    chat.projectName ||
                    "Quick Chat"
                  }
                  ·
                  ${
                    chat.messages.length
                  }
                  ข้อความ
                  ·
                  ${formatDate(
                    chat.updatedAt
                  )}
                </div>
              </div>

              <button
                class="tiny-button chat-delete-trigger"
                data-delete-chat="${
                  chat.id
                }"
                data-delete-project="${
                  chat.projectId || ""
                }"
                type="button"
                title="ลบ Chat"
                aria-label="ลบ Chat"
              >
                ×
              </button>
            </div>
          `
        )
        .join("");
  }

  /* =========================================================
     16. QUICK CHAT
     ========================================================= */

  function renderQuickChats() {
    const container =
      byId("inboxChatList");

    if (!container) return;

    const chats =
      state.quickChats.slice(0, 8);

    if (!chats.length) {
      container.innerHTML = `
        <div class="muted" style="
          padding: 8px;
          font-size: 11px;
        ">
          ยังไม่มี Quick Chat
        </div>
      `;

      return;
    }

    container.innerHTML =
      chats
        .map(
          (chat) => `
            <button
              class="inbox-chat-item"
              data-open-quick-chat="${
                chat.id
              }"
              type="button"
            >
              <span>◷</span>

              <span class="inbox-chat-item-title">
                ${escapeHTML(
                  chat.title
                )}
              </span>
            </button>
          `
        )
        .join("");
  }

  /* =========================================================
     17. PROJECT TREE
     ========================================================= */

  function renderProjectTree() {
    const container =
      byId("projectTree");

    if (!container) return;

    if (!state.projects.length) {
      container.innerHTML = `
        <div class="muted" style="
          padding: 8px;
          font-size: 11px;
        ">
          ยังไม่มี Project
        </div>
      `;

      return;
    }

    container.innerHTML =
      state.projects
        .slice(0, 10)
        .map(
          (project) => `
            <button
              class="project-tree-item"
              data-open-project="${
                project.id
              }"
              type="button"
            >
              <span>▣</span>
              <span class="project-tree-item-title">
                ${escapeHTML(
                  project.name
                )}
              </span>
            </button>
          `
        )
        .join("");
  }

  /* =========================================================
     18. PROJECT WORKSPACE
     ========================================================= */

  function renderProjectWorkspace() {
    const project =
      getCurrentProject();

    if (
      state.currentView !==
        "project" ||
      !project
    ) {
      return;
    }

    const name =
      byId("projectNameLabel");

    const description =
      byId(
        "projectDescriptionLabel"
      );

    const cover =
      byId("projectCoverSmall");

    if (name) {
      name.textContent =
        project.name;
    }

    if (description) {
      description.textContent =
        project.description ||
        "Project ของ Adareet";
    }

    if (cover) {
      cover.innerHTML =
        project.cover
          ? `
            <img
              src="${escapeHTML(
                project.cover
              )}"
              alt=""
              onerror="this.style.display='none'"
            />
          `
          : "";
    }

    const subviews = {
      overview:
        byId("projectOverviewView"),

      chat:
        byId("projectChatView"),

      knowledge:
        byId("projectKnowledgeView"),

      chapters:
        byId("projectChaptersView"),

      history:
        byId("projectHistoryView")
    };

    Object.entries(subviews)
      .forEach(
        ([key, element]) => {
          if (!element) return;

          element.classList.toggle(
            "is-hidden",
            key !==
              state.currentProjectSubview
          );
        }
      );

    renderProjectOverview(
      project
    );

    renderProjectChat(project);

    renderKnowledge(project);

    renderChapters(project);

    renderHistory(project);
  }

  function renderProjectOverview(
    project
  ) {
    const container =
      byId(
        "projectOverviewContent"
      );

    if (!container) return;

    const latestChat =
      project.chats[0];

    container.innerHTML = `
      <div class="home-hero">
        <div>
          <span class="eyebrow">
            PROJECT
          </span>

          <h2>
            ${escapeHTML(
              project.name
            )}
          </h2>

          <p>
            ${escapeHTML(
              project.description ||
                "พื้นที่สำหรับพัฒนาไอเดีย"
            )}
          </p>
        </div>

        <button
          class="button primary large"
          data-project-overview-chat="${escapeHTML(
            project.id
          )}"
          type="button"
        >
          ${
            latestChat
              ? "คุยต่อ"
              : "เริ่ม Chat"
          }
        </button>
      </div>

      <section class="home-section">
        <div class="section-head">
          <div>
            <h2>ภาพรวม</h2>
            <p class="muted">
              ข้อมูลพื้นฐานของ Project นี้
            </p>
          </div>
        </div>

        <div class="project-grid">
          <article class="project-card">
            <h3>Chats</h3>
            <p>
              ห้องสนทนาใน Project
            </p>
            <div class="project-meta">
              ${project.chats.length}
              ห้อง
            </div>
          </article>

          <article class="project-card">
            <h3>Knowledge</h3>
            <p>
              ข้อมูลที่บันทึกไว้
            </p>
            <div class="project-meta">
              ${project.knowledge.length}
              รายการ
            </div>
          </article>

          <article class="project-card">
            <h3>Chapters</h3>
            <p>
              งานเขียนใน Project
            </p>
            <div class="project-meta">
              ${project.chapters.length}
              Chapter
            </div>
          </article>
        </div>
      </section>
    `;
  }

  /* =========================================================
     19. PROJECT CHAT
     ========================================================= */

  function ensureProjectChat(
    project
  ) {
    if (!project.chats.length) {
      const chat =
        createChat({
          projectId: project.id,
          title: "เริ่มต้น Project",
          type: "project"
        });

      state.currentChatId =
        chat.id;

      saveState();

      return chat;
    }

    if (
      !project.chats.some(
        (chat) =>
          chat.id ===
          state.currentChatId
      )
    ) {
      state.currentChatId =
        project.chats[0].id;
    }

    return project.chats.find(
      (chat) =>
        chat.id ===
        state.currentChatId
    );
  }

  function renderProjectChat(
    project
  ) {
    const list =
      byId("projectChatList");

    const header =
      byId("chatHeaderBar");

    const messages =
      byId("messageList");

    if (!list || !header || !messages) {
      return;
    }

    const chat =
      ensureProjectChat(project);

    if (!chat) return;

    list.innerHTML =
      project.chats
        .map(
          (item) => `
            <div
              class="project-chat-item ${
                item.id ===
                chat.id
                  ? "active"
                  : ""
              }"
              data-open-project-chat="${
                item.id
              }"
              data-project-id="${
                project.id
              }"
            >
              <div class="project-chat-item-title">
                ${escapeHTML(
                  item.title
                )}
              </div>

              <div class="project-chat-item-meta">
                ${
                  item.messages.length
                } ข้อความ
              </div>

              <button
                class="tiny-button chat-delete-trigger"
                data-delete-chat="${
                  item.id
                }"
                data-delete-project="${
                  project.id
                }"
                type="button"
                title="ลบ Chat"
                aria-label="ลบ Chat"
              >
                ×
              </button>
            </div>
          `
        )
        .join("");

    header.innerHTML = `
      <h3>
        ${escapeHTML(
          chat.title
        )}
      </h3>

      <p>
        ${chat.messages.length}
        ข้อความ ·
        ${formatDate(
          chat.updatedAt
        )}
      </p>
    `;

    if (!chat.messages.length) {
      messages.innerHTML = `
        <div class="empty-state">
          เริ่มพ่นความคิดได้เลย
          <br />
          ยังไม่ต้องจัดระเบียบ
        </div>
      `;

      return;
    }

    messages.innerHTML =
      chat.messages
        .map(
          (message) => `
            <article
              class="message ${
                message.role ===
                "user"
                  ? "user"
                  : "assistant"
              }"
            >
              <div class="message-role">
                ${
                  message.role ===
                  "user"
                    ? "คุณ"
                    : "Adareet"
                }
              </div>

              <div class="message-content">
                ${escapeHTML(
                  message.content
                )}
              </div>
            </article>
          `
        )
        .join("");

    window.requestAnimationFrame(
      () => {
        messages.scrollTop =
          messages.scrollHeight;
      }
    );
  }

  /* =========================================================
     20. SEND MESSAGE
     ========================================================= */

  async function sendCurrentMessage() {
    const project =
      getCurrentProject();

    if (!project) return;

    const chat =
      ensureProjectChat(project);

    const input =
      byId("composerInput");

    if (!input || !chat) return;

    const text =
      input.value.trim();

    if (!text) return;

    input.value = "";

    addMessage(
      chat,
      "user",
      text
    );

    project.updatedAt = now();

    saveState("กำลังประมวลผล...");

    renderProjectChat(project);

    const response =
      await AI_ROUTER.respond({
        project,
        chat,
        message: text,
        state
      });

    if (response) {
      addMessage(
        chat,
        "assistant",
        response
      );

      project.updatedAt = now();

      saveState();

      renderProjectChat(project);
    }
  }

  /* =========================================================
     21. AI ROUTER
     ========================================================= */

  const AI_ROUTER = {
    async respond(context) {
      const provider =
        state.ai.activeProvider ||
        "mock";

      switch (provider) {
        case "mock":
          return this.mockRespond(
            context
          );

        case "gemini":
          return this.unavailableResponse(
            "Gemini"
          );

        case "openai":
          return this.unavailableResponse(
            "OpenAI"
          );

        case "custom":
          return this.unavailableResponse(
            "Custom Provider"
          );

        default:
          return this.mockRespond(
            context
          );
      }
    },

    mockRespond(context) {
      const message =
        context.message.trim();

      const lower =
        message.toLowerCase();

      if (
        lower.includes("canon") ||
        message.includes("แคนนอน")
      ) {
        return (
          "ตอนนี้ฉันอยู่ในโหมด Prototype จึงยังไม่ได้เชื่อมฐานข้อมูลภายนอก แต่ข้อความนี้ถูกเก็บไว้ใน Project แล้ว และในอนาคต AI Router สามารถส่งคำถามนี้ไปยังโมเดลที่เหมาะสมพร้อม Knowledge ของ Project ได้"
        );
      }

      if (
        lower.includes("idea") ||
        message.includes("ไอเดีย") ||
        message.includes("คิดว่า")
      ) {
        return (
          "รับไอเดียแล้ว ตอนนี้ Adareet จะเก็บมันไว้ก่อนโดยไม่บังคับให้จัดประเภททันที เมื่อระบบ AI จริงถูกเชื่อมเข้ามา เราสามารถให้โมเดลช่วยแตกประเด็น ตรวจความขัดแย้ง และเสนอสิ่งที่ควรเก็บเป็น Knowledge ได้"
        );
      }

      return (
        "รับข้อความแล้ว ตอนนี้ฉันทำหน้าที่เป็น Prototype AI เพื่อทดสอบการไหลของระบบก่อน เมื่อเราเชื่อม AI Router จริง ข้อความนี้จะถูกส่งไปยังโมเดลที่เลือกพร้อมบริบทของ Project โดยไม่ต้องเปลี่ยนโครงสร้าง Chat ใหม่"
      );
    },

    unavailableResponse(
      providerName
    ) {
      return (
        `${providerName} ยังไม่ได้เชื่อม API ใน V2.5 ตอนนี้ระบบยังทำงานผ่าน Mock AI เพื่อทดสอบโครงสร้างก่อน`
      );
    }
  };

  /* =========================================================
     22. KNOWLEDGE
     ========================================================= */

  function renderKnowledge(
    project
  ) {
    const list =
      byId("knowledgeList");

    const filters =
      byId(
        "knowledgeStatusFilters"
      );

    if (!list || !filters) return;

    const search =
      byId("knowledgeSearch")
        ?.value
        .trim()
        .toLowerCase() || "";

    const statuses = [
      ["all", "ทั้งหมด"],
      [
        "unconfirmed",
        "ยังไม่ตัดสินใจ"
      ],
      [
        "confirmed",
        "ยืนยันแล้ว"
      ],
      [
        "rejected",
        "ขีดค่าแล้ว"
      ],
      [
        "supplementary",
        "ข้อมูลเสริม"
      ]
    ];

    const activeStatus =
      filters.dataset.status ||
      "all";

    filters.innerHTML =
      statuses
        .map(
          ([value, label]) => `
            <button
              class="filter-pill ${
                value ===
                activeStatus
                  ? "active"
                  : ""
              }"
              data-knowledge-status="${
                value
              }"
              type="button"
            >
              ${label}
            </button>
          `
        )
        .join("");

    let items =
      project.knowledge;

    if (
      activeStatus !==
      "all"
    ) {
      items =
        items.filter(
          (item) =>
            item.status ===
            activeStatus
        );
    }

    if (search) {
      items =
        items.filter(
          (item) =>
            item.text
              .toLowerCase()
              .includes(search) ||
            item.source
              .toLowerCase()
              .includes(search)
        );
    }

    if (!items.length) {
      list.innerHTML = `
        <div class="empty-state">
          ยังไม่มีข้อมูลที่ตรงกับการค้นหา
        </div>
      `;

      return;
    }

    list.innerHTML =
      items
        .map(
          (item) => `
            <article class="knowledge-card">
              <div class="knowledge-card-top">
                <p>
                  ${escapeHTML(
                    item.text
                  )}
                </p>

                <span class="status-badge">
                  ${escapeHTML(
                    getKnowledgeStatusLabel(
                      item.status
                    )
                  )}
                </span>
              </div>

              <div class="knowledge-source">
                Source:
                ${escapeHTML(
                  item.source
                )}
                ·
                ${formatDate(
                  item.createdAt
                )}
              </div>
            </article>
          `
        )
        .join("");
  }

  function getKnowledgeStatusLabel(
    status
  ) {
    const labels = {
      unconfirmed:
        "ยังไม่ตัดสินใจ",
      confirmed:
        "ยืนยันแล้ว",
      rejected:
        "ขีดค่าแล้ว",
      supplementary:
        "ข้อมูลเสริม"
    };

    return (
      labels[status] ||
      status
    );
  }

  function addKnowledge(
    project,
    text,
    source,
    status
  ) {
    project.knowledge.unshift({
      id: createId("knowledge"),
      text: String(text || "").trim(),
      source:
        String(source || "").trim() ||
        "Unconfirmed Idea",
      status:
        status || "unconfirmed",
      createdAt: now(),
      updatedAt: now()
    });

    project.updatedAt = now();

    addHistory(
      "knowledge_added",
      "เพิ่มข้อมูล Knowledge",
      project.id
    );

    saveState("บันทึก Knowledge แล้ว");

    renderKnowledge(project);
  }

  /* =========================================================
     23. CHAPTERS
     ========================================================= */

  function renderChapters(
    project
  ) {
    const list =
      byId("chapterList");

    if (!list) return;

    if (!project.chapters.length) {
      list.innerHTML = `
        <div class="empty-state">
          ยังไม่มี Chapter
          <br />
          พื้นที่เขียนจริงจะเริ่มตรงนี้
        </div>
      `;

      return;
    }

    list.innerHTML =
      project.chapters
        .map(
          (chapter) => `
            <article class="chapter-card">
              <div>
                <h3>
                  ${escapeHTML(
                    chapter.title ||
                      "Untitled Chapter"
                  )}
                </h3>

                <p>
                  ${
                    countWords(
                      chapter.content
                    )
                  }
                  คำ ·
                  ${formatDate(
                    chapter.updatedAt
                  )}
                </p>
              </div>

              <button
                class="button soft"
                data-edit-chapter="${
                  chapter.id
                }"
                type="button"
              >
                เปิด
              </button>
            </article>
          `
        )
        .join("");
  }

  function createChapter(
    project,
    title = "",
    content = ""
  ) {
    const chapter = {
      id: createId("chapter"),

      title:
        String(title || "").trim() ||
        `Chapter ${
          project.chapters.length + 1
        }`,

      content:
        String(content || ""),

      createdAt: now(),
      updatedAt: now()
    };

    project.chapters.unshift(
      chapter
    );

    project.updatedAt = now();

    addHistory(
      "chapter_created",
      `สร้าง ${chapter.title}`,
      project.id
    );

    saveState("สร้าง Chapter แล้ว");

    return chapter;
  }

  function openChapter(
    chapterId = null
  ) {
    const project =
      getCurrentProject();

    if (!project) return;

    let chapter =
      chapterId
        ? project.chapters.find(
            (item) =>
              item.id ===
              chapterId
          )
        : null;

    if (!chapter) {
      chapter =
        createChapter(project);
    }

    const title =
      byId("chapterTitle");

    const content =
      byId("chapterContent");

    if (title) {
      title.value =
        chapter.title;
    }

    if (content) {
      content.value =
        chapter.content;
    }

    const wordCount =
      byId("chapterWordCount");

    updateChapterWordCount();

    const dialog =
      byId("chapterDialog");

    dialog.dataset.chapterId =
      chapter.id;

    dialog.showModal();
  }

  function saveChapterFromDialog() {
    const project =
      getCurrentProject();

    const dialog =
      byId("chapterDialog");

    if (!project || !dialog) {
      return;
    }

    const chapterId =
      dialog.dataset.chapterId;

    const chapter =
      project.chapters.find(
        (item) =>
          item.id ===
          chapterId
      );

    if (!chapter) return;

    chapter.title =
      byId("chapterTitle")
        ?.value
        .trim() ||
      "Untitled Chapter";

    chapter.content =
      byId("chapterContent")
        ?.value || "";

    chapter.updatedAt = now();

    project.updatedAt = now();

    addHistory(
      "chapter_updated",
      `แก้ไข ${chapter.title}`,
      project.id
    );

    saveState(
      "บันทึก Chapter แล้ว"
    );

    renderChapters(project);
  }

  function updateChapterWordCount() {
    const content =
      byId("chapterContent")
        ?.value || "";

    const counter =
      byId("chapterWordCount");

    if (!counter) return;

    counter.textContent =
      `${countWords(
        content
      )} คำ`;
  }

  /* =========================================================
     24. HISTORY
     ========================================================= */

  function renderHistory(
    project
  ) {
    const list =
      byId("historyList");

    if (!list) return;

    const history =
      getProjectHistory(
        project.id
      );

    if (!history.length) {
      list.innerHTML = `
        <div class="empty-state">
          ยังไม่มีประวัติการเปลี่ยนแปลง
        </div>
      `;

      return;
    }

    list.innerHTML =
      history
        .map(
          (item) => `
            <article class="history-item">
              <div class="history-time">
                ${formatDate(
                  item.createdAt
                )}
              </div>

              <div class="history-description">
                ${escapeHTML(
                  item.description
                )}
              </div>
            </article>
          `
        )
        .join("");
  }

  function clearProjectHistory(
    project
  ) {
    state.history =
      state.history.filter(
        (item) =>
          item.projectId !==
          project.id
      );

    saveState(
      "ล้างประวัติแล้ว"
    );

    renderHistory(project);
  }

  /* =========================================================
     25. SETTINGS
     ========================================================= */

  function renderSettings() {
    const container =
      byId("settingsContent");

    if (!container) return;

    const tab =
      state.currentSettingsTab ||
      "appearance";

    const contents = {
      appearance: renderAppearanceSettings(),
      data: renderDataSettings(),
      ai: renderAISettings(),
      account: renderAccountSettings()
    };

    container.innerHTML =
      contents[tab] ||
      contents.appearance;

    $$("[data-settings-tab]")
      .forEach((button) => {
        button.classList.toggle(
          "active",
          button.dataset
            .settingsTab ===
            tab
        );
      });
  }

  function renderAppearanceSettings() {
    return `
      <section class="settings-section">
        <h2>หน้าตา</h2>

        <p>
          การตั้งค่าหน้าตาของ Adareet
        </p>

        <div class="setting-row">
          <div>
            <div class="setting-title">
              โหมดสี
            </div>

            <div class="setting-description">
              V2.5 เริ่มต้นด้วยโหมดสว่าง
            </div>
          </div>

          <div class="setting-control">
            <select
              id="appearanceSelect"
            >
              <option value="light">
                Light
              </option>
              <option value="soft">
                Soft
              </option>
            </select>
          </div>
        </div>

        <div class="setting-row">
          <div>
            <div class="setting-title">
              Font
            </div>

            <div class="setting-description">
              เลือกแบบอักษรพื้นฐาน
            </div>
          </div>

          <div class="setting-control">
            <select id="fontSelect">
              <option value="system">
                System
              </option>
              <option value="serif">
                Serif
              </option>
            </select>
          </div>
        </div>

        <div class="setting-row">
          <div>
            <div class="setting-title">
              Auto Save
            </div>

            <div class="setting-description">
              บันทึกข้อมูลลงในเครื่องโดยอัตโนมัติ
            </div>
          </div>

          <div class="setting-control">
            <input
              id="autoSaveToggle"
              type="checkbox"
              ${
                state.settings.autoSave
                  ? "checked"
                  : ""
              }
            />
          </div>
        </div>
      </section>
    `;
  }

  function renderDataSettings() {
    return `
      <section class="settings-section">
        <h2>ข้อมูล</h2>

        <p>
          ข้อมูลของ Prototype นี้เก็บไว้ใน Browser ของเครื่องนี้
        </p>

        <div class="setting-row">
          <div>
            <div class="setting-title">
              Export
            </div>

            <div class="setting-description">
              ดาวน์โหลดข้อมูลทั้งหมดเป็น JSON
            </div>
          </div>

          <button
            class="button soft"
            id="exportDataBtn"
            type="button"
          >
            Export
          </button>
        </div>

        <div class="setting-row">
          <div>
            <div class="setting-title">
              Reset
            </div>

            <div class="setting-description">
              ลบข้อมูล Prototype ทั้งหมดจากเครื่องนี้
            </div>
          </div>

          <button
            class="button danger"
            id="resetDataBtn"
            type="button"
          >
            Reset
          </button>
        </div>
      </section>
    `;
  }

  function renderAISettings() {
    const provider =
      state.ai.activeProvider;

    return `
      <section class="settings-section">
        <h2>AI</h2>

        <p>
          จุดนี้คือโครงสำหรับระบบ AI หลายตัวของ Adareet
          ตอนนี้ยังไม่ได้ส่งข้อมูลออกไปยัง API ภายนอก
        </p>

        <div class="setting-row">
          <div>
            <div class="setting-title">
              Provider
            </div>

            <div class="setting-description">
              เลือก AI ที่ Router จะใช้ในอนาคต
            </div>
          </div>

          <div class="setting-control">
            <select
              id="aiProviderSelect"
            >
              ${Object.values(
                AI_PROVIDERS
              )
                .map(
                  (item) => `
                    <option
                      value="${
                        item.id
                      }"
                      ${
                        item.id ===
                        provider
                          ? "selected"
                          : ""
                      }
                    >
                      ${escapeHTML(
                        item.name
                      )}
                    </option>
                  `
                )
                .join("")}
            </select>
          </div>
        </div>

        <div class="setting-row">
          <div>
            <div class="setting-title">
              สถานะ
            </div>

            <div class="setting-description">
              ${
                provider === "mock"
                  ? "Prototype / Mock AI"
                  : "โครงสร้าง Provider พร้อม แต่ยังไม่ได้เชื่อม API"
              }
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderAccountSettings() {
    const user =
      state.user;

    return `
      <section class="settings-section">
        <h2>บัญชี</h2>

        <p>
          ข้อมูลบัญชีใน Prototype
        </p>

        <div class="setting-row">
          <div>
            <div class="setting-title">
              ${
                escapeHTML(
                  user?.name ||
                    "Guest"
                )
              }
            </div>

            <div class="setting-description">
              ${
                escapeHTML(
                  user?.email ||
                    "Guest account"
                )
              }
            </div>
          </div>

          <button
            class="button soft"
            id="settingsSignOutBtn"
            type="button"
          >
            ออกจากระบบ
          </button>
        </div>
      </section>
    `;
  }

  function applyAppearance() {
    const root =
      document.documentElement;

    root.dataset.theme =
      state.settings.appearance ===
      "soft"
        ? "soft"
        : "white";

    root.dataset.font =
      state.settings.font;
  }

  /* =========================================================
     26. DIALOG HELPERS
     ========================================================= */

  function openProjectDialog() {
    const dialog =
      byId("projectDialog");

    if (!dialog) return;

    byId("projectName").value =
      "";

    byId("projectDesc").value =
      "";

    byId("projectCover").value =
      "";

    dialog.showModal();
  }

  function saveProjectFromDialog() {
    const name =
      byId("projectName")
        ?.value
        .trim();

    if (!name) {
      byId("projectName")?.focus();

      return;
    }

    const description =
      byId("projectDesc")
        ?.value || "";

    const cover =
      byId("projectCover")
        ?.value || "";

    const project =
      createProject({
        name,
        description,
        cover
      });

    byId("projectDialog")
      ?.close();

    openProject(project.id);
  }

  function openKnowledgeDialog() {
    const dialog =
      byId("knowledgeDialog");

    if (!dialog) return;

    byId("knowledgeText").value =
      "";

    byId("knowledgeSource").value =
      "Unconfirmed Idea";

    byId("knowledgeStatus").value =
      "unconfirmed";

    dialog.showModal();
  }

  function saveKnowledgeFromDialog() {
    const project =
      getCurrentProject();

    if (!project) return;

    const text =
      byId("knowledgeText")
        ?.value
        .trim();

    if (!text) {
      byId("knowledgeText")
        ?.focus();

      return;
    }

    const source =
      byId("knowledgeSource")
        ?.value || "";

    const status =
      byId("knowledgeStatus")
        ?.value ||
      "unconfirmed";

    addKnowledge(
      project,
      text,
      source,
      status
    );

    byId("knowledgeDialog")
      ?.close();
  }

  /* =========================================================
     27. AI CONSENT
     ========================================================= */

  function requestAIConsent() {
    const project =
      getCurrentProject();

    if (!project) return;

    const dialog =
      byId("aiConsentDialog");

    if (!dialog) return;

    dialog.showModal();
  }

  function grantAIConsent() {
    const project =
      getCurrentProject();

    if (!project) return;

    project.settings.aiEnabled =
      true;

    if (
      !state.ai.consentedProjectIds.includes(
        project.id
      )
    ) {
      state.ai.consentedProjectIds.push(
        project.id
      );
    }

    addHistory(
      "ai_access_granted",
      "อนุญาต AI เข้าถึง Project",
      project.id
    );

    saveState(
      "อนุญาต AI แล้ว"
    );

    byId("aiConsentDialog")
      ?.close();
  }

  /* =========================================================
     28. EXPORT / RESET
     ========================================================= */

  function exportData() {
    const data =
      JSON.stringify(
        state,
        null,
        2
      );

    const blob =
      new Blob(
        [data],
        {
          type:
            "application/json"
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href = url;

    link.download =
      `adareet-v${APP_VERSION}-backup.json`;

    document.body.appendChild(
      link
    );

    link.click();

    link.remove();

    URL.revokeObjectURL(
      url
    );
  }

  function resetData() {
    const confirmed =
      window.confirm(
        "ลบข้อมูล Adareet Prototype ทั้งหมดจากเครื่องนี้หรือไม่?"
      );

    if (!confirmed) return;

    localStorage.removeItem(
      STORAGE_KEY
    );

    state =
      createDefaultState();

    window.location.reload();
  }

  /* =========================================================
     29. QUICK ACTIONS
     ========================================================= */

  function handleQuickAction(
    type
  ) {
    const input =
      byId("composerInput");

    if (!input) return;

    const prompts = {
      idea:
        "ช่วยแตกไอเดียนี้ให้หน่อย: ",

      confirm:
        "ช่วยตรวจว่าแนวคิดนี้ควรถูกยืนยันเป็นข้อมูลของ Project หรือยัง: ",

      chapter:
        "ช่วยคิดว่าไอเดียนี้เหมาะจะพัฒนาเป็น Chapter อย่างไร: ",

      canon:
        "ช่วยตรวจแนวคิดนี้กับ Canon และบอกจุดที่ควรตรวจสอบ: "
    };

    const prompt =
      prompts[type];

    if (!prompt) return;

    if (
      !input.value.trim()
    ) {
      input.value =
        prompt;
    } else {
      input.value =
        `${prompt}${input.value}`;
    }

    input.focus();
  }

  /* =========================================================
     30. EVENT LISTENERS
     ========================================================= */

  function bindEvents() {
    /* -------------------------
       LOGIN
       ------------------------- */

    byId("guestLoginBtn")
      ?.addEventListener(
        "click",
        () => {
          loginUser(
            byId("loginName")
              ?.value ||
              "Guest",
            byId("loginEmail")
              ?.value ||
              "",
            "guest"
          );
        }
      );

    byId("googleLoginBtn")
      ?.addEventListener(
        "click",
        () => {
          loginUser(
            byId("loginName")
              ?.value ||
              "Guest",
            byId("loginEmail")
              ?.value ||
              "",
            "google-prototype"
          );
        }
      );

    byId("loginForm")
      ?.addEventListener(
        "submit",
        (event) => {
          event.preventDefault();

          loginUser(
            byId("loginName")
              ?.value ||
              "Guest",
            byId("loginEmail")
              ?.value ||
              "",
            "guest"
          );
        }
      );

    /* -------------------------
       NAVIGATION
       ------------------------- */

    document.addEventListener(
      "click",
      (event) => {
        const viewButton =
          event.target.closest(
            "[data-view]"
          );

        if (viewButton) {
          setView(
            viewButton.dataset.view
          );

          return;
        }

        const openProjectButton =
          event.target.closest(
            "[data-open-project]"
          );

        if (
          openProjectButton
        ) {
          openProject(
            openProjectButton
              .dataset
              .openProject
          );

          return;
        }

        const openChatButton =
          event.target.closest(
            "[data-open-chat]"
          );

        if (openChatButton) {
          const chatId =
            openChatButton
              .dataset
              .openChat;

          const projectId =
            openChatButton
              .dataset
              .chatProject;

          if (projectId) {
            openProjectChat(
              projectId,
              chatId
            );
          } else {
            openQuickChat(
              chatId
            );
          }

          return;
        }

        const quickChatButton =
          event.target.closest(
            "[data-open-quick-chat]"
          );

        if (
          quickChatButton
        ) {
          openQuickChat(
            quickChatButton
              .dataset
              .openQuickChat
          );

          return;
        }

        const projectChatButton =
          event.target.closest(
            "[data-open-project-chat]"
          );

        if (
          projectChatButton
        ) {
          openProjectChat(
            projectChatButton
              .dataset
              .projectId,
            projectChatButton
              .dataset
              .openProjectChat
          );

          return;
        }

        const deleteButton =
          event.target.closest(
            "[data-delete-chat]"
          );

        if (deleteButton) {
          event.stopPropagation();

          requestDeleteChat(
            deleteButton
              .dataset
              .deleteChat,
            deleteButton
              .dataset
              .deleteProject ||
              null
          );

          return;
        }

        const projectOverviewChat =
          event.target.closest(
            "[data-project-overview-chat]"
          );

        if (
          projectOverviewChat
        ) {
          const project =
            getProject(
              projectOverviewChat
                .dataset
                .projectOverviewChat
            );

          if (!project) return;

          let chat =
            project.chats[0];

          if (!chat) {
            chat =
              createChat({
                projectId:
                  project.id,
                title:
                  "เริ่มต้น Project",
                type: "project"
              });
          }

          state.currentChatId =
            chat.id;

          state.currentProjectSubview =
            "chat";

          saveState();

          renderApp();

          return;
        }

        const editChapterButton =
          event.target.closest(
            "[data-edit-chapter]"
          );

        if (
          editChapterButton
        ) {
          openChapter(
            editChapterButton
              .dataset
              .editChapter
          );

          return;
        }

        const knowledgeFilter =
          event.target.closest(
            "[data-knowledge-status]"
          );

        if (
          knowledgeFilter
        ) {
          const filters =
            byId(
              "knowledgeStatusFilters"
            );

          if (filters) {
            filters.dataset.status =
              knowledgeFilter
                .dataset
                .knowledgeStatus;
          }

          const project =
            getCurrentProject();

          if (project) {
            renderKnowledge(
              project
            );
          }

          return;
        }
      }
    );

    /* -------------------------
       HOME / PROJECT
       ------------------------- */

    [
      "topNewProjectBtn",
      "homeNewProjectBtn",
      "projectsNewBtn",
      "newProjectSidebarBtn"
    ].forEach((id) => {
      byId(id)?.addEventListener(
        "click",
        openProjectDialog
      );
    });

    [
      "topQuickChatBtn",
      "heroQuickChatBtn",
      "recentQuickBtn",
      "quickChatBtn"
    ].forEach((id) => {
      byId(id)?.addEventListener(
        "click",
        () => {
          createAndOpenQuickChat();
        }
      );
    });

    byId("brandHomeBtn")
      ?.addEventListener(
        "click",
        () => {
          state.currentView =
            "home";

          state.currentProjectId =
            null;

          saveState();

          renderApp();
        }
      );

    /* -------------------------
       PROJECT NAV
       ------------------------- */

    byId("projectHomeBtn")
      ?.addEventListener(
        "click",
        () => {
          setProjectSubview(
            "overview"
          );
        }
      );

    byId("projectChatBtn")
      ?.addEventListener(
        "click",
        () => {
          setProjectSubview(
            "chat"
          );
        }
      );

    byId("projectKnowledgeBtn")
      ?.addEventListener(
        "click",
        () => {
          setProjectSubview(
            "knowledge"
          );
        }
      );

    byId("projectChaptersBtn")
      ?.addEventListener(
        "click",
        () => {
          setProjectSubview(
            "chapters"
          );
        }
      );

    byId("projectHistoryBtn")
      ?.addEventListener(
        "click",
        () => {
          setProjectSubview(
            "history"
          );
        }
      );

    byId("projectNewChatBtn")
      ?.addEventListener(
        "click",
        () => {
          const project =
            getCurrentProject();

          if (!project) return;

          const chat =
            createChat({
              projectId:
                project.id,
              title:
                `Chat ${
                  project.chats.length +
                  1
                }`,
              type: "project"
            });

          state.currentChatId =
            chat.id;

          state.currentProjectSubview =
            "chat";

          saveState();

          renderApp();
        }
      );

    /* -------------------------
       CHAT
       ------------------------- */

    byId("sendBtn")
      ?.addEventListener(
        "click",
        sendCurrentMessage
      );

    byId("composerInput")
      ?.addEventListener(
        "keydown",
        (event) => {
          if (
            event.key ===
              "Enter" &&
            (event.metaKey ||
              event.ctrlKey)
          ) {
            event.preventDefault();

            sendCurrentMessage();
          }
        }
      );

    $$(".quick-action")
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            handleQuickAction(
              button.dataset.quick
            );
          }
        );
      });

    /* -------------------------
       PROJECT DIALOG
       ------------------------- */

    byId("projectForm")
      ?.addEventListener(
        "submit",
        (event) => {
          if (
            event.submitter?.value ===
            "cancel"
          ) {
            return;
          }

          event.preventDefault();

          saveProjectFromDialog();
        }
      );

    /* -------------------------
       DELETE DIALOG
       ------------------------- */

    byId("chatDeleteForm")
      ?.addEventListener(
        "submit",
        (event) => {
          if (
            event.submitter?.value ===
            "cancel"
          ) {
            return;
          }

          event.preventDefault();

          const dialog =
            byId(
              "chatDeleteDialog"
            );

          const projectId =
            dialog?.dataset
              .projectId ||
            null;

          const chatId =
            state.pendingDeleteChatId;

          if (chatId) {
            deleteChat(
              chatId,
              projectId
            );
          }

          dialog?.close();
        }
      );

    /* -------------------------
       KNOWLEDGE
       ------------------------- */

    byId("addKnowledgeBtn")
      ?.addEventListener(
        "click",
        openKnowledgeDialog
      );

    byId("knowledgeForm")
      ?.addEventListener(
        "submit",
        (event) => {
          if (
            event.submitter?.value ===
            "cancel"
          ) {
            return;
          }

          event.preventDefault();

          saveKnowledgeFromDialog();
        }
      );

    byId("knowledgeSearch")
      ?.addEventListener(
        "input",
        () => {
          const project =
            getCurrentProject();

          if (project) {
            renderKnowledge(
              project
            );
          }
        }
      );

    /* -------------------------
       CHAPTERS
       ------------------------- */

    byId("addChapterBtn")
      ?.addEventListener(
        "click",
        () => {
          openChapter();
        }
      );

    byId("chapterForm")
      ?.addEventListener(
        "submit",
        (event) => {
          if (
            event.submitter?.value ===
            "cancel"
          ) {
            return;
          }

          event.preventDefault();

          saveChapterFromDialog();

          byId("chapterDialog")
            ?.close();
        }
      );

    byId("chapterContent")
      ?.addEventListener(
        "input",
        updateChapterWordCount
      );

    /* -------------------------
       HISTORY
       ------------------------- */

    byId("clearHistoryBtn")
      ?.addEventListener(
        "click",
        () => {
          const project =
            getCurrentProject();

          if (!project) return;

          const confirmed =
            window.confirm(
              "ล้างประวัติของ Project นี้หรือไม่?"
            );

          if (!confirmed) return;

          clearProjectHistory(
            project
          );
        }
      );

    /* -------------------------
       AI CONSENT
       ------------------------- */

    byId("grantAiBtn")
      ?.addEventListener(
        "click",
        (event) => {
          event.preventDefault();

          grantAIConsent();
        }
      );

    /* -------------------------
       SETTINGS
       ------------------------- */

    $$("[data-settings-tab]")
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            state.currentSettingsTab =
              button.dataset
                .settingsTab;

            saveState();

            renderSettings();
          }
        );
      });

    document.addEventListener(
      "change",
      (event) => {
        if (
          event.target.id ===
          "appearanceSelect"
        ) {
          state.settings.appearance =
            event.target.value;

          saveState();

          applyAppearance();

          return;
        }

        if (
          event.target.id ===
          "fontSelect"
        ) {
          state.settings.font =
            event.target.value;

          saveState();

          applyAppearance();

          return;
        }

        if (
          event.target.id ===
          "autoSaveToggle"
        ) {
          state.settings.autoSave =
            event.target.checked;

          saveState();

          return;
        }

        if (
          event.target.id ===
          "aiProviderSelect"
        ) {
          state.ai.activeProvider =
            event.target.value;

          state.settings.aiProvider =
            event.target.value;

          saveState(
            "เปลี่ยน AI Provider แล้ว"
          );

          renderSettings();

          return;
        }
      }
    );

    document.addEventListener(
      "click",
      (event) => {
        if (
          event.target.id ===
          "exportDataBtn"
        ) {
          exportData();

          return;
        }

        if (
          event.target.id ===
          "resetDataBtn"
        ) {
          resetData();

          return;
        }

        if (
          event.target.id ===
          "settingsSignOutBtn"
        ) {
          logoutUser();

          return;
        }
      }
    );

    /* -------------------------
       SIDEBAR
       ------------------------- */

    byId("sidebarCollapseBtn")
      ?.addEventListener(
        "click",
        () => {
          byId("appShell")
            ?.classList.toggle(
              "sidebar-collapsed"
            );
        }
      );

    byId("mobileSidebarBtn")
      ?.addEventListener(
        "click",
        () => {
          byId("sidebar")
            ?.classList.toggle(
              "mobile-open"
            );
        }
      );

    /* -------------------------
       SIGN OUT
       ------------------------- */

    byId("signOutBtn")
      ?.addEventListener(
        "click",
        logoutUser
      );
  }

  /* =========================================================
     31. CREATE QUICK CHAT
     ========================================================= */

  function createAndOpenQuickChat() {
    const chat =
      createChat({
        title: "Quick Chat",
        type: "quick"
      });

    if (!chat) return;

    state.currentView =
      "recent";

    state.currentChatId =
      chat.id;

    state.currentProjectId =
      null;

    saveState();

    renderApp();

    /*
      Quick Chat ตอนนี้มีข้อมูลจริงแล้ว
      แต่ UI ของ composer หลักอยู่ใน Project
      ดังนั้นเรายังไม่บังคับ Quick Chat ให้ใช้
      composer เดียวกันจนกว่าเราจะออกแบบ
      Quick Chat workspace โดยเฉพาะ

      ในขั้นถัดไปเราสามารถทำให้ Quick Chat
      เปิดเป็นหน้าคุยเต็มรูปแบบได้
    */
  }

  /* =========================================================
     32. INITIALIZE
     ========================================================= */

  function initialize() {
    bindEvents();

    if (state.user) {
      renderApp();
    } else {
      updateAuthenticationVisibility();
    }

    console.log(
      `Adareet v${APP_VERSION} initialized`
    );
  }

  initialize();

  /* =========================================================
     33. DEBUG API
     ========================================================= */

  window.Adareet = {
    getState: () => state,

    save: saveState,

    reset: resetData,

    createProject,

    createChat,

    getProject,

    getAllChats,

    aiRouter: AI_ROUTER
  };
})();
