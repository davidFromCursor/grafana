import { css } from '@emotion/css';
import { useMemo, useState } from 'react';

import { type GrafanaTheme2, type NavModelItem } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { Trans, t } from '@grafana/i18n';
import { EmptyState, FilterInput, Stack, useStyles2 } from '@grafana/ui';
import { usePinnedItems } from 'app/core/components/AppChrome/MegaMenu/hooks';
import { findByUrl } from 'app/core/components/AppChrome/MegaMenu/utils';
import { NavLandingPageCard } from 'app/core/components/NavLandingPage/NavLandingPageCard';
import { Page } from 'app/core/components/Page/Page';
import { useSelector } from 'app/types/store';

export function BookmarksPage() {
  const styles = useStyles2(getStyles);
  const { pinnedItems } = usePinnedItems();
  const navTree = useSelector((state) => state.navBarTree);
  const [query, setQuery] = useState('');

  const validItems = pinnedItems.reduce((acc: NavModelItem[], url) => {
    const item = findByUrl(navTree, url);
    if (item) {
      acc.push(item);
    }
    return acc;
  }, []);

  const filteredItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return validItems;
    }

    return validItems.filter((item) => {
      const title = item.text.toLowerCase();
      const subtitle = (item.subTitle ?? '').toLowerCase();
      return title.includes(needle) || subtitle.includes(needle);
    });
  }, [query, validItems]);

  return (
    <Page navId="bookmarks">
      <Page.Contents>
        {validItems.length === 0 ? (
          <EmptyState
            variant="call-to-action"
            message={t('bookmarks-page.empty.message', 'It looks like you haven’t created any bookmarks yet')}
          >
            <Trans i18nKey="bookmarks-page.empty.tip">
              Hover over any item in the nav menu and click on the bookmark icon to add it here.
            </Trans>
          </EmptyState>
        ) : (
          <Stack direction="column" gap={2}>
            <FilterInput
              escapeRegex={false}
              placeholder={t('bookmarks-page.search.placeholder', 'Search bookmarks')}
              value={query}
              onChange={setQuery}
              data-testid={selectors.pages.Bookmarks.searchInput}
            />
            {filteredItems.length === 0 ? (
              <EmptyState
                variant="not-found"
                message={t('bookmarks-page.search.no-results', 'No bookmarks matching your search')}
              />
            ) : (
              <section className={styles.grid}>
                {filteredItems.map((item) => {
                  return (
                    <NavLandingPageCard
                      key={item.id || item.url}
                      description={item.subTitle}
                      text={item.text}
                      url={item.url ?? ''}
                    />
                  );
                })}
              </section>
            )}
          </Stack>
        )}
      </Page.Contents>
    </Page>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  grid: css({
    display: 'grid',
    gap: theme.spacing(3),
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gridAutoRows: '138px',
    padding: theme.spacing(2, 0),
  }),
});

export default BookmarksPage;
