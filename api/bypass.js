const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

module.exports = async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'Mana linknya jirr?' });

    let browser = null;
    try {
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
        });

        const page = await browser.newPage();
        
        // Buka link sfl.gl
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // SUNTIKKAN LOGIKA HOLLOW.NODE LU DI SINI
        const finalLink = await page.evaluate(async () => {
            // 1. Percepat Timer
            const NativeTo = window.setTimeout;
            window.setTimeout = (fn, ms) => NativeTo(fn, ms / 1e7);
            
            // 2. Fungsi Klik Otomatis
            const fastClick = (sel) => {
                const el = document.querySelector(sel);
                if (el && el.offsetParent !== null) el.click();
            };

            // Looping nyari tombol sampe dapet
            return new Promise((resolve) => {
                const check = setInterval(() => {
                    // Cek semua selector tombol sfl & tutwuri
                    ['#btn-3', '#btn-2', '#submit-button', '#first_open_button_page_1', 'button', 'a'].forEach(sel => fastClick(sel));
                    
                    // Cari tombol "OPEN LINK"
                    const openLink = [...document.querySelectorAll('a, button, span')]
                        .find(n => n.textContent.trim().toUpperCase() === 'OPEN LINK');
                    
                    if (openLink) {
                        openLink.click();
                        // Tunggu bentar buat dapetin URL akhir setelah klik
                        setTimeout(() => resolve(window.location.href), 1000);
                    }
                }, 500);
                
                // Timeout biar gak stuck
                setTimeout(() => resolve(window.location.href), 15000);
            });
        });

        res.status(200).json({ success: true, destination: finalLink });

    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (browser) await browser.close();
    }
};
