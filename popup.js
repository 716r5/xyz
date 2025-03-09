const storage = {
    async get(keys) {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            return new Promise(resolve => chrome.storage.sync.get(keys, resolve));
        }
        const result = {};
        keys.forEach(key => {
            result[key] = localStorage.getItem(key) || 50;
        });
        return result;
    },
    async set(items) {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            return new Promise(resolve => chrome.storage.sync.set(items, resolve));
        }
        Object.entries(items).forEach(([key, value]) => {
            localStorage.setItem(key, value);
        });
    }
};

const THEME_KEY = 'preferredTheme';

const metrics = [
    'factDensity',
    'biasContent',
    'emotionalCalories',
    'perspectiveVitamins',
    'complexityIndex',
    'sourceMinerals'
];

const badges = {
    balancedDiet: { name: 'Balanced Diet', description: 'Consuming diverse content' },
    factChecker: { name: 'Fact Checker', description: 'High fact density preference' },
    perspectiveSeeker: { name: 'Perspective Seeker', description: 'Values diverse viewpoints' }
};

function updateUI(analysis) {
  document.getElementById('factDensityValue').textContent = `${analysis.fact_density}%`;
  document.getElementById('biasContentValue').textContent = `${analysis.bias_content}%`;
  document.getElementById('emotionalCaloriesValue').textContent = `${analysis.emotional_calories}%`;
  document.getElementById('perspectiveVitaminsValue').textContent = `${analysis.perspective_vitamins}%`;
  document.getElementById('complexityIndexValue').textContent = `${analysis.complexity_index}%`;
  document.getElementById('sourceMineralsValue').textContent = `${analysis.source_minerals}%`;
  
  applyColorClass('factDensityValue', analysis.fact_density);
  applyColorClass('biasContentValue', analysis.bias_content);
  applyColorClass('emotionalCaloriesValue', analysis.emotional_calories);
  applyColorClass('perspectiveVitaminsValue', analysis.perspective_vitamins);
  applyColorClass('complexityIndexValue', analysis.complexity_index);
  applyColorClass('sourceMineralsValue', analysis.source_minerals);
}

async function initializeUI() {
    const result = await storage.get([...metrics, THEME_KEY]);
    
    const savedTheme = result[THEME_KEY] || 
        (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(savedTheme);
    
    chrome.storage.local.get(['currentPageAnalysis'], (result) => {
        if (result.currentPageAnalysis) {
            updateUI(result.currentPageAnalysis);
        } else {
            metrics.forEach(metric => {
                const value = result[metric] || 50;
                const valueDisplay = document.getElementById(`${metric}Value`);
                valueDisplay.textContent = `${value}%`;
                applyColorClass(`${metric}Value`, value);
            });
        }
    });
    
    updateBadges();

    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('save').addEventListener('click', refreshAnalysis);
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.textContent = '☀️';
        }
    } else {
        document.body.classList.remove('dark-theme');
        document.getElementById('theme-toggle').textContent = '🌙';
    }
}

async function toggleTheme() {
    const isDark = document.body.classList.contains('dark-theme');
    const newTheme = isDark ? 'light' : 'dark';
    await storage.set({ [THEME_KEY]: newTheme });
    applyTheme(newTheme);
}

function applyColorClass(elementId, value) {
    const element = document.getElementById(elementId);
    element.classList.remove('value-low', 'value-medium', 'value-high');

    if (value <= 33) {
        element.classList.add('value-low');
    } else if (value <= 66) {
        element.classList.add('value-medium'); 
    } else {
        element.classList.add('value-high');
    }
}

async function refreshAnalysis() {
    const saveButton = document.getElementById('save');
    saveButton.textContent = 'Analyzing...';
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs && tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "getPageContent"}, function(response) {
                if (response && response.content) {
                    chrome.runtime.sendMessage({
                        action: "analyzeCurrentPage",
                        content: response.content
                    });
                }
            });
        }
    });
    
    setTimeout(() => {
        saveButton.textContent = 'Get results';
    }, 2000);
}

function updateBadges() {
    const badgeContainer = document.getElementById('badges');
    if (!badgeContainer) return;
    badgeContainer.innerHTML = '';

    chrome.storage.local.get(['currentPageAnalysis'], (result) => {
        if (result.currentPageAnalysis) {
            if (result.currentPageAnalysis.fact_density >= 80) {
                addBadge(badges.factChecker);
            }
            if (result.currentPageAnalysis.perspective_vitamins >= 80) {
                addBadge(badges.perspectiveSeeker);
            }
            
            const values = [
                result.currentPageAnalysis.fact_density,
                result.currentPageAnalysis.bias_content,
                result.currentPageAnalysis.emotional_calories,
                result.currentPageAnalysis.perspective_vitamins,
                result.currentPageAnalysis.complexity_index,
                result.currentPageAnalysis.source_minerals
            ];
            
            const average = values.reduce((a, b) => a + b, 0) / values.length;
            if (average >= 70) {
                addBadge(badges.balancedDiet);
            }
        }
    });
}

function addBadge(badge) {
    const badgeElement = document.createElement('div');
    badgeElement.className = 'badge';
    badgeElement.style.animation = 'badgeAppear 0.3s ease-out forwards';
    badgeElement.innerHTML = `
        <h4>🏆 ${badge.name}</h4>
        <p>${badge.description}</p>
    `;
    document.getElementById('badges').appendChild(badgeElement);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "analysisComplete") {
      updateUI(message.analysis);
      updateBadges();
  }
});

document.addEventListener('DOMContentLoaded', initializeUI);
