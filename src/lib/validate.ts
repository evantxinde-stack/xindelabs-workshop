/** Pure input guards — no I/O, so tests can import them directly. */

/**
 * Dot-atom syntax that Resend accepts. Rejects the shapes that produced
 * permanently-stuck queue rows in production: trailing/leading dot in the local
 * part, consecutive dots, and domain labels without an alphabetic TLD.
 */
const EMAIL =
  /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@([A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;

export function isValidEmail(email: unknown): boolean {
  return EMAIL.test(String(email ?? "").trim());
}
