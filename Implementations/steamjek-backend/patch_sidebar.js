// Inject hamburger icon and sidebar toggle logic
document.addEventListener('DOMContentLoaded', () => {
  const topbar = document.querySelector('.topbar');
  if (topbar) {
    const hamburger = document.createElement('button');
    hamburger.innerHTML = '☰';
    hamburger.className = 'btn btn-ghost btn-sm';
    hamburger.style.marginRight = '15px';
    hamburger.style.fontSize = '20px';
    hamburger.style.padding = '0 10px';
    hamburger.onclick = () => {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        if (sidebar.style.display === 'none') {
          sidebar.style.display = 'flex';
        } else {
          sidebar.style.display = 'none';
        }
      }
    };
    const titleDiv = topbar.querySelector('.tb-title') || topbar.firstElementChild;
    if (titleDiv && titleDiv.parentElement === topbar) {
      if (topbar.firstElementChild.classList && topbar.firstElementChild.classList.contains('tb-title')) {
        const wrap = document.createElement('div');
        wrap.style.display = 'flex';
        wrap.style.alignItems = 'center';
        topbar.insertBefore(wrap, titleDiv);
        wrap.appendChild(hamburger);
        wrap.appendChild(titleDiv);
      } else {
         topbar.insertBefore(hamburger, topbar.firstChild);
      }
    }
  }
});
