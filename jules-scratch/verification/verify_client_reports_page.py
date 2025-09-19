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

        # Wait for dashboard and then navigate
        expect(page.get_by_role("heading", name="Escritorio de RRHH")).to_be_visible(timeout=10000)
        page.get_by_role("link", name="Informes de cliente").click()

        # VERIFY CLIENT REPORTS PAGE
        expect(page.get_by_role("heading", name="Informe por Cliente")).to_be_visible(timeout=10000)

        # Select a client from the dropdown.
        # Playwright's select_option will wait for the option to appear.
        page.locator("#client-select").select_option("Cliente A")

        # Generate the report
        page.get_by_role("button", name="Generar Informe").click()

        # Wait for the summary data to appear
        summary_total = page.locator(".client-summary-total")
        expect(summary_total).to_be_visible()

        page.screenshot(path="jules-scratch/verification/hr_client_reports_page.png")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error_hr_client_reports.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)

print("Verification script finished.")
