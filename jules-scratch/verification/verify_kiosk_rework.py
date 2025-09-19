import re
from playwright.sync_api import Page, expect, sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Navigate to the kiosk page directly
        page.goto("http://localhost:3000/kiosk")

        # VERIFY INITIAL KIOSK VIEW
        expect(page.get_by_role("heading", name="Kiosko de Fichaje")).to_be_visible(timeout=10000)

        # Wait for the employee grid to be populated
        juanjo_card = page.get_by_text("Juanjo")
        expect(juanjo_card).to_be_visible()

        page.screenshot(path="jules-scratch/verification/01_kiosk_rework_view.png")

        # VERIFY CLOCK-IN FUNCTIONALITY
        juanjo_card.click()

        # Wait for the confirmation message to appear
        confirmation_message = page.locator(".kiosk-confirmation")
        expect(confirmation_message).to_be_visible()
        expect(confirmation_message).to_contain_text("¡Gracias, Juanjo!")

        page.screenshot(path="jules-scratch/verification/02_kiosk_confirmation.png")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error_kiosk.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)

print("Verification script finished.")
