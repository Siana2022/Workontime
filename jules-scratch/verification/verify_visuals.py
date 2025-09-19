import re
from playwright.sync_api import Page, expect, sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Navigate to the app
        page.goto("http://localhost:3000")

        # --- VERIFY EMPLOYEE VIEW ---
        # Wait for the Kiosk page to load
        expect(page.locator('h1:has-text("Kiosko de Fichaje")')).to_be_visible()

        # Take a screenshot of the initial employee view
        page.screenshot(path="jules-scratch/verification/01_employee_view.png")

        # --- VERIFY HR MANAGER VIEW ---
        # Change role to HR Manager
        page.locator("#role-selector").select_option("Gestor de RRHH")

        # Wait for network to be idle
        page.wait_for_load_state('networkidle')

        # Wait for the HR dashboard to load using a different selector
        expect(page.locator('h1:has-text("Escritorio de RRHH")')).to_be_visible(timeout=10000)

        # Verify that the employee links are not visible
        expect(page.get_by_role("link", name="Kiosko")).not_to_be_visible()
        expect(page.get_by_role("link", name="Historial")).not_to_be_visible()
        expect(page.get_by_role("link", name="Solicitudes")).not_to_be_visible()

        # Take a screenshot of the HR manager view
        page.screenshot(path="jules-scratch/verification/02_hr_view.png")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)

print("Verification script finished.")
