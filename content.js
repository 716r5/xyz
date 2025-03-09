function extractText() {
    return document.body.innerText;  
}

chrome.runtime.sendMessage({ action: "analyzeContent", text: extractText() }, response => {
    if (response.result) {
        displayNutritionLabel(response.result);
    }
});

function displayNutritionLabel(data) {
    const label = document.createElement("div");
    label.id = "Lazy Bird";
    label.innerHTML = `
      <div style="background: white; border: 1px solid black; padding: 10px; position: fixed; bottom: 20px; right: 20px; z-index: 10000;">
        <h4>Digital Nutrition Label</h4>
        <p>Fact Density: ${data.factDensity}%</p>
        <p>Bias Content: ${data.biasLevel}</p>
        <p>Emotional Calories: ${data.emotionalManipulation}</p>
        <p>Perspective Vitamins: ${data.diversity}</p>
        <p>Complexity Index: ${data.complexity}</p>
        <p>Source Minerals: ${data.sourceCredibility}</p>
      </div>
    `;
    document.body.appendChild(label);
}

class NutritionLabel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="${chrome.runtime.getURL('content/styles.css')}">
      <div class="label-container">
        <div class="label-header">
          <h2>Content Nutrition Facts</h2>
          <button id="close-label">×</button>
        </div>
        <div class="metric-grid"></div>
      </div>
    `;
  }
}

const createFAB = () => {
  const fab = document.createElement('button');
  fab.id = 'nutrition-fab';
  fab.innerHTML = `
    <svg width="24" height="24">
      <use href="${chrome.runtime.getURL('assets/label-icon.svg')}#icon"/>
    </svg>
  `;
  
  fab.addEventListener('click', () => {
    const label = document.createElement('nutrition-label');
    document.body.appendChild(label);
    analyzeContent(label);
  });

  document.body.appendChild(fab);
};

const analyzeContent = (labelElement) => {
  const content = document.body.innerText;
  const metrics = {
    readability: Math.floor(Math.random() * 100),
    sentiment: calculateSentiment(content),
    media: document.querySelectorAll('img, video').length,
    links: document.querySelectorAll('a[href]').length,
    wordCount: content.split(/\s+/).length
  };

  const grid = labelElement.shadowRoot.querySelector('.metric-grid');
  grid.innerHTML = Object.entries(metrics).map(([key, value]) => `
    <div class="metric">
      <span class="metric-label">${formatLabel(key)}</span>
      <span class="metric-value">${value}</span>
    </div>
  `).join('');

  labelElement.shadowRoot.getElementById('close-label').addEventListener('click', () => {
    labelElement.remove();
  });
};

const formatLabel = (str) => str.replace(/([A-Z])/g, ' $1').toUpperCase();
const calculateSentiment = (text) => ['Positive', 'Neutral', 'Negative'][Math.floor(Math.random() * 3)];

document.addEventListener('DOMContentLoaded', createFAB);
