const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Fungsi pembuat Headers API Tomoro Coffee
function getTomoroHeaders() {
    return {
        "Accept-Encoding": "gzip",
        "appChannel": "google play",
        "appLanguage": "en",
        "Content-Type": "application/json",
        "countryCode": "id",
        "deviceCode": "19fb25e2e6ebebd3",
        "revision": "3.4.3",
        "timeZone": "Asia/Bangkok",
        "token": "",
        "User-Agent": "okhttp/5.1.0",
        "wToken": ""
    };
}

// VARIABEL CACHE GLOBAL
let cachedStores = [];
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 Jam (dalam milidetik)

// 1. Route Halaman Utama: Daftar Toko Tomoro
app.get('/', async (req, res) => {
    // CEK CACHE: Jika data sudah ada dan belum 1 jam, gunakan data yang disimpan!
    if (cachedStores.length > 0 && (Date.now() - lastFetchTime < CACHE_DURATION)) {
        console.log("⚡ Menggunakan data toko dari Cache (Sangat Cepat!)");
        return res.render('index', { stores: cachedStores });
    }

    try {
        console.log("🚀 Menarik data toko secara paralel dari API...");
        const pagePromises = [];
        const MAX_PAGES = 25; // 25 halaman x 50 toko = Kapasitas 1250 toko seluruh Indonesia

        // Tembak 25 halaman sekaligus secara bersamaan!
        for (let pageNo = 1; pageNo <= MAX_PAGES; pageNo++) {
            const url = `https://api-service.tomoro-coffee.id/portal/app/basic/storeInfo/getStoreList/v3?pageNo=${pageNo}&centerPointLatitude=-6.214722&centerPointLongitude=106.845001&pageSize=50`;
            
            // Masukkan tugas ke dalam array (ditambah .catch agar kalau 1 halaman error, yang lain tetap jalan)
            pagePromises.push(axios.get(url, { headers: getTomoroHeaders() }).catch(() => null));
        }

        // Tunggu semua kasir (request) selesai bersamaan
        const responses = await Promise.all(pagePromises);
        let allStores = [];

        // Kumpulkan semua data yang berhasil didapat
        responses.forEach(response => {
            if (response && response.data?.data?.records) {
                allStores = allStores.concat(response.data.data.records);
            }
        });

        console.log(`✅ Selesai! Total toko yang ditarik: ${allStores.length}`);
        
        // SIMPAN KE CACHE agar request selanjutnya instan
        if (allStores.length > 0) {
            cachedStores = allStores;
            lastFetchTime = Date.now();
        }

        res.render('index', { stores: allStores });

    } catch (error) {
        console.error("Gagal Request:", error.message);
        
        // Jika gagal API tapi ada cache lama, tampilkan cache lama. Jika tidak, kosong.
        if (cachedStores.length > 0) {
            res.render('index', { stores: cachedStores });
        } else {
            res.render('index', { stores: [] }); 
        }
    }
});
// 2. Route Halaman Menu Berdasarkan storeCode
app.get('/menu/:storeCode', async (req, res) => {
    const storeCode = req.params.storeCode;
    const url = `https://api-service.tomoro-coffee.id/portal/app/basic/menu/getMenuList?storeCode=${storeCode}&mainMenuType=1`;

    try {
        const response = await axios.get(url, { headers: getTomoroHeaders() });
        const menuGroups = response.data?.data?.menuVos || [];
        res.render('menu', { storeCode, menuGroups });
    } catch (error) {
        if (error.response) {
            console.error("API Error Status:", error.response.status);
            console.error("API Error Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Gagal Request:", error.message);
        }
        // PERBAIKAN DI BARIS INI: render 'menu', bukan 'index'
        res.render('menu', { storeCode, menuGroups: [] }); 
    }
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server Tomoro Coffee berjalan di http://localhost:${PORT}`);
    });
}

module.exports = app;