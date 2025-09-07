# Vodling Protocol Frontend

A modern React frontend for the Vodling Protocol - principal-protected ETH staking.

## Features

- 🔗 **Wallet Connection** - Connect with MetaMask, WalletConnect, and more
- 💰 **Deposit ETH** - Stake ETH via Lido with principal protection
- 📊 **Balance Tracking** - View principal, yield, and total balances
- 💸 **Withdraw** - Withdraw principal and yield separately
- 📈 **Real-time Stats** - Protocol statistics and ETH price
- 🎨 **Modern UI** - Clean, responsive design with Tailwind CSS

## Setup

1. Install dependencies:
```bash
npm install
```

2. Get a WalletConnect Project ID:
   - Go to https://cloud.walletconnect.com
   - Create a new project
   - Copy the Project ID

3. Update the WalletConnect Project ID in `src/App.tsx`:
```tsx
projectId: 'YOUR_WALLETCONNECT_PROJECT_ID'
```

4. Update contract addresses in `src/utils/contracts.ts` after deployment

5. Start the development server:
```bash
npm start
```

## Environment Variables

Create a `.env` file:
```bash
REACT_APP_WALLETCONNECT_PROJECT_ID=your_project_id
```

## Deployment

Build for production:
```bash
npm run build
```

Deploy the `build` folder to your hosting service (Vercel, Netlify, etc.).
