import re
from playwright.sync_api import Page, expect, sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Navigate and Login as HR Manager
        page.goto("http://localhost:3000/login")
        page.get_by_label("Nombre").fill("Alicia")
        page.get_by_label("PIN").fill("1212")
        page.get_by_role("button", name="Acceder").click()

        # VERIFY HR DASHBOARD VIEW
        # Wait for the dashboard to load
        expect(page.get_by_role("heading", name="Escritorio de RRHH")).to_be_visible(timeout=10000)

        # Check for one of the stat cards and one of the shortcuts
        expect(page.get_by_text("Total de Empleados")).to_be_visible()
        expect(page.get_by_role("link", name="Gestionar Empleados")).to_be_visible()

        page.screenshot(path="jules-scratch/verification/hr_dashboard.png")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error_hr_dashboard.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)

print("Verification script finished.")
