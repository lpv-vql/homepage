document.addEventListener("DOMContentLoaded", () => {
  const targets = document.querySelectorAll(".fade-in");

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    rootMargin: "0px",
    threshold: 0.2
  });

  targets.forEach(target => observer.observe(target));
});


const colorVariables = [
  '--background-color',
  '--text-color',
  '--border-color',
  '--accent-color',
  '--icon-color',
  '--footer-text-color',
  '--footer-background-color'
];

const themes = {
  LIGHT: {
    '--background-color': '#ffffff',
    '--text-color': '#333333',
    '--border-color': '#d6d6d6',
    '--accent-color': '#3b82f6',
    '--icon-color': '#000000',
    '--footer-text-color': '#777777',
    '--footer-background-color': '#fdfdfd'
  },
  DARK: {
    '--background-color': '#000000',
    '--text-color': '#eeeeee',
    '--border-color': '#888888',
    '--accent-color': '#629eff',
    '--icon-color': '#ffffff',
    '--footer-text-color': '#bbbbbb',
    '--footer-background-color': '#111111'
  }
};

const root = document.documentElement;
const pickerContainer = document.getElementById('picker-container');

initTheme();

function initTheme() {
  const savedColors = localStorage.getItem('custom-theme-colors');
  let currentTheme = localStorage.getItem('current-base-theme');

  if (savedColors) {
    const colors = JSON.parse(savedColors);
    root.setAttribute('data-theme', currentTheme || 'LIGHT');
    Object.keys(colors).forEach(v => applyColor(v, colors[v]));
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    currentTheme = prefersDark ? 'DARK' : 'LIGHT';
    setBaseTheme(currentTheme);
  }

  createPickers();
}

function setBaseTheme(themeName) {
  root.setAttribute('data-theme', themeName);
  localStorage.setItem('current-base-theme', themeName);
  
  const defaultColors = themes[themeName];
  Object.keys(defaultColors).forEach(v => {
    applyColor(v, defaultColors[v]);
  });
  
  saveAllToStorage();
  updatePickerValues();
}

function applyColor(variable, value) {
  root.style.setProperty(variable, value);
}

function saveAllToStorage() {
  const currentColors = {};
  colorVariables.forEach(v => {
    currentColors[v] = getComputedStyle(root).getPropertyValue(v).trim();
  });
  localStorage.setItem('custom-theme-colors', JSON.stringify(currentColors));
}

function createPickers() {
  pickerContainer.innerHTML = '';
  
  colorVariables.forEach(v => {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'color';
    input.id = `picker-${v}`;
    
    const currentColor = getComputedStyle(root).getPropertyValue(v).trim();
    input.value = convertToHex(currentColor);

    input.addEventListener('input', (e) => {
      applyColor(v, e.target.value);
      saveAllToStorage();
    });

    label.appendChild(input);
    label.appendChild(document.createTextNode(v.replace('--', '')));
    pickerContainer.appendChild(label);
  });
}

function updatePickerValues() {
  colorVariables.forEach(v => {
    const input = document.getElementById(`picker-${v}`);
    if (input) {
      const currentColor = getComputedStyle(root).getPropertyValue(v).trim();
      input.value = convertToHex(currentColor);
    }
  });
}

function convertToHex(color) {
  if (color.startsWith('#')) return color;
  const rgb = color.match(/\d+/g);
  if (!rgb) return '#000000';
  return '#' + rgb.map(x => {
    const hex = parseInt(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

document.getElementById('btn-light').addEventListener('click', () => setBaseTheme('LIGHT'));
document.getElementById('btn-dark').addEventListener('click', () => setBaseTheme('DARK'));
