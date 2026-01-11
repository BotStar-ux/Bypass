// Mengabaikan peringatan deprecation agar log Vercel bersih
process.env.NODE_NO_WARNINGS = '1';

const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Konfigurasi Stealth Plugin agar tidak error di lingkungan Serverless Vercel
const stealth = StealthPlugin();
stealth.enabledEvasions.delete('chrome.app');
stealth.enabledEvasions.delete('chrome.runtime');
puppeteer.use(stealth);

module.exports = async (req, res) => {
    // Menggunakan WHATWG URL API untuk mengambil parameter 'url'
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const requestUrl = new URL(req.url, `${protocol}://${host}`);
    const targetUrl = requestUrl.searchParams.get('url');

    if (!targetUrl) {
        return res.status(400).json({ error: 'Mana linknya jirr? Contoh: ?url=https://sfl.gl/xxx' });
    }

    let browser = null;

    try {
        // Launch browser dengan konfigurasi optimal untuk Vercel
        browser = await puppeteer.launch({
            args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();
        
        // Set User Agent agar terdeteksi sebagai browser asli (Chrome 120+)
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Navigasi ke link sfl.gl
        await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        // EKSEKUSI LOGIKA BYPASS (Hollow.node Logic)
        const result = await page.evaluate(async () => {
            // 1. Manipulasi Timer: Memaksa setTimeout/Interval jadi instan (0.001ms)
            const NativeTo = window.setTimeout;
            window.setTimeout = (fn, ms) => NativeTo(fn, ms / 1e7);
            
            // 2. Fungsi Klik Otomatis untuk elemen yang terlihat
            const fastClick = (sel) => {
                const el = document.querySelector(sel);
                if (el && el.offsetParent !== null) el.click();
            };

            return new Promise((resolve) => {
                const checkInterval = setInterval(() => {
                    // Daftar selector tombol dari sfl.gl, tutwuri.id, dan safelink lainnya
                    const selectors = [
                        '#btn-3', '#btn-2', '#submit-button', 
                        '#first_open_button_page_1', '#verify > a', 
                        '#second_open_placeholder a', 'button.btn-success', 'a.btn-main'
                    ];

                    selectors.forEach(sel => fastClick(sel));
                    
                    // Mencari tombol "OPEN LINK" berdasarkan teks (Final Destination)
                    const openLinkBtn = [...document.querySelectorAll('a, button, span')]
                        .find(n => n.textContent.trim().toUpperCase() === 'OPEN LINK');
                    
                    if (openLinkBtn) {
                        openLinkBtn.click();
                        // Berikan jeda sebentar setelah klik terakhir untuk menangkap URL tujuan akhir
                        setTimeout(() => resolve({
                            success: true,
                            destination: window.location.href,
                            message: "Bypass Sukses Jirr!"
                        }), 2000);
                    }
                }, 800);

                // Batas waktu (timeout) 18 detik agar tidak memakan limit Vercel
                setTimeout(() => {
                    clearInterval(checkInterval);
                    resolve({
                        success: false,
                        destination: window.location.href,
                        message: "Gagal nemu tombol OPEN LINK (Timeout)"
                    });
                }, 18000);
            });
        });

        // Kirim hasil akhir
        res.status(200).json(result);

    } catch (error) {
        res.status(500).json({ error: 'Server Error: ' + error.message });
    } finally {
        if (browser !== null) {
            await browser.close();
        }
    }
};
