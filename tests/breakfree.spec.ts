import { test, expect } from "@playwright/test";

test.describe("BreakFree AI E2E User Journeys", () => {
  
  test("Test 1: Application smoke test - Verify landing page loads", async ({ page }) => {
    // Open the application
    await page.goto("/");

    // Verify main landing page title loads
    await expect(
      page.getByRole("heading", { name: /Break dopamine loops/i })
    ).toBeVisible({ timeout: 15000 });

    // Verify primary call-to-action buttons exist
    await expect(
      page.getByRole("button", { name: "Start Behavioral Check" })
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByRole("button", { name: "Skip to Dashboard" })
    ).toBeVisible({ timeout: 15000 });
  });

  test("Test 2: Onboarding validation - Verify error modal on empty name", async ({ page }) => {
    await page.goto("/");

    // Click on launch onboarding
    await page.getByRole("button", { name: "Start Behavioral Check" }).click();

    // Verify onboarding screen title loads
    await expect(
      page.getByRole("heading", { name: /Tell us your struggle & goals/i })
    ).toBeVisible();

    // The onboarding form is pre-filled with demo values by default.
    // Clear the Name field to trigger validation.
    const nameInput = page.getByPlaceholder("e.g. Alex Mercer");
    await expect(nameInput).toBeVisible();
    await nameInput.fill("");

    // Submit onboarding form
    await page.getByRole("button", { name: "Start AI Diagnostic Interview" }).click();

    // Verify that the validation modal/alert appears with correct messages
    await expect(page.getByRole("heading", { name: "Name is Required" })).toBeVisible();
    await expect(page.getByText("Please enter your name so the coach can personalize your behavioral diagnostic interview.")).toBeVisible();

    // Close the validation modal
    await page.getByRole("button", { name: "Got it, let me fix it" }).click();
    await expect(page.getByRole("heading", { name: "Name is Required" })).not.toBeVisible();
  });

  test("Test 3: Critical happy path - Complete onboarding flow", async ({ page }) => {
    // 1. Setup API Route Mocking to prevent hitting upstream Gemini models
    await page.route("**/api/interview/next", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ question: "Tell me about your high-risk situation?" }),
      });
    });

    await page.route("**/api/interview/profile", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          primaryAddiction: "Excessive Instagram doomscrolling",
          secondaryAddiction: "Bedtime phone usage",
          rootCause: "Anxiety triggered by complex software bugs",
          highRiskTime: "Late evening focus blocks",
          highRiskSituation: "When context-switching or facing developer roadblocks",
          motivationSummary: "Reclaim deep focus hours for career acceleration",
          behaviourSummary: "Blocker in code -> Stress -> Scroll Reels for quick comfort",
        }),
      });
    });

    await page.route("**/api/today-insight", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          insight: "Mocked daily insight: Scrolling peaks when coding blockers occur.",
          adaptiveMove: "increaseDifficulty",
          adaptiveReason: "Mocked reason: High resistance built up in previous sessions.",
        }),
      });
    });

    await page.route("**/api/recovery-plan", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          todayGoal: "Keep your phone in a locker during active work hours.",
          replacementActivity: "Write an automated unit test or drink some herbal tea.",
          microHabit: "Set a 45-minute focus timer on VS Code.",
          encouragement: "Alex, your infra architect goals depend on today's choice.",
          tomorrowFocus: "Bedtime screens-off by 10 PM.",
        }),
      });
    });

    await page.route("**/api/future-self", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          relapse: "Mocked Relapse Speech Script.",
          resist: "Mocked Resist Speech Script.",
        }),
      });
    });

    await page.route("**/api/accountability/message", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          messageText: "Mocked Accountability Alert message to partner.",
        }),
      });
    });

    // 2. Begin Onboarding Flow
    await page.goto("/");
    await page.getByRole("button", { name: "Start Behavioral Check" }).click();

    // Confirm form loads and submit the pre-filled valid data
    await page.getByRole("button", { name: "Start AI Diagnostic Interview" }).click();

    // 3. Complete the 4-turn Diagnostic Interview
    // Turn 1
    await expect(page.getByText("Question 1 of 4")).toBeVisible();
    await page.getByPlaceholder("Type your deep answer...").fill("I scroll Instagram late at night.");
    await page.getByRole("button", { name: "Submit Answer" }).click();

    // Turn 2
    await expect(page.getByText("Question 2 of 4")).toBeVisible();
    await page.getByPlaceholder("Type your deep answer...").fill("I do it because of work-related fatigue.");
    await page.getByRole("button", { name: "Submit Answer" }).click();

    // Turn 3
    await expect(page.getByText("Question 3 of 4")).toBeVisible();
    await page.getByPlaceholder("Type your deep answer...").fill("Mainly around 10 PM in my bed.");
    await page.getByRole("button", { name: "Submit Answer" }).click();

    // Turn 4
    await expect(page.getByText("Question 4 of 4")).toBeVisible();
    await page.getByPlaceholder("Type your deep answer...").fill("I want to become a Staff Engineer.");
    await page.getByRole("button", { name: "Submit Answer" }).click();

    // 4. Verify Synthesis Transition to Profile and Dashboard
    // It should now render the Profile Compile Page
    await expect(page.locator("#profile-reveal-title")).toBeVisible();
    await expect(page.getByText("Excessive Instagram doomscrolling")).toBeVisible();

    // Confirm root cause and summaries from mock API are shown
    await expect(page.locator("#profile-primary")).toContainText("Excessive Instagram doomscrolling");
    await expect(page.locator("#profile-secondary")).toContainText("Bedtime phone usage");
  });
});
