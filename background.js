importScripts('cluster.js');

function calculateFactDensity(text) {
  const sentences = text.split('.');
  if (!sentences.length) return 0;
  
  const factSentences = sentences.filter(sentence => 
    [...sentence].some(char => !isNaN(parseInt(char)))
  ).length;
  
  return Math.round((factSentences / sentences.length) * 100 * 100) / 100;
}

function calculateBiasContent(text) {
  const polarizingTerms = [
    'absolutely', 'amazing', 'awful', 'best', 'brilliant', 'catastrophic',
    'definitely', 'extraordinary', 'fantastic', 'horrible', 'incredible',
    'outrageous', 'ridiculous', 'terrible', 'wonderful', 'worst'
  ];
  
  const words = text.toLowerCase().split(/\s+/);
  const polarizingCount = words.filter(word => 
    polarizingTerms.includes(word)
  ).length;
  
  return Math.min(Math.round((polarizingCount / words.length) * 500 * 100) / 100, 100);
}

function calculateEmotionalCalories(text) {
  const emotionalTerms = [
    'love', 'hate', 'angry', 'happy', 'sad', 'excited', 'disappointed',
    'frustrated', 'anxious', 'fear', 'hope', 'worry', 'proud', 'ashamed'
  ];
  
  const words = text.toLowerCase().split(/\s+/);
  const emotionalCount = words.filter(word => 
    emotionalTerms.includes(word)
  ).length;
  
  return Math.min(Math.round((emotionalCount / words.length) * 300 * 100) / 100, 100);
}

function calculateComplexityIndex(text) {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  if (!words.length) return 0;
  
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  return Math.min(Math.round((avgWordLength - 3) * 20 * 100) / 100, 100);
}

function calculateSourceMinerals(url) {
  const urlLower = url.toLowerCase();
  if (urlLower.includes('nytimes')) return 95;
  if (urlLower.includes('bbc')) return 90;
  if (urlLower.includes('cnn')) return 80;
  if (urlLower.includes('wikipedia')) return 85;
  return 70;
}

function calculatePerspectiveVitamins(text) {
  const uniqueWords = new Set(text.toLowerCase().split(/\s+/));
  return Math.min(Math.round(uniqueWords.size / 10 * 100) / 100, 100);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "analyzeContent") {
    const analysis = analyzeContent(message.text);
    sendResponse({ result: analysis });
    return true;
  }
  else if (message.action === "analyzeCurrentPage") {
    const content = message.content;
    
    const analysis = {
      fact_density: calculateFactDensity(content.text),
      bias_content: calculateBiasContent(content.text),
      emotional_calories: calculateEmotionalCalories(content.text),
      perspective_vitamins: calculatePerspectiveVitamins(content.text),
      complexity_index: calculateComplexityIndex(content.text),
      source_minerals: calculateSourceMinerals(content.url),
      title: content.title,
      url: content.url
    };
    
    chrome.storage.local.set({ currentPageAnalysis: analysis }, () => {
      chrome.runtime.sendMessage({
        action: "analysisComplete",
        analysis: analysis
      });
      
      chrome.tabs.sendMessage(sender.tab.id, {
        action: "updateFabData",
        analysis: analysis
      });
    });
  }
  return true;
});

function analyzeContent(text) {
  const article = { text, url: "http://example.com" };
  return analyze_article(article);
}
