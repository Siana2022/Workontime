import re
from playwright.sync_api import Page, expect, sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Navigate to the app, should redirect to login
        page.goto("http://localhost:3000")

        # VERIFY LOGIN PAGE
        expect(page.get_by_role("heading", name="Iniciar Sesión")).to_be_visible(timeout=10000)
        page.screenshot(path="jules-scratch/verification/01_login_page.png")

        # LOG IN
        page.get_by_label("Nombre").fill("Juanjo")
        page.get_by_label("PIN").fill("6119")
        page.get_by_role("button", name="Acceder").click()

        # VERIFY EMPLOYEE DASHBOARD
        expect(page.get_by_role("heading", name="Escritorio de Empleado")).to_be_visible(timeout=10000)
        expect(page.get_by_role("heading", name="Bienvenido, Juanjo!")).to_be_visible()
        page.screenshot(path="jules-scratch/verification/02_employee_dashboard.png")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)

print("Verification script finished.")
