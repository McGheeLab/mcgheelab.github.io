/* =====================================================================================
   McGheeLab SPA (Single-Page App)
   -----------------------------------------------------------------------------
   What this file does:

   1) SPA ROUTER
      - Listens to location hash (#/mission, #/research, etc.) and swaps only the
        page BODY while keeping the top banner + hero + footer persistent.

   2) DATA LOADING
      - Fetches ALL page content from content.json.
      - We keep backwards compatibility with your existing JSON, and ALSO
        support optional "story" arrays so you can build expandable “stories”
        (multiple image + text blocks) inside Research topics and Projects.

        Example JSON extensions (optional; keep your old fields too):
        {
          "pages": {
            "research": {
              "topics": [
                {
                  "slug": "microfluidics",
                  "title": "Microfluidics",
                  "summary": "Short overview...",
                  "image": "https://...",
                  "story": [
                    { "image": "https://...", "imageAlt": "foo", "text": "detail paragraph 1" },
                    { "image": "https://...", "imageAlt": "bar", "text": "detail paragraph 2" }
                  ]
                }
              ]
            },
            "projects": {
              "projects": [
                {
                  "slug": "open-pump",
                  "title": "Open Microfluidic Pump",
                  "summary": "Short overview...",
                  "image": "https://...",
                  "story": [
                    { "image": "https://...", "imageAlt": "pump v1", "text": "design notes" },
                    { "image": "https://...", "imageAlt": "pump v2", "text": "testing notes" }
                  ]
                }
              ]
            }
          }
        }

   3) SUBNAV (Quick Links) — Desktop & Mobile
      - The chip row is swipeable on touch/pen (phones/tablets), but on desktop
        we DO NOT attach drag handlers at all, so mouse clicks always work.
      - Clicking a chip scrolls to the corresponding section and places it at
        the *center of the visible page*, below the sticky header + subnav.
      - Scrollspy highlights the chip whose section is closest to the visible
        center line and auto-centers that chip in the row.

   4) MISSION HIGHLIGHT
      - In the hero line, the phrase "in vitro models" and the trailing period
        are colored pink (via a span with .hero-highlight).

   5) LAZY IMAGES + REVEAL ON SCROLL
      - Images load as they enter the viewport; sections fade in gracefully.

   6) ACCESSIBILITY
      - Keyboard support for quick links (Enter/Space).
      - Proper aria-current on active chips.
      - Focus management on route changes.

   NOTES:
   - This file is intentionally *heavily commented* as requested.
   - You do NOT need to change your CSS for this to work (animations are basic).
   - If you want animated expand/collapse later, we can add a few CSS rules.

   ===================================================================================== */

(() => {
  // ---- DOM references to persistent containers
  const appEl     = document.getElementById('app');        // dynamic main content
  const menuBtn   = document.getElementById('menuBtn');    // hamburger button
  const navDrawer = document.getElementById('site-nav');   // slide-down nav drawer

  // ---- Simple app state
  const state = {
    data: null,        // content.json after load
    observers: [],     // active IntersectionObservers (reveal, lazy imgs)
    cleanups: [],      // per-page event listeners we must remove on page swap
    bannerHeight: 64   // computed sticky top height (updated on resize)
  };

  /* ===========================
     BOOTSTRAP
     =========================== */
  document.addEventListener('DOMContentLoaded', async () => {
    // Footer year stamp
    document.getElementById('year').textContent = new Date().getFullYear();

    // Wire up the persistent hamburger/drawer
    setupMenu();

    // Load content.json (with a safe fallback)
    await loadData();

    // Hero + footer text from JSON (mission pinkified in hero)
    applyMissionText(); // adds pink span to phrase + period
    document.getElementById('footerMission').textContent = state.data.site.mission;
    document.getElementById('footerContact').innerHTML = formatContact(state.data.site.contact);

    // Compute banner height for sticky math and keep it fresh on resize
    updateBannerHeight();
    window.addEventListener('resize', debounce(updateBannerHeight, 150));

    // Basic router: swap the body when the hash route changes
    window.addEventListener('hashchange', onRouteChange);
    onRouteChange(); // render initial route

    // Respect reduced motion users by stopping the hero video
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const v = document.getElementById('heroVideo');
      if (v) { v.pause(); v.removeAttribute('src'); v.load(); }
    }
  });

  /* ===========================
     DATA LOADING
     =========================== */
  async function loadData(){
    try{
      const res = await fetch('content.json');
      state.data = await res.json();
    }catch{
      // Fallback if JSON isn't reachable — keep the app usable
      state.data = {
        site: {
          mission: 'We build in vitro models to study the mechanisms driving metastasis.',
          contact: { address: '123 Science Dr, Tucson, AZ 85701', email: 'info@mcgheelab.org', phone: '(520) 555-0123' }
        },
        pages: {}
      };
    }
  }

  /* ===========================
     ROUTER
     =========================== */
  function onRouteChange(){
    // Route is everything after "#/", default to "mission"
    const hash = window.location.hash || '#/mission';
    const [, route] = hash.split('/');
    const page = (route || 'mission').toLowerCase();

    render(page);
    setActiveTopNav(page); // highlight the item in the slide-down drawer
  }

  function setActiveTopNav(page){
    document.querySelectorAll('#site-nav a[data-route]').forEach(a => {
      a.setAttribute('aria-current', a.dataset.route === page ? 'page' : 'false');
    });
  }

  /* ===========================
     PAGE RENDERER
     =========================== */
  async function render(page){
    // 1) Clean up prior page observers and event listeners
    state.observers.forEach(o => o.disconnect()); state.observers = [];
    state.cleanups.forEach(fn => { try{ fn(); }catch{} }); state.cleanups = [];

    // 2) Build the requested view
    let view;
    switch(page){
      case 'mission':   view = renderMission();  break;
      case 'research':  view = renderResearch(); break;
      case 'projects':  view = renderProjects(); break;
      case 'team':      view = renderTeam();     break;
      case 'classes':   view = renderClasses();  break;
      case 'contact':   view = renderContact();  break;
      default:          view = renderNotFound();
    }

    // 3) Swap the DOM
    appEl.innerHTML = '';
    appEl.appendChild(view);

    // Accessibility: move focus to <main>
    appEl.focus({ preventScroll: true });

    // 4) Wire the page-specific subnav (chips). IMPORTANT:
    //    - We add swipe/drag ONLY for touch/pen. No drag handlers on mouse.
    //    - We delegate clicks and ALWAYS let desktop clicks fire.
    wireUpSubnav(view);

    // 5) On route change, scroll the window so the top of body is just below the hero
    window.scrollTo({ top: headerBottom(), behavior: 'smooth' });

    // 6) Turn on reveal + lazy images for this view
    enableReveal();
    enableLazyImages();
  }

  /* ===========================
     VIEW: Mission
     =========================== */
  function renderMission(){
    const { missionPage } = state.data.pages;
    const wrap = sectionEl();

    // Build quick links from the per-section titles (if any)
    const sections = missionPage?.sections || [];
    const links = sections.map(sec => ({ id: slugify(sec.slug || sec.title), label: sec.title }));
    wrap.appendChild(buildSubnav(links));

    // Render sections (existing layout kept intact)
    if (sections.length){
      sections.forEach(sec => {
        const slug = slugify(sec.slug || sec.title);
        const s = div('section card reveal'); s.id = slug;
        s.innerHTML = `
          <div class="max-w">
            <h2>${esc(sec.title)}</h2>
            <div class="media">
              <div>
                <p>${esc(sec.body)}</p>
                ${sec.points ? `<ul>${sec.points.map(p=>`<li>${esc(p)}</li>`).join('')}</ul>` : ''}
              </div>
              ${imageHTML(sec.image, sec.imageAlt || sec.title)}
            </div>
          </div>
        `;
        wrap.appendChild(s);
      });
    } else {
      wrap.appendChild(infoBox('Update missionPage.sections in content.json'));
    }

    return wrap;
  }

  /* ===========================
     VIEW: Research
     - Each topic is shown in the same media layout you liked.
     - NEW: If a topic has a "story" array, we show a collapsed "More details"
            panel with multiple image + text blocks that the user can expand/collapse.
     =========================== */
  function renderResearch(){
    const { topics = [], references = [] } = state.data.pages.research || {};
    const wrap = sectionEl();

    // Build subnav chips for topics + references anchor
    const links = [
      ...topics.map(t => ({ id: t.slug, label: t.title })),
      ...(references.length ? [{ id: 'references', label: 'References' }] : [])
    ];
    wrap.appendChild(buildSubnav(links));

    // Topics
    topics.forEach(t=>{
      const art = div('section card reveal'); art.id = t.slug;

      // Build optional expandable "story" (multiple blocks)
      const storyHTML = buildStoryHTML(t.story);

      art.innerHTML = `
        <div class="max-w">
          <h2>${esc(t.title)}</h2>
          <div class="media">
            <div>
              <p>${esc(t.summary)}</p>
              ${t.keywords?.length ? `<p>${t.keywords.map(k=>`<span class="badge">${esc(k)}</span>`).join(' ')}</p>` : ''}
              ${storyHTML ? expandableHTML() : ''}  <!-- toggle button + empty details slot -->
            </div>
            ${imageHTML(t.image, t.imageAlt || t.title)}
          </div>

          ${storyHTML ? `<div class="expandable-details" hidden>${storyHTML}</div>` : ''}
        </div>
      `;

      // If there is an expandable section, wire the toggle
      const btn = art.querySelector('.expand-toggle');
      if (btn){
        const details = art.querySelector('.expandable-details');
        wireExpandable(btn, details);
      }

      wrap.appendChild(art);
    });

    // References list (unchanged)
    const refs = div('section card reveal'); refs.id = 'references';
    refs.innerHTML = `
      <div class="max-w">
        <h2>Selected References</h2>
        ${references?.length ? `<ol>${references.map(r => `
          <li>
            <strong>${esc(r.title)}</strong><br/>
            <span>${esc(r.authors || '')}</span> <em>${esc(r.journal || '')}</em> ${r.year ? `(${esc(r.year)})` : ''}${r.doi ? ` — <a href="${esc(r.doi)}" target="_blank" rel="noopener">DOI</a>` : ''}
          </li>
        `).join('')}</ol>` : '<p>No references yet.</p>'}
      </div>
    `;
    wrap.appendChild(refs);

    return wrap;
  }

  /* ===========================
     VIEW: Projects
     - Uses cards in a grid (as before).
     - NEW: If a project has a "story" array, add an expandable details panel.
     =========================== */
  function renderProjects(){
    const { projects = [] } = state.data.pages.projects || {};
    const wrap = sectionEl();

    // Quick-links from project titles
    const links = projects.map(p => ({ id: p.slug, label: p.title }));
    wrap.appendChild(buildSubnav(links));

    // Grid of cards
    const grid = div('max-w grid grid-fit-250');
    projects.forEach(p=>{
      const storyHTML = buildStoryHTML(p.story);

      const item = div('card class-item reveal project-card'); item.id = p.slug;
      item.innerHTML = `
        <div class="thumb">${imageHTML(p.image, p.imageAlt || p.title)}</div>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.summary)}</p>
        ${p.tags?.length ? `<p>${p.tags.map(t=>`<span class="badge">${esc(t)}</span>`).join(' ')}</p>` : ''}
        ${storyHTML ? `${expandableHTML()}<div class="expandable-details" hidden>${storyHTML}</div>` : ''}
      `;
      if (storyHTML){
        const btn = item.querySelector('.expand-toggle');
        const details = item.querySelector('.expandable-details');
        wireExpandable(btn, details);
      }

      grid.appendChild(item);
    });

    wrap.appendChild(grid);
    return wrap;
  }

  /* ===========================
     VIEW: Team
     =========================== */
  function renderTeam(){
    const { team = {} } = state.data.pages;
    const wrap = sectionEl();

    const order = ['highschool','undergrad','grad','postdoc'];
    const links = order
      .filter(group => (team?.[group] || []).length)
      .map(group => ({ id: `team-${group}`, label: labelGroup(group) }));
    wrap.appendChild(buildSubnav(links));

    order.forEach(group=>{
      const people = team?.[group] || [];
      if (!people.length) return;

      const section = div('section reveal'); section.id = `team-${group}`;
      section.innerHTML = `<div class="max-w"><h2>${labelGroup(group)}</h2></div>`;
      const grid = div('max-w grid grid-fit-250');

      people.forEach(person=>{
        const card = div('card person');
        card.innerHTML = `
          ${imageHTML(person.photo, `Photo of ${esc(person.name)}`)}
          <div><strong>${esc(person.name)}</strong></div>
          <div class="role">${esc(person.role || '')}</div>
          <p>${esc(person.bio || '')}</p>
        `;
        grid.appendChild(card);
      });

      section.appendChild(grid);
      wrap.appendChild(section);
    });

    return wrap;
  }

  /* ===========================
     VIEW: Classes
     =========================== */
  function renderClasses(){
    const { classesPage = {} } = state.data.pages;
    const wrap = sectionEl();

    const courses = classesPage.courses || [];
    const links = [
      ...(classesPage.intro ? [{ id: 'classes-intro', label: 'Overview' }] : []),
      ...courses.map(c => ({ id: slugify(c.title), label: c.title }))
    ];
    wrap.appendChild(buildSubnav(links));

    if (classesPage?.intro){
      const intro = div('section card reveal'); intro.id = 'classes-intro';
      intro.innerHTML = `<div class="max-w"><h2>Classes</h2><p>${esc(classesPage.intro)}</p></div>`;
      wrap.appendChild(intro);
    }

    const grid = div('max-w grid grid-fit-250');
    courses.forEach(c=>{
      const id = slugify(c.title);
      const card = div('card class-item reveal'); card.id = id;
      card.innerHTML = `
        <h3>${esc(c.title)}</h3>
        <p>${esc(c.description)}</p>
        <p><span class="badge">${esc(c.level || 'All levels')}</span> <span class="badge">${esc(c.when || '')}</span></p>
        ${c.registrationLink ? `<p><a href="${esc(c.registrationLink)}" target="_blank" rel="noopener">Register</a></p>` : ''}
      `;
      grid.appendChild(card);
    });
    wrap.appendChild(grid);

    return wrap;
  }

  /* ===========================
     VIEW: Contact
     =========================== */
  function renderContact(){
    const { site } = state.data;
    const wrap = sectionEl();

    // Two anchors for quick jumping
    wrap.appendChild(buildSubnav([
      { id: 'contact-form', label: 'Form' },
      { id: 'contact-info', label: 'Info' }
    ]));

    const block = div('max-w grid');

    const formBox = div('card class-item reveal'); formBox.id = 'contact-form';
    formBox.innerHTML = `
      <h2>Contact Us</h2>
      <form id="contactForm" novalidate>
        <label> Name
          <input name="name" type="text" placeholder="Your name" required />
        </label>
        <label> Email
          <input name="email" type="email" placeholder="you@example.com" required />
        </label>
        <label> Message
          <textarea name="message" placeholder="How can we help?" required></textarea>
        </label>
        <button type="submit">Send</button>
      </form>
      <p class="muted">This demo uses <code>mailto:</code>. Replace with your backend or a form service.</p>
    `;

    const infoBox = div('card class-item reveal'); infoBox.id = 'contact-info';
    infoBox.innerHTML = `<h2>Info</h2>${formatContact(site.contact)}`;

    block.appendChild(formBox);
    block.appendChild(infoBox);
    wrap.appendChild(block);

    // Simple mailto handler; you can replace with a real backend
    setTimeout(() => {
      const form = document.getElementById('contactForm');
      form?.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = new FormData(form);
        const name = data.get('name'); const email = data.get('email'); const message = data.get('message');
        if(!name || !email || !message){ alert('Please complete all fields.'); return; }
        const mailto = `mailto:${state.data.site.contact.email}?subject=${encodeURIComponent('Website contact from ' + name)}&body=${encodeURIComponent(message + '\n\nFrom: ' + name + ' <' + email + '>')}`;
        window.location.href = mailto;
      });
    }, 0);

    return wrap;
  }

  function renderNotFound(){
    const wrap = sectionEl();
    wrap.appendChild(infoBox('Page not found.'));
    return wrap;
  }

  /* ===========================
     SUBNAV (Quick Links) — build + wire
     =========================== */

  // Build the sticky chip row. Each chip uses data-scroll="section-id".
  function buildSubnav(items){
    const subnav = document.createElement('nav');
    subnav.className = 'subnav reveal';
    subnav.setAttribute('aria-label', 'Quick links');

    const container = document.createElement('div');
    container.className = 'max-w';

    const ul = document.createElement('ul');
    ul.className = 'track';
    ul.innerHTML = items.map(i => `<li><a href="#" data-scroll="${esc(i.id)}">${esc(i.label)}</a></li>`).join('');

    container.appendChild(ul);
    subnav.appendChild(container);
    return subnav;
  }

  // Wire subnav behavior AFTER the view is in the DOM.
  function wireUpSubnav(root){
    const subnav = root.querySelector('.subnav');
    if(!subnav) return;

    const track = subnav.querySelector('.track');

    // IMPORTANT: Only enable drag for touch/pen so DESKTOP MOUSE CLICKS always work.
    if (track) enableDragScrollForTouchOnly(track);

    // Delegated CLICK (works on desktop + mobile)
    subnav.addEventListener('click', (e) => {
      const a = e.target.closest('a[data-scroll]');
      if (!a) return;
      e.preventDefault();
      activateChip(subnav, track, a); // highlight + scroll + auto-center chip
    });

    // Keyboard activation for accessibility (Enter/Space)
    subnav.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const a = e.target.closest('a[data-scroll]');
      if (!a) return;
      e.preventDefault();
      activateChip(subnav, track, a);
    });

    // Scrollspy: as the user scrolls, highlight the section nearest the center
    const ids = Array.from(subnav.querySelectorAll('a[data-scroll]')).map(a=>a.getAttribute('data-scroll'));
    initScrollSpy(ids, subnav);
  }

  // Activate a chip: visually highlight, scroll to section (centered), and center the chip itself.
  function activateChip(subnav, track, anchor){
    const id = anchor.getAttribute('data-scroll');

    // Immediate visual feedback
    subnav.querySelectorAll('a[data-scroll]').forEach(x=>{
      const on = x === anchor;
      x.classList.toggle('is-active', on);
      x.setAttribute('aria-current', on ? 'true' : 'false');
    });

    scrollToSectionCentered(id, subnav);
    centerActiveChip(track, anchor);
  }

  /* ===========================
     STORIES (expand/collapse)
     =========================== */

  // Build the inner HTML for a story array (multiple image + text blocks).
  // If no story provided, return empty string and nothing will render.
  function buildStoryHTML(story){
    if (!Array.isArray(story) || story.length === 0) return '';
    // Each block renders as an image (if any) + a paragraph.
    return story.map(block => `
      <div class="section" style="margin-top:8px">
        <div class="media">
          <div>
            ${block.text ? `<p>${esc(block.text)}</p>` : ''}
          </div>
          ${block.image ? imageHTML(block.image, block.imageAlt || '') : '<div></div>'}
        </div>
      </div>
    `).join('');
  }

  // A small, reusable Expand/Collapse control
  function expandableHTML(){
    return `
      <p>
        <button type="button" class="expand-toggle" aria-expanded="false" aria-controls="">
          Read more
        </button>
      </p>
    `;
  }

  // Wire the "Read more" button to show/hide the adjacent details panel
  function wireExpandable(button, detailsEl){
    if (!button || !detailsEl) return;

    // Give the details a unique ID so aria-controls is valid
    const uid = 'details-' + Math.random().toString(36).slice(2);
    detailsEl.id = uid;
    button.setAttribute('aria-controls', uid);

    const setState = (expanded) => {
      button.setAttribute('aria-expanded', String(expanded));
      button.textContent = expanded ? 'Show less' : 'Read more';
      detailsEl.hidden = !expanded;
    };

    button.addEventListener('click', () => {
      const now = button.getAttribute('aria-expanded') === 'true';
      setState(!now);
    });

    // Optional: close when pressing Escape while focus is within details
    const keyHandler = (e) => {
      if (e.key === 'Escape' && button.getAttribute('aria-expanded') === 'true'){
        setState(false);
        button.focus();
      }
    };
    detailsEl.addEventListener('keydown', keyHandler);

    // Cleanup when page changes
    state.cleanups.push(() => detailsEl.removeEventListener('keydown', keyHandler));
  }

  /* ===========================
     BEHAVIORS
     =========================== */

  // Persistent hamburger + drawer
  function setupMenu(){
    menuBtn.addEventListener('click', toggleMenu);
    document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeMenu(); });

    // Close drawer when clicking a route link
    navDrawer.addEventListener('click', (e)=>{
      const t = e.target.closest('a[data-route]');
      if(!t) return;
      closeMenu();
    });
  }
  function toggleMenu(){
    const open = navDrawer.classList.toggle('open');
    navDrawer.setAttribute('aria-hidden', String(!open));
    menuBtn.setAttribute('aria-expanded', String(open));
    if(open) navDrawer.querySelector('a')?.focus();
  }
  function closeMenu(){
    navDrawer.classList.remove('open');
    navDrawer.setAttribute('aria-hidden', 'true');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.focus();
  }

  // Reveal-on-scroll for .reveal elements
  function enableReveal(){
    const els = appEl.querySelectorAll('.reveal');
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    els.forEach(el => io.observe(el));
    state.observers.push(io);
  }

  // Lazy-load images that have data-src
  function enableLazyImages(){
    const imgs = appEl.querySelectorAll('img[data-src]');
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          io.unobserve(img);
        }
      });
    }, { rootMargin: '100px 0px', threshold: 0.01 });
    imgs.forEach(i => io.observe(i));
    state.observers.push(io);
  }

  // TOUCH/PEN-ONLY drag for the chip row (no mouse handling, so desktop clicks always work)
  function enableDragScrollForTouchOnly(el){
    // If browser doesn't support Pointer Events, we skip (most modern browsers do).
    if (!('PointerEvent' in window)) return;

    let isDown = false, startX = 0, startLeft = 0, id = 0, moved = 0;
    const threshold = 6; // px — movement under this counts as a "tap"

    el.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse') return;         // desktop mouse: NO drag handling
      isDown = true; moved = 0;
      startX = e.clientX; startLeft = el.scrollLeft;
      id = e.pointerId;
      try { el.setPointerCapture(id); } catch {}
      // On touch we don't mess with cursor or selection; keep it simple
    }, { passive: true });

    el.addEventListener('pointermove', e => {
      if(!isDown) return;
      if (e.pointerType === 'mouse') return;         // ignore mouse moves
      const dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      el.scrollLeft = startLeft - dx;                // drag horizontally
    }, { passive: true });

    el.addEventListener('pointerup', e => {
      if(!isDown) return;
      isDown = false;
      try { el.releasePointerCapture(id); } catch {}

      // If it was effectively a tap, synthesize activation on the link
      if (moved <= threshold){
        const a = e.target.closest('a[data-scroll]');
        if (a){
          const subnav = el.closest('.subnav');
          activateChip(subnav, el, a);
        }
      }
    }, { passive: true });

    el.addEventListener('pointercancel', () => { isDown = false; }, { passive: true });
    el.addEventListener('pointerleave',  () => { isDown = false; }, { passive: true });
  }

  // Compute the Y position just below the hero (used when switching routes)
  function headerBottom(){
    const hero = document.querySelector('.hero');
    const rect = hero.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return scrollTop + rect.top + 1;
  }

  // Keep CSS variable --banner-height in sync with actual top banner height
  function updateBannerHeight(){
    const b = document.querySelector('.top-banner');
    state.bannerHeight = b ? b.getBoundingClientRect().height : 64;
    document.documentElement.style.setProperty('--banner-height', `${state.bannerHeight}px`);
  }

  // Smoothly scroll so a section is centered within the visible area (beneath sticky header + subnav)
  function scrollToSectionCentered(id, subnavEl){
    const el = document.getElementById(id);
    if(!el) return;

    const subnavH = subnavEl
      ? subnavEl.getBoundingClientRect().height
      : (document.querySelector('.subnav')?.getBoundingClientRect().height || 0);

    const offsetTop    = state.bannerHeight + subnavH + 8;              // height of sticky chrome
    const visibleH     = Math.max(0, window.innerHeight - offsetTop);   // viewport below the sticky chrome
    const targetCenter = offsetTop + (visibleH / 2);                     // pixels from viewport top

    const r        = el.getBoundingClientRect();
    const elCenter = r.top + (r.height / 2);
    const y        = Math.max(0, window.pageYOffset + elCenter - targetCenter);

    window.scrollTo({ top: y, behavior: 'smooth' });

    // Small correction after images/fonts load and change heights
    setTimeout(() => {
      const r2 = el.getBoundingClientRect();
      const elCenter2 = r2.top + (r2.height / 2);
      const delta = elCenter2 - targetCenter;
      if (Math.abs(delta) > 4) {
        window.scrollTo({ top: Math.max(0, window.pageYOffset + delta), behavior: 'smooth' });
      }
    }, 120);
  }

  // Scrollspy: highlight the section whose center is nearest the visible center line
  function initScrollSpy(ids, subnav){
    const track = subnav.querySelector('.track');

    // Update chip visuals + center the active chip in its row
    const setActive = (id) => {
      let activeA = null;
      subnav.querySelectorAll('a[data-scroll]').forEach(a=>{
        const on = a.getAttribute('data-scroll') === id;
        a.classList.toggle('is-active', on);
        a.setAttribute('aria-current', on ? 'true' : 'false');
        if (on) activeA = a;
      });
      if (activeA && track) centerActiveChip(track, activeA);
    };

    let ticking = false;
    const update = () => {
      const subnavH = subnav ? subnav.getBoundingClientRect().height : 0;
      const offsetTop = state.bannerHeight + subnavH + 8;
      const visibleH  = Math.max(0, window.innerHeight - offsetTop);
      const centerLine = offsetTop + (visibleH / 2);

      let bestId = null, bestDist = Infinity;
      ids.forEach(id=>{
        const el = document.getElementById(id);
        if(!el) return;
        const r = el.getBoundingClientRect();
        const elCenter = r.top + (r.height / 2);
        const dist = Math.abs(elCenter - centerLine);
        if (dist < bestDist){ bestDist = dist; bestId = id; }
      });

      if(bestId) setActive(bestId);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { update(); ticking = false; });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    setTimeout(update, 0); // run once after paint

    // Remove listeners when page swaps
    state.cleanups.push(() => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    });
  }

  // Auto-center the active chip (only if the row overflows)
  function centerActiveChip(track, a){
    if (!track || !a) return;
    if (track.scrollWidth <= track.clientWidth) return; // nothing to do

    const targetLeft = a.offsetLeft - (track.clientWidth - a.offsetWidth) / 2;
    const clamped = Math.max(0, Math.min(targetLeft, track.scrollWidth - track.clientWidth));

    const leftVisible  = track.scrollLeft;
    const rightVisible = leftVisible + track.clientWidth;
    const chipLeft  = a.offsetLeft, chipRight = chipLeft + a.offsetWidth;

    const outOfView = chipLeft < leftVisible + 8 || chipRight > rightVisible - 8;
    if (outOfView) track.scrollTo({ left: clamped, behavior: 'smooth' });
  }

  /* ===========================
     HERO MISSION HIGHLIGHT
     =========================== */
  function applyMissionText(){
    const el = document.getElementById('missionText');
    const desired = 'We build in vitro models to study the mechanisms driving metastasis.';
    const text = (state.data?.site?.mission || desired).trim();

    // Pink phrase + trailing period
    let html = text.replace(/in vitro models/i, '<span class="hero-highlight">$&</span>');
    html = html.replace(/\.\s*$/, '<span class="hero-highlight">.</span>');
    el.innerHTML = html;
  }

  /* ===========================
     HELPERS
     =========================== */
  function sectionEl(){ const el = document.createElement('section'); el.className = 'section'; return el; }
  function div(cls=''){ const d=document.createElement('div'); if(cls) d.className=cls; return d; }
  function esc(str){ return (str ?? '').toString().replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s])); }
  function imageHTML(src, alt){ return src ? `<img data-src="${esc(src)}" alt="${esc(alt || '')}" loading="lazy" />` : '<div></div>'; }
  function infoBox(msg){ const box = div('card class-item reveal'); box.innerHTML = `<div class="max-w"><p>${esc(msg)}</p></div>`; return box; }
  function labelGroup(g){
    const map = { highschool:'High School', undergrad:'Undergraduate', grad:'Graduate', postdoc:'Postdoctoral' };
    return map[g] || g;
  }
  function slugify(s=''){ return s.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
  function formatContact(c){
    const lines = [
      c.address ? esc(c.address) : '',
      c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : '',
      c.phone ? `<a href="tel:${esc(c.phone)}">${esc(c.phone)}</a>` : ''
    ].filter(Boolean).join('<br/>');
    return `<address>${lines}</address>`;
  }
  function debounce(fn, ms=150){ let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), ms); }; }

})();
