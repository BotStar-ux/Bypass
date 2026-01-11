process.env.NODE_NO_WARNINGS = '1';
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'Mana linknya jirr?' });

    let browser = null;
    try {
        browser = await puppeteer.launch({
            args: [...chromium.args, "--disable-blink-features=AutomationControlled"],
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });

        const page = await browser.newPage();
        
        // Trik Botasaurus: Injeksi Fingerprint Manusia
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // --- SIMULASI GERAKAN (Ini yang bikin Cloudflare Lolos) ---
        await page.mouse.move(Math.random() * 100, Math.random() * 100);
        await new Promise(r => setTimeout(r, 5000)); // Tunggu Turnstile mikir
        await page.mouse.wheel({ deltaY: 500 }); // Scroll ke bawah kayak orang baca
        // ---------------------------------------------------------

        const result = await page.evaluate(async () => {
            const NativeTo = window.setTimeout;
            window.setTimeout = (fn, ms) => NativeTo(fn, ms / 1e7);
            
            return new Promise((resolve) => {
                let attempts = 0;
                const check = setInterval(() => {
                    attempts++;
                    // Daftar tombol sesuai screenshot lu
                    const btns = [
                        '#btn-3', '#btn-2', '#submit-button', 
                        '#first_open_button_page_1', '#verify > a', 
                        '#second_open_placeholder a', 'button:contains("Open")', 'button:contains("Next")'
                    ];

                    btns.forEach(sel => {
                        const el = document.querySelector(sel);
                        if (el && el.offsetParent !== null) {
                            el.click();
                            console.log('Clicked: ' + sel);
                        }
                    });

                    // Cari tombol "OPEN LINK"
                    const finalBtn = [...document.querySelectorAll('a, button, span')]
                        .find(n => n.textContent.trim().toUpperCase() === 'OPEN LINK');
                    
                    if (finalBtn) {
                        finalBtn.click();
                        // Jika sudah klik, tunggu redirect
                    }

                    // Jika URL berubah (berhasil bypass)
                    if (!window.location.href.includes('sfl.gl') && !window.location.href.includes('tutwuri.id')) {
                        clearInterval(check);
                        resolve({ success: true, destination: window.location.href });
                    }
                }, 1000);

                // Timeout mepet limit Vercel
                setTimeout(() => {
                    clearInterval(check);
                    resolve({ success: false, destination: window.location.href, message: "Timeout di " + window.location.href });
                }, 22000);
            });
        });

        res.status(200).json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    } finally {
        if (browser) await browser.close();
    }
};
