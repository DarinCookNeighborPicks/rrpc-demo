(function () {
  const D = window.RRPC_DATA;
  const VIEWS = ["home", "new-here", "play", "events", "news", "membership", "club-info"];

  // -------- Routing & Mobile Menu --------
  const menuToggle = document.getElementById("menuToggle");
  const mobileDrawer = document.getElementById("mobileDrawer");

  function closeDrawer() {
    mobileDrawer.hidden = true;
    menuToggle.setAttribute("aria-expanded", "false");
  }

  menuToggle.addEventListener("click", () => {
    const isOpen = !mobileDrawer.hidden;
    mobileDrawer.hidden = isOpen;
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
  });

  mobileDrawer.addEventListener("click", (e) => {
    if (e.target === mobileDrawer) closeDrawer();
  });

  function showView(viewId, updateHash = true) {
    if (!VIEWS.includes(viewId)) viewId = "home";
    VIEWS.forEach((id) => {
      const el = document.getElementById("view-" + id);
      if (el) el.hidden = id !== viewId;
    });
    document.querySelectorAll("[data-nav]").forEach((link) => {
      const target = link.getAttribute("data-nav");
      link.classList.toggle("active", target === viewId);
    });
    closeDrawer();
    if (updateHash && location.hash !== "#" + viewId) {
      history.pushState(null, "", "#" + viewId);
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  document.addEventListener("click", (e) => {
    const navLink = e.target.closest("[data-nav]");
    if (!navLink) return;
    e.preventDefault();
    showView(navLink.getAttribute("data-nav"));
  });

  window.addEventListener("hashchange", () => {
    const id = (location.hash || "#home").replace("#", "");
    showView(id, false);
  });

  // -------- Home Highlights --------
  const highlightsEl = document.getElementById("homeHighlights");
  highlightsEl.innerHTML = D.highlights
    .map(
      (h) => `
      <article class="highlight-item">
        <div class="highlight-meta">${h.badge}</div>
        <h3>${h.title}</h3>
        <p>${h.text}</p>
      </article>`
    )
    .join("");

  // -------- Play: Weekly Schedule Explorer --------
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayName = days[new Date().getDay()];
  let activeDay = todayName;
  let activeLevel = "all";

  const levelOptions = [
    { key: "all", label: "All Levels" },
    { key: "2.5", label: "2.5" },
    { key: "3.0", label: "3.0" },
    { key: "3.5", label: "3.5" },
    { key: "4.0", label: "4.0" },
    { key: "4.5+", label: "4.5+" },
    { key: "5.0", label: "5.0" },
    { key: "special", label: "Lessons / DUPR / Social" },
    { key: "open", label: "Open / HOA" }
  ];

  const dayTabsEl = document.getElementById("dayTabs");
  const levelFiltersEl = document.getElementById("levelFilters");
  const scheduleSlotsEl = document.getElementById("scheduleSlots");

  function renderDayTabs() {
    dayTabsEl.innerHTML = days
      .map((d) => {
        const short = d.slice(0, 3);
        const label = d === todayName ? `${short} · Today` : short;
        const active = d === activeDay ? "active" : "";
        return `<button type="button" role="tab" aria-selected="${d === activeDay}" class="day-tab ${active}" data-day="${d}">${label}</button>`;
      })
      .join("");
  }

  function renderLevelFilters() {
    levelFiltersEl.innerHTML = levelOptions
      .map(
        (opt) =>
          `<button type="button" class="filter-chip ${opt.key === activeLevel ? "active" : ""}" data-level="${opt.key}">${opt.label}</button>`
      )
      .join("");
  }

  function renderSchedule() {
    const blocks = D.schedule[activeDay] || [];
    const html = blocks
      .map((b) => {
        const filtered = b.items.filter(
          (item) => activeLevel === "all" || item.tags.includes(activeLevel)
        );
        if (!filtered.length) return "";
        return `
          <div class="slot-block">
            <div class="slot-time">
              <span>${b.time}</span>
              <span>${activeDay}</span>
            </div>
            <div class="slot-items">
              ${filtered
                .map((it) => {
                  const cls =
                    it.kind === "hoa" ? "is-hoa" : it.kind === "special" ? "is-special" : "";
                  return `
                    <div class="slot-row ${cls}">
                      <span class="slot-title">${it.label}</span>
                      <span class="slot-courts">${it.courts}</span>
                    </div>`;
                })
                .join("")}
            </div>
          </div>`;
      })
      .join("");

    scheduleSlotsEl.innerHTML =
      html ||
      `<p class="muted-note">No sessions match that filter on ${activeDay}. Try tapping <strong>All Levels</strong> or check <strong>Open / HOA</strong>.</p>`;
  }

  dayTabsEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-day]");
    if (!btn) return;
    activeDay = btn.getAttribute("data-day");
    renderDayTabs();
    renderSchedule();
  });

  levelFiltersEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-level]");
    if (!btn) return;
    activeLevel = btn.getAttribute("data-level");
    renderLevelFilters();
    renderSchedule();
  });

  renderDayTabs();
  renderLevelFilters();
  renderSchedule();

  // -------- Court Map Interactive Legend --------
  const zoneDetailEl = document.getElementById("zoneDetail");
  document.querySelectorAll(".court-zone").forEach((g) => {
    g.addEventListener("click", () => {
      const z = g.getAttribute("data-zone");
      if (z === "hoa") {
        zoneDetailEl.innerHTML =
          "<strong>HOA Walk-Up Courts (1, 2, 15, 16):</strong> No reservations or advance sign-ups. Place your paddle in the rack, play 1 game to 11, and all 4 rotate off. Beginner Lessons run Mon/Wed 8–10 AM on HOA Courts 1 &amp; 2.";
      } else {
        zoneDetailEl.innerHTML =
          "<strong>Club &amp; Reservable Courts (3–14):</strong> Used for scheduled rated play and CourtReserve reservations (1–2 hours, up to 3 days ahead starting 6:30 AM). Courts 1–8 have tournament lighting for play until 10:00 PM.";
      }
    });
  });

  // -------- Gizmo Walkthrough --------
  const gizmoSteps = [
    "<strong>Example (21 players, 4 courts):</strong> Players 1–16 start on Courts 5–8. Players 17–21 wait on the <em>Reserve</em> list. Draw a vertical line on the back of the sheet labeled <strong>High</strong> and <strong>Low</strong>.",
    "<strong>When a court finishes:</strong> Winners write their names on the <strong>High</strong> side; the other pair writes their names on the <strong>Low</strong> side. The first 4 Reserves immediately take the open court.",
    "<strong>Keep alternating:</strong> Once Reserves are in, fill each open court by taking 4 from <strong>High</strong>, then 4 from <strong>Low</strong>, erasing names as they go on court. Want to sit out? Cross your name off and re-add when ready!"
  ];
  const gizmoPanel = document.getElementById("gizmoPanel");
  function showGizmoStep(idx) {
    gizmoPanel.innerHTML = gizmoSteps[idx];
    document.querySelectorAll(".gizmo-btn").forEach((b) => {
      b.classList.toggle("active", Number(b.getAttribute("data-gstep")) === idx);
    });
  }
  document.getElementById("gizmoDemo").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-gstep]");
    if (!btn) return;
    showGizmoStep(Number(btn.getAttribute("data-gstep")));
  });
  showGizmoStep(0);

  // -------- Events & .ics Calendar Download --------
  const eventCats = ["All", "Clinics & Training", "Club Play", "Tournaments", "Social", "Board & Meetings"];
  let activeEventCat = "All";
  const eventFiltersEl = document.getElementById("eventFilters");
  const eventsListEl = document.getElementById("eventsList");

  function renderEventFilters() {
    eventFiltersEl.innerHTML = eventCats
      .map(
        (c) =>
          `<button type="button" class="filter-chip ${c === activeEventCat ? "active" : ""}" data-ecat="${c}">${c}</button>`
      )
      .join("");
  }

  function renderEvents() {
    const items = D.events.filter(
      (ev) => activeEventCat === "All" || ev.category === activeEventCat
    );
    eventsListEl.innerHTML = items
      .map(
        (ev) => `
        <article class="event-card">
          <div class="event-top">
            <div class="event-date-box">
              <div class="event-month">${ev.month}</div>
              <div class="event-day">${ev.day}</div>
            </div>
            <div>
              <div class="event-badges">
                <span class="pill ${ev.isSample ? "pill-sample" : "pill-pine"}">${ev.isSample ? "Sample Event" : ev.sourceNote}</span>
                <span class="pill pill-blue">${ev.category}</span>
              </div>
              <h3>${ev.title}</h3>
              <div class="event-meta">${ev.time} · ${ev.location}</div>
            </div>
          </div>
          <p class="event-desc">${ev.description}</p>
          <div>
            <button type="button" class="btn btn-outline btn-sm" onclick="downloadEventICS('${ev.id}')">
              📅 Add to iPhone / Calendar (.ics)
            </button>
          </div>
        </article>`
      )
      .join("");
  }

  eventFiltersEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-ecat]");
    if (!btn) return;
    activeEventCat = btn.getAttribute("data-ecat");
    renderEventFilters();
    renderEvents();
  });

  window.downloadEventICS = function (eventId) {
    const ev = D.events.find((x) => x.id === eventId);
    if (!ev) return;
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Robson Ranch Pickleball Club Demo//EN",
      "CALSCALE:GREGORIAN",
      "BEGIN:VTIMEZONE",
      "TZID:America/Phoenix",
      "BEGIN:STANDARD",
      "DTSTART:19700101T000000",
      "TZOFFSETFROM:-0700",
      "TZOFFSETTO:-0700",
      "TZNAME:MST",
      "END:STANDARD",
      "END:VTIMEZONE",
      "BEGIN:VEVENT",
      `UID:${ev.id}@rrpc-demo.local`,
      `DTSTAMP:20261124T210000Z`,
      `DTSTART;TZID=America/Phoenix:${ev.ics.start}`,
      `DTEND;TZID=America/Phoenix:${ev.ics.end}`,
      ...(ev.ics.rrule ? [`RRULE:${ev.ics.rrule}`] : []),
      `SUMMARY:${ev.title}`,
      `LOCATION:${ev.location}, 5624 N. Robson Blvd, Eloy, AZ 85131`,
      `DESCRIPTION:${ev.description.replace(/\n/g, " ")}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ];
    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${ev.id}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  renderEventFilters();
  renderEvents();

  // -------- News --------
  document.getElementById("newsList").innerHTML = D.news
    .map(
      (n) => `
      <article class="news-card">
        <img src="${n.image}" alt="${n.imageAlt}" class="news-img" loading="lazy" />
        <div class="news-body">
          <div class="event-badges">
            <span class="pill ${n.isSample ? "pill-sample" : "pill-pine"}">${n.badge}</span>
            <span class="policy-date">${n.date}</span>
          </div>
          <h3>${n.title}</h3>
          <p>${n.summary}</p>
          <span class="photo-credit">${n.credit}</span>
        </div>
      </article>`
    )
    .join("");

  // -------- Membership Form Mockup --------
  const mMonth = document.getElementById("mMonth");
  const duesDisplay = document.getElementById("duesDisplay");
  const mRatingSource = document.getElementById("mRatingSource");
  const ratingLevelRow = document.getElementById("ratingLevelRow");
  const membershipForm = document.getElementById("membershipForm");
  const demoModal = document.getElementById("demoModal");
  const modalBody = document.getElementById("modalBody");
  let memberType = "New Member";

  document.querySelectorAll(".seg-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".seg-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      memberType = btn.textContent.trim();
    });
  });

  mMonth.addEventListener("change", () => {
    duesDisplay.textContent = `$${Number(mMonth.value).toFixed(2)}`;
  });

  mRatingSource.addEventListener("change", () => {
    ratingLevelRow.hidden = mRatingSource.value === "beginner";
  });

  membershipForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("mName").value.trim() || "Member";
    const res = document.getElementById("mResidency").value;
    const dues = duesDisplay.textContent;
    const ratingText =
      mRatingSource.value === "beginner"
        ? "2.0 Novice (Free Beginner Class scheduled)"
        : `${document.getElementById("mRatingVal").value} (${mRatingSource.options[mRatingSource.selectedIndex].text})`;

    modalBody.innerHTML = `
      <p><strong>This is a concept demo only—nothing was submitted or charged.</strong></p>
      <ul class="detail-list mt-sm">
        <li><strong>Type:</strong> ${memberType}</li>
        <li><strong>Name:</strong> ${name}</li>
        <li><strong>Residency:</strong> ${res}</li>
        <li><strong>Rating Path:</strong> ${ratingText}</li>
        <li><strong>Prorated Dues Preview:</strong> ${dues} (Online payment coming soon)</li>
      </ul>
      <p class="muted-note mt-sm">In a live launch, this could route directly to CourtReserve payment or notify the Treasurer at <strong>rrpbctreasure@gmail.com</strong>.</p>
    `;
    demoModal.hidden = false;
  });

  function closeModal() {
    demoModal.hidden = true;
  }
  document.getElementById("modalClose").addEventListener("click", closeModal);
  document.getElementById("modalDone").addEventListener("click", closeModal);
  demoModal.addEventListener("click", (e) => {
    if (e.target === demoModal) closeModal();
  });

  // -------- Club Info: Board & Searchable Policies --------
  document.getElementById("boardGrid").innerHTML = D.board
    .map(
      (b) => `
      <div class="board-card">
        <div class="board-avatar" aria-hidden="true">${b.initials}</div>
        <div>
          <div class="board-role">${b.role}</div>
          <div class="board-name">${b.name}</div>
        </div>
      </div>`
    )
    .join("");

  const policySearch = document.getElementById("policySearch");
  const clearSearch = document.getElementById("clearSearch");
  const policyListEl = document.getElementById("policyList");

  function renderPolicies(query = "") {
    const q = query.trim().toLowerCase();
    clearSearch.hidden = q.length === 0;
    const matches = D.policies.filter((p) => {
      if (!q) return true;
      const hay = `${p.title} ${p.date} ${p.keywords} ${p.summary} ${p.bullets.join(" ")}`.toLowerCase();
      return hay.includes(q);
    });

    if (!matches.length) {
      policyListEl.innerHTML = `<p class="muted-note">No rules matched “${query}”. Try keywords like <em>guest</em>, <em>paddle</em>, <em>dues</em>, <em>48</em>, or <em>bylaws</em>.</p>`;
      return;
    }

    policyListEl.innerHTML = matches
      .map(
        (p, idx) => `
        <details class="policy-item" ${q || idx === 0 ? "open" : ""}>
          <summary>
            <div>
              <div class="policy-title">${p.title}</div>
              <div class="policy-date">${p.date}</div>
            </div>
            <span aria-hidden="true" style="font-weight:800;color:var(--pine);">▾</span>
          </summary>
          <div class="policy-body">
            <p>${p.summary}</p>
            <ul class="detail-list mt-xs">
              ${p.bullets.map((b) => `<li>${b}</li>`).join("")}
            </ul>
            <div class="mt-sm">
              <a href="${p.pdf}" target="_blank" rel="noopener noreferrer" class="text-link">Open Official PDF ↗</a>
            </div>
          </div>
        </details>`
      )
      .join("");
  }

  policySearch.addEventListener("input", (e) => renderPolicies(e.target.value));
  clearSearch.addEventListener("click", () => {
    policySearch.value = "";
    renderPolicies("");
    policySearch.focus();
  });

  renderPolicies("");

  // Initialize from hash if present
  const initial = (location.hash || "#home").replace("#", "");
  if (VIEWS.includes(initial) && initial !== "home") {
    showView(initial, false);
  }
})();
