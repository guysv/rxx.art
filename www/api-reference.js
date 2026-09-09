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
const sectionLabels = new Map([...toc.querySelectorAll('a')].map(link => [link.hash.slice(1), link.textContent]));
const tree = document.createElement('ul');
const targets = [];
let section;
let subsection;

function addTocItem(target, label, parent, branch = false) {
  const item = document.createElement('li');
  item.className = branch ? 'api-toc-branch' : 'api-toc-api';
  const link = document.createElement('a');
  link.href = `#${target.id}`;
  link.textContent = label;
  if (!branch) {
    const parts = label.split(/(?<=\.|::)/);
    if (parts.length > 1) link.replaceChildren(parts[0], document.createElement('wbr'), parts.slice(1).join(''));
  }
  item.append(link);
  parent.append(item);
  let children;
  if (branch) {
    children = document.createElement('ul');
    item.append(children);
  }
  return { target, item, link, children };
}

document.querySelectorAll('h2[id], h3[id], details.api-entry').forEach(target => {
  let record;
  if (target.matches('h2')) {
    section = addTocItem(target, sectionLabels.get(target.id), tree, true);
    subsection = null;
    record = section;
  } else if (target.matches('h3')) {
    subsection = addTocItem(target, target.textContent, section.children, true);
    record = subsection;
  } else {
    const name = target.querySelector('.api-signature').textContent.split('(')[0];
    record = addTocItem(target, name, (subsection || section).children);
  }
  targets.push({ ...record, section, subsection });
});
toc.replaceChildren(tree);
toc.classList.add('api-toc');

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

const observer = new IntersectionObserver(scheduleTocUpdate, { rootMargin: '-32px 0px 0px 0px' });
targets.forEach(({ target }) => observer.observe(target));
new ResizeObserver(scheduleTocUpdate).observe(tree);
// Also cover large scroll jumps and movement within long expanded entries.
window.addEventListener('scroll', scheduleTocUpdate, { passive: true });
window.addEventListener('resize', scheduleTocUpdate);
document.addEventListener('toggle', scheduleTocUpdate, true);
document.fonts.ready.then(scheduleTocUpdate);
revealLinkedApi();
updateToc();
