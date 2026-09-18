const requests = [
  { icon: '⌁', type: 'plumbing', title: 'Reparação de canalização', id: '#RS-1048', date: '16 Set 2024', status: 'progress', label: 'Em andamento' },
  { icon: 'ϟ', type: 'electrical', title: 'Instalação elétrica', id: '#RS-1045', date: '12 Set 2024', status: 'waiting', label: 'A aguardar orçamento' },
  { icon: '✥', type: 'repair', title: 'Montagem de móveis', id: '#RS-1039', date: '08 Set 2024', status: 'scheduled', label: 'Agendado' }
];
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

function requestMarkup(request) {
  return `<article class="request-row" data-status="${request.status}"><div class="service-icon ${request.type}">${request.icon}</div><div class="request-info"><strong>${request.title}</strong><span>Pedido ${request.id} · ${request.date}</span></div><span class="status ${request.status}"><i></i> ${request.label}</span><button class="row-arrow" aria-label="Ver pedido">→</button></article>`;
}

function renderRequests(filter = 'all') {
  const list = $('.all-requests');
  if (!list) return;
  list.innerHTML = requests.filter((item) => filter === 'all' || item.status === filter).map(requestMarkup).join('');
}

function showView(viewName) {
  $$('.view').forEach((view) => view.classList.toggle('hidden', view.dataset.page !== viewName));
  $$('.nav-link').forEach((link) => link.classList.toggle('active', link.dataset.view === viewName));
  const current = viewName === 'inicio' ? 'Visão geral' : ({ pedidos: 'Os meus pedidos', orcamentos: 'Orçamentos', mensagens: 'Mensagens' }[viewName] || viewName);
  $('.breadcrumb strong').textContent = current;
  $('#sidebar').classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openModal() { $('#modal').classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
function closeModal() { $('#modal').classList.add('hidden'); document.body.style.overflow = ''; }

renderRequests();
$$('[data-view]').forEach((link) => link.addEventListener('click', (event) => { event.preventDefault(); showView(link.dataset.view); }));
$('#new-request').addEventListener('click', openModal);
$('#new-request-2').addEventListener('click', openModal);
$('#tip-action').addEventListener('click', openModal);
$('#close-modal').addEventListener('click', closeModal);
$('#modal').addEventListener('click', (event) => { if (event.target.id === 'modal') closeModal(); });
$('#menu-toggle').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
$('#status-filter').addEventListener('change', (event) => renderRequests(event.target.value));
$('#request-form').addEventListener('submit', (event) => {
  event.preventDefault();
  closeModal();
  event.target.reset();
  const toast = $('#toast');
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3500);
});
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !$('#modal').classList.contains('hidden')) closeModal(); });
