# TradeLogs Pro Mobile (Android)

Capacitor + React app. Data phone ke andar hi save hota hai. Lot size, pips aur points ka hisaab desktop app jaisa hi hai (forex, JPY pairs, gold, index, crypto, futures).

Package name (applicationId): `com.huzaifa.tradelogs`. Play Store par ye har app ka unique hota hai. Badalna ho to upload se PEHLE `capacitor.config.json` mein `appId` badlo aur `android` folder delete karke `npx cap add android` dobara chalao.

## 1. APK ka download link (GitHub se, free)

1. github.com par account banao, phir **New repository** (naam: `tradelogs-mobile`, **Public** rakho taake download link bina login kaam kare).
2. Is folder ko computer par extract karo. Folder ke andar terminal kholo:

   ```
   git init
   git add .
   git commit -m "TradeLogs Pro mobile"
   git branch -M main
   git remote add origin https://github.com/<TUMHARA-USERNAME>/tradelogs-mobile.git
   git push -u origin main
   ```

   (Web se upload karo to hidden folder `.github` zaroor upload hona chahiye, warna build nahi chalega.)
3. Repo mein **Actions** tab kholo. "Build Android APK" khud chalega (5-8 minute).
4. Khatam hone ke baad repo ke **Releases** mein "TradeLogs Pro (test build)" milega. Usme `TradeLogsPro.apk` ka link hai. Phone par kholo, download karo, install karo (Android "Unknown sources / Install unknown apps" allow karne ko kahega).

APK dobara banana ho to Actions mein "Run workflow" dabao ya naya commit push karo.

## 2. Play Store ke liye

Play Store ko **AAB** chahiye jo apni signing key se sign ho.

1. Key banao (ye file aur passwords hamesha safe rakho, kho gayi to app update nahi hogi):

   ```
   keytool -genkey -v -keystore tradelogs.keystore -alias tradelogs -keyalg RSA -keysize 2048 -validity 10000
   base64 -w0 tradelogs.keystore > keystore.b64        # Mac: base64 -i tradelogs.keystore -o keystore.b64
   ```
2. GitHub repo > Settings > Secrets and variables > Actions mein ye 4 secrets banao:
   `KEYSTORE_BASE64` (keystore.b64 ka content), `KEY_ALIAS` (tradelogs), `KEYSTORE_PASSWORD`, `KEY_PASSWORD`.
3. Actions dobara chalao. Ab "TradeLogsPro-playstore-aab" artifact milega. Wo `.aab` Play Console mein upload karo.
4. Play Console mein privacy policy, screenshots, content rating bharni hongi. Naye personal developer accounts ko aksar production se pehle closed testing karni padti hai (Play Console mein current rule dekh lena).

Debug APK aur Play Store wali app ki signing key alag hoti hai. Dono ek dusre ke upar install nahi hoti: pehle app ke Settings se **Backup** le lo, purani app hatao, phir nayi install karke **Restore** karo.

## Computer par khud chalana (optional)

```
npm install
npm run dev              # browser mein
npm run android:sync     # web build + Android project update
npm run android:open     # Android Studio (JDK 21 chahiye)
```

## Data

Trades `localStorage` (Android WebView) mein hain. App uninstall ya "Clear data" par mit jaate hain, isliye Settings > Backup (JSON) regular lo. CSV export bhi hai.
