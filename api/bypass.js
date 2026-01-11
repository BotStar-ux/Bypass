const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

module.exports = async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'Mana linknya jirr?' });

    let browser = null;
    try {
        // Konfigurasi terbaru untuk performa maksimal di Vercel
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();
        
        // Buka link target
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // SUNTIKKAN LOGIKA HOLLOW.NODE
        const finalLink = await page.evaluate(async () => {
            const NativeTo = window.setTimeout;
            window.setTimeout = (fn, ms) => NativeTo(fn, ms / 1e7);
            
            const fastClick = (sel) => {
                const el = document.querySelector(sel);
                if (el && el.offsetParent !== null) el.click();
            };

            return new Promise((resolve) => {
                const check = setInterval(() => {
                    // List selector tombol dari script hollow.node lu
                    ['#btn-3', '#btn-2', '#submit-button', '#first_open_button_page_1'].forEach(sel => fastClick(sel));
                    
                    // Deteksi tombol OPEN LINK di halaman akhir
                    const openLink = [...document.querySelectorAll('a, button, span')]
                        .find(n => n.textContent.trim().toUpperCase() === 'OPEN LINK');
                    
                    if (openLink) {
                        openLink.click();
                        setTimeout(() => resolve(window.location.href), 1500);
                    }
                }, 500);
                
                // Timeout 15 detik biar gak gantung
                setTimeout(() => resolve(window.location.href), 15000);
            });
        });

        res.status(200).json({ 
            success: true, 
            destination: finalLink,
            status: "Link berhasil dibabat!" 
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (browser) await browser.close();
    }
};
