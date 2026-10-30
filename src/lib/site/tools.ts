import seoPages from '../../../data/seo-pages.json' with { type: 'json' };

type SeoPage = (typeof seoPages.pages)[number];

export interface Tool {
  id: string;
  name: string;
  path: string;
  /** Short label for the header, which has to fit a 320px screen. */
  navLabel: string;
  /** One-sentence plain-English description shown on tool cards. */
  summary: string;
}

/**
 * Tools whose route exists and passes its release gate. Adding an ID here is the
 * single step that publishes a tool to the navigation, Home, /tools/ and related
 * links, so only add one in the same change that ships the working page.
 */
export const LIVE_TOOL_IDS: readonly string[] = [];

const TOOL_COPY: Record<string, Pick<Tool, 'navLabel' | 'summary'>> = {
  P01: {
    navLabel: 'Hand Rankings',
    summary:
      'See every hand from royal flush to high card, then compare two hands and learn which one wins and why.',
  },
  P05: {
    navLabel: 'Positions',
    summary:
      'Find the button, the blinds and every other seat on 6-max and 9-max tables, then practice until it sticks.',
  },
  P09: {
    navLabel: 'Pot Odds',
    summary:
      'Enter the pot and the bet to see the equity a call needs to break even, with the arithmetic shown.',
  },
};

function toTool(page: SeoPage): Tool {
  return {
    id: page.id,
    name: page.name,
    path: page.path,
    navLabel: TOOL_COPY[page.id]?.navLabel ?? page.name,
    summary: TOOL_COPY[page.id]?.summary ?? '',
  };
}

const waveOnePages = seoPages.pages.filter((page) => page.publishInWave1);

/** Wave 1 tools that are published and safe to link to. */
export function getLiveTools(): Tool[] {
  return waveOnePages.filter((page) => LIVE_TOOL_IDS.includes(page.id)).map(toTool);
}

/** Wave 1 tools still being built. Never link to these: their routes do not exist. */
export function getToolsInDevelopment(): Tool[] {
  return waveOnePages.filter((page) => !LIVE_TOOL_IDS.includes(page.id)).map(toTool);
}

/** Resolves tool IDs to live tools, silently dropping anything unpublished. */
export function getLinkableTools(ids: readonly string[]): Tool[] {
  const live = getLiveTools();
  return ids.flatMap((id) => live.find((tool) => tool.id === id) ?? []);
}
