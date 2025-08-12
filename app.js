/* McGheeLab SPA – subnav scrolling (fixed), scrollspy + auto-center, mission period pink */

(() => {
  const appEl = document.getElementById('app');
  const menuBtn = document.getElementById('menuBtn');
  const navDrawer = document.getElementById('site-nav');

  const state = { data: null, observers: [], cleanups: [], bannerHeight: 64 };

  // ---------- Init ----------
  document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('year').textContent = new Date().getFullYear();
    setupMenu();
    await loadData();

    // Hero + footer from JSON; hero uses pink highlight
    applyMissionText();
    document.getElementById('footerMission').textContent = state.data.site.mission;
    document.getElementById('footerContact').innerHTML = formatContact(state.data.site.contact);

    updateBannerHeight();
    window.addEventListener('resize', debounce(updateBannerHeight, 150));

    window.addEventListener('hashchange', onRouteChange);
    onRouteChange();

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const v = document.getElementById('heroVideo');
      if (v) { v.pause(); v.removeAttribute('src'); v.load(); }
    }
  });

  // ---------- Data ----------
  async function loadData(){
    try{
      const res = await fetch('content.json');
      state.data = await res.json();
    }catch{
      state.data = fallbackData();
    }
  }

  // ---------- Router ----------
  function onRouteChange(){
    const hash = window.location.hash || '#/mission';
    const [, route] = hash.split('/');
    render((route || 'mission').toLowerCase());
    setActiveLink((route || 'mission').toLowerCase());
  }

  function setActiveLink(page){
    document.querySelectorAll('#site-nav a[data-route]').forEach(a => {
      a.setAttribute('aria-current', a.dataset.route === page ? 'page' : 'false');
    });
  }

  async function render(page){
    // cleanup
    state.observers.forEach(o => o.disconnect()); state.observers = [];
    state.cleanups.forEach(fn => { try{ fn(); }catch{} }); state.cleanups = [];

    let view;
    switch(page){
      case 'mission':   view = renderMission(); break;
      case 'research':  view = renderResearch(); break;
      case 'projects':  view = renderProjects(); break;
      case 'team':      view = renderTeam(); break;
      case 'classes':   view = renderClasses(); break;
      case 'contact':   view = renderContact(); break;
      default:          view = renderNotFound();
    }

    appEl.innerHTML = ''; appEl.appendChild(view); appEl.focus({ preventScroll: true });

    wireUpSubnav(view);          // ✅ links, scrollspy, auto-center
    window.scrollTo({ top: headerBottom(), behavior: 'smooth' });

    enableReveal();
    enableLazyImages();
  }

  // ---------- Views ----------
  function renderMission(){
    const { missionPage } = state.data.pages;
    const wrap = sectionEl();
    const sections = missionPage?.sections || [];
    const links = sections.map(sec => ({ id: slugify(sec.slug || sec.title), label: sec.title }));
    wrap.appendChild(buildSubnav(links));

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
      wrap.appendChild(fallbackMessage('Update missionPage.sections in content.json'));
    }
    return wrap;
  }

  function renderResearch(){
    const { topics = [], references = [] } = state.data.pages.research || {};
    const wrap = sectionEl();
    const links = [...topics.map(t => ({ id: t.slug, label: t.title })), ...(references.length ? [{ id: 'references', label: 'References' }] : [])];
    wrap.appendChild(buildSubnav(links));

    topics.forEach(t=>{
      const art = div('section card reveal'); art.id = t.slug;
      art.innerHTML = `
        <div class="max-w">
          <h2>${esc(t.title)}</h2>
          <div class="media">
            <div>
              <p>${esc(t.summary)}</p>
              ${t.keywords?.length ? `<p>${t.keywords.map(k=>`<span class="badge">${esc(k)}</span>`).join(' ')}</p>` : ''}
            </div>
            ${imageHTML(t.image, t.imageAlt || t.title)}
          </div>
        </div>
      `;
      wrap.appendChild(art);
    });

    const refs = div('section card reveal'); refs.id = 'references';
    refs.innerHTML = `
      <div class="max-w">
        <h2>Selected References</h2>
        ${references?.length ? `<ol>${references.map(r => `
          <li><strong>${esc(r.title)}</strong><br/><span>${esc(r.authors || '')}</span> <em>${esc(r.journal || '')}</em> ${r.year ? `(${esc(r.year)})` : ''}${r.doi ? ` — <a href="${esc(r.doi)}" target="_blank" rel="noopener">DOI</a>` : ''}</li>
        `).join('')}</ol>` : '<p>No references yet.</p>'}
      </div>`;
    wrap.appendChild(refs);

    return wrap;
  }

  function renderProjects(){
    const { projects = [] } = state.data.pages.projects || {};
    const wrap = sectionEl();
    const links = projects.map(p => ({ id: p.slug, label: p.title }));
    wrap.appendChild(buildSubnav(links));

    const grid = div('max-w grid grid-fit-250');
    projects.forEach(p=>{
      const item = div('card class-item reveal project-card'); item.id = p.slug;
      item.innerHTML = `
        <div class="thumb">${imageHTML(p.image, p.imageAlt || p.title)}</div>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.summary)}</p>
        ${p.tags?.length ? `<p>${p.tags.map(t=>`<span class="badge">${esc(t)}</span>`).join(' ')}</p>` : ''}
      `;
      grid.appendChild(item);
    });
    wrap.appendChild(grid);
    return wrap;
  }

  function renderTeam(){
    const { team = {} } = state.data.pages;
    const wrap = sectionEl();
    const order = ['highschool','undergrad','grad','postdoc'];
    const links = order.filter(g => (team?.[g] || []).length).map(g => ({ id: `team-${g}`, label: labelGroup(g) }));
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

  function renderContact(){
    const { site } = state.data;
    const wrap = sectionEl();

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

    block.appendChild(formBox); block.appendChild(infoBox);
    wrap.appendChild(block);

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
    wrap.appendChild(fallbackMessage('Page not found.'));
    return wrap;
  }

  // ---------- Subnav (chips) ----------
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

  function wireUpSubnav(root){
    const subnav = root.querySelector('.subnav');
    if(!subnav) return;

    const track = subnav.querySelector('.track');

    // Click to scroll (don’t touch #/route)
    subnav.querySelectorAll('a[data-scroll]').forEach(a=>{
      a.addEventListener('click', (e)=>{
        e.preventDefault();
        const id = a.getAttribute('data-scroll');
        subnav.querySelectorAll('a[data-scroll]').forEach(x=>{
          const on = x === a;
          x.classList.toggle('is-active', on);
          x.setAttribute('aria-current', on ? 'true' : 'false');
        });
        scrollToSection(id, subnav);
        centerActiveChip(track, a);   // center on manual click too
      });
      // Keyboard support
      a.addEventListener('keydown', (e)=>{
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); a.click(); }
      });
    });

    // Drag/Swipe scrolling
    if (track) enableDragScroll(track);

    // Scrollspy highlight + auto-center
    const ids = Array.from(subnav.querySelectorAll('a[data-scroll]')).map(a=>a.getAttribute('data-scroll'));
    initScrollSpy(ids, subnav);
  }

  // ---------- Behaviors ----------
  function setupMenu(){
    menuBtn.addEventListener('click', toggleMenu);
    document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeMenu(); });
    navDrawer.addEventListener('click', (e)=>{
      const t = e.target.closest('a[data-route]'); if(!t) return; closeMenu();
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

  function enableDragScroll(el){
    let isDown = false, startX = 0, startLeft = 0, id = 0;
    el.addEventListener('pointerdown', e => {
      isDown = true; startX = e.clientX; startLeft = el.scrollLeft;
      id = e.pointerId; el.setPointerCapture(id); el.style.cursor = 'grabbing';
    });
    el.addEventListener('pointermove', e => {
      if(!isDown) return;
      el.scrollLeft = startLeft - (e.clientX - startX);
    });
    const end = () => { isDown = false; if(id){ try{ el.releasePointerCapture(id); }catch{} } el.style.cursor=''; };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointerleave', end);
  }

  function headerBottom(){
    const hero = document.querySelector('.hero');
    const rect = hero.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return scrollTop + rect.top + 1;
  }

  function updateBannerHeight(){
    const b = document.querySelector('.top-banner');
    state.bannerHeight = b ? b.getBoundingClientRect().height : 64;
    document.documentElement.style.setProperty('--banner-height', `${state.bannerHeight}px`);
  }

  function scrollToSection(id, subnavEl){
    const el = document.getElementById(id);
    if(!el) return;

    // Heights of fixed elements at the top (banner + subnav)
    const subnavH = subnavEl
      ? subnavEl.getBoundingClientRect().height
      : (document.querySelector('.subnav')?.getBoundingClientRect().height || 0);
    const offsetTop = state.bannerHeight + subnavH + 8; // padding

    // Visible area height below the sticky UI
    const visibleH = Math.max(0, window.innerHeight - offsetTop);

    // Element rect
    const rect = el.getBoundingClientRect();
    const elCenter = rect.top + (rect.height / 2);

    // We want the element's center to align with the center of the visible area
    const targetCenter = offsetTop + (visibleH / 2);

    // Compute absolute scrollTop target
    const y = Math.max(
      0,
      window.pageYOffset + elCenter - targetCenter
    );

    window.scrollTo({ top: y, behavior: 'smooth' });
  }


  // Scrollspy: highlight the section nearest the sticky top, and center chip if needed
  function initScrollSpy(ids, subnav){
    const track = subnav.querySelector('.track');

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
      const visibleH = Math.max(0, window.innerHeight - offsetTop);
      const centerLine = offsetTop + (visibleH / 2);

      let bestId = null;
      let bestDist = Infinity;

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
    setTimeout(update, 0);

    state.cleanups.push(() => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    });
  }
  // Center the active chip in its track when overflowed
  function centerActiveChip(track, a){
    if (!track || !a) return;
    if (track.scrollWidth <= track.clientWidth) return; // no overflow

    const targetLeft = a.offsetLeft - (track.clientWidth - a.offsetWidth) / 2;
    const clamped = Math.max(0, Math.min(targetLeft, track.scrollWidth - track.clientWidth));

    // Only scroll if the chip is cut off at either edge
    const leftVisible = track.scrollLeft;
    const rightVisible = leftVisible + track.clientWidth;
    const chipLeft = a.offsetLeft, chipRight = chipLeft + a.offsetWidth;

    const outOfView = chipLeft < leftVisible + 8 || chipRight > rightVisible - 8;
    if (outOfView) track.scrollTo({ left: clamped, behavior: 'smooth' });
  }

  // ---------- Mission text highlight (phrase + period in pink) ----------
  function applyMissionText(){
    const el = document.getElementById('missionText');
    const desired = 'We build in vitro models to study the mechanisms driving metastasis.';
    const text = (state.data?.site?.mission || desired).trim();

    // Pink phrase
    let html = text.replace(/in vitro models/i, '<span class="hero-highlight">$&</span>');
    // Pink period at end (if present)
    html = html.replace(/\.\s*$/, '<span class="hero-highlight">.</span>');
    el.innerHTML = html;
  }

  // ---------- Helpers ----------
  function sectionEl(){ const el = document.createElement('section'); el.className = 'section'; return el; }
  function div(cls=''){ const d=document.createElement('div'); if(cls) d.className=cls; return d; }
  function esc(str){ return (str ?? '').toString().replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s])); }
  function imageHTML(src, alt){ return src ? `<img data-src="${esc(src)}" alt="${esc(alt || '')}" loading="lazy" />` : '<div></div>'; }
  function fallbackMessage(msg){ const box = div('card class-item reveal'); box.innerHTML = `<div class="max-w"><p>${esc(msg)}</p></div>`; return box; }
  function labelGroup(g){ const map = { highschool:'High School', undergrad:'Undergraduate', grad:'Graduate', postdoc:'Postdoctoral' }; return map[g] || g; }
  function slugify(s=''){ return s.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
  function formatContact(c){
    const lines = [ c.address ? esc(c.address) : '', c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : '', c.phone ? `<a href="tel:${esc(c.phone)}">${esc(c.phone)}</a>` : '' ]
      .filter(Boolean).join('<br/>');
    return `<address>${lines}</address>`;
  }
  function debounce(fn, ms=150){ let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), ms); }; }

  function fallbackData(){
    return {
      site: {
        mission: 'We build in vitro models to study the mechanisms driving metastasis.',
        contact: { address: '123 Science Dr, Tucson, AZ 85701', email: 'info@mcgheelab.org', phone: '(520) 555-0123' }
      },
      pages: {}
    };
  }
})();
