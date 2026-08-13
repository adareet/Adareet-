/* =========================================================
   ADAREET v2.6
   APPLICATION BOOTSTRAP
   ========================================================= */

const app = document.querySelector("#app");

function renderApp() {
  app.innerHTML = `
    <div class="app-shell">
      <aside class="app-sidebar">
        <div class="empty-state">
          <div class="empty-state__inner">
            <strong>Adareet</strong>
          </div>
        </div>
      </aside>

      <main class="app-main">
        <div class="app-content">
          <section class="empty-state">
            <div class="empty-state__inner">
              <h1>Adareet v2.6</h1>
              <p>
                Application shell is ready.
                Feature modules will be connected here.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  `;
}

function initialize() {
  renderApp();
}

initialize();
