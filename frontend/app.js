const api = (path, opts = {}) =>
  fetch('http://localhost:5000/api' + path, { credentials: 'include', ...opts });

loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  const res = await api('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id: sid.value, password: pass.value })
  });
  if (res.ok) {
    loginForm.style.display = 'none';
    dashboard.style.display = 'block';
    loadData();
  } else alert('Invalid login');
});

async function loadData() {
  const data = await (await api('/me')).json();
  name.textContent = data[0].full_name;
  subjects.innerHTML = '<tr><th>Code</th><th>Subject</th><th>Date</th><th>Time</th></tr>' +
    data.map(r => `<tr><td>${r.code}</td><td>${r.title}</td><td>${r.exam_date}</td><td>${r.exam_time}</td></tr>`).join('');
}

function downloadSlip() {
  window.open('http://localhost:5000/api/permission-slip', '_blank');
}