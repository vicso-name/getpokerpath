import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

const PATH = '/poker-pot-odds-calculator/';

const potField = (page: Page) => page.getByLabel('Pot size before opponent’s bet (P)');
const betField = (page: Page) => page.getByLabel('Opponent’s bet (B)');
const callField = (page: Page) => page.getByLabel('Amount to call (C)');
const equity = (page: Page) => page.getByTestId('required-equity');
const finalPot = (page: Page) => page.getByTestId('final-pot');
const ratio = (page: Page) => page.getByTestId('ratio');
const equation = (page: Page) => page.getByTestId('equation');
const message = (page: Page) => page.getByTestId('message');
const announcer = (page: Page) => page.getByTestId('announcer');
const example = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const reset = (page: Page) => page.getByRole('button', { name: 'Reset', exact: true });
const reason = (page: Page, name: RegExp) => page.getByRole('radio', { name });

/** Tapping exercises touch on the mobile projects and is a click on desktop. */
async function press(locator: Locator, hasTouch: boolean) {
  if (hasTouch) await locator.tap();
  else await locator.click();
}

/** Astro removes the `ssr` attribute once the island has hydrated. */
async function open(page: Page) {
  await page.goto(PATH);
  await page.locator('astro-island:not([ssr])').waitFor({ state: 'attached' });
}

async function enter(page: Page, pot: string, bet: string, call: string) {
  await potField(page).fill(pot);
  await betField(page).fill(bet);
  await callField(page).fill(call);
}

test.describe('server-rendered content', () => {
  test('is complete without JavaScript', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(PATH);

    await expect(page.locator('h1')).toHaveText('Pot Odds Calculator');
    await expect(equity(page)).toHaveText('25%');
    await expect(equation(page)).toHaveText('50 ÷ (100 + 50 + 50) = 25%');
    for (const heading of [
      'What pot odds mean',
      'How to calculate pot odds',
      'Pot odds examples',
      'When your call is smaller than the bet',
      'Pot odds vs equity',
      'What pot odds leave out',
      'Frequently asked questions',
    ]) {
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    }
    await context.close();
  });

  test('states the assumptions next to the result', async ({ page }) => {
    await page.goto(PATH);
    await expect(page.getByText(/break-even equity for an immediate call/)).toBeVisible();
    await expect(page.getByText(/doesn’t include rake, future bets or implied odds/)).toBeVisible();
  });

  test('links to the published tools in the text', async ({ page }) => {
    await page.goto(PATH);
    await expect(
      page.getByRole('link', { name: 'poker hand rankings chart' }),
    ).toHaveAttribute('href', '/poker-hand-rankings/');
    await expect(
      page.getByRole('link', { name: 'position at the table' }),
    ).toHaveAttribute('href', '/poker-positions/');
  });

  test('prints the golden prices in the bet size table', async ({ page }) => {
    await page.goto(PATH);
    const rows = page.locator('table tbody tr');
    await expect(rows.filter({ hasText: 'Half pot' })).toContainText('3:1');
    await expect(rows.filter({ hasText: 'Half pot' })).toContainText('25%');
    await expect(rows.filter({ hasText: 'Pot size' })).toContainText('2:1');
    await expect(rows.filter({ hasText: 'Pot size' })).toContainText('33.33%');
  });
});

test.describe('calculator', () => {
  test('opens on a worked example', async ({ page }) => {
    await open(page);
    await expect(potField(page)).toHaveValue('100');
    await expect(equity(page)).toHaveText('25%');
    await expect(finalPot(page)).toHaveText('200');
    await expect(ratio(page)).toHaveText('3:1');
  });

  test('recalculates as amounts change', async ({ page }) => {
    await open(page);
    await enter(page, '100', '100', '100');
    await expect(equity(page)).toHaveText('33.33%');
    await expect(finalPot(page)).toHaveText('300');
    await expect(ratio(page)).toHaveText('2:1');
    await expect(equation(page)).toHaveText('100 ÷ (100 + 100 + 100) ≈ 33.33%');
  });

  test('shows every step of the math', async ({ page }) => {
    await open(page);
    const steps = page.getByTestId('steps').getByRole('listitem');
    await expect(steps).toHaveCount(4);
    await expect(steps.nth(0)).toContainText('100 + 50 = 150');
    await expect(steps.nth(1)).toContainText('150 + 50 = 200');
    await expect(steps.nth(2)).toContainText('50 ÷ 200 = 25%');
    await expect(steps.nth(3)).toContainText('150 to 50 = 3:1');
  });

  test('handles decimals without stray digits', async ({ page }) => {
    await open(page);
    await enter(page, '0.1', '0.2', '0.2');
    await expect(equity(page)).toHaveText('40%');
    await expect(finalPot(page)).toHaveText('0.5');
    await expect(page.getByTestId('steps')).toContainText('0.1 + 0.2 = 0.3');
  });

  test('flags invalid text and removes the result', async ({ page }) => {
    await open(page);
    await betField(page).fill('abc');
    await expect(betField(page)).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText('Enter a number, like 50 or 12.50.')).toBeVisible();
    await expect(equity(page)).toHaveCount(0);
    await expect(message(page)).toHaveText('Fix the highlighted amount to see the result.');

    await betField(page).fill('50');
    await expect(betField(page)).not.toHaveAttribute('aria-invalid');
    await expect(equity(page)).toHaveText('25%');
  });

  test('refuses negative amounts', async ({ page }) => {
    await open(page);
    await potField(page).fill('-100');
    await expect(page.getByText('Amounts can’t be negative.')).toBeVisible();
    await expect(equity(page)).toHaveCount(0);
  });

  test('has no percentage when every amount is zero', async ({ page }) => {
    await open(page);
    await enter(page, '0', '0', '0');
    await expect(equity(page)).toHaveCount(0);
    await expect(message(page)).toContainText('no pot to work out');
  });

  test('says when there is nothing to call', async ({ page }) => {
    await open(page);
    await enter(page, '100', '0', '0');
    await expect(equity(page)).toHaveCount(0);
    await expect(message(page)).toContainText('costs nothing');
  });

  test('refuses a call larger than the bet', async ({ page }) => {
    await open(page);
    await enter(page, '100', '50', '60');
    await expect(callField(page)).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText(/can’t be more than the bet/)).toBeVisible();
    await expect(equity(page)).toHaveCount(0);
  });

  test('resets to empty and returns focus to the first field', async ({ page }, info) => {
    await open(page);
    await press(reset(page), Boolean(info.project.use.hasTouch));
    await expect(potField(page)).toHaveValue('');
    await expect(betField(page)).toHaveValue('');
    await expect(callField(page)).toHaveValue('');
    await expect(potField(page)).toBeFocused();
    await expect(message(page)).toHaveText('Enter all three amounts to see the result.');
  });

  test('every example loads a matching result', async ({ page }, info) => {
    const hasTouch = Boolean(info.project.use.hasTouch);
    await open(page);

    await press(example(page, 'Pot-size bet'), hasTouch);
    await expect(equity(page)).toHaveText('33.33%');

    await press(example(page, 'Facing a raise'), hasTouch);
    await expect(equity(page)).toHaveText('18.18%');
    await expect(reason(page, /already have chips/)).toBeChecked();

    await press(example(page, 'All-in for less'), hasTouch);
    await expect(equity(page)).toHaveText('22.22%');
    await expect(reason(page, /against one opponent/)).toBeChecked();

    await press(example(page, 'Half-pot bet'), hasTouch);
    await expect(equity(page)).toHaveText('25%');
    await expect(reason(page, /against one opponent/)).toHaveCount(0);
  });
});

test.describe('call smaller than the bet', () => {
  test('withholds the number until the reason is known', async ({ page }) => {
    await open(page);
    await enter(page, '100', '100', '40');
    await expect(equity(page)).toHaveCount(0);
    await expect(message(page)).toContainText('Choose why');
    await expect(page.getByRole('group', { name: /Why is your call smaller/ })).toBeVisible();
  });

  test('keeps every entered chip when you already have chips in', async ({ page }, info) => {
    await open(page);
    await enter(page, '120', '60', '40');
    await press(reason(page, /already have chips/), Boolean(info.project.use.hasTouch));
    await expect(equity(page)).toHaveText('18.18%');
    await expect(finalPot(page)).toHaveText('220');
  });

  test('removes the unmatched part when all-in for less', async ({ page }, info) => {
    await open(page);
    await enter(page, '100', '100', '40');
    await press(reason(page, /against one opponent/), Boolean(info.project.use.hasTouch));
    await expect(equity(page)).toHaveText('22.22%');
    await expect(finalPot(page)).toHaveText('180');
    await expect(equation(page)).toHaveText('40 ÷ (100 + 40 + 40) ≈ 22.22%');
    await expect(page.getByTestId('result')).toContainText('the other 60 goes back');
  });

  test('gives no number for any other all-in', async ({ page }, info) => {
    await open(page);
    await enter(page, '100', '200', '40');
    await press(reason(page, /Any other all-in/), Boolean(info.project.use.hasTouch));
    await expect(equity(page)).toHaveCount(0);
    await expect(message(page)).toContainText('side pot');
  });

  test('hides the question when the call matches the bet again', async ({ page }) => {
    await open(page);
    await enter(page, '100', '100', '40');
    await callField(page).fill('100');
    await expect(reason(page, /against one opponent/)).toHaveCount(0);
    await expect(equity(page)).toHaveText('33.33%');
  });
});

test.describe('keyboard and screen readers', () => {
  test('finishes a calculation without a pointer', async ({ page }) => {
    await open(page);
    await potField(page).focus();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.type('200');
    await page.keyboard.press('Tab');
    await expect(betField(page)).toBeFocused();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.type('100');
    await page.keyboard.press('Tab');
    await expect(callField(page)).toBeFocused();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.type('100');
    await expect(equity(page)).toHaveText('25%');
    await expect(finalPot(page)).toHaveText('400');
  });

  test('answers the reason question from the keyboard', async ({ page }) => {
    await open(page);
    await enter(page, '100', '100', '40');
    await callField(page).press('Tab');
    await expect(reason(page, /already have chips/)).toBeFocused();
    await page.keyboard.press('Space');
    await expect(equity(page)).toHaveText('16.67%');
    await page.keyboard.press('ArrowDown');
    await expect(reason(page, /against one opponent/)).toBeChecked();
    await expect(equity(page)).toHaveText('22.22%');
  });

  test('pressing Enter in a field keeps the page and the result', async ({ page }) => {
    await open(page);
    await potField(page).press('Enter');
    await expect(page).toHaveURL(new RegExp(`${PATH}$`));
    await expect(equity(page)).toHaveText('25%');
  });

  test('reset and examples work from the keyboard', async ({ page }) => {
    await open(page);
    await reset(page).focus();
    await page.keyboard.press('Enter');
    await expect(potField(page)).toBeFocused();
    await example(page, 'Pot-size bet').focus();
    await page.keyboard.press('Space');
    await expect(equity(page)).toHaveText('33.33%');
  });

  test('announces the result once typing stops', async ({ page }) => {
    await open(page);
    await enter(page, '100', '100', '100');
    await expect(announcer(page)).toHaveText('Required equity 33.33%. Final pot 300. Pot odds 2:1.');
    await expect(announcer(page)).toHaveAttribute('role', 'status');
  });

  test('announces problems and ties errors to their field', async ({ page }) => {
    await open(page);
    await betField(page).fill('abc');
    await expect(announcer(page)).toHaveText('Fix the highlighted amount to see the result.');
    await expect(betField(page)).toHaveAccessibleDescription(/Enter a number, like 50 or 12.50/);
  });

  test('labels each field with its help text', async ({ page }) => {
    await open(page);
    await expect(potField(page)).toHaveAccessibleDescription(/including chips you put in/);
    await expect(callField(page)).toHaveAccessibleDescription(/still have to pay/);
    await expect(callField(page)).toHaveAttribute('inputmode', 'decimal');
  });
});

test.describe('layout and accessibility', () => {
  test('hydrates and runs without console errors', async ({ page }) => {
    const problems: string[] = [];
    page.on('console', (entry) => {
      if (entry.type() === 'error' || entry.type() === 'warning') problems.push(entry.text());
    });
    page.on('pageerror', (error) => problems.push(error.message));

    await open(page);
    await enter(page, '100', 'abc', '40');
    await enter(page, '100', '100', '40');
    await example(page, 'All-in for less').click();
    await reset(page).click();
    expect(problems).toEqual([]);
  });

  for (const state of ['result', 'empty', 'invalid', 'reason', 'side-pot'] as const) {
    test(`has no accessibility violations or overflow: ${state}`, async ({ page }) => {
      await open(page);
      if (state === 'empty') await enter(page, '', '', '');
      if (state === 'invalid') await enter(page, '-5', 'abc', '1.234');
      if (state === 'reason') await enter(page, '100', '100', '40');
      if (state === 'side-pot') {
        await enter(page, '100', '200', '40');
        await reason(page, /Any other all-in/).check();
      }

      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations.map((violation) => violation.id)).toEqual([]);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test('huge amounts wrap instead of overflowing', async ({ page }) => {
    await open(page);
    await enter(page, '1000000000', '1000000000', '1000000000');
    await expect(finalPot(page)).toHaveText('3,000,000,000');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('controls meet the tap size', async ({ page }) => {
    await open(page);
    await enter(page, '100', '100', '40');
    const controls = [
      potField(page),
      betField(page),
      callField(page),
      reset(page),
      example(page, 'Pot-size bet'),
      page.locator('label', { hasText: 'against one opponent' }),
    ];
    for (const control of controls) {
      const box = await control.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('the result sits right after the fields', async ({ page }) => {
    await open(page);
    const call = await callField(page).boundingBox();
    const result = await equity(page).boundingBox();
    expect(call && result).toBeTruthy();
    if (call && result && page.viewportSize()!.width < 960) {
      expect(result.y - (call.y + call.height)).toBeLessThan(200);
    }
  });

  test('the calculator appears before the explanatory text', async ({ page }) => {
    await page.goto(PATH);
    const tool = await page.getByRole('heading', { name: 'Calculate your pot odds' }).boundingBox();
    const text = await page.getByRole('heading', { name: 'What pot odds mean', exact: true }).boundingBox();
    expect(tool && text && tool.y < text.y).toBe(true);
  });
});
