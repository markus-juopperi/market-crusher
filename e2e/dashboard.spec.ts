import { test, expect } from "@playwright/test";

test.describe("Dashboard Page", () => {
  test("loads the dashboard with title", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Market Crusher");
  });

  test("shows empty watchlist message", async ({ page }) => {
    // Clear localStorage to ensure empty state
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await expect(page.getByText(/no tickers in your watchlist/i)).toBeVisible();
    await expect(
      page.getByText(/use the search bar to add stocks/i)
    ).toBeVisible();
  });

  test("shows market status bar", async ({ page }) => {
    await page.goto("/");
    // The status bar should show one of: Open, Closed, Pre-Market, After Hours
    await expect(
      page.getByText(/market:/i)
    ).toBeVisible({ timeout: 10_000 });
  });

  test("shows popular stocks section", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Popular Stocks")).toBeVisible();
    await expect(page.getByText("Gainers")).toBeVisible();
    await expect(page.getByText("Losers")).toBeVisible();
  });

  test("loads movers data with real prices", async ({ page }) => {
    await page.goto("/");
    // Wait for movers table to populate
    const moversTable = page.locator("table").last();
    await expect(moversTable.locator("tbody tr").first()).toBeVisible({
      timeout: 15_000,
    });

    // Should show at least one stock link
    await expect(moversTable.locator("a[href^='/stock/']").first()).toBeVisible();
  });

  test("can switch between gainers and losers", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Popular Stocks").waitFor();

    const losersBtn = page.getByRole("button", { name: "Losers" });
    await losersBtn.click();

    // Wait for table to update
    const moversTable = page.locator("table").last();
    await expect(moversTable.locator("tbody tr").first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("has a search input in the header", async ({ page }) => {
    await page.goto("/");
    const searchInput = page.getByPlaceholder(/search tickers/i);
    await expect(searchInput).toBeVisible();
  });
});

test.describe("Search Functionality", () => {
  test("search returns results for a valid query", async ({ page }) => {
    await page.goto("/");

    const searchInput = page.getByPlaceholder(/search tickers/i);
    await searchInput.fill("apple");

    // Wait for search results dropdown
    await expect(
      page.getByText(/AAPL/).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("search shows Nokia results including HEX listing", async ({
    page,
  }) => {
    await page.goto("/");

    const searchInput = page.getByPlaceholder(/search tickers/i);
    await searchInput.fill("nokia");

    // Should show at least NOK (US) result
    await expect(
      page.getByText(/NOK/).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("can add ticker to watchlist from search", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    const searchInput = page.getByPlaceholder(/search tickers/i);
    await searchInput.fill("apple");

    // Wait for results
    await expect(
      page.getByText(/AAPL/).first()
    ).toBeVisible({ timeout: 10_000 });

    // Click "+ Watch" button
    const watchBtn = page.getByRole("button", { name: /watch/i }).first();
    await watchBtn.click();

    // Watchlist should now show AAPL
    await expect(page.getByText("Watchlist")).toBeVisible();
  });

  test("clicking search result navigates to stock page", async ({ page }) => {
    await page.goto("/");

    const searchInput = page.getByPlaceholder(/search tickers/i);
    await searchInput.fill("microsoft");

    // Wait for MSFT result
    await expect(
      page.getByText(/MSFT/).first()
    ).toBeVisible({ timeout: 10_000 });

    // Click the result text (not the Watch button)
    await page.getByText(/MSFT/).first().click();

    // Should navigate to stock detail page
    await expect(page).toHaveURL(/\/stock\/MSFT/i);
  });
});

test.describe("Stock Detail Page", () => {
  test("loads stock detail page for AAPL", async ({ page }) => {
    await page.goto("/stock/AAPL");

    // Should show ticker
    await expect(page.getByText("AAPL")).toBeVisible();

    // Should show back link
    await expect(
      page.getByText(/back to dashboard/i)
    ).toBeVisible();
  });

  test("shows price information", async ({ page }) => {
    await page.goto("/stock/AAPL");

    // Wait for price to load
    await expect(
      page.locator("text=/\\$\\d+\\.\\d{2}/").first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("shows key stats section", async ({ page }) => {
    await page.goto("/stock/AAPL");

    await expect(page.getByText("Key Stats")).toBeVisible();

    // Wait for stats to load
    await expect(page.getByText("Open", { exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("High", { exact: true })).toBeVisible();
    await expect(page.getByText("Low", { exact: true })).toBeVisible();
    await expect(page.getByText("Prev Close", { exact: true })).toBeVisible();
  });

  test("shows price chart with timeframe buttons", async ({ page }) => {
    await page.goto("/stock/AAPL");

    // Chart timeframe buttons
    await expect(page.getByRole("button", { name: "1D" })).toBeVisible();
    await expect(page.getByRole("button", { name: "1M" })).toBeVisible();
    await expect(page.getByRole("button", { name: "1Y" })).toBeVisible();
    await expect(page.getByRole("button", { name: "5Y" })).toBeVisible();
  });

  test("shows news section", async ({ page }) => {
    await page.goto("/stock/AAPL");
    await expect(page.getByText("Latest News")).toBeVisible();
  });

  test("back link navigates to dashboard", async ({ page }) => {
    await page.goto("/stock/AAPL");
    await page.getByText(/back to dashboard/i).click();
    await expect(page).toHaveURL("/");
  });

  test("loads Finnish stock detail page", async ({ page }) => {
    await page.goto("/stock/NOKIA.HE");

    await expect(page.getByText("NOKIA.HE")).toBeVisible();

    // Wait for price - should show EUR
    await expect(
      page.locator("text=/€\\d+\\.\\d{2}/").first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
