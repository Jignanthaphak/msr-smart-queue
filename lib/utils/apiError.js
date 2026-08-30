// FILE: /lib/utils/apiError.js
import "server-only";

/**
 * @typedef {"info" | "warning" | "error"} LogLevel
 */

/**
 * Error มาตรฐานสำหรับ API / Server Action
 *
 * - statusCode: HTTP status ที่จะส่งออก
 * - clientMessage: ข้อความที่ส่งไปให้ client เห็น
 * - logMessage: ข้อความสำหรับ log (ถ้าไม่กำหนดจะใช้ clientMessage)
 * - level: ระดับ log เช่น "info" | "warning" | "error"
 * - extra: object สำหรับใส่ข้อมูลเพิ่มใน log
 */
export class ApiError extends Error {
  /**
   * @param {object} params
   * @param {number} params.statusCode
   * @param {string} params.clientMessage
   * @param {string} [params.logMessage]
   * @param {LogLevel} [params.level="warning"]
   * @param {object} [params.extra={}]
   */
  constructor({ statusCode, clientMessage, logMessage, level = "warning", extra = {} }) {
    
    super(logMessage || clientMessage);

    this.name = "ApiError";
    this.statusCode = statusCode;
    this.clientMessage = clientMessage;
    this.logMessage = logMessage || clientMessage;
    this.level = level;
    this.extra = extra;
  }

  // helper static methods เอาไว้เรียกง่าย ๆ

  /**
   * 400 Bad Request
   */
  static badRequest(message = "Bad Request", extra = {}) {
    return new ApiError({
      statusCode: 400,
      clientMessage: message,
      logMessage: message,
      level: "warning",
      extra,
    });
  }

  /**
   * 401 Unauthorized
   */
  static unauthorized(message = "Unauthorized", extra = {}) {
    return new ApiError({
      statusCode: 401,
      clientMessage: message,
      logMessage: message,
      level: "warning",
      extra,
    });
  }

  /**
   * 404 Not Found
   */
  static notFound(message = "Not Found", extra = {}) {
    return new ApiError({
      statusCode: 404,
      clientMessage: message,
      logMessage: message,
      level: "warning",
      extra,
    });
  }

  /**
   * 500 Internal Server Error
   */
  static internal(message = "Server error", extra = {}) {
    return new ApiError({
      statusCode: 500,
      clientMessage: message,
      logMessage: message,
      level: "error",
      extra,
    });
  }
}
