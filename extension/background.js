console.log('Background script started');

let activeTabId = null;
let activeUrl = null;
let startTime = null;
let totalTrackedTime = 0;

// Load previously saved totalTrackedTime from storage on startup
chrome.storage.local.get(['totalTrackedTime'], (result) => {
  if (result.totalTrackedTime) {
    totalTrackedTime = result.totalTrackedTime;
  }
});

function sendLog(url, duration) {
  if (!url || duration <= 0) return; // Validate URL and duration

  console.log('Sending log:', url, duration);
  fetch('http://localhost:3000/api/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, duration })
  })
  .then(res => {
    if (!res || !res.headers) {
      console.log('No headers in response, status:', res ? res.status : 'no response');
      return null;
    }
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return res.json();
    } else {
      console.log('Response status:', res.status);
      return null;
    }
  })
  .then(data => {
    if (data) {
      console.log('Log sent response:', data);
    }
  })
  .catch(err => {
    console.error('Error sending log:', err);
    console.log('Fetch might be failing due to network issues or CORS.');
  });
}

function updateActiveTab(tabId, url) {
  if (activeUrl && startTime) {
    const duration = Date.now() - startTime;

    console.log(`Tab switched. Previous URL: ${activeUrl}, duration: ${duration} ms`);

    sendLog(activeUrl, duration);

    // Update totalTrackedTime and save to storage
    totalTrackedTime += duration;
    chrome.storage.local.set({ totalTrackedTime }, () => {
      console.log('Total tracked time updated:', totalTrackedTime);
    });
  }

  activeTabId = tabId;
  activeUrl = url;
  startTime = Date.now();

  console.log(`Tracking new URL: ${url}`);
}

// When active tab changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    updateActiveTab(activeInfo.tabId, tab.url);
  } catch (err) {
    console.error('Error getting active tab:', err);
  }
});

// When window focus changes
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Chrome window lost focus
    if (activeUrl && startTime) {
      const duration = Date.now() - startTime;
      console.log(`Window lost focus. URL: ${activeUrl}, duration: ${duration} ms`);
      sendLog(activeUrl, duration);

      totalTrackedTime += duration;
      chrome.storage.local.set({ totalTrackedTime }, () => {
        console.log('Total tracked time updated:', totalTrackedTime);
      });

      activeUrl = null;
      startTime = null;
    }
  } else {
    try {
      const tabs = await chrome.tabs.query({ active: true, windowId });
      if (tabs.length > 0) {
        updateActiveTab(tabs[0].id, tabs[0].url);
      }
    } catch (err) {
      console.error('Error querying active tab on focus change:', err);
    }
  }
});

// Initialize tracking on extension start
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs.length > 0) {
    updateActiveTab(tabs[0].id, tabs[0].url);
  }
});

// Optional: Listen for messages from popup to reset totalTrackedTime (not mandatory)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === 'resetTime') {
    totalTrackedTime = 0;
    chrome.storage.local.set({ totalTrackedTime });
    sendResponse({ status: 'reset' });
  }
});

