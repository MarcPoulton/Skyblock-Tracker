import { ProfileNetworthCalculator } from "skyhelper-networth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function calculateNetworth(
  profileData: Record<string, any>,
  museumData: Record<string, unknown> | null,
  bankBalance: number,
): Promise<{ total: number; nonCosmetic: number }> {
  try {
    const calculator = new ProfileNetworthCalculator(
      profileData,
      museumData ?? {},
      bankBalance,
    );

    const [full, nonCosmetic] = await Promise.all([
      calculator.getNetworth({ onlyNetworth: true }),
      calculator.getNonCosmeticNetworth({ onlyNetworth: true }),
    ]);

    return {
      total: Number(full.networth ?? 0),
      nonCosmetic: Number(nonCosmetic.networth ?? 0),
    };
  } catch (error) {
    console.error("Networth calculation failed:", error);
    return { total: 0, nonCosmetic: 0 };
  }
}
