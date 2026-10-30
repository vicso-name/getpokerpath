import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

const PATH = '/poker-hand-rankings/';

const slot = (page: Page, label: string) =>
  page.getByRole('button', { name: new RegExp(`^${label}:`) });
const deckCard = (page: Page, name: string) =>
  page.getByRole('button', { name: new RegExp(`^${name}, \\w+$`) });
const usedCard = (page: Page, name: string, owner: string) =>
  page.getByRole('button', { name: new RegExp(`^${name}, \\w+, in ${owner}$`) });
const result = (page: Page) => page.getByTestId('result');
const handA = (page: Page) => page.getByTestId('hand-Player A');
const handB = (page: Page) => page.getByTestId('hand-Player B');

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

async function fill(page: Page, names: string[], hasTouch: boolean) {
  for (const name of names) await press(deckCard(page, name), hasTouch);
}

test.describe('server-rendered content', () => {
  test('is complete without JavaScript', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(PATH);

    await expect(page.locator('h1')).toHaveText('Poker Hands Ranked From Best to Worst');
    await expect(result(page)).toContainText('Player A wins');
    await expect(result(page)).toContainText("Player A's first kicker (Ace)");
    await expect(page.locator('.chart__row')).toHaveCount(10);
    await expect(page.getByRole('heading', { name: 'Royal Flush' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'High Card' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'How kickers and ties work' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Frequently asked questions' })).toBeVisible();
    await context.close();
  });

  test('lists hands from strongest to weakest', async ({ page }) => {
    await page.goto(PATH);
    await expect(page.locator('.chart__row h3')).toHaveText([
      'Royal Flush',
      'Straight Flush',
      'Four of a Kind',
      'Full House',
      'Flush',
      'Straight',
      'Three of a Kind',
      'Two Pair',
      'Pair',
      'High Card',
    ]);
  });

  test('has an example result the moment it loads', async ({ page }) => {
    await open(page);
    await expect(handA(page)).toHaveText('Pair of Kings');
    await expect(handB(page)).toHaveText('Pair of Kings');
  });
});

test('hydrates and runs without console errors', async ({ page }) => {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') problems.push(message.text());
  });
  page.on('pageerror', (error) => problems.push(error.message));

  await open(page);
  await page.getByRole('button', { name: 'Random hands' }).click();
  await page.locator('label', { hasText: 'Five-card hands' }).click();
  expect(problems).toEqual([]);
});

test.describe('comparing hands', () => {
  test('builds a Hold’em hand card by card, with instant feedback', async ({ page }, info) => {
    const hasTouch = Boolean(info.project.use.hasTouch);
    await open(page);
    await press(page.getByRole('button', { name: 'Clear all' }), hasTouch);
    await expect(handA(page)).toHaveText('Waiting for cards');
    await expect(page.getByTestId('active-slot')).toHaveText('Player A card 1');

    await fill(page, ['Ace of spades', 'Ace of diamonds'], hasTouch);
    await expect(page.getByTestId('active-slot')).toHaveText('Player B card 1');
    await fill(page, ['Queen of hearts', 'Jack of hearts'], hasTouch);
    await expect(page.getByTestId('active-slot')).toHaveText('Flop 1');

    await fill(page, ['Ten of hearts', 'Nine of hearts', 'Two of clubs'], hasTouch);
    await expect(handA(page)).toHaveText('Pair of Aces');
    await expect(handB(page)).toHaveText('High Card, Queen');
    await expect(result(page)).toContainText('2 cards to go');

    await fill(page, ['Eight of hearts'], hasTouch);
    await expect(handB(page)).toHaveText('Straight Flush, Queen-high');

    await fill(page, ['Three of diamonds'], hasTouch);
    await expect(result(page)).toContainText('Player B wins');
    await expect(result(page)).toContainText('a straight flush beats a pair');
    await expect(page.getByTestId('announcer')).toContainText('Player B wins');
  });

  test('the result stays in view after the last card', async ({ page }, info) => {
    const hasTouch = Boolean(info.project.use.hasTouch);
    await open(page);
    await press(slot(page, 'River'), hasTouch);
    await press(page.getByRole('button', { name: 'Remove card' }), hasTouch);
    await expect(result(page)).toContainText('1 card to go');
    await fill(page, ['Three of diamonds'], hasTouch);
    await expect(result(page)).toContainText('Player A wins');
    await expect(result(page)).toBeInViewport();
  });

  test('compares two five-card hands and explains the tie-break', async ({ page }, info) => {
    const hasTouch = Boolean(info.project.use.hasTouch);
    await open(page);
    await press(page.locator('label', { hasText: 'Five-card hands' }), hasTouch);
    await expect(page.getByTestId('active-slot')).toHaveText('Player A card 1');

    await fill(
      page,
      ['Ace of clubs', 'Ace of diamonds', 'King of spades', 'Queen of hearts', 'Three of clubs'],
      hasTouch,
    );
    await expect(handA(page)).toHaveText('Pair of Aces');
    await fill(
      page,
      ['Ace of hearts', 'Ace of spades', 'King of diamonds', 'Queen of diamonds', 'Two of diamonds'],
      hasTouch,
    );
    await expect(result(page)).toContainText('Player A wins');
    await expect(result(page)).toContainText("Player A's third kicker (Three)");
  });

  test('shows a split pot when both players play the board', async ({ page }, info) => {
    await open(page);
    await press(
      page.getByRole('button', { name: 'Split pot on the board' }),
      Boolean(info.project.use.hasTouch),
    );
    await expect(result(page)).toContainText('Split pot');
    await expect(result(page)).toContainText('The board is the best hand for both players');
  });

  test('explains that the wheel loses to a six-high straight', async ({ page }, info) => {
    await open(page);
    await press(
      page.getByRole('button', { name: 'Ace-low straight' }),
      Boolean(info.project.use.hasTouch),
    );
    await expect(handA(page)).toHaveText('Straight, Five-high');
    await expect(handB(page)).toHaveText('Straight, Six-high');
    await expect(result(page)).toContainText('Player B wins');
  });

  test('deals random hands that are always complete and unique', async ({ page }, info) => {
    const hasTouch = Boolean(info.project.use.hasTouch);
    await open(page);
    for (let round = 0; round < 3; round += 1) {
      await press(page.getByRole('button', { name: 'Random hands' }), hasTouch);
      await expect(result(page)).toContainText(/Player [AB] wins|Split pot/);
      const used = page.locator('button[aria-disabled="true"]');
      await expect(used).toHaveCount(9);
    }
  });
});

test.describe('duplicate cards', () => {
  test('a card in use is marked and refuses to be picked twice', async ({ page }, info) => {
    const hasTouch = Boolean(info.project.use.hasTouch);
    await open(page);
    await press(page.getByRole('button', { name: 'Clear all' }), hasTouch);
    await fill(page, ['Ace of spades'], hasTouch);

    const used = usedCard(page, 'Ace of spades', 'Player A card 1');
    await expect(used).toHaveAttribute('aria-disabled', 'true');

    // Forced: Playwright skips aria-disabled elements, but a real tap still lands.
    await press(used, hasTouch, true);
    await expect(page.getByTestId('notice')).toContainText(
      'Ace of spades is already in Player A card 1',
    );
    await expect(page.getByTestId('active-slot')).toHaveText('Player A card 2');
    await expect(slot(page, 'Player A card 2')).toHaveAccessibleName(/empty$/);
  });

  test('replacing a card returns the old one to the deck', async ({ page }, info) => {
    const hasTouch = Boolean(info.project.use.hasTouch);
    await open(page);
    await press(slot(page, 'Player A card 1'), hasTouch);
    await fill(page, ['Two of hearts'], hasTouch);
    await expect(slot(page, 'Player A card 1')).toHaveAccessibleName(/Two of hearts, 2$/);
    await expect(deckCard(page, 'Ace of spades')).not.toHaveAttribute('aria-disabled', 'true');
  });

  test('removing a card empties its slot and shows what is missing', async ({ page }, info) => {
    const hasTouch = Boolean(info.project.use.hasTouch);
    await open(page);
    await press(slot(page, 'Flop 2'), hasTouch);
    await press(page.getByRole('button', { name: 'Remove card' }), hasTouch);
    await expect(slot(page, 'Flop 2')).toHaveAccessibleName(/empty$/);
    await expect(result(page)).toContainText('1 card to go');
    await expect(page.getByRole('button', { name: 'Remove card' })).toBeDisabled();
  });
});

test.describe('keyboard', () => {
  test('completes a card pick and reaches a result without a pointer', async ({ page }) => {
    await open(page);
    await slot(page, 'River').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('active-slot')).toHaveText('River');

    const remove = page.getByRole('button', { name: 'Remove card' });
    await remove.focus();
    await page.keyboard.press('Space');
    await expect(result(page)).toContainText('1 card to go');

    // The deck is a single tab stop; arrows move inside it.
    await usedCard(page, 'Ace of spades', 'Player A card 1').focus();
    await page.keyboard.press('End');
    await expect(deckCard(page, 'Two of clubs')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(result(page)).toContainText('Player A wins');
    await expect(page.getByTestId('announcer')).toContainText('placed in River');

    // Focus survives on the card just used, so keyboard users keep their place.
    await expect(usedCard(page, 'Two of clubs', 'River')).toBeFocused();
  });

  test('tab enters the deck once and arrow keys move focus', async ({ page }) => {
    await open(page);
    await expect(page.locator('button[tabindex="0"]')).toHaveCount(1);

    const first = usedCard(page, 'Ace of spades', 'Player A card 1');
    await first.focus();
    await page.keyboard.press('ArrowRight');
    await expect(deckCard(page, 'King of spades')).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(deckCard(page, 'Six of spades')).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByRole('button', { name: /^Seven of spades, 7, in / })).toBeFocused();
    await expect(page.locator('button[tabindex="0"]')).toHaveCount(1);
  });

  test('switches format with the radio group', async ({ page }) => {
    await open(page);
    await page.getByRole('radio', { name: /Texas Hold’em/ }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('radio', { name: /Five-card hands/ })).toBeChecked();
    await expect(page.getByRole('group', { name: 'Board' })).toHaveCount(0);
  });
});

test.describe('layout and accessibility', () => {
  for (const state of ['initial', 'five-card', 'empty'] as const) {
    test(`has no accessibility violations or overflow: ${state}`, async ({ page }) => {
      await open(page);
      if (state === 'five-card') {
        await page.locator('label', { hasText: 'Five-card hands' }).click();
      }
      if (state === 'empty') await page.getByRole('button', { name: 'Clear all' }).click();

      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations.map((violation) => violation.id)).toEqual([]);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test('deck cards are large enough to tap', async ({ page }) => {
    await open(page);
    const box = await deckCard(page, 'King of spades').boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(box?.width).toBeGreaterThanOrEqual(36);
  });

  test('the tool appears before the explanatory text', async ({ page }) => {
    await page.goto(PATH);
    const tool = await page.getByRole('heading', { name: 'Compare two poker hands' }).boundingBox();
    const chart = await page.getByRole('heading', { name: 'Poker hand rankings chart' }).boundingBox();
    expect(tool && chart && tool.y < chart.y).toBe(true);
  });

  test('the skip link jumps past the tool to the chart', async ({ page }, info) => {
    await open(page);
    await press(
      page.getByRole('link', { name: 'Skip to the hand rankings chart' }),
      Boolean(info.project.use.hasTouch),
    );
    await expect(page).toHaveURL(/#hand-chart$/);
    await expect(page.getByRole('heading', { name: 'Poker hand rankings chart' })).toBeInViewport();
  });
});
