import re
from playwright.sync_api import Page, expect, sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Navigate to the login page
        page.goto("http://localhost:3000/login")

        # VERIFY LOGIN PAGE
        expect(page.get_by_role("heading", name="Iniciar Sesión")).to_be_visible(timeout=10000)

        # LOG IN as Employee
        page.get_by_label("Nombre").fill("Juanjo")
        page.get_by_label("PIN").fill("6119")
        page.get_by_role("button", name="Acceder").click()

        # VERIFY EMPLOYEE DASHBOARD
        expect(page.get_by_role("heading", name="Escritorio de Empleado")).to_be_visible(timeout=10000)

        # Take a screenshot of the final authenticated state
        page.screenshot(path="jules-scratch/verification/supabase_login_success.png")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error_supabase_login.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)

print("Verification script finished.")
