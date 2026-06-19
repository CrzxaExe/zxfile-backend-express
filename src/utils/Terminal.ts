import chalk from "chalk";

/**
 * Utility class for prettify console.log
 */
class Terminal {
  /**
   * Display as info
   * @param args something want to display
   */
  static info(...args: any[]): void {
    console.info(
      chalk.yellow.bold(`[${process.title} | ${new Date().toUTCString()}]`),
      ...args,
    );
  }

  /**
   * Display as log
   * @param args something want to display
   */
  static log(...args: any[]): void {
    console.info(
      chalk.gray.bold(`[${process.title} | ${new Date().toUTCString()}]`),
      ...args,
    );
  }

  /**
   * Display as error
   * @param args something want to display
   */
  static error(...args: any[]): void {
    console.error(
      chalk.red.bold(`[${process.title} | ${new Date().toUTCString()}]`),
      ...args,
    );
  }
}

export { Terminal };
