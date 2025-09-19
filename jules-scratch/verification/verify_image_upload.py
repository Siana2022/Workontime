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

        # VERIFY IMAGE UPLOAD
        expect(page.get_by_role("heading", name="Gestión de Empleados")).to_be_visible(timeout=10000)
        page.get_by_role("button", name="Añadir Empleado").click()

        # Fill out the form and select the dummy file for upload
        new_employee_name = f"AvatarTest-{random_name()}"
        page.get_by_label("Nombre").fill(new_employee_name)
        page.get_by_label("PIN (4 dígitos)").fill("5555")

        # Use set_input_files with the correct relative path
        page.locator("input[type='file']").set_input_files("../jules-scratch/verification/test-image.png")

        page.get_by_role("button", name="Guardar").click()

        # Wait for the new employee to appear in the table
        new_row = page.locator("tr", has_text=new_employee_name)
        expect(new_row).to_be_visible(timeout=10000)

        # Verify that the new employee's avatar has a supabase URL
        avatar_image = new_row.locator(".employee-table-avatar")
        expect(avatar_image).to_have_attribute("src", re.compile(r"https://uywabqbqzoeganyisvuk.supabase.co/storage/v1/object/public/avatars/public/.*"))

        print(f"SUCCESS: Employee '{new_employee_name}' created with a Supabase avatar URL.")
        page.screenshot(path="jules-scratch/verification/image_upload_success.png")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error_image_upload.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)

print("Verification script finished.")
