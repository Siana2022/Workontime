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

    new_schedule_name = f"TestSchedule-{random_name()}"

    try:
        # === Step 1: Login as HR and Create a new Schedule ===
        page.goto("http://localhost:3000/login")
        page.get_by_label("Nombre").fill("Alicia")
        page.get_by_label("PIN").fill("1212")
        page.get_by_role("button", name="Acceder").click()

        expect(page.get_by_role("heading", name="Escritorio de RRHH")).to_be_visible(timeout=10000)
        page.get_by_role("link", name="Tipos de horario").click()

        expect(page.get_by_role("heading", name="Gestión de Tipos de Horario")).to_be_visible(timeout=10000)
        page.get_by_role("button", name="Añadir Tipo").click()

        page.get_by_label("Nombre del Horario").fill(new_schedule_name)
        page.get_by_label("Horas por Semana").fill("35")
        page.get_by_role("button", name="Guardar").click()

        expect(page.get_by_text(new_schedule_name)).to_be_visible(timeout=10000)
        print(f"CREATE: Successfully created schedule '{new_schedule_name}'")

        # === Step 2: Assign the new schedule to an Employee ===
        page.get_by_role("link", name="Gestionar Empleados").click()
        expect(page.get_by_role("heading", name="Gestión de Empleados")).to_be_visible(timeout=10000)

        juanjo_row = page.locator("tr", has_text="Juanjo")
        juanjo_row.get_by_role("button", name="Editar").click()

        expect(page.get_by_role("heading", name="Editar Empleado")).to_be_visible()
        page.locator("#employee-schedule").select_option(label=new_schedule_name)
        page.get_by_role("button", name="Guardar").click()

        expect(juanjo_row.get_by_text(new_schedule_name)).to_be_visible(timeout=10000)
        print("ASSIGN: Successfully assigned schedule to Juanjo")

        # === Step 3: Login as Employee and Verify Schedule Display ===
        # Use a new browser context for a clean session
        context2 = browser.new_context()
        page2 = context2.new_page()

        page2.goto("http://localhost:3000/login")
        page2.get_by_label("Nombre").fill("Juanjo")
        page2.get_by_label("PIN").fill("6119")
        page2.get_by_role("button", name="Acceder").click()

        expect(page2.get_by_role("heading", name="Escritorio de Empleado")).to_be_visible(timeout=10000)

        schedule_info = page2.locator(".schedule-info")
        expect(schedule_info).to_be_visible()
        expect(schedule_info).to_contain_text(new_schedule_name)
        expect(schedule_info).to_contain_text("35")
        print("VERIFY: Successfully verified schedule display on employee dashboard.")

        page2.screenshot(path="jules-scratch/verification/schedules_flow_success.png")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error_schedules_flow.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)

print("Verification script finished.")
