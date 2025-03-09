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

async function initializeUI() {
    const result = await storage.get(metrics);
    metrics.forEach(metric => {
        const value = result[metric] || 50;
        const valueDisplay = document.getElementById(`${metric}Value`);
        valueDisplay.textContent = `${value}%`;

        applyColorClass(`${metric}Value`, value);
    });
    updateBadges();

    document.getElementById('save').addEventListener('click', saveSettings);
}

function applyColorClass(elementId, value) {
    const element = document.getElementById(elementId);
    element.classList.remove('value-low', 'value-medium', 'value-high');

    if (value <= 33) {
        element.classList.add('value-low'); // Red low values (0-33%)
    } else if (value <= 66) {
        element.classList.add('value-medium'); // Yellow medium values (34-66%)
    } else {
        element.classList.add('value-high'); // Green  high values (67-100%)
    }
}

async function saveSettings() {
    const settings = {};
    metrics.forEach(metric => {
        settings[metric] = parseInt(document.getElementById(`${metric}Value`).textContent);
    });

    await storage.set(settings);
    const saveButton = document.getElementById('save');
    saveButton.textContent = 'Hold tight...';
    setTimeout(() => {
        saveButton.textContent = 'Get results';
    }, 2000);
}

function updateBadges() {
    const badgeContainer = document.getElementById('badges');
    if (!badgeContainer) return;
    badgeContainer.innerHTML = '';

    const values = metrics.map(metric => parseInt(document.getElementById(`${metric}Value`).textContent));
    const average = values.reduce((a, b) => a + b, 0) / values.length;

    if (average >= 70) {
        addBadge(badges.balancedDiet);
    }
    if (parseInt(document.getElementById('factDensityValue').textContent) >= 80) {
        addBadge(badges.factChecker);
    }
    if (parseInt(document.getElementById('perspectiveVitaminsValue').textContent) >= 80) {
        addBadge(badges.perspectiveSeeker);
    }

    if (!document.querySelector('style[data-badges]')) {
        const style = document.createElement('style');
        style.setAttribute('data-badges', 'true');
        style.textContent = `
            .badge {
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                padding: 15px;
                border-radius: 8px;
                text-align: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                border: 1px solid #dee2e6;
                transition: transform 0.2s, box-shadow 0.2s;
                cursor: default;
            }
            .badge:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.15);
            }
            .badge h4 {
                margin: 0 0 8px 0;
                color: #495057;
                font-size: 16px;
            }
            .badge p {
                margin: 0;
                font-size: 13px;
                color: #6c757d;
                line-height: 1.4;
            }
            @keyframes badgeAppear {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }
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

document.addEventListener('DOMContentLoaded', initializeUI);
