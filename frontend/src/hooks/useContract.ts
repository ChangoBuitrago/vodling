import { useChainId } from 'wagmi';
import { SAFE_VAULT_ADDRESSES, SAFE_VAULT_ABI, MOCK_LIDO_ADDRESSES, MOCK_LIDO_ABI } from '../utils/contracts';

export const useContract = () => {
  const chainId = useChainId();

  const getContractAddress = () => {
    if (!chainId) return undefined;
    
    switch (chainId) {
      case 1: // Mainnet
        return SAFE_VAULT_ADDRESSES.MAINNET;
      case 11155111: // Sepolia
        return SAFE_VAULT_ADDRESSES.SEPOLIA;
      case 31337: // Local development (Anvil)
        return SAFE_VAULT_ADDRESSES.LOCAL;
      default:
        return undefined;
    }
  };

  const getMockLidoAddress = () => {
    if (!chainId) return undefined;
    
    switch (chainId) {
      case 1: // Mainnet
        return MOCK_LIDO_ADDRESSES.MAINNET;
      case 11155111: // Sepolia
        return MOCK_LIDO_ADDRESSES.SEPOLIA;
      case 31337: // Local development (Anvil)
        return MOCK_LIDO_ADDRESSES.LOCAL;
      default:
        return undefined;
    }
  };

  const safeVaultContract = {
    address: getContractAddress(),
    abi: SAFE_VAULT_ABI,
  };

  const mockLidoContract = {
    address: getMockLidoAddress(),
    abi: MOCK_LIDO_ABI,
  };

  return {
    safeVaultContract,
    mockLidoContract,
  };
};
