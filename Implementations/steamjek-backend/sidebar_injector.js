// Inject hamburger icon and sidebar toggle logic
document.addEventListener('DOMContentLoaded', () => {
  const style = document.createElement('style');
  style.innerHTML = `
    .sidebar { transition: transform 0.3s ease; }
    .sidebar.closed { transform: translateX(-100%); }
    .main { transition: margin-left 0.3s ease; }
    .layout.closed .main { margin-left: 0; }
    .hamburger-btn {
      background: none;
      border: none;
      color: var(--text, #fff);
      font-size: 24px;
      cursor: pointer;
      margin-right: 15px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `;
  document.head.appendChild(style);

  const topbar = document.querySelector('.topbar');
  if (topbar) {
    const hamburger = document.createElement('button');
    hamburger.innerHTML = '☰';
    hamburger.className = 'hamburger-btn';
    hamburger.onclick = () => {
      const sidebar = document.querySelector('.sidebar');
      const main = document.querySelector('.main');
      const layout = document.querySelector('.layout');
      if (sidebar && main) {
        sidebar.classList.toggle('closed');
        if (layout) {
          layout.classList.toggle('closed');
        } else {
          main.style.marginLeft = sidebar.classList.contains('closed') ? '0' : '230px';
        }
      }
    };
    
    // Instead of nested wrap, simply insert it before the title
    const titleDiv = topbar.querySelector('.tb-title');
    if (titleDiv) {
      const wrap = document.createElement('div');
      wrap.style.display = 'flex';
      wrap.style.alignItems = 'center';
      titleDiv.parentNode.insertBefore(wrap, titleDiv);
      wrap.appendChild(hamburger);
      wrap.appendChild(titleDiv);
    } else {
      topbar.insertBefore(hamburger, topbar.firstChild);
    }
  }
});
