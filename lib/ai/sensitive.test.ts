import { describe, it, expect } from "vitest";
import { detectSensitiveData } from "./sensitive";

describe("detectSensitiveData", () => {
  it("leaves ordinary messages alone", () => {
    expect(detectSensitiveData("Merhaba, siparişim nerede?").detected).toBe(false);
  });

  it("does not flag order numbers or phone numbers as sensitive", () => {
    expect(detectSensitiveData("Sipariş no: 482134829, telefonum 05551234567").detected).toBe(false);
  });

  it("flags a valid TC Kimlik No", () => {
    // 10000000146 is a well-known valid test TCKN (passes the checksum).
    expect(detectSensitiveData("Kimlik numaram 10000000146").detected).toBe(true);
    expect(detectSensitiveData("Kimlik numaram 10000000146").reason).toBe("national_id");
  });

  it("does not flag a random 11-digit number that fails the TCKN checksum", () => {
    expect(detectSensitiveData("Referans kodu: 12345678901").detected).toBe(false);
  });

  it("flags a valid credit card number (Luhn-valid test number)", () => {
    expect(detectSensitiveData("Kartım 4111 1111 1111 1111").detected).toBe(true);
    expect(detectSensitiveData("Kartım 4111 1111 1111 1111").reason).toBe("card");
  });

  it("does not flag a Luhn-invalid long number", () => {
    expect(detectSensitiveData("Takip no 1234567890123456").detected).toBe(false);
  });

  it("flags a Turkish IBAN", () => {
    expect(detectSensitiveData("IBAN: TR33 0006 1005 1978 6457 8413 26").detected).toBe(true);
    expect(detectSensitiveData("IBAN: TR33 0006 1005 1978 6457 8413 26").reason).toBe("iban");
  });
});
