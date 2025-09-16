import { useChainId } from 'wagmi';
import { SAFE_VAULT_ADDRESSES, SAFE_VAULT_ABI, MOCK_LIDO_ADDRESSES, MOCK_LIDO_ABI, TURBO_VAULT_ADDRESSES, TURBO_VAULT_ABI, MOCK_EIGENLAYER_ADDRESSES, MOCK_EIGENLAYER_ABI } from '../utils/contracts';

export const useContract = () => {
  const chainId = useChainId();
  
  // Debug logging (reduced frequency)
  // console.log('useContract - Chain ID:', chainId);

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

  const getTurboVaultAddress = () => {
    if (!chainId) return undefined;
    
    switch (chainId) {
      case 1: // Mainnet
        return TURBO_VAULT_ADDRESSES.MAINNET;
      case 11155111: // Sepolia
        return TURBO_VAULT_ADDRESSES.SEPOLIA;
      case 31337: // Local development (Anvil)
        return TURBO_VAULT_ADDRESSES.LOCAL;
      default:
        return undefined;
    }
  };

  const getMockEigenLayerAddress = () => {
    if (!chainId) return undefined;
    
    switch (chainId) {
      case 1: // Mainnet
        return MOCK_EIGENLAYER_ADDRESSES.MAINNET;
      case 11155111: // Sepolia
        return MOCK_EIGENLAYER_ADDRESSES.SEPOLIA;
      case 31337: // Local development (Anvil)
        return MOCK_EIGENLAYER_ADDRESSES.LOCAL;
      default:
        return undefined;
    }
  };

  const safeVaultAddress = getContractAddress();
  const mockLidoAddress = getMockLidoAddress();
  const turboVaultAddress = getTurboVaultAddress();
  const mockEigenLayerAddress = getMockEigenLayerAddress();
  
  // console.log('useContract - SafeVault Address:', safeVaultAddress);
  // console.log('useContract - MockLido Address:', mockLidoAddress);
  // console.log('useContract - TurboVault Address:', turboVaultAddress);
  // console.log('useContract - MockEigenLayer Address:', mockEigenLayerAddress);

  const safeVaultContract = {
    address: safeVaultAddress,
    abi: SAFE_VAULT_ABI,
  };

  const mockLidoContract = {
    address: mockLidoAddress,
    abi: MOCK_LIDO_ABI,
  };

  const turboVaultContract = {
    address: turboVaultAddress,
    abi: TURBO_VAULT_ABI,
  };

  const mockEigenLayerContract = {
    address: mockEigenLayerAddress,
    abi: MOCK_EIGENLAYER_ABI,
  };

  return {
    safeVaultContract,
    mockLidoContract,
    turboVaultContract,
    mockEigenLayerContract,
  };
};
