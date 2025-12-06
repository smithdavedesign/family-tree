# Todo List: Tree Photo Gallery Optimizations

- [x] **Phase 1: Foundation**
    - [x] Install `@tanstack/react-query` and `@tanstack/react-virtual` in `client`.
    - [x] Create `client/src/utils/photoUtils.js` and move grouping/sorting logic there.
    - [x] Setup `QueryClientProvider` in `client/src/main.jsx` (or `App.jsx`).
    - [x] Create `useTreePhotos` hook in `client/src/hooks/useTreePhotos.js`.
    - [x] Refactor `TreeGalleryPage.jsx` to use `useTreePhotos` and `photoUtils`.

- [x] **Phase 2: Backend Metadata**
    - [x] Create SQL migration file `server/sql-prompts/photos_metadata_migration.sql` adding `width`, `height`, `orientation`, `year`, `month_year`.
    - [x] Update `server/controllers/mediaController.js` to handle new fields in `addPhoto`.
    - [x] (Optional) Create script/endpoint to backfill metadata for existing photos.

- [x] **Phase 3: Virtualization & Rendering**
    - [x] Implement `VirtualGallery` component using `@tanstack/react-virtual`.
    - [x] Create `LazyImage` component with `IntersectionObserver`.
    - [x] Integrate `VirtualGallery` into `TreeGalleryPage.jsx`.
    - [x] Ensure `useMemo` is used for all heavy data transformations.

- [x] **Phase 4: Polish**
    - [x] Implement progressive loading (Blur-up effect) in `LazyImage`.
    - [x] Add prefetching logic for next batches (if pagination is implemented).
    - [x] Optimize video thumbnail loading (if applicable).
