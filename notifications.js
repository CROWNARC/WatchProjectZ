// notifications.js
const notifications = [
  {
    id: 1,
    title: "New Feature Added!",
    message: "You can now request new anime to be added to our collection",
    date: new Date(Date.now() - 259200000).toISOString(),
    read: false
  },
  {
  id: 2,
  title: "Platform in Testing Phase",
  message: `Welcome to the early release of our web platform! Please be aware that this site is currently in V1 testing, and many features are still under development. At the moment, we’re only integrated with the Dailymotion model. Your feedback is invaluable—if you encounter any issues or missing functionality, please let us know so we can improve. In the next testing phase, we plan to introduce an enhanced model and additional capabilities. Thank you for helping us build a better experience!`,
  date: new Date().toISOString(),
  image: "https://i.pinimg.com/originals/e3/ee/f0/e3eef0b4441925a54923dc00f7ef7d36.gif",
  read: false
}
];

// Initialize notifications
function initNotifications() {
  let storedNotifications = JSON.parse(localStorage.getItem('notifications'));
  
  if (!storedNotifications || storedNotifications.length === 0) {
    localStorage.setItem('notifications', JSON.stringify(notifications));
    storedNotifications = notifications;
  }
  
  updateNotificationBadge();
}

// Add new notification
function addNotification(title, message, image = null) {
  const newNotification = {
    id: Date.now(),
    title,
    message,
    image,
    date: new Date().toISOString(),
    read: false
  };
  
  const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
  notifications.unshift(newNotification);
  localStorage.setItem('notifications', JSON.stringify(notifications));
  updateNotificationBadge();
  
  // Update UI if dropdown is open
  if (document.querySelector('.notification-dropdown').classList.contains('active')) {
    renderNotifications();
  }
  
  return newNotification;
}

// Mark notification as read
function markNotificationAsRead(id) {
  const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
  const notificationIndex = notifications.findIndex(n => n.id === id);
  
  if (notificationIndex !== -1 && !notifications[notificationIndex].read) {
    notifications[notificationIndex].read = true;
    localStorage.setItem('notifications', JSON.stringify(notifications));
    updateNotificationBadge();
  }
}

// Mark all notifications as read
function markAllNotificationsAsRead() {
  const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
  notifications.forEach(notification => {
    notification.read = true;
  });
  localStorage.setItem('notifications', JSON.stringify(notifications));
  updateNotificationBadge();
  
  // Update UI
  renderNotifications();
}

// Get unread notifications count
function getUnreadCount() {
  const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
  return notifications.filter(n => !n.read).length;
}

// Update notification badge
function updateNotificationBadge() {
  const badge = document.querySelector('.notification-badge');
  if (!badge) return;
  
  const unreadCount = getUnreadCount();
  badge.textContent = unreadCount > 9 ? "9+" : unreadCount;
  badge.style.display = unreadCount > 0 ? 'flex' : 'none';
}

// Render notifications dropdown with sorting by ID descending
function renderNotifications() {
    const container = document.querySelector('.notification-list');
    if (!container) return;
    
    // Get notifications and sort by ID descending
    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    const sortedNotifications = [...notifications].sort((a, b) => b.id - a.id);
    
    container.innerHTML = '';
    
    if (sortedNotifications.length === 0) {
        container.innerHTML = `
            <div class="empty-notifications">
                <i class="fas fa-bell-slash"></i>
                <p>No notifications yet</p>
            </div>
        `;
        return;
    }
    
    sortedNotifications.forEach(notification => {
        const notificationEl = document.createElement('div');
        notificationEl.className = `notification-item ${notification.read ? '' : 'unread'}`;
        notificationEl.dataset.id = notification.id;
        
        notificationEl.innerHTML = `
            ${notification.image ? `
                <div class="notification-image">
                    <img src="${notification.image}" alt="${notification.title}">
                </div>
            ` : ''}
            <div class="notification-content">
                <h4>${notification.title}</h4>
                <p>${notification.message}</p>
                <div class="notification-meta">
                    <span>${formatNotificationDate(notification.date)}</span>
                    ${!notification.read ? '<span class="unread-dot"></span>' : ''}
                </div>
            </div>
        `;
        
        container.appendChild(notificationEl);
    });
}

// Format notification date
function formatNotificationDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initNotifications();
  renderNotifications();
  
  // Toggle notifications dropdown
  const notifBtn = document.getElementById('notif-btn');
  const notifDropdown = document.querySelector('.notification-dropdown');
  
  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle('active');
      renderNotifications();
    });
    
    // Mark as read when clicking notification
    document.addEventListener('click', (e) => {
      const notificationItem = e.target.closest('.notification-item');
      if (notificationItem) {
        const id = parseInt(notificationItem.dataset.id);
        markNotificationAsRead(id);
        notificationItem.classList.remove('unread');
        updateNotificationBadge();
      }
      
      // Close dropdown when clicking outside
      if (!e.target.closest('.notification-container')) {
        notifDropdown.classList.remove('active');
      }
    });
    
    // Mark all as read
    const markAllReadBtn = document.getElementById('mark-all-read');
    if (markAllReadBtn) {
      markAllReadBtn.addEventListener('click', () => {
        markAllNotificationsAsRead();
      });
    }
  }
});

// Export for testing/adding notifications
window.addNotification = addNotification;