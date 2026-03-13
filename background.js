// Initialize context menus
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "auto-incognito-parent",
    title: "Auto Incognito",
    contexts: ["link", "page"]
  });

  chrome.contextMenus.create({
    id: "open-incognito",
    parentId: "auto-incognito-parent",
    title: "Open in Incognito",
    contexts: ["link", "page"]
  });

  chrome.contextMenus.create({
    id: "add-to-list",
    parentId: "auto-incognito-parent",
    title: "Add to List",
    contexts: ["link", "page"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const urlString = info.linkUrl || info.pageUrl;
  if (!urlString) return;

  if (info.menuItemId === "open-incognito") {
    // Only allow http/https to be opened in incognito to prevent errors on internal pages
    if (urlString.startsWith('http')) {
      chrome.windows.create({
        url: urlString,
        incognito: true
      });
    } else {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: showToast,
        args: ["Browser pages cannot be opened in Incognito"]
      });
    }
  } else if (info.menuItemId === "add-to-list") {
    try {
      const url = new URL(urlString);
      const domain = url.hostname.toLowerCase();
      
      chrome.storage.local.get(['incognitoList'], (result) => {
        let list = result.incognitoList || [];
        const exists = list.some(item => (typeof item === 'string' ? item : item.domain) === domain);
        
        if (!exists) {
          list.push({ domain: domain, enabled: true, isWildcard: false });
          chrome.storage.local.set({ incognitoList: list }, () => {
            // Show toast notification with white domain
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: showToast,
              args: [`<span style="color: #fff; font-weight: 600;">${domain}</span> added to Auto Incognito list`]
            });
          });
        }
      });
    } catch (e) {
      console.error("Invalid URL for adding to list:", urlString);
    }
  }
});

// Toast Notification Function (to be injected)
function showToast(htmlMessage) {
  const toastId = 'ain-toast-' + Date.now();
  const toast = document.createElement('div');
  toast.id = toastId;
  toast.innerHTML = htmlMessage;
  toast.style.cssText = `
    position: fixed;
    bottom: 25px;
    right: 25px;
    background: #0a0a0a;
    color: #ff4444;
    padding: 12px 22px;
    border: 1px solid rgba(255, 68, 68, 0.4);
    border-radius: 4px;
    font-family: 'Segoe UI', Tahoma, sans-serif;
    font-size: 14px;
    font-weight: 500;
    z-index: 2147483647;
    box-shadow: 0 8px 24px rgba(0,0,0,0.6);
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    pointer-events: none;
    letter-spacing: 0.5px;
    text-shadow: 1px 1px 0px rgba(0,0,0,0.5);
  `;
  
  document.body.appendChild(toast);
  
  // Animate in
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  // Animate out and remove
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => {
      const el = document.getElementById(toastId);
      if (el) el.remove();
    }, 400);
  }, 3500);
}

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Only handle main frame navigation
  if (details.frameId !== 0) return;

  // Ignore navigation from within incognito windows
  const tab = await chrome.tabs.get(details.tabId).catch(() => null);
  if (!tab || tab.incognito) return;

  const url = new URL(details.url);
  const hostname = url.hostname.toLowerCase();

  chrome.storage.local.get(['incognitoList', 'globalEnabled'], (result) => {
    // Check if global filter is enabled (defaults to true)
    const isGlobalEnabled = result.globalEnabled !== false;
    if (!isGlobalEnabled) return;

    const list = result.incognitoList || [];
    
    // Check if hostname matches any item
    const isMatched = list.some(item => {
      const domain = typeof item === 'string' ? item : item.domain;
      const isEnabled = typeof item === 'string' ? true : item.enabled;
      const isWildcard = typeof item === 'string' ? false : !!item.isWildcard;

      if (!isEnabled) return false;

      if (isWildcard) {
        try {
          // Convert wildcard string to regex: escape dots, change '*' to '.*'
          const escaped = domain.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
          const re = new RegExp('^' + escaped + '$', 'i');
          return re.test(hostname);
        } catch (e) {
          return false;
        }
      } else {
        return hostname.includes(domain);
      }
    });
    
    if (isMatched) {
      // Close the current tab
      chrome.tabs.remove(details.tabId);
      
      // Open the URL in a new incognito window
      chrome.windows.create({
        url: details.url,
        incognito: true
      });
    }
  });
}, { url: [{ schemes: ['http', 'https'] }] });
