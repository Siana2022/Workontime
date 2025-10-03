from playwright.sync_api import sync_playwright, expect

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # Navigate to the app. It should redirect to the employees page.
            page.goto("http://localhost:3000/", timeout=60000)

            # Wait for the table to be visible to ensure the page has loaded
            table = page.locator(".hr-panel-table")
            expect(table).to_be_visible(timeout=30000)

            # Take a screenshot for visual verification
            page.screenshot(path="jules-scratch/verification/table_text_color_verification.png")

            print("Screenshot taken successfully.")

        except Exception as e:
            print(f"An error occurred: {e}")
            page.screenshot(path="jules-scratch/verification/error.png")

        finally:
            browser.close()

if __name__ == "__main__":
    run_verification()