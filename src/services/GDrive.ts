import { google } from "googleapis";
import { Generator } from "../utils/Generator";
import { Readable } from "stream";

const auth = new google.auth.OAuth2(
  process.env.DRIVE_CLIENT,
  process.env.DRIVE_SECRET,
  "https://developers.google.com/oauthplayground",
);

auth.setCredentials({
  refresh_token: process.env.DRIVE_REFRESH_TOKEN,
});

const drive = google.drive({
  version: "v3",
  auth,
});

/**
 * Utility class to handle Google Drive api methods
 */
export class GDrive {
  /**
   * Upload single file to GDrive folder
   * @param file file buffer
   * @param mimeType mimetype of file
   * @param ext file extension
   * @returns result of services
   */
  static async upload(
    file: Buffer,
    mimeType: string,
    ext: string,
  ) {
    const res = await drive.files.create({
      requestBody: {
        name: Generator.id() + ext,
        mimeType,
      },
      media: {
        mimeType,
        body: Readable.from(file),
      },
    });

    return res;
  }

  /**
   * Delete image with matches id from GDrive
   * @param fileId id of GDrive image
   */
  static async delete(fileId: string) {
    const res = await drive.files.delete({ fileId });

    return res;
  }

  static async update() {}

  /**
   * Get image metadata from GDrive
   * @param fileId id of GDrive image
   * @returns image metadata (id, name, webViewLink, mimeType, size)
   */
  static async read(fileId: string) {
    const res = await drive.files.get({
      fileId,
      fields: "id, name, webViewLink, mimeType, size",
    });

    return res;
  }

  /**
   * Stream image binary from GDrive directly to Express response.
   * Use alt:'media' to get the file content instead of metadata.
   * @param fileId id of GDrive image
   * @returns readable stream of the image
   */
  static async stream(fileId: string) {
    const res = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "stream" },
    );

    return res;
  }
}
