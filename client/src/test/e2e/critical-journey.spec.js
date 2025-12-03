import { test, expect } from '@playwright/test';

test.describe('Critical User Journey', () => {
    test.beforeEach(async ({ page }) => {
        // Start at the home page
        await page.goto('/');
    });

    test('complete user flow: login → create tree → add person → search', async ({ page }) => {
        // Step 1: Login (assuming mock mode or already authenticated)
        await expect(page).toHaveTitle(/Family Tree/i);

        // Check if we're on the dashboard or need to login
        const isLoggedIn = await page.locator('text=Create New Tree').isVisible().catch(() => false);

        if (!isLoggedIn) {
            // If not logged in, we should see login options
            await expect(page.locator('text=Sign in with Google')).toBeVisible();
            // In mock mode, this would auto-login
            // For now, we'll skip the actual login flow
            test.skip();
        }

        // Step 2: Create a new tree
        await page.click('text=Create New Tree');

        // Fill in tree name
        await page.fill('input[placeholder*="tree name" i]', 'Test Family Tree');
        await page.click('button:has-text("Create")');

        // Wait for tree page to load
        await expect(page).toHaveURL(/\/tree\//);
        await expect(page.locator('text=Test Family Tree')).toBeVisible();

        // Step 3: Add first person (root node)
        // Look for "Add First Person" or "Add Root" button
        const addRootButton = page.locator('button:has-text("Add Root")').first();
        if (await addRootButton.isVisible()) {
            await addRootButton.click();
        }

        // Step 4: Edit person details in side panel
        // Wait for side panel to open
        await expect(page.locator('text=Edit Person')).toBeVisible({ timeout: 5000 });

        // Fill in person details
        await page.fill('input[name="first_name"]', 'John');
        await page.fill('input[name="last_name"]', 'Doe');
        await page.selectOption('select[name="gender"]', 'Male');
        await page.fill('input[name="dob"]', '1980-01-01');
        await page.fill('input[name="occupation"]', 'Engineer');
        await page.fill('textarea[name="bio"]', 'Test person bio');

        // Save the person
        await page.click('button:has-text("Save")');

        // Wait for save to complete
        await expect(page.locator('text=John Doe')).toBeVisible();

        // Step 5: Add a spouse
        // Right-click on the node (or use context menu)
        await page.locator('text=John Doe').click({ button: 'right' });
        await page.click('text=Add Spouse');

        // Fill in spouse details
        await page.fill('input[name="first_name"]', 'Jane');
        await page.fill('input[name="last_name"]', 'Doe');
        await page.selectOption('select[name="gender"]', 'Female');
        await page.click('button:has-text("Save")');

        // Verify spouse is added
        await expect(page.locator('text=Jane Doe')).toBeVisible();

        // Step 6: Add a child
        await page.locator('text=John Doe').click({ button: 'right' });
        await page.click('text=Add Child');

        await page.fill('input[name="first_name"]', 'Alice');
        await page.fill('input[name="last_name"]', 'Doe');
        await page.selectOption('select[name="gender"]', 'Female');
        await page.fill('input[name="dob"]', '2010-05-15');
        await page.click('button:has-text("Save")');

        await expect(page.locator('text=Alice Doe')).toBeVisible();

        // Step 7: Test search functionality
        // Open search
        const searchButton = page.locator('button[title*="Search" i]').first();
        await searchButton.click();

        // Search for a person
        await page.fill('input[placeholder*="Search family members" i]', 'Alice');

        // Verify search highlights the person
        await expect(page.locator('text=Alice Doe')).toHaveClass(/highlighted/);

        // Clear search
        await page.click('button[title*="Close Search" i]');

        // Step 8: Test timeline view
        await page.click('button[title*="Timeline" i]');
        await expect(page).toHaveURL(/\/timeline/);
        await expect(page.locator('text=Family Timeline')).toBeVisible();

        // Verify events are shown
        await expect(page.locator('text=Birth')).toBeVisible();

        // Step 9: Navigate back to tree
        await page.click('a:has-text("Tree")');
        await expect(page).toHaveURL(/\/tree\//);

        // Verify all persons are still visible
        await expect(page.locator('text=John Doe')).toBeVisible();
        await expect(page.locator('text=Jane Doe')).toBeVisible();
        await expect(page.locator('text=Alice Doe')).toBeVisible();
    });

    test('should handle tree deletion', async ({ page }) => {
        // Navigate to dashboard
        await page.goto('/trees');

        // Verify we're on the dashboard
        await expect(page.locator('text=My Family Trees')).toBeVisible();

        // Find a tree to delete (if any exist)
        const treeCard = page.locator('[data-testid="tree-card"]').first();

        if (await treeCard.isVisible()) {
            // Click delete button
            await treeCard.locator('button[title*="Delete" i]').click();

            // Confirm deletion
            await page.click('button:has-text("Delete")');

            // Verify tree is removed
            await expect(page.locator('text=Tree deleted successfully')).toBeVisible();
        }
    });

    test('should test permission controls', async ({ page }) => {
        // This test would verify that viewers cannot edit
        // For now, we'll skip as it requires multi-user setup
        test.skip();
    });
});
