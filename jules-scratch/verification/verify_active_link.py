import re
from playwright.sync_api import Page, expect, sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Login as an Employee
        page.goto("http://localhost:3000/login")
        page.get_by_label("Nombre").fill("Juanjo")
        page.get_by_label("PIN").fill("6119")
        page.get_by_role("button", name="Acceder").click()

        # Wait for dashboard to load. The 'Escritorio' link should be active.
        expect(page.get_by_role("heading", name="Escritorio de Empleado")).to_be_visible(timeout=10000)

        # Take a screenshot of the sidebar with the first link active
        sidebar = page.locator(".sidebar")
        sidebar.screenshot(path="jules-scratch/verification/01_sidebar_escritorio_active.png")

        # Click the 'Historial' link
        page.get_by_role("link", name="Historial").click()

        # Wait for the History page to load
        expect(page.get_by_role("heading", name="Historial de Fichajes")).to_be_visible(timeout=10000)

        # Take a screenshot of the sidebar with the second link active
        sidebar.screenshot(path="jules-scratch/verification/02_sidebar_historial_active.png")


    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error_active_link.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)

print("Verification script finished.")
