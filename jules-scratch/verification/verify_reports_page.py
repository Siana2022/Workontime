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

        # Wait for dashboard to ensure login is complete
        expect(page.get_by_role("heading", name="Escritorio de RRHH")).to_be_visible(timeout=10000)

        # Navigate to the reports page by clicking the sidebar link, using an exact match
        page.get_by_role("link", name="Informes", exact=True).click()

        # VERIFY REPORTS PAGE
        expect(page.get_by_role("heading", name="Informes de Fichajes")).to_be_visible(timeout=10000)

        # Apply filters to fetch data
        page.get_by_role("button", name="Aplicar Filtros").click()

        # Wait for the summary table to appear
        summary_table_header = page.get_by_role("cell", name="Horas Totales Trabajadas")
        expect(summary_table_header).to_be_visible()

        page.screenshot(path="jules-scratch/verification/hr_reports_page.png")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error_hr_reports.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)

print("Verification script finished.")
