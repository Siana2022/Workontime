import re
from playwright.sync_api import Page, expect, sync_playwright
import random
import string

def random_name(length=8):
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(length)).capitalize()

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

        # Navigate to the employees page
        expect(page.get_by_role("heading", name="Escritorio de RRHH")).to_be_visible(timeout=10000)
        page.get_by_role("link", name="Gestionar Empleados").click()

        # VERIFY ADD EMPLOYEE FLOW
        expect(page.get_by_role("heading", name="Gestión de Empleados")).to_be_visible(timeout=10000)

        # **FIX:** Wait for the initial list of employees to be loaded before counting them
        expect(page.get_by_text("Alicia")).to_be_visible(timeout=10000)

        # Get the initial count of employees
        initial_row_count = page.locator("tbody tr").count()

        # Click "Add Employee"
        page.get_by_role("button", name="Añadir Empleado").click()

        # Fill out the form
        new_employee_name = f"Test-{random_name()}"
        page.get_by_label("Nombre").fill(new_employee_name)
        page.get_by_label("PIN (4 dígitos)").fill("9999")
        page.get_by_role("button", name="Guardar").click()

        # Wait for the form to disappear and the new employee to be visible
        expect(page.get_by_text(new_employee_name)).to_be_visible(timeout=10000)

        # Verify the row count has increased
        expect(page.locator("tbody tr")).to_have_count(initial_row_count + 1)

        page.screenshot(path="jules-scratch/verification/add_employee_success.png")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error_add_employee.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)

print("Verification script finished.")
