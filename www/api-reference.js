document.addEventListener('click', (event) => {
  const fields = event.target.closest('.api-fields');
  if (!fields || event.target.closest('a, button, input, select, textarea')) return;
  // Keep the section open when selecting documentation to copy it.
  if (window.getSelection()?.isCollapsed === false) return;
  const entry = fields.closest('details.api-entry');
  if (!entry?.open) return;
  entry.open = false;
  entry.querySelector('summary').focus({ preventScroll: true });
});
