function revealLinkedApi() {
  let id;
  try {
    id = decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return;
  }
  const entry = document.getElementById(id);
  if (!entry?.matches('details.api-entry')) return;
  entry.open = true;
  entry.scrollIntoView();
}

window.addEventListener('hashchange', revealLinkedApi);

document.addEventListener('click', (event) => {
  const anchor = event.target.closest('.api-anchor, .api-toc-api > a');
  if (anchor) {
    // Also reopen an entry when its fragment is already in the URL.
    if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
      document.getElementById(anchor.hash.slice(1)).open = true;
    }
    return;
  }
  const fields = event.target.closest('.api-fields');
  if (!fields || event.target.closest('a, button, input, select, textarea')) return;
  // Keep the section open when selecting documentation to copy it.
  if (window.getSelection()?.isCollapsed === false) return;
  const entry = fields.closest('details.api-entry');
  if (!entry?.open) return;
  entry.open = false;
  entry.querySelector('summary').focus({ preventScroll: true });
});

const toc = document.querySelector('.nav-toc');
const tree = toc.querySelector('ul');
const targets = [...toc.querySelectorAll('a')].map(link => {
  const item = link.parentElement;
  const sectionItem = item.closest('.api-toc > ul > li');
  const subsectionItem = item.closest('.api-toc > ul > li > ul > .api-toc-branch');
  return {
    target: document.getElementById(link.hash.slice(1)), item, link,
    section: { item: sectionItem },
    subsection: subsectionItem ? { item: subsectionItem } : null,
  };
});

// Browsers with native scroll tracking expand the static tree entirely in CSS.
const nativeToc = CSS.supports('scroll-target-group: auto') &&
  CSS.supports('selector(a:target-current)');

const sidebar = window.matchMedia('(min-width: 1100px)');
let active;
let pending = false;

function updateToc() {
  pending = false;
  // The last heading or API above this reading line owns the active branch.
  let next = targets[0];
  for (const record of targets) {
    if (record.target.getBoundingClientRect().top > 32) break;
    next = record;
  }
  if (next !== active) {
    if (active) {
      active.link.removeAttribute('aria-current');
      active.section.item.classList.remove('is-active', 'has-active-subsection');
      active.subsection?.item.classList.remove('is-active');
    }
    active = next;
    active.link.setAttribute('aria-current', 'location');
    active.section.item.classList.add('is-active');
    active.section.item.classList.toggle('has-active-subsection', Boolean(active.subsection));
    active.subsection?.item.classList.add('is-active');
  }

  if (sidebar.matches) {
    // Keep the initial position unless the expanded tree needs more height.
    const contentHeight = tree.getBoundingClientRect().height + 8;
    const top = Math.max(24, Math.min(336, window.innerHeight - 24 - contentHeight));
    toc.style.setProperty('--api-toc-top', `${top}px`);
  }

  // Scroll only the sidebar, leaving the document's reading position intact.
  if (sidebar.matches && !toc.matches(':hover, :focus-within')) {
    const bounds = toc.getBoundingClientRect();
    const linkBounds = active.link.getBoundingClientRect();
    if (linkBounds.top < bounds.top) toc.scrollTop += linkBounds.top - bounds.top;
    else if (linkBounds.bottom > bounds.bottom) toc.scrollTop += linkBounds.bottom - bounds.bottom;
  }
}

function scheduleTocUpdate() {
  if (pending) return;
  pending = true;
  requestAnimationFrame(updateToc);
}

if (!nativeToc) {
  const observer = new IntersectionObserver(scheduleTocUpdate, { rootMargin: '-32px 0px 0px 0px' });
  targets.forEach(({ target }) => observer.observe(target));
  new ResizeObserver(scheduleTocUpdate).observe(tree);
  window.addEventListener('scroll', scheduleTocUpdate, { passive: true });
  window.addEventListener('resize', scheduleTocUpdate);
  document.addEventListener('toggle', scheduleTocUpdate, true);
  document.fonts.ready.then(scheduleTocUpdate);
  updateToc();
}
revealLinkedApi();
