function extractPageContent() {
  const paragraphs = document.querySelectorAll('p');
  let text = '';
  paragraphs.forEach(p => {
    if (p.textContent.trim().length > 0) {
      text += p.textContent.trim() + ' ';
    }
  });
  
  const url = window.location.href;
  const title = document.title;
  
  return {
    text: text,
    url: url,
    title: title
  };
}

function analyzeCurrentPage() {
  const pageContent = extractPageContent();
  
  if (pageContent.text.length > 250) {
    chrome.runtime.sendMessage({
      action: "analyzeCurrentPage",
      content: pageContent
    });
  }
}

window.addEventListener('load', () => {
  setTimeout(analyzeCurrentPage, 1000);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateFabData") {
    const analysis = message.analysis;
    
    const fab = document.getElementById('lazybird-fab');
    if (fab) {
      fab.setAttribute('data-fact-density', analysis.fact_density);
      fab.setAttribute('data-bias-content', analysis.bias_content);
      fab.setAttribute('data-emotional-calories', analysis.emotional_calories);
      fab.setAttribute('data-perspective-vitamins', analysis.perspective_vitamins);
      fab.setAttribute('data-complexity-index', analysis.complexity_index);
      fab.setAttribute('data-source-minerals', analysis.source_minerals);
      
      const label = document.getElementById('lazybird-nutrition-label');
      if (label && label.style.display !== 'none') {
        updateNutritionLabel(analysis);
      }
    }
  }
});

function updateNutritionLabel(analysis) {
  const label = document.getElementById('lazybird-nutrition-label');
  if (!label) return;
  
  label.querySelector('.fact-density-value').textContent = `${analysis.fact_density}%`;
  label.querySelector('.bias-content-value').textContent = `${analysis.bias_content}%`;
  label.querySelector('.emotional-calories-value').textContent = `${analysis.emotional_calories}%`;
  label.querySelector('.perspective-vitamins-value').textContent = `${analysis.perspective_vitamins}%`;
  label.querySelector('.complexity-index-value').textContent = `${analysis.complexity_index}%`;
  label.querySelector('.source-minerals-value').textContent = `${analysis.source_minerals}%`;
}

chrome.runtime.sendMessage({ action: "analyzeContent", text: extractPageContent().text }, response => {
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
        <p>Fact Density: ${data.fact_density}%</p>
        <p>Bias Content: ${data.bias_content}%</p>
        <p>Emotional Calories: ${data.emotional_calories}%</p>
        <p>Perspective Vitamins: ${data.perspective_vitamins}%</p>
        <p>Complexity Index: ${data.complexity_index}%</p>
        <p>Source Minerals: ${data.source_minerals}%</p>
      </div>
    `;
    document.body.appendChild(label);
}

class NutritionLabel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="${chrome.runtime.getURL('styles.css')}">
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
  chrome.runtime.sendMessage({ action: "analyzeContent", text: content }, response => {
    if (response.result) {
      const metrics = response.result;
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
    }
  });
};

const formatLabel = (str) => str.replace(/([A-Z])/g, ' $1').toUpperCase();
const calculateSentiment = (text) => ['Positive', 'Neutral', 'Negative'][Math.floor(Math.random() * 3)];

document.addEventListener('DOMContentLoaded', createFAB);
