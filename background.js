chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "analyzeContent") {
        fetchAnalysis(request.text)
            .then(data => sendResponse({ result: data }))
            .catch(error => sendResponse({ error: error.message }));
        return true; 
    }
});

async function fetchAnalysis(text) {
    const apiKey = "AIzaSyC2uGwNzkF75xpNc0rmP5PGP-ChYZxXs0U";

    const response = await fetch(`?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [
                { role: "user", parts: [{ text: `Analyze the following content and return a JSON with fields: factDensity, biasLevel, emotionalManipulation, diversity, complexity, sourceCredibility. Content: "${text}"` }] }
            ]
        })
    });

    const data = await response.json();

    if (data.candidates && data.candidates.length > 0) {
        try {
            return JSON.parse(data.candidates[0].content.parts[0].text);
        } catch (error) {
            throw new Error("Invalid JSON response from Gemini");
        }
    } else {
        throw new Error("No valid response from Gemini API");
    }
}
