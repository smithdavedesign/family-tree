# Todo List: Tree Photo Gallery Optimizations

- [ ] **Phase 1: Foundation**
    - [ ] Install `@tanstack/react-query` and `@tanstack/react-virtual` in `client`.
    - [ ] Create `client/src/utils/photoUtils.js` and move grouping/sorting logic there.
    - [ ] Setup `QueryClientProvider` in `client/src/main.jsx` (or `App.jsx`).
    - [ ] Create `useTreePhotos` hook in `client/src/hooks/useTreePhotos.js`.
    - [ ] Refactor `TreeGalleryPage.jsx` to use `useTreePhotos` and `photoUtils`.

- [ ] **Phase 2: Backend Metadata**
    - [ ] Create SQL migration file `server/sql-prompts/photos_metadata_migration.sql` adding `width`, `height`, `orientation`, `year`, `month_year`.
    - [ ] Update `server/controllers/mediaController.js` to handle new fields in `addPhoto`.
    - [ ] (Optional) Create script/endpoint to backfill metadata for existing photos.

- [ ] **Phase 3: Virtualization & Rendering**
    - [ ] Implement `VirtualGallery` component using `@tanstack/react-virtual`.
    - [ ] Create `LazyImage` component with `IntersectionObserver`.
    - [ ] Integrate `VirtualGallery` into `TreeGalleryPage.jsx`.
    - [ ] Ensure `useMemo` is used for all heavy data transformations.

- [ ] **Phase 4: Polish**
    - [ ] Implement progressive loading (Blur-up effect) in `LazyImage`.
    - [ ] Add prefetching logic for next batches (if pagination is implemented).
    - [ ] Optimize video thumbnail loading (if applicable).
