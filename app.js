/* McGheeLab SPA – minimal, dependency-free
   - Top (banner + hero) never reloads
   - Body swaps based on #/route
   - Content comes from content.json
*/

(() => {
  const appEl = document.getElementById('app');
  const menuBtn = document.getElementById('menuBtn');
  const navDrawer = document.getElementById('site-nav');

  const state = {
    data: null,
    observers: [],
    bannerHeight: 64
  };

  // ---------- Init ----------
  document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('year').textContent = new Date().getFullYear();

    setupMenu();
    await loadData();

    // Set static bits from JSON
    document.getElementById('missionText').textContent = state.data.site.mission;
    document.getElementById('footerMission').textContent = state.data.site.mission;
    document.getElementById('footerContact').innerHTML = formatContact(state.data.site.contact);

    // Compute banner height for sticky subnav offsets
    updateBannerHeight();
    window.addEventListener('resize', debounce(updateBannerHeight, 150));

    // Router
    window.addEventListener('hashchange', onRouteChange);
    onRouteChange();

    // Respect reduced motion
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
    }catch(err){
      console.error('Failed to load content.json', err);
      state.data = fallbackData();
    }
  }

  // ---------- Router ----------
  function onRouteChange(){
    const hash = window.location.hash || '#/mission';
    const [, route] = hash.split('/'); // route after "#/"
    const page = (route || 'mission').toLowerCase();

    render(page);
    setActiveLink(page);
  }

  function setActiveLink(page){
    document.querySelectorAll('#site-nav a[data-route]').forEach(a => {
      a.setAttribute('aria-current', a.dataset.route === page ? 'page' : 'false');
    });
  }

  async function render(page){
    // Clear observers from previous page
    state.observers.forEach(o => o.disconnect());
    state.observers = [];

    // Build view
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

    appEl.innerHTML = '';
    appEl.appendChild(view);

    // Focus main for accessibility
    appEl.focus({ preventScroll: true });

    // Scroll to just below hero on page change
    window.scrollTo({ top: headerBottom(), behavior: 'smooth' });

    // Observe reveal elements + lazy images
    enableReveal();
    enableLazyImages();
  }

  // ---------- Views ----------
  function renderMission(){
    const { missionPage } = state.data.pages;
    const wrap = sectionEl();

    if (missionPage?.sections?.length){
      missionPage.sections.forEach(sec => {
        const s = div('section card reveal');
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

    // Sticky subnav for quick-jump
    const subnav = div('subnav reveal');
    subnav.innerHTML = `
      <ul>
        ${topics.map(t=>`<li><a href="#" data-scroll="${esc(t.slug)}">${esc(t.title)}</a></li>`).join('')}
      </ul>
    `;
    wrap.appendChild(subnav);

    // Attach scroll handlers
    subnav.querySelectorAll('a[data-scroll]').forEach(a=>{
      a.addEventListener('click', (e)=>{
        e.preventDefault();
        const id = a.getAttribute('data-scroll');
        scrollToSection(id);
      });
    });

    topics.forEach(t=>{
      const art = div('section card reveal');
      art.id = t.slug;
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

    // References block
    const refs = div('section card reveal');
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

  function renderProjects(){
    const { projects = [] } = state.data.pages.projects || {};
    const wrap = sectionEl();

    const grid = div('max-w grid grid-fit-250');
    projects.forEach(p=>{
      const item = div('card class-item reveal');
      item.id = p.slug;
      item.innerHTML = `
        ${imageHTML(p.image, p.imageAlt || p.title)}
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
    order.forEach(group=>{
      const people = team?.[group] || [];
      const section = div('section reveal');
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

    if (classesPage?.intro){
      const intro = div('section card reveal');
      intro.innerHTML = `<div class="max-w"><h2>Classes</h2><p>${esc(classesPage.intro)}</p></div>`;
      wrap.appendChild(intro);
    }

    const grid = div('max-w grid grid-fit-250');
    (classesPage.courses || []).forEach(c=>{
      const card = div('card class-item reveal');
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

    const block = div('max-w grid');
    const formBox = div('card class-item reveal');
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

    const infoBox = div('card class-item reveal');
    infoBox.innerHTML = `
      <h2>Info</h2>
      ${formatContact(site.contact)}
    `;

    block.appendChild(formBox);
    block.appendChild(infoBox);
    wrap.appendChild(block);

    // Simple mailto handler
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

  // ---------- Behaviors ----------
  function setupMenu(){
    menuBtn.addEventListener('click', toggleMenu);
    document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeMenu(); });

    // Close when clicking a nav link
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

  function headerBottom(){
    // Where the page body should start after route changes
    const hero = document.querySelector('.hero');
    const rect = hero.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return scrollTop + rect.top + 1; // +1 to move past the boundary
  }

  function updateBannerHeight(){
    const b = document.querySelector('.top-banner');
    state.bannerHeight = b ? b.getBoundingClientRect().height : 64;
    document.documentElement.style.setProperty('--banner-height', `${state.bannerHeight}px`);
  }

  function scrollToSection(id){
    const el = document.getElementById(id);
    if(!el) return;
    const y = el.getBoundingClientRect().top + window.pageYOffset - (state.bannerHeight + 12);
    window.scrollTo({ top: y, behavior: 'smooth' });
  }

  // ---------- Helpers ----------
  function sectionEl(){ const el = document.createElement('section'); el.className = 'section'; return el; }
  function div(cls=''){ const d=document.createElement('div'); if(cls) d.className=cls; return d; }
  function esc(str){ return (str ?? '').toString().replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s])); }
  function imageHTML(src, alt){
    if(!src) return '<div></div>';
    return `
      <img data-src="${esc(src)}" alt="${esc(alt || '')}" loading="lazy" />
    `;
  }
  function fallbackMessage(msg){
    const box = div('card class-item reveal'); box.innerHTML = `<div class="max-w"><p>${esc(msg)}</p></div>`; return box;
  }
  function labelGroup(g){
    const map = { highschool:'High School', undergrad:'Undergraduate', grad:'Graduate', postdoc:'Postdoctoral' };
    return map[g] || g;
  }
  function formatContact(c){
    const lines = [
      c.address ? esc(c.address) : '',
      c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : '',
      c.phone ? `<a href="tel:${esc(c.phone)}">${esc(c.phone)}</a>` : ''
    ].filter(Boolean).join('<br/>');
    return `<address>${lines}</address>`;
  }
  function debounce(fn, ms=150){
    let t; return (...args) => { clearTimeout(t); t=setTimeout(()=>fn(...args), ms); };
  }

  // Minimal fallback if JSON fails
  function fallbackData(){
    return {
      site: {
        mission: 'We build simple, open, and robust bioengineering tools—microfluidics, bioprinting, and biomechanics—to make high‑impact science accessible.',
        contact: { address: '123 Science Dr, Tucson, AZ 85701', email: 'info@mcgheelab.org', phone: '(520) 555-0123' }
      },
      pages: {}
    };
  }
})();
