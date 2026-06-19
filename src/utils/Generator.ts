/**
 * Utility class to generate somethings
 */
export class Generator {
  /**
   * Generating random id
   * @param length length of id, default is 18
   * @returns string of random chars
   */
  static id(length: number = 18): string {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let result: string = "";
    for (let i = 0; i < length; i++)
      result += chars[Math.floor(Math.random() * chars.length)];

    return result;
  }
}
