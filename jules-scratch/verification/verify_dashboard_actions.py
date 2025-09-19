import re
from playwright.sync_api import Page, expect, sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Login as an employee
        page.goto("http://localhost:3000/login")
        page.get_by_label("Nombre").fill("Juanjo")
        page.get_by_label("PIN").fill("6119")
        page.get_by_role("button", name="Acceder").click()

        # Wait for dashboard to load
        expect(page.get_by_role("heading", name="Escritorio de Empleado")).to_be_visible(timeout=10000)

        # Select a client
        page.locator("#client").select_option("Cliente A")

        # Click the clock-in button
        page.get_by_role("button", name="Fichar Entrada").click()

        # Verify that the confirmation message appears
        # This implicitly confirms that the Supabase insert did not return an error
        confirmation_message = page.locator(".last-clocking")
        expect(confirmation_message).to_be_visible()
        expect(confirmation_message).to_contain_text("Última acción: Entrada")
        expect(confirmation_message).to_contain_text("Cliente: Cliente A")

        # Take a screenshot of the successful clock-in
        page.screenshot(path="jules-scratch/verification/dashboard_action_success.png")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error_dashboard_action.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)

print("Verification script finished.")
