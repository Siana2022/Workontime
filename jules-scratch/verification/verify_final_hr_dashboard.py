import re
from playwright.sync_api import Page, expect, sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Login as HR Manager
        page.goto("http://localhost:3000/login")
        page.get_by_label("Nombre").fill("Alicia")
        page.get_by_label("PIN").fill("1212")
        page.get_by_role("button", name="Acceder").click()

        # VERIFY HR DASHBOARD
        # Wait for the dashboard to load
        expect(page.get_by_role("heading", name="Escritorio de RRHH")).to_be_visible(timeout=10000)

        # Verify the "Activos Hoy" card has a number
        active_today_card = page.locator(".stat-card", has_text="Activos Hoy")
        # We expect a number, so we can use a regex. This will wait for any digit to appear.
        expect(active_today_card.get_by_text(re.compile(r"\d+"))).to_be_visible(timeout=10000)

        # Verify the "Recent Activity" widget has loaded some items
        # We can just check for the first list item to be present.
        expect(page.locator(".activity-item").first).to_be_visible(timeout=10000)

        page.screenshot(path="jules-scratch/verification/final_hr_dashboard.png")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error_final_hr_dashboard.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)

print("Verification script finished.")
