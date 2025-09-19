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

        # --- VERIFY CREATE ---
        expect(page.get_by_role("heading", name="Gestión de Empleados")).to_be_visible(timeout=10000)
        expect(page.get_by_text("Alicia")).to_be_visible(timeout=10000) # Wait for list to load

        page.get_by_role("button", name="Añadir Empleado").click()

        new_employee_name = f"Test-{random_name()}"
        page.get_by_label("Nombre").fill(new_employee_name)
        page.get_by_label("PIN (4 dígitos)").fill("1234")
        page.get_by_role("button", name="Guardar").click()

        expect(page.get_by_text(new_employee_name)).to_be_visible(timeout=10000)
        print(f"CREATE: Successfully created employee '{new_employee_name}'")

        # --- VERIFY UPDATE ---
        new_row = page.locator("tr", has_text=new_employee_name)
        new_row.get_by_role("button", name="Editar").click()

        updated_employee_name = f"{new_employee_name}-edited"
        page.get_by_label("Nombre").fill(updated_employee_name)
        page.get_by_role("button", name="Guardar").click()

        expect(page.get_by_text(updated_employee_name)).to_be_visible(timeout=10000)
        print(f"UPDATE: Successfully updated employee to '{updated_employee_name}'")

        # --- VERIFY DELETE ---
        updated_row = page.locator("tr", has_text=updated_employee_name)
        # Handle the confirmation dialog
        page.on("dialog", lambda dialog: dialog.accept())
        updated_row.get_by_role("button", name="Eliminar").click()

        expect(page.get_by_text(updated_employee_name)).not_to_be_visible(timeout=10000)
        print(f"DELETE: Successfully deleted employee '{updated_employee_name}'")

        page.screenshot(path="jules-scratch/verification/employee_crud_success.png")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error_employee_crud.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)

print("Verification script finished.")
