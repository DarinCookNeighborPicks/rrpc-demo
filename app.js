(function () {
  const D = window.RRPC_DATA;
  const VIEWS = ["home", "play", "events", "testing", "directory", "policies", "membership", "help", "news"];

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

  function showView(viewId, updateHash = true, scrollTarget = null) {
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
    if (updateHash) {
      const nextHash = scrollTarget ? "#" + scrollTarget : "#" + viewId;
      if (location.hash !== nextHash) history.pushState(null, "", nextHash);
    }
    if (scrollTarget) {
      const targetEl = document.getElementById(scrollTarget);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  document.addEventListener("click", (e) => {
    const navLink = e.target.closest("[data-nav]");
    if (!navLink) return;
    e.preventDefault();
    showView(navLink.getAttribute("data-nav"), true, navLink.getAttribute("data-scroll"));
  });

  const HASH_ALIASES = {
    "apply-form": ["membership", "renew-form"],
    "renew-form": ["membership", "renew-form"],
    "testing-request": ["testing", "testing-request"],
    "request-forms": ["help", "request-forms"],
    "real-vs-sample": ["help", "real-vs-sample"],
    "contact-directory": ["help", "contact-directory"],
    "faq-ratings": ["help", "faq-ratings"],
    "faq-ball-machine": ["help", "faq-ball-machine"],
    "today-play": ["home", "today-play"],
    "this-week": ["home", "this-week"]
  };

  function routeFromHash(updateHash) {
    const raw = (location.hash || "#home").replace("#", "");
    if (HASH_ALIASES[raw]) {
      showView(HASH_ALIASES[raw][0], updateHash, HASH_ALIASES[raw][1]);
    } else if (raw.startsWith("faq-")) {
      showView("help", updateHash, raw);
    } else {
      showView(raw, updateHash);
    }
  }

  window.addEventListener("hashchange", () => routeFromHash(false));

  // -------- Home: today's play, week glance, announcements --------
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayName = days[new Date().getDay()];
  const dateLine = document.getElementById("homeDateLine");
  if (dateLine) {
    const nice = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      timeZone: "America/Phoenix"
    });
    dateLine.textContent = nice + " · Today’s play, court tools, and announcements — in one place for members.";
  }

  function sessionCardsHtml(dayName, blocks, emptyMsg) {
    const cards = [];
    (blocks || []).forEach((b) => {
      cards.push(`
        <article class="schedule-card">
          <div class="schedule-time">${dayName} · ${b.time}</div>
          ${b.items
            .map(
              (it) => `
              <div style="margin-top:8px; padding-top:8px; border-top:1px solid rgba(25,80,81,0.1);">
                <h3>${it.label}</h3>
                <span class="schedule-courts">${it.courts}</span>
              </div>`
            )
            .join("")}
        </article>`);
    });
    return cards.join("") || `<div class="schedule-card"><p>${emptyMsg}</p></div>`;
  }

  const todayPlay = document.getElementById("todayPlay");
  if (todayPlay) {
    const heading = document.getElementById("todayHeading");
    if (heading) heading.textContent = "Today’s Club Play — " + todayName;
    todayPlay.innerHTML = sessionCardsHtml(
      todayName,
      D.schedule[todayName],
      "No scheduled club play was found for today in the Nov 15–28 schedule."
    );
  }

  let glanceDay = todayName;
  const weekDayTabs = document.getElementById("weekDayTabs");
  const weekGlance = document.getElementById("weekGlance");

  function renderWeekTabs() {
    weekDayTabs.innerHTML = days
      .map((d) => {
        const short = d.slice(0, 3);
        const label = d === todayName ? `${short} · Today` : short;
        return `<button type="button" class="chip-btn ${d === glanceDay ? "active" : ""}" data-week-day="${d}">${label}</button>`;
      })
      .join("");
  }

  function renderWeekGlance() {
    weekGlance.innerHTML = sessionCardsHtml(
      glanceDay,
      D.schedule[glanceDay],
      `No sessions listed for ${glanceDay}.`
    );
  }

  if (weekDayTabs && weekGlance) {
    weekDayTabs.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-week-day]");
      if (!btn) return;
      glanceDay = btn.getAttribute("data-week-day");
      renderWeekTabs();
      renderWeekGlance();
    });
    renderWeekTabs();
    renderWeekGlance();
  }

  const highlightsEl = document.getElementById("homeHighlights");
  if (highlightsEl && D.highlights) {
    highlightsEl.innerHTML = D.highlights.slice(0, 3)
      .map(
        (h) => `
        <article class="info-card">
          <span class="verified-badge">${h.badge}</span>
          <h3>${h.title}</h3>
          <p>${h.text}</p>
        </article>`
      )
      .join("");
  }

  // -------- Play: Weekly Schedule Filters --------
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
  const levelChipsEl = document.getElementById("levelChips");
  const scheduleListEl = document.getElementById("scheduleList");

  function renderDayTabs() {
    dayTabsEl.innerHTML = days
      .map((d) => {
        const short = d.slice(0, 3);
        const label = d === todayName ? `${short} · Today` : short;
        return `<button type="button" role="tab" aria-selected="${d === activeDay}" class="chip-btn ${d === activeDay ? "active" : ""}" data-day="${d}">${label}</button>`;
      })
      .join("");
  }

  function renderLevelChips() {
    levelChipsEl.innerHTML = levelOptions
      .map(
        (opt) => `<button type="button" class="chip-btn ${opt.key === activeLevel ? "active" : ""}" data-level="${opt.key}">${opt.label}</button>`
      )
      .join("");
  }

  function renderSchedule() {
    const blocks = D.schedule[activeDay] || [];
    const cards = [];
    blocks.forEach((b) => {
      const filtered = b.items.filter((item) => activeLevel === "all" || item.tags.includes(activeLevel));
      if (!filtered.length) return;
      cards.push(`
        <article class="schedule-card">
          <div class="schedule-time">${activeDay} · ${b.time}</div>
          ${filtered
            .map(
              (it) => `
              <div style="margin-top:8px; padding-top:8px; border-top:1px solid rgba(25,80,81,0.1);">
                <h3>${it.label}</h3>
                <span class="schedule-courts">${it.courts}</span>
              </div>`
            )
            .join("")}
        </article>`);
    });
    scheduleListEl.innerHTML =
      cards.join("") ||
      `<div class="schedule-card"><p>No sessions match that filter on ${activeDay}. Try tapping <strong>All Levels</strong> or <strong>Open / HOA</strong>.</p></div>`;
  }

  dayTabsEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-day]");
    if (!btn) return;
    activeDay = btn.getAttribute("data-day");
    renderDayTabs();
    renderSchedule();
  });

  levelChipsEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-level]");
    if (!btn) return;
    activeLevel = btn.getAttribute("data-level");
    renderLevelChips();
    renderSchedule();
  });

  renderDayTabs();
  renderLevelChips();
  renderSchedule();

  // -------- Play: Interactive 16-Court Map --------
  const courtNodesEl = document.getElementById("courtNodes");
  const courtDetailEl = document.getElementById("courtDetail");
  if (courtNodesEl && D.courts) {
    courtNodesEl.innerHTML = D.courts
      .map((c, idx) => {
        const row = idx < 8 ? 0 : 1;
        const col = idx % 8;
        const x = 16 + col * 81;
        const y = row === 0 ? 34 : 122;
        const fill = c.zone === "HOA" ? "#94B6A1" : "#195051";
        const textFill = c.zone === "HOA" ? "#111111" : "#FFFFFF";
        const subFill = c.zone === "HOA" ? "#195051" : "#D4E0AD";
        return `
          <g class="court-node" data-court="${c.num}" tabindex="0" role="button" aria-label="Court ${c.num}, ${c.zone}${c.lit ? ", Lighted" : ""}">
            <rect x="${x}" y="${y}" width="72" height="74" rx="6" fill="${fill}" stroke="#ffffff" stroke-width="2"/>
            <text x="${x + 36}" y="${y + 34}" text-anchor="middle" font-size="14" font-weight="700" fill="${textFill}">Ct ${c.num}</text>
            <text x="${x + 36}" y="${y + 52}" text-anchor="middle" font-size="10" fill="${subFill}">${c.zone}${c.lit ? " 💡" : ""}</text>
          </g>`;
      })
      .join("");

    function selectCourt(num) {
      const c = D.courts.find((x) => x.num === Number(num));
      if (!c) return;
      document.querySelectorAll(".court-node").forEach((n) => {
        n.classList.toggle("selected", Number(n.getAttribute("data-court")) === c.num);
      });
      courtDetailEl.innerHTML = `<strong>Court ${c.num} (${c.zone} · ${c.lit ? "Lighted until 10:00 PM" : "Daylight hours"}):</strong> ${c.note}`;
    }

    courtNodesEl.addEventListener("click", (e) => {
      const node = e.target.closest("[data-court]");
      if (node) selectCourt(node.getAttribute("data-court"));
    });
    courtNodesEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        const node = e.target.closest("[data-court]");
        if (node) {
          e.preventDefault();
          selectCourt(node.getAttribute("data-court"));
        }
      }
    });
  }

  // -------- Play Gizmo! --------
  const gizmoSteps = [
    "<strong>Step 1 — Register Weekly:</strong> Sign into Play Gizmo! and choose your rated session for the upcoming week. Sessions are grouped by club rating (2.5, 3.0, 3.5, 4.0, 4.5+).",
    "<strong>Step 2 — Wednesday 11:00 PM Cutoff:</strong> Entries close Wednesday at 11:00 PM MST so coordinators can balance court counts and assign rotations fairly.",
    "<strong>Step 3 — Check Court Assignments &amp; Rotate:</strong> View your assigned court list before play, track High/Low winners &amp; reserves on the sheet, and rotate smoothly every game."
  ];
  const gizmoBody = document.getElementById("gizmoBody");
  const gizmoTabs = document.getElementById("gizmoTabs");
  function showGizmoStep(idx) {
    gizmoBody.innerHTML = gizmoSteps[idx];
    gizmoTabs.querySelectorAll(".gizmo-tab").forEach((b) => {
      b.classList.toggle("active", Number(b.getAttribute("data-step")) === idx);
    });
  }
  gizmoTabs.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-step]");
    if (btn) showGizmoStep(Number(btn.getAttribute("data-step")));
  });
  showGizmoStep(0);

  // -------- Events & .ics --------
  const eventCats = ["All", "Clinics & Training", "Club Play", "Tournaments", "Social", "Board & Meetings"];
  let activeEventCat = "All";
  const eventFiltersEl = document.getElementById("eventFilters");
  const eventsListEl = document.getElementById("eventsList");

  function renderEventFilters() {
    eventFiltersEl.innerHTML = eventCats
      .map(
        (c) => `<button type="button" class="chip-btn ${c === activeEventCat ? "active" : ""}" data-ecat="${c}">${c}</button>`
      )
      .join("");
  }

  function renderEvents() {
    const items = D.events.filter((ev) => activeEventCat === "All" || ev.category === activeEventCat);
    eventsListEl.innerHTML = items
      .map(
        (ev) => `
        <article class="info-card">
          <span class="${ev.isSample ? "sample-badge" : "verified-badge"}">${ev.isSample ? "Sample Event" : ev.sourceNote} · ${ev.category}</span>
          <h3>${ev.title}</h3>
          <p class="card-meta"><strong>${ev.month} ${ev.day}</strong> · ${ev.time}<br/>${ev.location}</p>
          <p>${ev.description}</p>
          <div class="card-actions">
            <button type="button" class="btn-pill btn-pill-outline-teal" data-ics="${ev.id}">Add to Calendar (.ics)</button>
          </div>
        </article>`
      )
      .join("");
  }

  function buildICS(eventList) {
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
      "END:VTIMEZONE"
    ];
    eventList.forEach((ev) => {
      lines.push(
        "BEGIN:VEVENT",
        `UID:${ev.id}@rrpc-demo.local`,
        "DTSTAMP:20261124T210000Z",
        `DTSTART;TZID=America/Phoenix:${ev.ics.start}`,
        `DTEND;TZID=America/Phoenix:${ev.ics.end}`,
        ...(ev.ics.rrule ? [`RRULE:${ev.ics.rrule}`] : []),
        `SUMMARY:${ev.title}`,
        `LOCATION:${ev.location}, 5624 N. Robson Blvd, Eloy, AZ 85131`,
        `DESCRIPTION:${ev.description.replace(/\n/g, " ")}`,
        "END:VEVENT"
      );
    });
    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
  }

  function triggerICSDownload(filename, content) {
    const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  eventFiltersEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-ecat]");
    if (!btn) return;
    activeEventCat = btn.getAttribute("data-ecat");
    renderEventFilters();
    renderEvents();
  });

  eventsListEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-ics]");
    if (!btn) return;
    const ev = D.events.find((x) => x.id === btn.getAttribute("data-ics"));
    if (ev) triggerICSDownload(`${ev.id}.ics`, buildICS([ev]));
  });

  document.getElementById("downloadAllIcs").addEventListener("click", () => {
    triggerICSDownload("robson-ranch-pickleball-events.ics", buildICS(D.events));
  });

  renderEventFilters();
  renderEvents();

  // -------- News --------
  document.getElementById("newsList").innerHTML = D.news
    .map(
      (n) => `
      <article class="info-card">
        <img src="${n.image}" alt="${n.imageAlt}" class="feature-photo" style="margin-bottom:16px;" loading="lazy" />
        <span class="${n.isSample ? "sample-badge" : "verified-badge"}">${n.badge}</span>
        <p class="card-meta">${n.date}</p>
        <h3>${n.title}</h3>
        <p>${n.summary}</p>
        <p class="card-meta" style="margin-bottom:0;">${n.credit}</p>
      </article>`
    )
    .join("");

  // -------- Membership renewal mockup --------
  const duesMap = {
    "jan-sep": "$30.00",
    oct: "$15.00",
    nov: "$10.00",
    dec: "$5.00"
  };
  const joinMonthSelect = document.getElementById("joinMonthSelect");
  const memberTypeSelect = document.getElementById("memberTypeSelect");
  const duesAmount = document.getElementById("duesAmount");
  const membershipForm = document.getElementById("membershipForm");
  const appModal = document.getElementById("appModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalBody = document.getElementById("modalBody");

  function syncDues() {
    if (memberTypeSelect && memberTypeSelect.value === "Renewal") {
      joinMonthSelect.value = "jan-sep";
    }
    duesAmount.textContent = duesMap[joinMonthSelect.value] || "$30.00";
  }

  joinMonthSelect.addEventListener("change", syncDues);
  if (memberTypeSelect) {
    memberTypeSelect.addEventListener("change", syncDues);
  }

  document.querySelectorAll(".price-select").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const jm = btn.getAttribute("data-join-month");
      if (jm) {
        if (memberTypeSelect) {
          memberTypeSelect.value = jm === "jan-sep" ? "Renewal" : "New Member";
        }
        joinMonthSelect.value = jm;
        syncDues();
      }
      document.getElementById("renew-form").scrollIntoView({ behavior: "smooth" });
    });
  });

  membershipForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(membershipForm);
    const fullName = (data.get("fullName") || "").toString().trim() || "Prospective Member";
    const email = (data.get("email") || "").toString().trim() || "Not entered";
    const dues = duesMap[joinMonthSelect.value] || "$30.00";
    modalTitle.textContent = "Membership Renewal Preview";
    modalBody.innerHTML = `
      <p><strong>Concept Demo Preview — Nothing was transmitted or charged.</strong></p>
      <ul class="clean-list">
        <li><strong>Type:</strong> ${data.get("memberType")}</li>
        <li><strong>Applicant:</strong> ${fullName}</li>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Residency:</strong> ${data.get("residency")}</li>
        <li><strong>Preferred Payment:</strong> ${data.get("payMethod")}</li>
        <li><strong>Calculated Dues:</strong> ${dues}</li>
      </ul>
      <p>Real payment: checks payable to Robson Ranch Pickleball Club in the secure mailbox at the courts, a scanned form to <strong>rrpbctreasure@gmail.com</strong>, or CourtReserve <em>My Membership</em>.</p>
    `;
    appModal.hidden = false;
  });

  function closeModal() {
    appModal.hidden = true;
  }
  document.getElementById("closeModal").addEventListener("click", closeModal);
  document.getElementById("confirmModalBtn").addEventListener("click", closeModal);
  appModal.addEventListener("click", (e) => {
    if (e.target === appModal) closeModal();
  });

  // -------- Help: FAQ, contacts, board --------
  const faqSearch = document.getElementById("faqSearch");
  const clearFaqSearch = document.getElementById("clearFaqSearch");
  const faqCount = document.getElementById("faqCount");
  const faqList = document.getElementById("faqList");

  function renderFaqs(query = "") {
    const q = query.trim().toLowerCase();
    clearFaqSearch.hidden = q.length === 0;
    const matches = (D.faqs || []).filter((f) => {
      if (!q) return true;
      return `${f.topic} ${f.q} ${f.a}`.toLowerCase().includes(q);
    });
    faqCount.textContent = `Showing ${matches.length} of ${(D.faqs || []).length} questions`;
    if (!matches.length) {
      faqList.innerHTML = `<article class="faq-item"><p>No FAQs matched “${query}”. Try <em>reserve</em>, <em>48</em>, <em>guest</em>, or <em>paddle up</em>.</p></article>`;
      return;
    }
    faqList.innerHTML = matches
      .map(
        (f) => `
        <details class="faq-item" id="${f.id}" ${q ? "open" : ""}>
          <summary>${f.q}</summary>
          <div class="faq-body">
            <span class="card-eyebrow">${f.topic}</span>
            <p>${f.a}</p>
          </div>
        </details>`
      )
      .join("");
  }

  if (faqSearch) {
    faqSearch.addEventListener("input", (e) => renderFaqs(e.target.value));
    clearFaqSearch.addEventListener("click", () => {
      faqSearch.value = "";
      renderFaqs("");
      faqSearch.focus();
    });
    renderFaqs("");
  }

  const contactDirectory = document.getElementById("contactDirectory");
  if (contactDirectory && D.contactDirectory) {
    contactDirectory.innerHTML = D.contactDirectory
      .map(
        (c) => `
        <article class="lime-contact-card">
          <h2>${c.title}</h2>
          <p>${c.text}</p>
          <a href="${c.href}" class="underlined-link">${c.contact}</a>
        </article>`
      )
      .join("");
  }

  const boardGrid = document.getElementById("boardGrid");
  if (boardGrid && D.board) {
    boardGrid.innerHTML = D.board
      .map(
        (b) => `
        <article class="info-card">
          <span class="card-eyebrow">${b.role}</span>
          <h3>${b.name}</h3>
          <p>Robson Ranch Pickleball Club · 2026–2027 Term</p>
        </article>`
      )
      .join("");
  }

  // -------- Request forms & board inbox preview --------
  const FORM_META = {
    rating: {
      title: "Rating Evaluation Request",
      route: "Testing Coordinator",
      inbox: "rraz.pickleball.ratings@gmail.com"
    },
    machine: {
      title: "Ball Machine Training Signup",
      route: "Sports Desk / Training",
      inbox: "Sports Desk · (520) 426-3355 (waiver & checkout)"
    },
    question: {
      title: "General Question / Suggestion",
      route: "General Club Inbox",
      inbox: "robsonranchpickleball@gmail.com"
    }
  };

  const demoInbox = [];

  function renderInbox() {
    const empty = `<p class="card-meta" style="margin:0;">No demo requests yet. Submit a form to see a sample inbox item.</p>`;
    const html = demoInbox.length
      ? demoInbox
          .map(
            (item) => `
          <article class="inbox-item">
            <span class="sample-badge">Demo Only · Not Sent</span>
            <h4>${item.title}</h4>
            <p class="card-meta">Would route to ${item.route} · ${item.inbox}<br/>Received (demo): ${item.when}</p>
            ${item.details}
          </article>`
          )
          .join("")
      : empty;
    const a = document.getElementById("inboxList");
    const b = document.getElementById("testingInboxList");
    if (a) a.innerHTML = html;
    if (b) {
      const ratingOnly = demoInbox.filter((i) => i.id === "rating");
      b.innerHTML = ratingOnly.length
        ? ratingOnly
            .map(
              (item) => `
          <article class="inbox-item">
            <span class="sample-badge">Demo Only · Not Sent</span>
            <h4>${item.title}</h4>
            <p class="card-meta">Would route to ${item.route} · ${item.inbox}<br/>Received (demo): ${item.when}</p>
            ${item.details}
          </article>`
            )
            .join("")
        : empty;
    }
  }

  function formDetails(id, data) {
    if (id === "rating") {
      return `<ul class="clean-list">
        <li><strong>Name:</strong> ${data.get("name")}</li>
        <li><strong>Email:</strong> ${data.get("email")}</li>
        <li><strong>Current rating:</strong> ${data.get("currentRating")}</li>
        <li><strong>Rating sought:</strong> ${data.get("soughtRating")}</li>
        <li><strong>Notes:</strong> ${data.get("notes") || "None"}</li>
      </ul>`;
    }
    if (id === "machine") {
      return `<ul class="clean-list">
        <li><strong>Name:</strong> ${data.get("name")}</li>
        <li><strong>Email:</strong> ${data.get("email")}</li>
        <li><strong>Phone:</strong> ${data.get("phone") || "Not provided"}</li>
        <li><strong>Preferred window:</strong> ${data.get("window")}</li>
      </ul>`;
    }
    return `<ul class="clean-list">
      <li><strong>Name:</strong> ${data.get("name")}</li>
      <li><strong>Email:</strong> ${data.get("email")}</li>
      <li><strong>Topic:</strong> ${data.get("topic")}</li>
      <li><strong>Message:</strong> ${data.get("message")}</li>
    </ul>`;
  }

  document.querySelectorAll(".request-form").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const id = form.getAttribute("data-form-id");
      const meta = FORM_META[id];
      const data = new FormData(form);
      const when = new Date().toLocaleString("en-US", { timeZone: "America/Phoenix" });
      demoInbox.unshift({
        id,
        title: meta.title,
        route: meta.route,
        inbox: meta.inbox,
        when: when + " (Arizona time)",
        details: formDetails(id, data)
      });
      renderInbox();
      modalTitle.textContent = "Board Inbox Preview";
      modalBody.innerHTML = `
        <p><strong>Demo only — this request was not emailed or stored on a server.</strong></p>
        <p>In a live site, this would appear in the <strong>${meta.route}</strong> queue (${meta.inbox}).</p>
        ${formDetails(id, data)}
      `;
      appModal.hidden = false;
      form.reset();
    });
  });
  renderInbox();

  document.querySelectorAll(".request-tabs").forEach((tabs) => {
    tabs.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-form]");
      if (!btn) return;
      const id = btn.getAttribute("data-form");
      tabs.querySelectorAll(".chip-btn").forEach((b) => b.classList.toggle("active", b === btn));
      document.querySelectorAll("#form-machine, #form-question").forEach((f) => {
        f.hidden = f.getAttribute("data-form-id") !== id;
      });
    });
  });

  // -------- Player Directory (fictional sample names, mock sign-in) --------
  const directoryGate = document.getElementById("directoryGate");
  const directoryApp = document.getElementById("directoryApp");
  const AUTH_KEY = "rrpcDemoDirectoryAuth";
  let dirRating = "all";
  let dirQuery = "";

  function isDirAuthed() {
    return sessionStorage.getItem(AUTH_KEY) === "1";
  }

  function setDirAuth(on) {
    if (on) sessionStorage.setItem(AUTH_KEY, "1");
    else sessionStorage.removeItem(AUTH_KEY);
    directoryGate.hidden = on;
    directoryApp.hidden = !on;
    if (on) renderDirectory();
  }

  document.getElementById("demoSignInBtn").addEventListener("click", () => setDirAuth(true));
  document.getElementById("demoSignOutBtn").addEventListener("click", () => setDirAuth(false));

  const dirChips = document.getElementById("directoryRatingChips");
  const dirRatings = ["all", "2.0", "2.5", "3.0", "3.5", "4.0", "4.5", "5.0"];

  function renderDirChips() {
    dirChips.innerHTML = dirRatings
      .map(
        (r) =>
          `<button type="button" class="chip-btn ${r === dirRating ? "active" : ""}" data-dir-rating="${r}">${r === "all" ? "All Ratings" : r}</button>`
      )
      .join("");
  }

  function renderDirectory() {
    const q = dirQuery.trim().toLowerCase();
    const rows = (D.sampleDirectory || []).filter((p) => {
      const ratingOk = dirRating === "all" || p.rating === dirRating;
      const nameOk = !q || p.name.toLowerCase().includes(q);
      return ratingOk && nameOk;
    });
    document.getElementById("directoryCount").textContent =
      `Showing ${rows.length} of ${(D.sampleDirectory || []).length} sample (fictional) members`;
    document.getElementById("directoryList").innerHTML = rows.length
      ? rows
          .map(
            (p) => `
        <article class="directory-card">
          <div>
            <span class="sample-badge">${p.note}</span>
            <h3>${p.name}</h3>
            <span class="directory-rating">${p.rating}</span>
          </div>
          <button type="button" class="btn-pill btn-pill-outline-teal" data-contact-sample="${p.id}">Contact Me</button>
        </article>`
          )
          .join("")
      : `<p>No sample members match that name or rating.</p>`;
  }

  dirChips.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-dir-rating]");
    if (!btn) return;
    dirRating = btn.getAttribute("data-dir-rating");
    renderDirChips();
    renderDirectory();
  });

  document.getElementById("directorySearch").addEventListener("input", (e) => {
    dirQuery = e.target.value;
    renderDirectory();
  });

  document.getElementById("directoryList").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-contact-sample]");
    if (!btn) return;
    const person = (D.sampleDirectory || []).find((x) => x.id === btn.getAttribute("data-contact-sample"));
    if (!person) return;
    modalTitle.textContent = "Contact Request (Demo Only)";
    modalBody.innerHTML = `
      <p><strong>Nothing was sent.</strong> In a live members-only directory, this would notify <em>${person.name}</em> (${person.rating}) with an option to reply.</p>
      <p class="card-meta">${person.note} — this is not a real Robson Ranch member and is not from the club roster.</p>
      <label class="field">
        <span>Short message (demo only)</span>
        <textarea rows="3" placeholder="This text stays in the preview and is never delivered."></textarea>
      </label>
    `;
    appModal.hidden = false;
  });

  renderDirChips();
  setDirAuth(isDirAuthed());

  // -------- Searchable Policies --------
  const policySearch = document.getElementById("policySearch");
  const clearPolicySearch = document.getElementById("clearPolicySearch");
  const policyCount = document.getElementById("policyCount");
  const policiesList = document.getElementById("policiesList");
  const docsGrid = document.getElementById("docsGrid");

  function renderPolicies(query = "") {
    const q = query.trim().toLowerCase();
    clearPolicySearch.hidden = q.length === 0;
    const matches = D.policies.filter((p) => {
      if (!q) return true;
      const hay = `${p.title} ${p.date} ${p.keywords} ${p.summary} ${p.bullets.join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
    policyCount.textContent = `Showing ${matches.length} of ${D.policies.length} official club documents`;
    if (!matches.length) {
      policiesList.innerHTML = `<article class="policy-card"><p>No rules matched “${query}”. Try searching <em>guest</em>, <em>paddle</em>, <em>48</em>, <em>lights</em>, or <em>bylaws</em>.</p></article>`;
      return;
    }
    policiesList.innerHTML = matches
      .map(
        (p) => `
        <article class="policy-card">
          <span class="card-eyebrow">${p.date}</span>
          <h3>${p.title}</h3>
          <p>${p.summary}</p>
          <ul class="clean-list">
            ${p.bullets.map((b) => `<li>${b}</li>`).join("")}
          </ul>
          <a href="${p.pdf}" target="_blank" rel="noopener noreferrer" class="underlined-link">Open Official PDF ↗</a>
        </article>`
      )
      .join("");
  }

  policySearch.addEventListener("input", (e) => renderPolicies(e.target.value));
  clearPolicySearch.addEventListener("click", () => {
    policySearch.value = "";
    renderPolicies("");
    policySearch.focus();
  });
  renderPolicies("");

  if (docsGrid && D.policies) {
    docsGrid.innerHTML = D.policies
      .map(
        (p) => `
        <article class="info-card">
          <span class="card-eyebrow">${p.date}</span>
          <h3>${p.title}</h3>
          <p>${p.summary}</p>
          <a href="${p.pdf}" target="_blank" rel="noopener noreferrer" class="underlined-link">Download PDF ↗</a>
        </article>`
      )
      .join("");
  }

  // -------- Initial view --------
  routeFromHash(false);
})();
