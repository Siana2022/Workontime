from playwright.sync_api import sync_playwright, expect

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # Navigate to the app. It should redirect to a page with the sidebar.
            page.goto("http://localhost:3000/", timeout=90000)

            # Wait for the sidebar logo to be visible
            logo = page.locator(".sidebar-logo")
            expect(logo).to_be_visible(timeout=60000)

            # Take a screenshot of the sidebar area for focused verification
            sidebar_element = page.locator(".sidebar")
            sidebar_element.screenshot(path="jules-scratch/verification/logo_verification.png")

            print("Screenshot taken successfully.")

        except Exception as e:
            print(f"An error occurred during verification: {e}")
            page.screenshot(path="jules-scratch/verification/error.png")

        finally:
            browser.close()

if __name__ == "__main__":
    run_verification()