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

        # VERIFY HR DASHBOARD
        # Wait for the dashboard to load
        expect(page.get_by_role("heading", name="Escritorio de RRHH")).to_be_visible(timeout=10000)

        # Verify the total employees card
        total_employees_card = page.locator(".stat-card", has_text="Total de Empleados")
        expect(total_employees_card.get_by_text("2")).to_be_visible(timeout=10000)

        # Verify the pending requests card
        pending_requests_card = page.locator(".stat-card", has_text="Solicitudes Pendientes")
        # We expect 0 because we haven't submitted any requests yet
        expect(pending_requests_card.get_by_text("0")).to_be_visible(timeout=10000)

        page.screenshot(path="jules-scratch/verification/full_dynamic_hr_dashboard.png")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error_full_dynamic_hr_dashboard.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)

print("Verification script finished.")
