document.addEventListener('DOMContentLoaded', () => {
    // Load stats from storage (mocked for now, or implement storage in content.js)
    chrome.storage.local.get(['maskedCount', 'promptsCount'], (result) => {
        document.getElementById('masked-count').textContent = result.maskedCount || 0;
        document.getElementById('prompts-count').textContent = result.promptsCount || 0;
    });

    // Dashboard button
    document.getElementById('dashboard-btn').addEventListener('click', () => {
        chrome.tabs.create({ url: 'http://localhost:5173' });
    });
});
