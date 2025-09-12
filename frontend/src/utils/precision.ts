import { formatEther } from 'ethers';

/**
 * Formats a BigInt value to ETH with controlled precision to avoid floating-point errors
 * @param value - BigInt value in wei
 * @param decimals - Number of decimal places (default: 6)
 * @returns Formatted string with controlled precision
 */
export function formatEtherPrecise(value: bigint, decimals: number = 6): string {
  if (value === 0n) {
    return '0';
  }

  // Convert to string using formatEther
  const ethString = formatEther(value);
  
  // Split by decimal point
  const [integerPart, decimalPart] = ethString.split('.');
  
  // If no decimal part, return integer
  if (!decimalPart) {
    return integerPart;
  }
  
  // Truncate decimal part to specified precision
  const truncatedDecimal = decimalPart.substring(0, decimals);
  
  // Remove trailing zeros
  const cleanDecimal = truncatedDecimal.replace(/0+$/, '');
  
  // Return formatted string
  if (cleanDecimal === '') {
    return integerPart;
  }
  
  return `${integerPart}.${cleanDecimal}`;
}

/**
 * Formats a BigInt value to ETH with reasonable precision for display
 * Rounds to 6 decimal places to avoid excessive precision
 * @param value - BigInt value in wei
 * @returns Formatted string with reasonable precision
 */
export function formatEtherDisplay(value: bigint): string {
  if (value === 0n) {
    return '0';
  }

  // 1 ETH = 10^18 wei
  const ETH_DECIMALS = 18n;
  const ETH_DIVISOR = 10n ** ETH_DECIMALS;
  
  // Calculate integer part (whole ETH)
  const integerPart = value / ETH_DIVISOR;
  
  // Calculate decimal part (remainder in wei)
  const decimalPart = value % ETH_DIVISOR;
  
  // If no decimal part, return integer
  if (decimalPart === 0n) {
    return integerPart.toString();
  }
  
  // Round to 6 decimal places (10^12 wei)
  const ROUNDING_DIVISOR = 10n ** 12n; // 6 decimal places
  const roundedDecimal = (decimalPart + (ROUNDING_DIVISOR / 2n)) / ROUNDING_DIVISOR;
  
  // If rounding resulted in a full ETH, adjust
  if (roundedDecimal >= 1000000n) { // 1.000000 ETH
    return (integerPart + 1n).toString();
  }
  
  // Convert to string with leading zeros and remove trailing zeros
  const decimalString = roundedDecimal.toString().padStart(6, '0');
  const cleanDecimal = decimalString.replace(/0+$/, '');
  
  // Return formatted string
  if (cleanDecimal === '') {
    return integerPart.toString();
  }
  
  return `${integerPart}.${cleanDecimal}`;
}
