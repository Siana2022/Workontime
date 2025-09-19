import re
from playwright.sync_api import Page, expect, sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Navigate to the app
        page.goto("http://localhost:3000")

        # Change role to HR Manager
        page.locator("#role-selector").select_option("Gestor de RRHH")

        # Wait for the HR dashboard to load
        expect(page.locator('h1:has-text("Escritorio de RRHH")')).to_be_visible(timeout=10000)

        # Select the sidebar element
        sidebar = page.locator(".sidebar")

        # Verify that there is no scrollbar by checking the scroll height vs client height
        # This is a programmatic way to check for a scrollbar
        scroll_height = sidebar.evaluate("element => element.scrollHeight")
        client_height = sidebar.evaluate("element => element.clientHeight")
        expect(scroll_height).to_be_less_than_or_equal_to(client_height)

        # Take a screenshot of the sidebar
        sidebar.screenshot(path="jules-scratch/verification/sidebar_hr_indented.png")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)

print("Verification script finished.")
