process.env.NODE_NO_WARNINGS = '1';
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core'); // Pakai core saja, hilangkan extra

module.exports = async (req, res) => {
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const requestUrl = new URL(req.url, `${protocol}://${host}`);
    const targetUrl = requestUrl.searchParams.get('url');

    if (!targetUrl) {
        return res.status(400).json({ error: 'Mana linknya jirr?' });
    }

    let browser = null;

    try {
        browser = await puppeteer.launch({
            args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });

        const page = await browser.newPage();
        
        // --- MANUAL STEALTH INJECTION (Pengganti plugin yang error) ---
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
            window.chrome = { runtime: {} };
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
        });
        // -------------------------------------------------------------

        await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        const result = await page.evaluate(async () => {
            const NativeTo = window.setTimeout;
            window.setTimeout = (fn, ms) => NativeTo(fn, ms / 1e7);
            
            return new Promise((resolve) => {
                const checkInterval = setInterval(() => {
                    const selectors = [
                        '#btn-3', '#btn-2', '#submit-button', 
                        '#first_open_button_page_1', '#verify > a', 
                        '#second_open_placeholder a'
                    ];

                    selectors.forEach(sel => {
                        const el = document.querySelector(sel);
                        if (el && el.offsetParent !== null) el.click();
                    });
                    
                    const openLinkBtn = [...document.querySelectorAll('a, button, span')]
                        .find(n => n.textContent.trim().toUpperCase() === 'OPEN LINK');
                    
                    if (openLinkBtn) {
                        openLinkBtn.click();
                        setTimeout(() => resolve({
                            success: true,
                            destination: window.location.href
                        }), 2000);
                    }
                }, 1000);

                setTimeout(() => {
                    clearInterval(checkInterval);
                    resolve({
                        success: false,
                        destination: window.location.href,
                        message: "Timeout"
                    });
                }, 18000);
            });
        });

        res.status(200).json(result);

    } catch (error) {
        res.status(500).json({ error: 'Server Error: ' + error.message });
    } finally {
        if (browser !== null) await browser.close();
    }
};
