import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/accedi");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("il titolare vede il margine delle forniture", async ({ page }) => {
  await page.getByRole("button", { name: /Giulia Varesi/ }).click();
  await expect(page).toHaveURL(/\/progetti$/);
  await expect(page.getByRole("heading", { name: "Casa Ferraris" })).toBeVisible();
  await expect(page.getByText("Margine forniture").first()).toBeVisible();
});

test("il designer non vede margini e il bagno risulta fuori budget", async ({ page }) => {
  await page.getByRole("button", { name: /Tommaso Rinaldi/ }).click();
  await expect(page.getByRole("heading", { name: "Casa Ferraris" })).toBeVisible();
  await expect(page.getByText("Margine forniture")).toHaveCount(0);
  await expect(page.getByText("Fuori budget").first()).toBeVisible();
});

test("cambiando ruolo cambia ciò che si vede", async ({ page }) => {
  await page.getByRole("button", { name: /Tommaso Rinaldi/ }).click();
  await page.getByRole("radio", { name: "Titolare" }).filter({ visible: true }).click();
  await expect(page.getByText("Margine forniture").first()).toBeVisible();
});

test("senza sessione si torna all'accesso", async ({ page }) => {
  await page.goto("/progetti");
  await expect(page).toHaveURL(/\/accedi$/);
});
