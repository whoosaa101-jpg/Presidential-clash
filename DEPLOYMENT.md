# 🌎 Presidential Clash: Cloud Launch Guide

To take your game from your local network to the global stage, follow these steps to deploy your server.

## 1. Choose a Hosting Provider
I recommend **Render.com** (Free tier available) for the Node.js server.
- **Service Type**: Web Service
- **Runtime**: Node.js
- **Build Command**: `npm install`
- **Start Command**: `node production_server.cjs`

## 2. Environment Variables
In your cloud dashboard, add these environment variables:
- `PORT`: 10000 (Render standard) or any available port.
- `NODE_ENV`: production

## 3. Update the App to Point to Cloud
Once you have your server URL (e.g., `https://presidential-clash.onrender.com`), you need to tell the game to use it.

### Option A: Hardcoded (Permanent)
Edit `src/hooks/useNetwork.js`:
```javascript
const getSocketURL = () => {
    // 1. Check for manual override (for testing)
    const overrideIp = localStorage.getItem('pres_serverIp');
    if (overrideIp) return `http://${overrideIp}:3001`;

    // 2. USE YOUR CLOUD URL HERE
    return "https://presidential-clash.onrender.com"; 
};
```

### Option B: Environmental (Cleaner)
Add to your `.env` file:
`VITE_SOCKET_URL=https://your-server-name.onrender.com`

## 4. Final Mobile Sync
After updating the URL:
1. Run `npm run build`
2. Run `npx cap sync android`
3. Deploy to your phone.

Your phone will now connect to the **Global D.C. Server** instead of your local PC! 🦅🌎
