document.addEventListener('DOMContentLoaded', () => {
  const domainInput = document.getElementById('domainInput');
  const domainList = document.getElementById('domainList');
  const addBtn = document.getElementById('addBtn');
  const addCurrentBtn = document.getElementById('addCurrentBtn');
  const helpBtn = document.getElementById('helpBtn');
  const helpSection = document.getElementById('helpSection');
  const instructionText = document.getElementById('instructionText');
  const mainHeader = document.getElementById('mainHeader');
  const globalToggle = document.getElementById('globalToggle');
  const globalToggleLabel = document.getElementById('globalToggleLabel');

  mainHeader.dataset.version = `v${chrome.runtime.getManifest().version}`;

  // --- Start All Startup Functions ---

  // 1. Load the list and global state from storage
  chrome.storage.local.get(['incognitoList', 'globalEnabled'], (result) => {
    const list = result.incognitoList || [];
    const isGlobalEnabled = result.globalEnabled !== false;
    
    globalToggle.checked = isGlobalEnabled;
    updateGlobalLabel(isGlobalEnabled);
    renderList(list);
  });

  // 2. Start the typing animation
  const textToType = "Add a website and you're good to go!";
  let i = 0;
  function typeWriter() {
    if (i < textToType.length) {
      instructionText.innerHTML += textToType.charAt(i);
      i++;
      setTimeout(typeWriter, 20); // Typing speed
    }
  }
  typeWriter();

  // --- End Startup Functions ---

  // Global Toggle Listener
  globalToggle.onchange = () => {
    const isEnabled = globalToggle.checked;
    chrome.storage.local.set({ globalEnabled: isEnabled });
    updateGlobalLabel(isEnabled);
  };

  function updateGlobalLabel(isEnabled) {
    globalToggleLabel.textContent = `Auto Incognito ${isEnabled ? 'Enabled' : 'Disabled'}`;
  }


  // Help Section Toggle
  helpBtn.onclick = () => {
    const isHidden = helpSection.classList.toggle('hidden');
    helpBtn.textContent = isHidden ? 'Help' : 'Close';
  };

  // Function to add domain
  function addDomain(domain) {
    if (!domain) return;
    domain = domain.trim().toLowerCase();
    
    const isWildcard = domain.includes('*');
    if (!isWildcard) {
      try {
        if (domain.includes('://')) {
          domain = new URL(domain).hostname;
        } else if (domain.includes('/')) {
          domain = domain.split('/')[0];
        }
      } catch(e) {}
    }

    chrome.storage.local.get(['incognitoList'], (result) => {
      let list = result.incognitoList || [];
      const exists = list.some(item => (typeof item === 'string' ? item : item.domain) === domain);
      
      if (!exists) {
        list.push({ domain: domain, enabled: true, isWildcard: isWildcard });
        chrome.storage.local.set({ incognitoList: list }, () => {
          renderList(list);
          domainInput.value = '';
        });
      }
    });
  }

  // Event Listeners for Adding
  domainInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addDomain(domainInput.value);
  });

  addBtn.onclick = () => addDomain(domainInput.value);

  addCurrentBtn.onclick = async () => {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (tab && tab.url) {
      try {
        const url = new URL(tab.url);
        if (url.protocol.startsWith('http')) {
          addDomain(url.hostname);
        }
      } catch (e) {}
    }
  };

  // Function to render the list
  function renderList(list) {
    domainList.innerHTML = '';
    list.forEach((item, index) => {
      const domain = typeof item === 'string' ? item : item.domain;
      const isEnabled = typeof item === 'string' ? true : item.enabled;
      const isWildcard = typeof item === 'string' ? false : !!item.isWildcard;

      const li = document.createElement('li');
      if (!isEnabled) li.classList.add('disabled-item');
      
      const domainInfo = document.createElement('div');
      domainInfo.className = 'domain-info';

      if (!isWildcard) {
        const img = document.createElement('img');
        img.className = 'favicon';
        img.src = `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=http://${domain}&size=32`;
        img.onerror = () => { img.src = 'icon_128.png'; }; // Use icon_128.png as fallback
        domainInfo.appendChild(img);
      } else {
        // Use icon_128.png for wildcard entries
        const img = document.createElement('img');
        img.className = 'favicon';
        img.src = 'icon_128.png'; 
        domainInfo.appendChild(img);
      }

      const span = document.createElement('span');
      span.textContent = domain;
      domainInfo.appendChild(span);

      li.appendChild(domainInfo);

      const actions = document.createElement('div');
      actions.className = 'actions';

      const powerIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>`;
      const trashIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`;

      const toggleBtn = document.createElement('span');
      toggleBtn.innerHTML = powerIcon;
      toggleBtn.className = 'action-btn toggle-btn';
      toggleBtn.title = isEnabled ? 'Turn Off' : 'Turn On';
      toggleBtn.onclick = () => {
        const newItem = typeof item === 'string' ? { domain: domain, enabled: !isEnabled } : { ...item, enabled: !isEnabled };
        list[index] = newItem;
        chrome.storage.local.set({ incognitoList: list }, () => {
          renderList(list);
        });
      };
      actions.appendChild(toggleBtn);

      const removeBtn = document.createElement('span');
      removeBtn.innerHTML = trashIcon;
      removeBtn.className = 'action-btn remove-btn';
      removeBtn.title = 'Remove';
      removeBtn.onclick = () => {
        list.splice(index, 1);
        chrome.storage.local.set({ incognitoList: list }, () => {
          renderList(list);
        });
      };
      actions.appendChild(removeBtn);

      li.appendChild(actions);
      domainList.appendChild(li);
    });
  }
});
