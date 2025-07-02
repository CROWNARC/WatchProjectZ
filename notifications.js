// notifications.js
const NOTIFICATION_VERSION = 1;
const notifications = [
  { id: 1, title: "New Feature Added!", message: "You can now request new anime to be added to our collection", date: new Date(Date.now() - 259200000).toISOString(), read: false },
  { id: 2, title: "Platform in Testing Phase", message: `Welcome to the early release of our web platform! Please be aware that this site is currently in V1 testing, and many features are still under development. At the moment, we’re only integrated with the Dailymotion model. Your feedback is invaluable—if you encounter any issues or missing functionality, please let us know so we can improve. In the next testing phase, we plan to introduce an enhanced model and additional capabilities. Thank you for helping us build a better experience!`, date: new Date().toISOString(), image: "https://i.pinimg.com/originals/e3/ee/f0/e3eef0b4441925a54923dc00f7ef7d36.gif", read: false },
  { id: 3, title: "Report Link Section Added", message: `I have fixed the issue with the report link not working and added the entire section. It is now working properly. Thank you!`, date: new Date().toISOString(), read: false },
  { id: 4, title: "Improving UI", message: "for better looks and experience", date: new Date().toISOString(), read: false }
];

function initNotifications() {
  const storedRaw = localStorage.getItem('notifications');
  const stored = storedRaw ? JSON.parse(storedRaw) : [];

  // Build map for read status and separate custom
  const readMap = {};
  stored.forEach(n => { readMap[n.id] = n.read; });
  const custom = stored.filter(n => !notifications.some(bi => bi.id === n.id));

  // Merge built-ins with stored read flags
  const mergedBuiltIns = notifications.map(bi => ({
    ...bi,
    read: readMap[bi.id] !== undefined ? readMap[bi.id] : bi.read
  }));

  // Combine built-ins + custom notifications
  const combined = [...mergedBuiltIns, ...custom];

  // Save version and data
  localStorage.setItem('notification_version', NOTIFICATION_VERSION);
  localStorage.setItem('notifications', JSON.stringify(combined));

  updateNotificationBadge();
}

function addNotification(title, message, image = null) {
  const newNotification = { id: Date.now(), title, message, image, date: new Date().toISOString(), read: false };
  const all = JSON.parse(localStorage.getItem('notifications')) || [];
  all.unshift(newNotification);
  localStorage.setItem('notifications', JSON.stringify(all));
  updateNotificationBadge();
  if (document.querySelector('.notification-dropdown').classList.contains('active')) renderNotifications();
  return newNotification;
}

function markNotificationAsRead(id) {
  const list = JSON.parse(localStorage.getItem('notifications')) || [];
  const idx = list.findIndex(n => n.id === id);
  if (idx > -1 && !list[idx].read) { list[idx].read = true; localStorage.setItem('notifications', JSON.stringify(list)); updateNotificationBadge(); }
}

function markAllNotificationsAsRead() {
  const list = JSON.parse(localStorage.getItem('notifications')) || [];
  list.forEach(n => n.read = true);
  localStorage.setItem('notifications', JSON.stringify(list));
  updateNotificationBadge(); renderNotifications();
}

function getUnreadCount() {
  return (JSON.parse(localStorage.getItem('notifications')) || []).filter(n => !n.read).length;
}

function updateNotificationBadge() {
  const badge = document.querySelector('.notification-badge');
  if (!badge) return;
  const count = getUnreadCount();
  badge.textContent = count > 9 ? '9+' : count;
  badge.style.display = count > 0 ? 'flex' : 'none';
}

function renderNotifications() {
  const container = document.querySelector('.notification-list'); if (!container) return;
  const stored = JSON.parse(localStorage.getItem('notifications')) || [];
  const sorted = [...stored].sort((a, b) => b.id - a.id);
  container.innerHTML = '';
  if (sorted.length === 0) {
    container.innerHTML = `<div class="empty-notifications"><i class="fas fa-bell-slash"></i><p>No notifications yet</p></div>`; return;
  }
  sorted.forEach(n => {
    const item = document.createElement('div'); item.className = `notification-item ${n.read ? '' : 'unread'}`; item.dataset.id = n.id;
    item.innerHTML = `${n.image ? `<div class="notification-image"><img src="${n.image}" alt="${n.title}"></div>` : ''}<div class="notification-content"><h4>${n.title}</h4><p>${n.message}</p><div class="notification-meta"><span>${formatNotificationDate(n.date)}</span>${!n.read ? '<span class="unread-dot"></span>' : ''}</div></div>`;
    container.appendChild(item);
  });
}

function formatNotificationDate(dateString) {
  const date = new Date(dateString); const now = new Date(); const diffMs = now - date; const mins = Math.floor(diffMs/60000);
  if (mins < 1) return 'Just now'; if (mins < 60) return `${mins} min ago`; const hrs = Math.floor(mins/60);
  if (hrs < 24) return `${hrs} hr ago`; const days = Math.floor(hrs/24);
  if (days < 7) return `${days} day${days>1?'s':''} ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

document.addEventListener('DOMContentLoaded', () => {
  const storedVersion = parseInt(localStorage.getItem('notification_version'), 10) || 0;
  if (storedVersion < NOTIFICATION_VERSION) {
    initNotifications();
  }
  renderNotifications();

  const notifBtn = document.getElementById('notif-btn');
  const notifDropdown = document.querySelector('.notification-dropdown');
  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener('click', e => { e.stopPropagation(); notifDropdown.classList.toggle('active'); renderNotifications(); });
    document.addEventListener('click', e => {
      const item = e.target.closest('.notification-item');
      if (item) { markNotificationAsRead(parseInt(item.dataset.id)); item.classList.remove('unread'); updateNotificationBadge(); }
      if (!e.target.closest('.notification-container')) notifDropdown.classList.remove('active');
    });
    const markAll = document.getElementById('mark-all-read');
    if (markAll) markAll.addEventListener('click', markAllNotificationsAsRead);
  }
});

window.addNotification = addNotification;
