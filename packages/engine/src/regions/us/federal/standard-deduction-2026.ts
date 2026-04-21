import { Money } from '../../../money.js';

/**
 * US federal standard deduction, single filer, tax year 2026 (projected).
 *
 * 2025 was $14,600 (IRS Rev. Proc. 2024-40). 2026 is projected at $15,000;
 * the final figure is typically published in late autumn of the prior year.
 *
 * TODO(yaqin): verify — projected from IRS Rev. Proc. 2024-40.
 *
 * @example
 *   import { Money } from '../../../money.js';
 *   const agi = new Money(80_000_00, 'USD');
 *   const taxable = Money.max(agi.sub(usFederalStandardDeduction2026), Money.zero('USD'));
 *   // taxable = $65,000
 */
export const usFederalStandardDeduction2026 = new Money(15_000_00, 'USD');
