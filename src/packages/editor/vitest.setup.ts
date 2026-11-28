// Every test sees every screen language at once, as a page does after fetching it (core
// `lazyCatalog`): the catalogs register on import, then all their languages are fetched.
import { loadAllLocales } from '@ariadne-nsd/core';

import './src/i18n/messages';
import './src/ui/messages';

await loadAllLocales();
