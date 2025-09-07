import { useNetwork } from 'wagmi';
import { SAFE_VAULT_ADDRESSES, SAFE_VAULT_ABI } from '../utils/contracts';

export const useContract = () => {
  const { chain } = useNetwork();

  const getContractAddress = () => {
    if (!chain) return undefined;
    
    switch (chain.id) {
      case 1: // Mainnet
        return SAFE_VAULT_ADDRESSES.MAINNET;
      case 5: // Goerli
        return SAFE_VAULT_ADDRESSES.GOERLI;
      case 11155111: // Sepolia
        return SAFE_VAULT_ADDRESSES.SEPOLIA;
      default:
        return undefined;
    }
  };

  const safeVaultContract = {
    address: getContractAddress(),
    abi: SAFE_VAULT_ABI,
  };

  return {
    safeVaultContract,
  };
};
