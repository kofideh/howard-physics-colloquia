(() => {
  "use strict";

  const data = window.HOWARD_COLLOQUIA || { series: {}, events: [] };
  const events = (data.events || [])
    .filter(event => event.published !== false)
    .map(normalizeEvent)
    .sort((a, b) => a.dateObj - b.dateObj);

  const scheduleGrid = document.querySelector("#schedule-grid");
  const recordingsGrid = document.querySelector("#recordings-grid");
  const emptyState = document.querySelector("#empty-state");
  const recordingsEmpty = document.querySelector("#recordings-empty");
  const searchInput = document.querySelector("#search");
  const statusFilter = document.querySelector("#status-filter");
  const cardTemplate = document.querySelector("#event-card-template");
  const dialog = document.querySelector("#event-dialog");
  const dialogContent = document.querySelector("#dialog-content");

  document.querySelector("#semester-label").textContent = data.series.semester || "Colloquium series";
  renderNextEvent();
  renderSchedule();
  renderRecordings();

  searchInput.addEventListener("input", renderSchedule);
  statusFilter.addEventListener("change", renderSchedule);
  document.querySelector(".dialog-close").addEventListener("click", closeDialog);
  dialog.addEventListener("click", event => {
    if (event.target === dialog) closeDialog();
  });
  dialog.addEventListener("close", () => document.body.classList.remove("dialog-open"));

  function normalizeEvent(event) {
    const dateObj = parseLocalDate(event.date);
    const now = new Date();
    const endOfEvent = new Date(dateObj);
    const [endHour, endMinute] = parseClock(event.endTime || data.series.endTime || "16:00");
    endOfEvent.setHours(endHour, endMinute, 0, 0);

    let computedStatus = (event.status || "scheduled").toLowerCase();
    if (!["cancelled", "open", "reserved"].includes(computedStatus)) {
      computedStatus = endOfEvent < now ? "completed" : "upcoming";
    }

    return {
      ...event,
      dateObj,
      computedStatus,
      time: event.time || data.series.time || "3:00–4:00 PM ET",
      location: event.location || data.series.location || "Howard University",
      format: event.format || "In person"
    };
  }

  function renderNextEvent() {
    const target = document.querySelector("#next-event");
    const next = events.find(event => event.computedStatus === "upcoming" && event.speaker);
    if (!next) {
      target.innerHTML = '<p class="next-label">Next colloquium</p><h2>Schedule forthcoming</h2><p class="next-institution">Please check back for the next announced speaker.</p>';
      return;
    }
    target.innerHTML = `
      <p class="next-label">Next colloquium</p>
      <p class="next-date">${escapeHtml(formatLongDate(next.dateObj))} · ${escapeHtml(next.time)}</p>
      <h2>${escapeHtml(next.title || "Title forthcoming")}</h2>
      <p class="next-speaker">${escapeHtml(next.speaker)}</p>
      <p class="next-institution">${escapeHtml(next.institution || "")}</p>
      <button class="button button-primary" type="button" data-next-details>View event details</button>`;
    target.querySelector("[data-next-details]").addEventListener("click", () => openDialog(next));
  }

  function renderSchedule() {
    const query = searchInput.value.trim().toLowerCase();
    const filter = statusFilter.value;
    const filtered = events.filter(event => {
      const haystack = [event.speaker, event.institution, event.title, event.abstract].join(" ").toLowerCase();
      const searchMatches = !query || haystack.includes(query);
      let filterMatches = true;
      if (filter === "upcoming") filterMatches = event.computedStatus === "upcoming";
      if (filter === "completed") filterMatches = event.computedStatus === "completed";
      if (filter === "recordings") filterMatches = Boolean(event.youtubeUrl);
      return searchMatches && filterMatches;
    });

    scheduleGrid.replaceChildren(...filtered.map(createEventCard));
    emptyState.hidden = filtered.length > 0;
  }

  function createEventCard(event) {
    const node = cardTemplate.content.firstElementChild.cloneNode(true);
    const { month, day, year } = splitDate(event.dateObj);
    node.classList.add(`is-${event.computedStatus}`);
    node.querySelector(".date-month").textContent = month;
    node.querySelector(".date-day").textContent = day;
    node.querySelector(".date-year").textContent = year;

    const portrait = node.querySelector(".speaker-portrait");
    if (event.photoUrl) {
      const image = document.createElement("img");
      image.src = event.photoUrl;
      image.alt = event.photoAlt || `Portrait of ${event.speaker}`;
      image.loading = "lazy";
      portrait.append(image);
    } else {
      portrait.textContent = initials(event.speaker || event.title || "HU");
      portrait.setAttribute("aria-label", event.speaker ? `No portrait provided for ${event.speaker}` : "Colloquium placeholder");
    }

    const badge = node.querySelector(".status-badge");
    badge.textContent = statusLabel(event);
    badge.classList.add(event.computedStatus);
    node.querySelector(".event-format").textContent = `${event.format} · ${event.time}`;
    node.querySelector(".event-title").textContent = event.title || defaultTitle(event);
    node.querySelector(".event-speaker").textContent = event.speaker || defaultSpeaker(event);
    node.querySelector(".event-institution").textContent = event.institution || event.location;

    const actions = node.querySelector(".event-actions");
    const details = makeButton("Details", "button-secondary", () => openDialog(event));
    actions.append(details);
    if (event.youtubeUrl) actions.append(makeLink("Watch recording", event.youtubeUrl, "button-youtube"));
    else if (event.registrationUrl && event.computedStatus === "upcoming") actions.append(makeLink("Register", event.registrationUrl, "button-primary"));
    if (event.computedStatus === "upcoming" && event.speaker) actions.append(makeButton("Add to calendar", "button-ghost", () => downloadIcs(event)));
    return node;
  }

  function renderRecordings() {
    const recordings = events.filter(event => event.youtubeUrl);
    recordingsGrid.replaceChildren(...recordings.map(event => {
      const card = document.createElement("article");
      card.className = "recording-card";
      card.innerHTML = `
        <p class="eyebrow">${escapeHtml(formatShortDate(event.dateObj))}</p>
        <h3>${escapeHtml(event.title || "Howard Physics Colloquium")}</h3>
        <p>${escapeHtml(event.speaker || "Howard Physics")}${event.institution ? ` · ${escapeHtml(event.institution)}` : ""}</p>`;
      card.append(makeLink("Watch on YouTube", event.youtubeUrl, "button-youtube"));
      return card;
    }));
    recordingsEmpty.hidden = recordings.length > 0;
  }

  function openDialog(event) {
    dialogContent.innerHTML = `
      <div class="dialog-body">
        <p class="dialog-date">${escapeHtml(formatLongDate(event.dateObj))}</p>
        <h2 id="dialog-title">${escapeHtml(event.title || defaultTitle(event))}</h2>
        <p class="dialog-speaker">${escapeHtml(event.speaker || defaultSpeaker(event))}</p>
        <p class="dialog-institution">${escapeHtml(event.institution || "")}</p>
        <div class="dialog-meta">
          <span>${escapeHtml(event.time)}</span>
          <span>${escapeHtml(event.location)}</span>
          <span>${escapeHtml(event.format)}</span>
        </div>
        ${event.abstract ? `<div class="abstract"><h3>Abstract</h3>${paragraphs(event.abstract)}</div>` : '<div class="abstract"><h3>Abstract</h3><p>Abstract forthcoming.</p></div>'}
        <div class="dialog-actions"></div>
      </div>`;

    const actions = dialogContent.querySelector(".dialog-actions");
    if (event.registrationUrl && event.computedStatus === "upcoming") actions.append(makeLink("Register", event.registrationUrl, "button-primary"));
    if (event.youtubeUrl) actions.append(makeLink("Watch recording", event.youtubeUrl, "button-youtube"));
    if (event.speakerUrl) actions.append(makeLink("Speaker profile", event.speakerUrl, "button-secondary"));
    if (event.eventUrl) actions.append(makeLink("Official event page", event.eventUrl, "button-ghost"));
    if (event.computedStatus === "upcoming" && event.speaker) actions.append(makeButton("Add to calendar", "button-ghost", () => downloadIcs(event)));

    dialog.showModal();
    document.body.classList.add("dialog-open");
  }

  function closeDialog() {
    if (dialog.open) dialog.close();
  }

  function makeButton(label, className, handler) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `button ${className}`;
    button.textContent = label;
    button.addEventListener("click", handler);
    return button;
  }

  function makeLink(label, href, className) {
    const link = document.createElement("a");
    link.className = `button ${className}`;
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = label;
    return link;
  }

  function downloadIcs(event) {
    const start = localDateTime(event.date, event.startTime || data.series.startTime || "15:00");
    const end = localDateTime(event.date, event.endTime || data.series.endTime || "16:00");
    const stamp = formatIcsDate(new Date());
    const uid = `${event.date}-${slugify(event.speaker || "colloquium")}@physics.howard.edu`;
    const description = [event.abstract, event.eventUrl].filter(Boolean).join("\n\n");
    const content = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Howard University//Physics Colloquium//EN",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:${escapeIcs(uid)}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${formatIcsDate(start)}`,
      `DTEND:${formatIcsDate(end)}`,
      `SUMMARY:${escapeIcs(`${event.speaker || "Howard Physics Colloquium"}: ${event.title || "Colloquium"}`)}`,
      `LOCATION:${escapeIcs(event.location)}`,
      `DESCRIPTION:${escapeIcs(description)}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");
    const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${event.date}-${slugify(event.speaker || "howard-colloquium")}.ics`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function statusLabel(event) {
    if (event.computedStatus === "reserved") return "Reserved";
    if (event.computedStatus === "open") return "Open date";
    if (event.computedStatus === "cancelled") return "Cancelled";
    if (event.computedStatus === "completed") return event.youtubeUrl ? "Recording posted" : "Completed";
    return "Upcoming";
  }

  function defaultTitle(event) {
    if (event.computedStatus === "reserved") return "Reserved for trainee presentations";
    if (event.computedStatus === "open") return "Speaker to be announced";
    return "Talk title forthcoming";
  }

  function defaultSpeaker(event) {
    if (event.computedStatus === "reserved") return "Howard University trainees";
    if (event.computedStatus === "open") return "Open colloquium date";
    return "Speaker to be announced";
  }

  function parseLocalDate(value) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  }

  function parseClock(value) {
    return value.split(":").map(Number);
  }

  function localDateTime(date, time) {
    const [year, month, day] = date.split("-").map(Number);
    const [hour, minute] = parseClock(time);
    return new Date(year, month - 1, day, hour, minute, 0);
  }

  function splitDate(date) {
    return {
      month: new Intl.DateTimeFormat("en-US", { month: "short" }).format(date),
      day: new Intl.DateTimeFormat("en-US", { day: "2-digit" }).format(date),
      year: date.getFullYear()
    };
  }

  function formatLongDate(date) {
    return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(date);
  }

  function formatShortDate(date) {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
  }

  function initials(value) {
    return String(value).split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  }

  function paragraphs(value) {
    return String(value).split(/\n\s*\n/).map(text => `<p>${escapeHtml(text)}</p>`).join("");
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  }

  function slugify(value) {
    return String(value).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function formatIcsDate(date) {
    const pad = value => String(value).padStart(2, "0");
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  }

  function escapeIcs(value) {
    return String(value ?? "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  }
})();
