document.addEventListener('DOMContentLoaded', () => {
  const extractBtn = document.getElementById('extractBtn');
  const statusEl = document.getElementById('status');

  extractBtn.addEventListener('click', async () => {
    try {
      extractBtn.disabled = true;
      statusEl.textContent = 'Searching for session...';
      statusEl.style.color = 'var(--foreground)';

      // Query the sessionid cookie from instagram.com
      const cookies = await chrome.cookies.getAll({ domain: 'instagram.com', name: 'sessionid' });

      if (cookies && cookies.length > 0) {
        const sessionId = cookies[0].value;
        
        // Copy to clipboard
        await navigator.clipboard.writeText(sessionId);
        
        statusEl.textContent = 'COPIED TO CLIPBOARD!';
        statusEl.style.color = 'hsl(142, 71%, 45%)'; // Success Green
        
        // Change button text temporarily
        const originalText = extractBtn.textContent;
        extractBtn.textContent = 'Success!';
        extractBtn.style.background = 'hsl(142, 71%, 45%)';
        extractBtn.style.color = 'white';
        extractBtn.style.boxShadow = '0 4px 14px 0 hsla(142, 71%, 45%, 0.3)';
        
        setTimeout(() => {
          extractBtn.textContent = originalText;
          extractBtn.style.background = '';
          extractBtn.style.color = '';
          extractBtn.style.boxShadow = '';
          extractBtn.disabled = false;
        }, 3000);
      } else {
        statusEl.textContent = 'Not found. Are you logged in to Instagram?';
        statusEl.style.color = 'hsl(0, 84%, 60%)'; // Destructive Red
        extractBtn.disabled = false;
      }
    } catch (err) {
      statusEl.textContent = 'Error: ' + err.message;
      statusEl.style.color = 'hsl(0, 84%, 60%)';
      extractBtn.disabled = false;
    }
  });
});
