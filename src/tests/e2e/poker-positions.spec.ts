import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

const PATH = '/poker-positions/';

const seat = (page: Page, number: number) => page.getByTestId(`seat-${number}`);
const details = (page: Page) => page.getByTestId('seat-details');
const prompt = (page: Page) => page.getByTestId('prompt');
const feedback = (page: Page) => page.getByTestId('feedback');
const score = (page: Page) => page.getByTestId('score');
const nextQuestion = (page: Page) => page.getByRole('button', { name: 'Next question' });

/** Tapping exercises touch on the mobile projects and is a click on desktop. */
async function press(locator: Locator, hasTouch: boolean, force = false) {
  if (hasTouch) await locator.tap({ force });
  else await locator.click({ force });
}

/** Astro removes the `ssr` attribute once the island has hydrated. */
async function open(page: Page) {
  await page.goto(PATH);
  await page.locator('astro-island:not([ssr])').waitFor({ state: 'attached' });
}

const startPractice = (page: Page, hasTouch: boolean) =>
  press(page.locator('label', { hasText: 'Practice' }), hasTouch);
const chooseNineMax = (page: Page, hasTouch: boolean) =>
  press(page.locator('label', { hasText: '9-max' }), hasTouch);

/** Reads seat labels in seat order, as displayed on the table. */
async function tableLabels(page: Page, seats: number) {
  const labels: string[] = [];
  for (let number = 1; number <= seats; number += 1) {
    const text = await seat(page, number).innerText();
    labels.push(text.split('\n').at(-1) ?? '');
  }
  return labels;
}

test.describe('server-rendered content', () => {
  test('is complete without JavaScript', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(PATH);

    await expect(page.locator('h1')).toHaveText('Poker Positions Explained');
    await expect(details(page)).toContainText('Button (BTN)');
    await expect(seat(page, 1)).toContainText('BTN');
    await expect(seat(page, 6)).toContainText('CO');
    for (const heading of [
      'Poker position names',
      'Early, middle and late position',
      'Why being in position is an advantage',
      'Who acts first before and after the flop',
      '6-max and 9-max table examples',
      'Frequently asked questions',
    ]) {
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    }
    await context.close();
  });

  test('gives every illustration and chart a text equivalent', async ({ page }) => {
    await page.goto(PATH);
    await expect(page.getByRole('img', { name: /^6-max poker table, clockwise: Seat 1 BTN/ })).toBeVisible();
    await expect(page.getByRole('img', { name: /^9-max poker table, clockwise: Seat 1 BTN/ })).toBeVisible();
    await expect(page.getByRole('table', { name: /^6-max positions/ }).getByRole('row')).toHaveCount(7);
    await expect(page.getByRole('table', { name: /^9-max positions/ }).getByRole('row')).toHaveCount(10);
  });

  test('links to the hand rankings tool', async ({ page }) => {
    await page.goto(PATH);
    await expect(page.locator('main a[href="/poker-hand-rankings/"]').first()).toBeVisible();
  });
});

test.describe('interactive table', () => {
  test('shows correct 6-max and 9-max positions', async ({ page }, info) => {
    await open(page);
    expect(await tableLabels(page, 6)).toEqual(['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO']);
    await expect(seat(page, 7)).toHaveCount(0);

    await chooseNineMax(page, Boolean(info.project.use.hasTouch));
    expect(await tableLabels(page, 9)).toEqual([
      'BTN',
      'SB',
      'BB',
      'UTG',
      'UTG+1',
      'MP',
      'LJ',
      'HJ',
      'CO',
    ]);
  });

  test('selecting a seat explains that position', async ({ page }, info) => {
    await open(page);
    await press(seat(page, 6), Boolean(info.project.use.hasTouch));
    await expect(seat(page, 6)).toHaveAttribute('aria-pressed', 'true');
    await expect(seat(page, 1)).toHaveAttribute('aria-pressed', 'false');
    await expect(details(page)).toContainText('Cutoff (CO)');
    await expect(details(page)).toContainText('Late position');
    await expect(details(page)).toContainText('1 seat counterclockwise from the button');
    await expect(details(page)).toContainText('Acts 3 of 6');
    await expect(details(page)).toContainText('Acts 5 of 6');
    await expect(page.getByTestId('announcer')).toHaveText('Seat 6 is the Cutoff (CO).');
  });

  test('moving the button rotates every position clockwise, blinds included', async ({ page }, info) => {
    const hasTouch = Boolean(info.project.use.hasTouch);
    const moveButton = page.getByRole('button', { name: 'Move dealer button' });
    await open(page);

    await press(moveButton, hasTouch);
    expect(await tableLabels(page, 6)).toEqual(['CO', 'BTN', 'SB', 'BB', 'UTG', 'HJ']);
    await expect(seat(page, 2)).toHaveAccessibleName(/dealer button/);
    await expect(seat(page, 1)).not.toHaveAccessibleName(/dealer button/);

    await press(moveButton, hasTouch);
    expect(await tableLabels(page, 6)).toEqual(['HJ', 'CO', 'BTN', 'SB', 'BB', 'UTG']);

    for (let move = 0; move < 4; move += 1) await press(moveButton, hasTouch);
    expect(await tableLabels(page, 6)).toEqual(['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO']);
  });

  test('the dealer chip follows the button', async ({ page }, info) => {
    await open(page);
    const chip = page.getByTestId('dealer-chip').first();
    const before = await chip.getAttribute('style');
    await press(page.getByRole('button', { name: 'Move dealer button' }), Boolean(info.project.use.hasTouch));
    await expect(chip).not.toHaveAttribute('style', before ?? '');
  });

  test('switching to 6-max after a long rotation keeps a valid table', async ({ page }, info) => {
    const hasTouch = Boolean(info.project.use.hasTouch);
    await open(page);
    await chooseNineMax(page, hasTouch);
    const moveButton = page.getByRole('button', { name: 'Move dealer button' });
    for (let move = 0; move < 8; move += 1) await press(moveButton, hasTouch);
    await expect(seat(page, 9)).toContainText('BTN');

    await press(page.locator('label', { hasText: '6-max' }), hasTouch);
    expect(await tableLabels(page, 6)).toEqual(['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO']);
  });
});

test.describe('practice', () => {
  test('completes a full round: wrong, explained, then correct', async ({ page }, info) => {
    const hasTouch = Boolean(info.project.use.hasTouch);
    await open(page);
    await startPractice(page, hasTouch);

    await expect(prompt(page)).toHaveText('Find the Cutoff (CO)');
    await expect(score(page)).toHaveText('Score: 0 of 0');
    await expect(seat(page, 6)).not.toContainText('CO');

    await press(seat(page, 3), hasTouch);
    await expect(feedback(page)).toContainText('Not quite');
    await expect(feedback(page)).toContainText(
      'Seat 3 is the Big Blind (BB). The Cutoff (CO) is Seat 6: 1 seat counterclockwise from the button.',
    );
    await expect(feedback(page)).toBeInViewport();
    await expect(score(page)).toHaveText('Score: 0 of 1');
    await expect(seat(page, 3)).toHaveAttribute('data-status', 'wrong');
    await expect(seat(page, 6)).toHaveAttribute('data-status', 'correct');
    await expect(seat(page, 6)).toContainText('CO');

    await press(nextQuestion(page), hasTouch);
    await expect(feedback(page)).toHaveCount(0);
    await expect(seat(page, 2)).toHaveAccessibleName(/dealer button/);
    await expect(prompt(page)).not.toHaveText('Find the Cutoff (CO)');

    const target = (await prompt(page).innerText()).match(/\((.+)\)/)?.[1] ?? '';
    const order = ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO'];
    const correctSeat = ((1 + order.indexOf(target)) % 6) + 1;
    await press(seat(page, correctSeat), hasTouch);
    await expect(feedback(page)).toContainText(`Seat ${correctSeat} is`);
    await expect(score(page)).toHaveText('Score: 1 of 2');
    await expect(page.getByTestId('announcer')).toContainText('Score: 1 of 2.');
  });

  test('only the first answer counts', async ({ page }, info) => {
    const hasTouch = Boolean(info.project.use.hasTouch);
    await open(page);
    await startPractice(page, hasTouch);
    await press(seat(page, 3), hasTouch);
    await expect(seat(page, 6)).toHaveAttribute('aria-disabled', 'true');
    await press(seat(page, 6), hasTouch, true);
    await expect(score(page)).toHaveText('Score: 0 of 1');
  });

  test('the score resets', async ({ page }, info) => {
    const hasTouch = Boolean(info.project.use.hasTouch);
    await open(page);
    await startPractice(page, hasTouch);
    await press(seat(page, 6), hasTouch);
    await expect(score(page)).toHaveText('Score: 1 of 1');
    await press(page.getByRole('button', { name: 'Reset score' }), hasTouch);
    await expect(score(page)).toHaveText('Score: 0 of 0');
  });

  test('works on a 9-max table', async ({ page }, info) => {
    const hasTouch = Boolean(info.project.use.hasTouch);
    await open(page);
    await startPractice(page, hasTouch);
    await chooseNineMax(page, hasTouch);

    await expect(seat(page, 9)).toBeVisible();
    const target = (await prompt(page).innerText()).match(/\((.+)\)/)?.[1] ?? '';
    const order = ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'LJ', 'HJ', 'CO'];
    await press(seat(page, order.indexOf(target) + 1), hasTouch);
    await expect(feedback(page)).toContainText('Correct');
  });
});

test.describe('button target', () => {
  test('practice can ask for the Button and accepts it', async ({ page }, info) => {
    const hasTouch = Boolean(info.project.use.hasTouch);
    // The first entry in the clockwise list is the Button.
    await page.addInitScript(() => {
      Math.random = () => 0;
    });
    await open(page);
    await startPractice(page, hasTouch);
    await press(seat(page, 6), hasTouch);
    await press(nextQuestion(page), hasTouch);

    await expect(prompt(page)).toHaveText('Find the Button (BTN)');
    await press(seat(page, 2), hasTouch);
    await expect(feedback(page)).toContainText('Correct');
    await expect(feedback(page)).toContainText('Seat 2 is the Button (BTN): the seat with the dealer button.');
    await expect(score(page)).toHaveText('Score: 2 of 2');
  });
});

test.describe('acting order', () => {
  test('says it assumes every player is still in the hand', async ({ page }) => {
    await page.goto(PATH);
    await expect(details(page).locator('..').getByText(/Assumes every player is still in the hand/)).toBeVisible();
    await expect(page.getByText(/turn numbers assume every player is still in the hand/)).toBeVisible();
    await expect(page.getByRole('figure').first().getByText(/Assumes every player/)).toBeVisible();
  });
});

test.describe('keyboard', () => {
  test('finishes a practice round without a pointer', async ({ page }) => {
    await open(page);
    await page.getByRole('radio', { name: 'Explore' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('radio', { name: 'Practice' })).toBeChecked();

    await seat(page, 6).focus();
    await page.keyboard.press('Enter');
    await expect(feedback(page)).toContainText('Correct');

    // Focus lands on Next, so Enter moves straight on to the new question.
    await expect(nextQuestion(page)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(prompt(page)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Reset score' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(seat(page, 1)).toBeFocused();
  });

  test('every seat is a tab stop in clockwise order', async ({ page }) => {
    await open(page);
    await seat(page, 1).focus();
    for (let number = 2; number <= 6; number += 1) {
      await page.keyboard.press('Tab');
      await expect(seat(page, number)).toBeFocused();
    }
  });

  test('selects a seat with Space', async ({ page }) => {
    await open(page);
    await seat(page, 4).focus();
    await page.keyboard.press('Space');
    await expect(details(page)).toContainText('Under the Gun (UTG)');
  });
});

test.describe('layout and accessibility', () => {
  test('hydrates and runs without console errors', async ({ page }) => {
    const problems: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error' || message.type() === 'warning') problems.push(message.text());
    });
    page.on('pageerror', (error) => problems.push(error.message));

    await open(page);
    await page.getByRole('button', { name: 'Move dealer button' }).click();
    await page.locator('label', { hasText: '9-max' }).click();
    await page.locator('label', { hasText: 'Practice' }).click();
    await seat(page, 1).click();
    await nextQuestion(page).click();
    expect(problems).toEqual([]);
  });

  for (const state of ['explore', 'explore-9-max', 'practice', 'answered'] as const) {
    test(`has no accessibility violations or overflow: ${state}`, async ({ page }) => {
      await open(page);
      if (state === 'explore-9-max') await page.locator('label', { hasText: '9-max' }).click();
      if (state === 'practice' || state === 'answered') {
        await page.locator('label', { hasText: 'Practice' }).click();
      }
      if (state === 'answered') await seat(page, 3).click();

      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations.map((violation) => violation.id)).toEqual([]);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test('nine seats stay tappable and never overlap', async ({ page }, info) => {
    await open(page);
    await chooseNineMax(page, Boolean(info.project.use.hasTouch));

    const boxes: { x: number; y: number; width: number; height: number }[] = [];
    for (let number = 1; number <= 9; number += 1) {
      const box = await seat(page, number).boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
      if (box) boxes.push(box);
    }
    boxes.forEach((a, index) => {
      for (const b of boxes.slice(index + 1)) {
        const apart =
          a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y;
        expect(apart).toBe(true);
      }
    });
  });

  test('the tool appears before the explanatory text', async ({ page }) => {
    await page.goto(PATH);
    const tool = await page.getByRole('heading', { name: 'Poker table trainer' }).boundingBox();
    const names = await page.getByRole('heading', { name: 'Poker position names', exact: true }).boundingBox();
    expect(tool && names && tool.y < names.y).toBe(true);
  });
});
