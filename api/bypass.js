const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Fix error "Cannot find module" di Vercel
const stealth = StealthPlugin();
stealth.enabledEvasions.delete('chrome.app');
stealth.enabledEvasions.delete('chrome.runtime');
puppeteer.use(stealth);

module.exports = async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'Mana linknya jirr?' });
    }

    let browser = null;

    try {
        browser = await puppeteer.launch({
            args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();
        
        // Atur User Agent biar makin mirip manusia
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Buka URL target
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // SUNTIKKAN LOGIKA HOLLOW.NODE
        const result = await page.evaluate(async () => {
            // 1. Percepat Timer
            const NativeTo = window.setTimeout;
            window.setTimeout = (fn, ms) => NativeTo(fn, ms / 1e7);

            return new Promise((resolve) => {
                const check = setInterval(() => {
                    // List selector tombol dari script lu
                    const selectors = [
                        '#btn-3', '#btn-2', '#submit-button', 
                        '#first_open_button_page_1', '#verify > a', 
                        '#second_open_placeholder a'
                    ];

                    selectors.forEach(sel => {
                        const el = document.querySelector(sel);
                        if (el && el.offsetParent !== null) el.click();
                    });

                    // Cari tombol "OPEN LINK" (Final Boss)
                    const openLink = [...document.querySelectorAll('a, button, span')]
                        .find(n => n.textContent.trim().toUpperCase() === 'OPEN LINK');

                    if (openLink) {
                        openLink.click();
                        // Tunggu sejenak setelah klik untuk dapetin URL akhir
                        setTimeout(() => resolve({
                            success: true,
                            destination: window.location.href
                        }), 2000);
                    }
                }, 1000);

                // Timeout 15 detik biar serverless nggak gantung
                setTimeout(() => {
                    clearInterval(check);
                    resolve({
                        success: false,
                        destination: window.location.href,
                        msg: "Timeout nyari tombol"
                    });
                }, 15000);
            });
        });

        res.status(200).json(result);

    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (browser !== null) {
            await browser.close();
        }
    }
};
