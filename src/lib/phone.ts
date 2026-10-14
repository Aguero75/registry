import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

export function normalizePhone(input: string): string {
  const value = input.trim();
  if (!value) {
    throw new Error("Phone number is required");
  }

  const defaultCountry = (process.env.DEFAULT_PHONE_COUNTRY ?? "NG") as CountryCode;
  const phone = parsePhoneNumberFromString(value, defaultCountry);

  if (!phone || !phone.isValid()) {
    throw new Error("Invalid phone number");
  }

  return phone.number;
}

export function maskPhone(e164: string): string {
  const digits = e164.replace(/\D/g, "");

  if (!digits) {
    return e164;
  }

  const directMatch = e164.match(/^(\+\d{6})\d+(\d{3})$/);
  if (directMatch) {
    return `${directMatch[1]}••••${directMatch[2]}`;
  }

  return e164.replace(/\d(?=\d{3}$)/g, "•");
}
