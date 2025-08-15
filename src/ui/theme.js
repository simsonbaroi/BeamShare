// Theme Management
export class ThemeManager {
  constructor() {
    this.theme = 'auto';
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  }
  
  init() {
    // Load saved theme
    this.loadTheme();
    
    // Set up theme toggle
    this.setupThemeToggle();
    
    // Listen for system theme changes
    this.mediaQuery.addEventListener('change', () => {
      if (this.theme === 'auto') {
        this.updateThemeDisplay();
      }
    });
    
    // Apply initial theme
    this.updateThemeDisplay();
  }
  
  setupThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        this.toggleTheme();
      });
    }
  }
  
  toggleTheme() {
    const currentTheme = this.getCurrentTheme();
    this.setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  }
  
  setTheme(theme) {
    this.theme = theme;
    this.saveTheme();
    this.updateThemeDisplay();
  }
  
  getCurrentTheme() {
    if (this.theme === 'auto') {
      return this.mediaQuery.matches ? 'dark' : 'light';
    }
    return this.theme;
  }
  
  updateThemeDisplay() {
    const isDark = this.getCurrentTheme() === 'dark';
    const body = document.body;
    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');
    
    if (isDark) {
      body.classList.add('dark');
      if (sunIcon) sunIcon.classList.add('hidden');
      if (moonIcon) moonIcon.classList.remove('hidden');
    } else {
      body.classList.remove('dark');
      if (sunIcon) sunIcon.classList.remove('hidden');
      if (moonIcon) moonIcon.classList.add('hidden');
    }
  }
  
  saveTheme() {
    try {
      localStorage.setItem('beamshare-theme', this.theme);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  }
  
  loadTheme() {
    try {
      const saved = localStorage.getItem('beamshare-theme');
      if (saved && ['light', 'dark', 'auto'].includes(saved)) {
        this.theme = saved;
      }
    } catch (error) {
      console.warn('Failed to load theme preference:', error);
    }
  }
}