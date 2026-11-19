import { expect, test } from "@playwright/test";
import { accedi, chiediCodice, emailNuova } from "./aiuti";

test("senza accesso si torna ad accedi, ricordando dove si voleva andare", async ({ page }) => {
  await page.goto("/progetti");
  await expect(page).toHaveURL(/\/accedi\?poi=%2Fprogetti$/);
  await expect(page.getByRole("heading", { name: "Entra nel tuo studio" })).toBeVisible();
});

test("un'email non valida dice cosa correggere", async ({ page }) => {
  await page.goto("/accedi");
  await page.getByLabel("Email").fill("giulia@");
  await page.getByRole("button", { name: "Mandami il codice" }).click();
  await expect(page.getByText("Controlla l'indirizzo email.")).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveAttribute("aria-invalid", "true");
});

test("al primo accesso nasce lo studio e chi entra ne è titolare", async ({ page }) => {
  await accedi(page, emailNuova("anna.maria_rossi"));
  await expect(page).toHaveURL(/\/progetti$/);
  await expect(page.getByRole("link", { name: "Studio di Anna Maria Rossi" }).first()).toBeVisible();
});

test("il link porta alla pagina chiesta prima dell'accesso", async ({ page }) => {
  await page.goto("/progetti/qualsiasi/approvazioni");
  await expect(page).toHaveURL(/poi=/);
  await accedi(page, emailNuova("tommaso"), page.url());
  await expect(page).toHaveURL(/\/progetti\/qualsiasi\/approvazioni$/);
});

test("anche il link nell'email fa entrare, dallo stesso browser", async ({ page }) => {
  const { link } = await chiediCodice(page, emailNuova("link"));
  await page.goto(link);
  await expect(page).toHaveURL(/\/progetti$/);
});

test("un codice sbagliato dice cosa fare", async ({ page }) => {
  await chiediCodice(page, emailNuova("codice"));
  await page.getByLabel("Codice dell'email").fill("000000");
  await page.getByRole("button", { name: "Entra", exact: true }).click();
  await expect(page.getByText("Codice sbagliato o scaduto")).toBeVisible();
});

test("un link non valido rimanda ad accedi con la spiegazione", async ({ page }) => {
  await page.goto("/auth/confirm?code=non-valido");
  await expect(page).toHaveURL(/\/accedi\?errore=link$/);
  await expect(page.getByRole("alert").filter({ hasText: "Questo link non vale più" })).toBeVisible();
});

test("esci chiude la sessione", async ({ page }) => {
  await accedi(page, emailNuova("esce"));
  await expect(page).toHaveURL(/\/progetti$/);
  await page.getByRole("button", { name: "Esci" }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/accedi$/);
  await page.goto("/progetti");
  await expect(page).toHaveURL(/\/accedi\?poi=/);
});

test("lo studio di esempio entra con la sua email", async ({ page }, info) => {
  // Una sola email per tutti i progetti di Playwright: la usiamo solo da desktop.
  test.skip(info.project.name !== "desktop", "email condivisa, basta un viewport");
  await accedi(page, "giulia@studiovaresi.example");
  await expect(page.getByRole("link", { name: "Studio Varesi Interni" }).first()).toBeVisible();
  await expect(page.getByText("Giulia Varesi")).toBeVisible();
});
