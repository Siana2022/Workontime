import re
from playwright.sync_api import Page, expect, sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Navigate to the kiosk page
        page.goto("http://localhost:3000/kiosk")

        # Wait for employee cards to be visible
        expect(page.get_by_text("Juanjo")).to_be_visible(timeout=10000)
        page.screenshot(path="jules-scratch/verification/01_kiosk_v2_grid.png")

        # Click on an employee
        page.get_by_text("Juanjo").click()

        # Wait for the PIN modal to appear
        expect(page.get_by_role("heading", name="Juanjo")).to_be_visible()
        pin_input = page.locator(".pin-input")
        expect(pin_input).to_be_visible()

        # Enter PIN and clock in
        pin_input.fill("6119")
        page.get_by_role("button", name="Entrada").click()

        # Wait for the modal to disappear and confirmation to appear
        expect(pin_input).not_to_be_visible()
        confirmation = page.locator(".kiosk-confirmation")
        expect(confirmation).to_be_visible(timeout=10000)
        expect(confirmation).to_contain_text("¡Gracias, Juanjo!")

        page.screenshot(path="jules-scratch/verification/02_kiosk_v2_success.png")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error_kiosk_v2.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)

print("Verification script finished.")
