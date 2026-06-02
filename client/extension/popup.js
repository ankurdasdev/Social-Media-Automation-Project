document.addEventListener('DOMContentLoaded', () => {
  const extractBtn = document.getElementById('extractBtn');
  const statusEl = document.getElementById('status');

  extractBtn.addEventListener('click', async () => {
    try {
      extractBtn.disabled = true;
      statusEl.textContent = 'Searching for session...';
      statusEl.style.color = '#e4e4e7';

      // Query the sessionid cookie from instagram.com
      const cookies = await chrome.cookies.getAll({ domain: 'instagram.com', name: 'sessionid' });

      if (cookies && cookies.length > 0) {
        const sessionId = cookies[0].value;
        
        // Copy to clipboard
        await navigator.clipboard.writeText(sessionId);
        
        statusEl.textContent = 'COPIED TO CLIPBOARD!';
        statusEl.style.color = '#10b981'; // Emerald 500
        
        // Change button text temporarily
        const originalText = extractBtn.textContent;
        extractBtn.textContent = 'Success!';
        extractBtn.style.background = '#10b981';
        
        setTimeout(() => {
          extractBtn.textContent = originalText;
          extractBtn.style.background = '';
          extractBtn.disabled = false;
        }, 3000);
      } else {
        statusEl.textContent = 'Not found. Are you logged in to Instagram?';
        statusEl.style.color = '#ef4444'; // Red 500
        extractBtn.disabled = false;
      }
    } catch (err) {
      statusEl.textContent = 'Error: ' + err.message;
      statusEl.style.color = '#ef4444';
      extractBtn.disabled = false;
    }
  });
});
