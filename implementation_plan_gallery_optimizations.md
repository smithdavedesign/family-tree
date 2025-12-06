# Implementation Plan: Tree Photo Gallery Optimizations

This plan outlines the steps to enhance the performance and user experience of the Tree Photo Gallery.

## Phase 1: Architecture & Dependencies (Foundation)
**Goal:** Set up the necessary libraries and refactor the code structure to support advanced features.

1.  **Install Dependencies**
    *   `@tanstack/react-query`: For efficient data fetching, caching, and synchronization.
    *   `@tanstack/react-virtual`: For virtualized rendering of large lists.
    *   `blurhash` (optional): For progressive image loading.

2.  **Refactor Grouping Logic**
    *   Create `client/src/utils/photoUtils.js`.
    *   Move `groupPhotosByDate`, `groupPhotosByPerson`, `sortPhotos`, and `filterPhotos` logic from `TreeGalleryPage.jsx` to this utility file.
    *   Ensure these functions are pure and testable.

3.  **Implement React Query**
    *   Wrap the application (or relevant part) in `QueryClientProvider`.
    *   Create a custom hook `useTreePhotos(treeId)` using `useQuery`.
    *   Replace the manual `fetch` and `useEffect` in `TreeGalleryPage.jsx` with this hook.
    *   Enable caching and background refetching.

## Phase 2: Database & Metadata (Backend)
**Goal:** Store pre-calculated metadata to prevent layout shifts and improve query performance.

1.  **Update Database Schema**
    *   Create a migration to add the following columns to the `photos` table:
        *   `width` (integer)
        *   `height` (integer)
        *   `orientation` (text: 'landscape', 'portrait', 'square')
        *   `year` (integer)
        *   `month_year` (text, e.g., '2024-05')

2.  **Update Backend API**
    *   Update `server/controllers/mediaController.js` -> `addPhoto`.
    *   When a photo is added, calculate/extract these metadata fields (if provided by client or extractable).
    *   Store them in the database.

3.  **Frontend Metadata Handling**
    *   When uploading a photo, try to extract dimensions (using `Image` object) before sending to server.

## Phase 3: Performance & Rendering (Core UX)
**Goal:** Make the gallery feel instant and handle thousands of photos smoothly.

1.  **Virtualized Grid**
    *   Replace the standard CSS Grid with a virtualized grid using `@tanstack/react-virtual`.
    *   Calculate the exact position of each photo based on the cached `width`/`height` metadata.
    *   Render only the items currently in the viewport.

2.  **Lazy Loading & Intersection Observer**
    *   Create a `LazyImage` component.
    *   Use `IntersectionObserver` to detect when an image enters the viewport.
    *   Swap a low-res thumbnail (or placeholder) for the high-res image only when visible.
    *   Use `loading="lazy"` attribute as a fallback.

3.  **Memoization**
    *   Wrap heavy operations (grouping, sorting) in `useMemo` hooks in the component.
    *   Use `useCallback` for event handlers passed to children.

## Phase 4: Advanced UX & Polish
**Goal:** Add "wow" factors and further optimizations.

1.  **Progressive Image Loading**
    *   Implement a "Blurhash" or "LQIP" strategy.
    *   Display a tiny, blurred version of the image immediately while the full image loads.
    *   Transition smoothly (fade-in) to the sharp image.

2.  **Defer Video Loading**
    *   If videos are supported, load only the thumbnail initially.
    *   Load the video player/source only upon user interaction (click/hover).

3.  **Prefetching**
    *   Use React Query's `queryClient.prefetchQuery` to load the next "page" or batch of photos when the user scrolls near the bottom.

## Phase 5: Future Scalability (Optional)
1.  **Photo Search Index**
    *   Create a dedicated `photo_search_index` table for complex queries.
2.  **Browser-Level Caching**
    *   Investigate `IndexedDB` for persisting the gallery state offline.
