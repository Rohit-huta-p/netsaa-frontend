const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files (hashed JS/CSS/assets) with long-lived cache.
// Disable automatic index.html serving so we control its cache headers below.
app.use(express.static(path.join(__dirname, 'dist'), { index: false }));

// SPA fallback — always serve index.html with no-cache so browsers never serve
// a stale copy that references an old content-hashed bundle after a redeploy.
app.get('*', (req, res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
