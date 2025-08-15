// Theme toggle + year
(function(){
  const root = document.documentElement;
  const key = 'theme';
  const saved = localStorage.getItem(key);
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  if(saved === 'light' || (!saved && prefersLight)){ root.classList.add('light'); }
  document.getElementById('themeToggle').addEventListener('click', () => {
    root.classList.toggle('light');
    localStorage.setItem(key, root.classList.contains('light') ? 'light' : 'dark');
  });
  document.getElementById('year').textContent = new Date().getFullYear();
})();
