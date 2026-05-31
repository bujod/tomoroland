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
        "token": "ucde:t698",
        "User-Agent": "okhttp/5.1.0",
        "wToken": "0004_9E7C1699FD35C9FA792D5D6FA79A1B51F652DEE73EE56A51619A400BA33D5B66C7AA0841EB04A19B41877241EB2E2E1FA8B75019A0A8c+D4MDF+ShD2+hGncElDKBcyiYGtaRYj+JJtpL4c3FA0fv/KVW43SlH0yzTd4QQBIk8QFKrzlw/M1GMW+6EkkmsXJX1oit0kQ0wi4QRiANh43EwAQPIbguXrRiYYzYDTg0F3CJxGZFEWylNZtBcOocVt9RN9JXhOeTNRisNhcJEoldwiNoxSKMKGiFUrfpep0IA6Hwi7YmNNTz/DK9kPH/Nes2BcBqgt78gKtcpLAPxFbsIMIkyVRDwFbB9/huMkcLmlnqNpvAlrbIy5epNfB93oAVDMKIE97euRPytmMO6i2XlqcPc7Ls3ukhYQumK/QsIr9FBuvOxV8w8/50xdihzuulnP/hlLyL0F3E9qNGsulBvHANnWd+CGhtd9UkI7JyvilnePzvch7EWDe1yYa3zqvTQwNEizajM/ordtRgFqE0XzTEP2gA4G6mnVAKu163N9589lVzHlhjir0lC39i8e2dVKTn1x6fxS6F4x+GceFjESKwQRF/pdZ577rTxKCRc/StvUYOzGjRryrR56V1iu1OvBsKzMIGqfVZ16XooM9L2gK70FQlP2HxUlyB6Lhx0qd6/TV+VbR7WpgjU297et+YyYV0XZ/ZZK1Luu+Xh7usaR+nG3XdR0yu9ntXKCmgWtSRKQJWyb7DZcNv8f0TbwB/sPdpGpGz7WMrASOvTu4W6T+qTaoGE/aIz9GjlhvyFSUX5KCtDCUcjWPCjyDTCaukh6g9hyNYsuX6UhmMhcl8G7nX+58TeLaPgdr+esYLtcKgGan8leVKk3iw7zJg==_fHw=_ddb6cb8e14fec33a-h-1780198306324-02d1e60bfd2a448bac1509fff1e65003"
    };
}

// 1. Route Halaman Utama: Daftar Toko Tomoro
app.get('/', async (req, res) => {
    // Koordinat default mengarah ke area Jakarta
    const url = "https://api-service.tomoro-coffee.id/portal/app/basic/storeInfo/getStoreList/v3?pageNo=1&centerPointLatitude=-6.214722096666667&centerPointLongitude=106.84500128033334&pageSize=20";

    try {
        const response = await axios.get(url, { headers: getTomoroHeaders() });
        const stores = response.data?.data?.records || [];
        res.render('index', { stores });
    } catch (error) {
        console.error("Gagal mengambil data toko Tomoro:", error.message);
        res.render('index', { stores: [] });
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
        console.error(`Gagal mengambil menu untuk toko ${storeCode}:`, error.message);
        res.render('menu', { storeCode, menuGroups: [] });
    }
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server Tomoro Coffee berjalan di http://localhost:${PORT}`);
    });
}

module.exports = app;