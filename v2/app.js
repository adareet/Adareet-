(() => {
  "use strict";

  const STORAGE_KEY = "adareet_v2_state";

  const defaultState = {
    user: null,
    currentProjectId: null,
    projects: [],
    settings: {
      theme: "white",
      font: "system"
    }
  };

  let state = loadState();

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  function uid(prefix = "id") {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function now() {
    return new Date().toISOString();
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(defaultState);

      const saved = JSON.parse(raw);

      return {
        ...structuredClone(defaultState),
        ...saved,
        settings: {
          ...defaultState.settings,
          ...(saved.settings || {})
        }
      };
    } catch (error) {
      console.error("Adareet: failed to load state", error);
      return structuredClone(defaultState);
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function currentProject() {
    return state.projects.find(
      (project) => project.id === state.currentProjectId
    ) || null;
  }

  function render() {
    applyTheme();
    renderProjects();
    renderCurrentProject();
    renderBackstage();
  }

  function applyTheme() {
    document.documentElement.dataset.theme = state.settings.theme || "white";
    document.documentElement.dataset.font = state.settings.font || "system";
  }

  function renderProjects() {
    const list = $("#projectList");
    if (!list) return;

    if (!state.projects.length) {
      list.innerHTML = `
        <div class="panel">
          <p class="muted">ยังไม่มี Project</p>
        </div>
      `;
      return;
    }

    list.innerHTML = state.projects.map((project) => `
      <button
        type="button"
        class="project-item ${project.id === state.currentProjectId ? "active" : ""}"
        data-project-id="${escapeHTML(project.id)}"
      >
        <strong>${escapeHTML(project.name)}</strong>
        <span>${project.chats?.length || 0} Chat · ${project.knowledge?.length || 0} Data</span>
      </button>
    `).join("");

    $$(".project-item").forEach((button) => {
      button.addEventListener("click", () => {
        state.currentProjectId = button.dataset.projectId;
        saveState();
        render();
      });
    });
  }

  function renderCurrentProject() {
    const project = currentProject();

    $("#emptyProjectView")?.classList.toggle("is-hidden", !!project);
    $("#workspace")?.classList.toggle("is-hidden", !project);

    if (!project) {
      $("#currentProjectTitle").textContent = "ยังไม่มี Project";
      $("#currentProjectSub").textContent = "สร้าง Project เพื่อเริ่มคุย";
      return;
    }

    $("#currentProjectTitle").textContent = project.name;
    $("#currentProjectSub").textContent =
      project.description || "Project-based writing environment";

    renderChats(project);
    renderMessages(project);
  }

  function renderChats(project) {
    const strip = $("#chatStrip");
    if (!strip) return;

    if (!project.chats.length) {
      strip.innerHTML = "";
      return;
    }

    if (!project.currentChatId) {
      project.currentChatId = project.chats[0].id;
      saveState();
    }

    strip.innerHTML = project.chats.map((chat) => `
      <button
        type="button"
        class="chat-pill ${chat.id === project.currentChatId ? "active" : ""}"
        data-chat-id="${escapeHTML(chat.id)}"
      >
        ${escapeHTML(chat.title)}
      </button>
    `).join("");

    $$(".chat-pill").forEach((button) => {
      button.addEventListener("click", () => {
        project.currentChatId = button.dataset.chatId;
        saveState();
        renderCurrentProject();
      });
    });
  }

  function currentChat(project) {
    return project?.chats?.find(
      (chat) => chat.id === project.currentChatId
    ) || null;
  }

  function renderMessages(project) {
    const list = $("#messageList");
    if (!list) return;

    const chat = currentChat(project);

    if (!chat || !chat.messages.length) {
      list.innerHTML = `
        <div class="message">
          <div class="message-bubble">
            เริ่มคุยกับ Adareet ได้เลย ข้อมูลที่ผู้เขียนยืนยันหรือจัดเก็บ
            จะถูกแยกออกจากข้อความสนทนาในระบบด้านหลัง
          </div>
          <div class="message-meta">Adareet</div>
        </div>
      `;
      return;
    }

    list.innerHTML = chat.messages.map((message) => `
      <div class="message ${message.role === "user" ? "user" : ""}">
        <div class="message-bubble">${escapeHTML(message.content)}</div>
        <div class="message-meta">
          ${message.role === "user" ? "You" : "Adareet"}
        </div>
      </div>
    `).join("");

    list.scrollTop = list.scrollHeight;
  }

  function addMessage(content, role = "user") {
    const project = currentProject();
    if (!project) return;

    let chat = currentChat(project);

    if (!chat) {
      chat = createChat("ห้องเริ่มต้น");
      project.chats.push(chat);
      project.currentChatId = chat.id;
    }

    chat.messages.push({
      id: uid("msg"),
      role,
      content,
      createdAt: now()
    });

    saveState();
    renderCurrentProject();
  }

  function createChat(title = "Chat ใหม่") {
    return {
      id: uid("chat"),
      title,
      createdAt: now(),
      messages: []
    };
  }

  function createProject(name, description = "") {
    const project = {
      id: uid("project"),
      name: name.trim(),
      description: description.trim(),
      createdAt: now(),

      ai: {
        status: "not_granted",
        grantedAt: null
      },

      knowledge: [],

      chapters: [],

      history: [],

      chats: [
        createChat("ห้องเริ่มต้น")
      ],

      currentChatId: null
    };

    project.currentChatId = project.chats[0].id;

    project.history.push({
      id: uid("history"),
      type: "project_created",
      text: `สร้าง Project "${project.name}"`,
      createdAt: now()
    });

    state.projects.push(project);
    state.currentProjectId = project.id;

    saveState();
    render();
  }

  function openProjectDialog() {
    const dialog = $("#projectDialog");
    if (!dialog) return;

    $("#projectName").value = "";
    $("#projectDesc").value = "";

    dialog.showModal();
    setTimeout(() => $("#projectName")?.focus(), 50);
  }

  function createSampleProject() {
    const project = {
      id: uid("project"),
      name: "Initial D Butterfly Effect",
      description: "Sample project for testing Adareet's project structure.",

      createdAt: now(),

      ai: {
        status: "not_granted",
        grantedAt: null
      },

      knowledge: [
        {
          id: uid("knowledge"),
          text: "Takumi เริ่มเรื่องตอนอายุ 15",
          source: "Manuscript",
          status: "confirmed",
          createdAt: now()
        },
        {
          id: uid("knowledge"),
          text: "ในอนาคตร้านเต้าหู้จะมีพนักงานร้อยคน",
          source: "Unconfirmed Idea",
          status: "rejected",
          createdAt: now()
        }
      ],

      chapters: [
        {
          id: uid("chapter"),
          title: "Chapter 1",
          content: "",
          versions: [],
          createdAt: now()
        }
      ],

      history: [
        {
          id: uid("history"),
          type: "sample",
          text: "สร้าง Sample Project",
          createdAt: now()
        }
      ],

      chats: [
        createChat("ห้องเริ่มต้น")
      ],

      currentChatId: null
    };

    project.currentChatId = project.chats[0].id;

    state.projects.push(project);
    state.currentProjectId = project.id;

    saveState();
    render();
  }

  function newChat() {
    const project = currentProject();
    if (!project) return;

    const chat = createChat(
      `Chat ${project.chats.length + 1}`
    );

    project.chats.push(chat);
    project.currentChatId = chat.id;

    saveState();
    renderCurrentProject();
  }

  function renderBackstage() {
    const project = currentProject();

    renderOverview(project);
    renderKnowledge(project);
    renderChapters(project);
    renderHistory(project);
    renderSettings(project);
  }

  function renderOverview(project) {
    const panel = $("#tab-overview");
    if (!panel) return;

    if (!project) {
      panel.innerHTML = `
        <div class="panel">
          <h3>No Project</h3>
          <p class="muted">สร้าง Project ก่อน</p>
        </div>
      `;
      return;
    }

    panel.innerHTML = `
      <div class="panel">
        <h3>${escapeHTML(project.name)}</h3>
        <p>${escapeHTML(project.description || "ไม่มีคำอธิบาย")}</p>
      </div>

      <div class="panel">
        <div class="data-item">
          <div class="label">Knowledge</div>
          <strong>${project.knowledge.length}</strong>
        </div>

        <div class="data-item">
          <div class="label">Chapters</div>
          <strong>${project.chapters.length}</strong>
        </div>

        <div class="data-item">
          <div class="label">Chats</div>
          <strong>${project.chats.length}</strong>
        </div>

        <div class="data-item">
          <div class="label">AI access</div>
          <span class="status ${project.ai.status === "granted" ? "confirmed" : ""}">
            ${project.ai.status === "granted" ? "Granted" : "Not granted"}
          </span>
        </div>
      </div>
    `;
  }

  function renderKnowledge(project) {
    const panel = $("#tab-knowledge");
    if (!panel) return;

    if (!project) {
      panel.innerHTML = "";
      return;
    }

    panel.innerHTML = `
      <div class="panel">
        <div class="section-head">
          <h3>Knowledge</h3>
          <button id="addKnowledgeBtn" type="button" class="button primary">
            + เพิ่มข้อมูล
          </button>
        </div>

        <p class="hint">
          ข้อมูลมี source และ status แยกจากกัน
        </p>

        ${
          project.knowledge.length
            ? project.knowledge.map((item) => `
              <div class="data-item knowledge-item ${item.status === "rejected" ? "rejected" : ""}">
                <div>
                  <strong>${escapeHTML(item.text)}</strong>
                  <div class="label">${escapeHTML(item.source)}</div>
                </div>

                <div class="button-row">
                  <span class="status ${item.status}">
                    ${escapeHTML(item.status)}
                  </span>

                  ${
                    item.status !== "rejected"
                      ? `<button
                          type="button"
                          class="button soft strike-btn"
                          data-knowledge-id="${escapeHTML(item.id)}"
                        >ขีดค่า</button>`
                      : `<button
                          type="button"
                          class="button soft restore-btn"
                          data-knowledge-id="${escapeHTML(item.id)}"
                        >คืนค่า</button>`
                  }

                  <button
                    type="button"
                    class="button"
                    data-delete-knowledge="${escapeHTML(item.id)}"
                  >ลบ</button>
                </div>
              </div>
            `).join("")
            : `<p class="muted">ยังไม่มีข้อมูลที่จัดเก็บ</p>`
        }
      </div>
    `;

    $("#addKnowledgeBtn")?.addEventListener("click", addKnowledge);

    $$(".strike-btn").forEach((button) => {
      button.addEventListener("click", () => {
        changeKnowledgeStatus(button.dataset.knowledgeId, "rejected");
      });
    });

    $$(".restore-btn").forEach((button) => {
      button.addEventListener("click", () => {
        changeKnowledgeStatus(button.dataset.knowledgeId, "confirmed");
      });
    });

    $$("[data-delete-knowledge]").forEach((button) => {
      button.addEventListener("click", () => {
        deleteKnowledge(button.dataset.deleteKnowledge);
      });
    });
  }

  function addKnowledge() {
    const project = currentProject();
    if (!project) return;

    const text = prompt("ข้อมูลที่ต้องการเก็บ");
    if (!text?.trim()) return;

    const source = prompt(
      "แหล่งที่มา",
      "Unconfirmed Idea"
    ) || "Unconfirmed Idea";

    project.knowledge.unshift({
      id: uid("knowledge"),
      text: text.trim(),
      source,
      status: "unconfirmed",
      createdAt: now()
    });

    project.history.unshift({
      id: uid("history"),
      type: "knowledge_added",
      text: `เพิ่มข้อมูล: ${text.trim()}`,
      createdAt: now()
    });

    saveState();
    renderBackstage();
  }

  function changeKnowledgeStatus(id, status) {
    const project = currentProject();
    if (!project) return;

    const item = project.knowledge.find(
      (knowledge) => knowledge.id === id
    );

    if (!item) return;

    item.status = status;

    project.history.unshift({
      id: uid("history"),
      type: "knowledge_status",
      text: `${status === "rejected" ? "ขีดค่า" : "คืนค่า"}ข้อมูล: ${item.text}`,
      createdAt: now()
    });

    saveState();
    renderBackstage();
  }

  function deleteKnowledge(id) {
    const project = currentProject();
    if (!project) return;

    const item = project.knowledge.find(
      (knowledge) => knowledge.id === id
    );

    if (!item) return;

    if (!confirm(`ลบข้อมูลนี้จริงหรือไม่?\n\n${item.text}`)) {
      return;
    }

    project.knowledge = project.knowledge.filter(
      (knowledge) => knowledge.id !== id
    );

    project.history.unshift({
      id: uid("history"),
      type: "knowledge_deleted",
      text: `ลบข้อมูล: ${item.text}`,
      createdAt: now()
    });

    saveState();
    renderBackstage();
  }

  function renderChapters(project) {
    const panel = $("#tab-chapters");
    if (!panel) return;

    if (!project) {
      panel.innerHTML = "";
      return;
    }

    panel.innerHTML = `
      <div class="panel">
        <div class="section-head">
          <h3>Chapters</h3>
          <button id="addChapterBtn" type="button" class="button primary">
            + Chapter
          </button>
        </div>

        ${
          project.chapters.length
            ? project.chapters.map((chapter) => `
              <div class="data-item">
                <strong>${escapeHTML(chapter.title)}</strong>
                <div class="label">
                  ${chapter.versions?.length || 0} version
                </div>

                <div class="button-row">
                  <button
                    type="button"
                    class="button soft chapter-edit-btn"
                    data-chapter-id="${escapeHTML(chapter.id)}"
                  >แก้ไข</button>

                  <button
                    type="button"
                    class="button chapter-delete-btn"
                    data-chapter-id="${escapeHTML(chapter.id)}"
                  >ลบ</button>
                </div>
              </div>
            `).join("")
            : `<p class="muted">ยังไม่มี Chapter</p>`
        }
      </div>
    `;

    $("#addChapterBtn")?.addEventListener("click", addChapter);

    $$(".chapter-edit-btn").forEach((button) => {
      button.addEventListener("click", () => {
        editChapter(button.dataset.chapterId);
      });
    });

    $$(".chapter-delete-btn").forEach((button) => {
      button.addEventListener("click", () => {
        deleteChapter(button.dataset.chapterId);
      });
    });
  }

  function addChapter() {
    const project = currentProject();
    if (!project) return;

    const title = prompt(
      "ชื่อ Chapter",
      `Chapter ${project.chapters.length + 1}`
    );

    if (!title?.trim()) return;

    const content = prompt(
      "เนื้อหา Chapter เริ่มต้น",
      ""
    ) ?? "";

    const chapter = {
      id: uid("chapter"),
      title: title.trim(),
      content,
      versions: [],
      createdAt: now()
    };

    project.chapters.push(chapter);

    project.history.unshift({
      id: uid("history"),
      type: "chapter_created",
      text: `สร้าง ${chapter.title}`,
      createdAt: now()
    });

    saveState();
    renderBackstage();
  }

  function editChapter(id) {
    const project = currentProject();
    if (!project) return;

    const chapter = project.chapters.find(
      (item) => item.id === id
    );

    if (!chapter) return;

    const nextContent = prompt(
      `${chapter.title}\n\nแก้ไขเนื้อหา`,
      chapter.content
    );

    if (nextContent === null) return;

    chapter.versions.push({
      id: uid("version"),
      content: chapter.content,
      createdAt: now()
    });

    chapter.content = nextContent;

    project.history.unshift({
      id: uid("history"),
      type: "chapter_updated",
      text: `แก้ไข ${chapter.title}`,
      createdAt: now()
    });

    saveState();
    renderBackstage();
  }

  function deleteChapter(id) {
    const project = currentProject();
    if (!project) return;

    const chapter = project.chapters.find(
      (item) => item.id === id
    );

    if (!chapter) return;

    if (!confirm(`ลบ ${chapter.title} จริงหรือไม่?`)) {
      return;
    }

    project.chapters = project.chapters.filter(
      (item) => item.id !== id
    );

    project.history.unshift({
      id: uid("history"),
      type: "chapter_deleted",
      text: `ลบ ${chapter.title}`,
      createdAt: now()
    });

    saveState();
    renderBackstage();
  }

  function renderHistory(project) {
    const panel = $("#tab-history");
    if (!panel) return;

    if (!project) {
      panel.innerHTML = "";
      return;
    }

    panel.innerHTML = `
      <div class="panel">
        <h3>History</h3>

        ${
          project.history.length
            ? project.history.map((item) => `
              <div class="data-item">
                <strong>${escapeHTML(item.text)}</strong>
                <div class="label">
                  ${new Date(item.createdAt).toLocaleString("th-TH")}
                </div>
              </div>
            `).join("")
            : `<p class="muted">ยังไม่มีประวัติ</p>`
        }
      </div>
    `;
  }

  function renderSettings(project) {
    const panel = $("#tab-settings");
    if (!panel) return;

    panel.innerHTML = `
      <div class="panel">
        <h3>Appearance</h3>

        <label class="field">
          <span>Theme</span>
          <select id="themeSelect">
            <option value="white">White</option>
            <option value="dark">Dark</option>
            <option value="yellow">Warm Yellow</option>
          </select>
        </label>

        <label class="field">
          <span>Font</span>
          <select id="fontSelect">
            <option value="system">System</option>
            <option value="serif">Serif</option>
            <option value="mono">Monospace</option>
            <option value="rounded">Rounded</option>
            <option value="anuphan">Thai / Noto Sans</option>
          </select>
        </label>
      </div>

      <div class="panel">
        <h3>AI Access</h3>

        ${
          project
            ? `
              <p>
                สถานะ:
                <span class="status ${project.ai.status === "granted" ? "confirmed" : ""}">
                  ${project.ai.status === "granted" ? "Granted" : "Not granted"}
                </span>
              </p>

              <button
                id="aiAccessSettingsBtn"
                type="button"
                class="button primary"
              >
                ${
                  project.ai.status === "granted"
                    ? "Revoke AI access"
                    : "Grant AI access"
                }
              </button>
            `
            : `<p class="muted">สร้าง Project ก่อน</p>`
        }
      </div>

      <div class="panel">
        <h3>Data</h3>
        <p class="hint">
          ข้อมูลทั้งหมดของ foundation ตอนนี้เก็บใน browser localStorage
          เพื่อทดสอบระบบก่อนต่อ backend จริง
        </p>

        <button id="clearLocalDataBtn" type="button" class="button">
          Clear local data
        </button>
      </div>
    `;

    const themeSelect = $("#themeSelect");
    const fontSelect = $("#fontSelect");

    if (themeSelect) {
      themeSelect.value = state.settings.theme;
      themeSelect.addEventListener("change", () => {
        state.settings.theme = themeSelect.value;
        saveState();
        applyTheme();
      });
    }

    if (fontSelect) {
      fontSelect.value = state.settings.font;
      fontSelect.addEventListener("change", () => {
        state.settings.font = fontSelect.value;
        saveState();
        applyTheme();
      });
    }

    $("#aiAccessSettingsBtn")?.addEventListener(
      "click",
      toggleAiAccess
    );

    $("#clearLocalDataBtn")?.addEventListener(
      "click",
      clearLocalData
    );
  }

  function toggleAiAccess() {
    const project = currentProject();
    if (!project) return;

    if (project.ai.status === "granted") {
      if (!confirm("ถอนสิทธิ์ AI จาก Project นี้หรือไม่?")) {
        return;
      }

      project.ai.status = "not_granted";
      project.ai.grantedAt = null;

      project.history.unshift({
        id: uid("history"),
        type: "ai_access_revoked",
        text: "ถอนสิทธิ์ AI",
        createdAt: now()
      });

      saveState();
      renderBackstage();
      return;
    }

    const dialog = $("#aiConsentDialog");
    dialog?.showModal();
  }

  function grantAiAccess() {
    const project = currentProject();
    if (!project) return;

    project.ai.status = "granted";
    project.ai.grantedAt = now();

    project.history.unshift({
      id: uid("history"),
      type: "ai_access_granted",
      text: "อนุญาต AI ให้เข้าถึง Project",
      createdAt: now()
    });

    saveState();
    $("#aiConsentDialog")?.close();
    renderBackstage();
  }

  function denyAiAccess() {
    $("#aiConsentDialog")?.close();
  }

  function sendMessage() {
    const input = $("#composerInput");
    if (!input) return;

    const content = input.value.trim();
    if (!content) return;

    const project = currentProject();

    if (!project) {
      alert("สร้างหรือเลือก Project ก่อน");
      return;
    }

    addMessage(content, "user");
    input.value = "";

    /*
      AI ยังไม่ได้ต่อ backend จริงใน foundation นี้
      จึงตอบกลับด้วยข้อความจำลอง เพื่อทดสอบ flow ของ Chat
    */

    setTimeout(() => {
      addMessage(
        "ได้รับข้อความแล้ว ตอนนี้ฉันยังเป็น Foundation mode และยังไม่ได้เชื่อม AI จริง ข้อมูล Project จะยังไม่ถูกส่งออกไปภายนอกโดยอัตโนมัติ",
        "assistant"
      );
    }, 150);
  }

  function quickAction(type) {
    const input = $("#composerInput");
    if (!input) return;

    const templates = {
      idea: "ไอเดีย: ",
      confirm: "ยืนยัน: ",
      chapter: "Chapter: ",
      canon: "Canon?: "
    };

    input.value += templates[type] || "";
    input.focus();
  }

  function openAiConsentIfNeeded() {
    const project = currentProject();
    if (!project) return;

    if (project.ai.status !== "granted") {
      $("#aiConsentDialog")?.showModal();
    }
  }

  function switchTab(tabName) {
    $$(".tab-button").forEach((button) => {
      button.classList.toggle(
        "is-active",
        button.dataset.tab === tabName
      );
    });

    $$(".tab-panel").forEach((panel) => {
      panel.classList.toggle(
        "is-hidden",
        panel.id !== `tab-${tabName}`
      );
    });
  }

  function exportJSON() {
    const payload = {
      schema: "adareet-v2",
      exportedAt: now(),
      state
    };

    const blob = new Blob(
      [JSON.stringify(payload, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `adareet-backup-${Date.now()}.json`;
    link.click();

    URL.revokeObjectURL(url);
  }

  function openImportDialog() {
    $("#importFile").value = "";
    $("#importDialog")?.showModal();
  }

  async function importJSON() {
    const file = $("#importFile")?.files?.[0];

    if (!file) {
      alert("เลือกไฟล์ JSON ก่อน");
      return;
    }

    try {
      const text = await file.text();
      const imported = JSON.parse(text);

      if (!imported.state || !Array.isArray(imported.state.projects)) {
        throw new Error("Invalid Adareet JSON");
      }

      if (
        !confirm(
          "นำเข้าข้อมูลนี้หรือไม่? ข้อมูลปัจจุบันใน browser จะถูกแทนที่"
        )
      ) {
        return;
      }

      state = {
        ...structuredClone(defaultState),
        ...imported.state,
        settings: {
          ...defaultState.settings,
          ...(imported.state.settings || {})
        }
      };

      saveState();
      $("#importDialog")?.close();
      render();

    } catch (error) {
      console.error(error);
      alert("ไฟล์ JSON ไม่ถูกต้องหรือไม่ใช่ไฟล์ของ Adareet");
    }
  }

  function clearLocalData() {
    if (!confirm("ลบข้อมูล Adareet ใน browser นี้ทั้งหมดหรือไม่?")) {
      return;
    }

    localStorage.removeItem(STORAGE_KEY);
    state = structuredClone(defaultState);

    render();

    alert("ล้างข้อมูลแล้ว");
  }

  function loginAsUser(name, email = "") {
    state.user = {
      id: uid("user"),
      name: name.trim() || "Writer",
      email: email.trim(),
      provider: "local"
    };

    saveState();

    $("#loginScreen")?.classList.add("is-hidden");
    $("#appShell")?.classList.remove("is-hidden");

    render();
  }

  function setupLogin() {
    const form = $("#loginForm");

    form?.addEventListener("submit", (event) => {
      event.preventDefault();

      loginAsUser(
        $("#loginName").value,
        $("#loginEmail").value
      );
    });

    $("#googleLoginBtn")?.addEventListener("click", () => {
      /*
        Placeholder:
        Google OAuth จริงจะถูกต่อ backend/plugin ในภายหลัง
      */
      loginAsUser(
        $("#loginName").value || "Google User",
        $("#loginEmail").value
      );
    });

    $("#guestLoginBtn")?.addEventListener("click", () => {
      loginAsUser("Guest Writer", "");
    });
  }

  function setupProjectActions() {
    $("#newProjectRailBtn")?.addEventListener(
      "click",
      openProjectDialog
    );

    $("#createFirstProjectBtn")?.addEventListener(
      "click",
      openProjectDialog
    );

    $("#seedProjectBtn")?.addEventListener(
      "click",
      createSampleProject
    );

    $("#projectForm")?.addEventListener("submit", (event) => {
      event.preventDefault();

      const name = $("#projectName").value.trim();
      const description = $("#projectDesc").value.trim();

      if (!name) return;

      createProject(name, description);
      $("#projectDialog")?.close();
    });

    $("#newChatBtn")?.addEventListener(
      "click",
      newChat
    );
  }

  function setupChat() {
    $("#sendBtn")?.addEventListener(
      "click",
      sendMessage
    );

    $("#composerInput")?.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key === "Enter" &&
          (event.ctrlKey || event.metaKey)
        ) {
          event.preventDefault();
          sendMessage();
        }
      }
    );

    $$(".quick-action").forEach((button) => {
      button.addEventListener("click", () => {
        quickAction(button.dataset.quick);
      });
    });
  }

  function setupBackstage() {
    $$(".tab-button").forEach((button) => {
      button.addEventListener("click", () => {
        switchTab(button.dataset.tab);
      });
    });

    $("#toggleBackstageBtn")?.addEventListener(
      "click",
      () => {
        $("#backstage")?.classList.toggle("open");
      }
    );

    $("#closeBackstageMobileBtn")?.addEventListener(
      "click",
      () => {
        $("#backstage")?.classList.remove("open");
      }
    );

    $("#allowAiBtn")?.addEventListener(
      "click",
      grantAiAccess
    );

    $("#denyAiBtn")?.addEventListener(
      "click",
      denyAiAccess
    );
  }

  function setupImportExport() {
    $("#exportBtn")?.addEventListener(
      "click",
      exportJSON
    );

    $("#importBtn")?.addEventListener(
      "click",
      openImportDialog
    );

    $("#doImportBtn")?.addEventListener(
      "click",
      importJSON
    );
  }

  function setupAccount() {
    $("#signOutBtn")?.addEventListener(
      "click",
      () => {
        state.user = null;
        saveState();

        $("#appShell")?.classList.add("is-hidden");
        $("#loginScreen")?.classList.remove("is-hidden");
      }
    );
  }

  function boot() {
    setupLogin();
    setupProjectActions();
    setupChat();
    setupBackstage();
    setupImportExport();
    setupAccount();

    if (state.user) {
      $("#loginScreen")?.classList.add("is-hidden");
      $("#appShell")?.classList.remove("is-hidden");
    }

    render();
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
