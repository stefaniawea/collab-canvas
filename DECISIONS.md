# Product and Technical Decisions

The current decisions reflected in Collab Canvas describing the implemented scope, not a promise fulfilling every part of the home task.

## Product Decisions

### The canvas is an image-review surface

The canvas presents a small, fixed set of images that are, for this home task to look a little prettier, arranged in a grid. The canvas is zoomable achored to the cursors position and users can place comments anywhere on the canvas. It does not currently provide freeform drawing, image editing, or document uploads.

### Comments are anchored threads

Comments are placed by clicking a point on the canvas. Each comment can have replies and can be marked as open or resolved. Authors can edit or delete their own comments and replies, not others.

### Collaboration is local, not live or multi-user

The app has no server-side storage, accounts, permissions, or real-time synchronization. Comments and the display identity are stored in the current browser's `localStorage`, which is, in all other contexts exect for this home task, a very bad solution to store this type of data. The generated, editable name and color identify a local user interface state only, they are not authentication or reliable author verification, just to cheer up who ever looks at this home task.

## Technical Decisions

### Use React, TypeScript, and Vite

The app is a client-rendered React and TypeScript application, served and built with Vite.

### Keep identity and comment state in separate contexts

`IdentityContext` owns the local display identity, while `CommentsContext` owns drafts and comment threads. The comment layer and canvas consume these contexts instead of coordinating state through component props. The comment provider also fills in missing `replies` and `resolved` values when loading older saved comments.

### Persist browser state with `localStorage`

Comments and identity are loaded from and written to browser storage, which makes the canvas state persisted among reloads. It also means data is not shared across browsers or devices, so it's a bac choice for anything that's outside of this home task.

### Store comment positions in canvas coordinates

Comment positions are recorded relative to the canvas, not the viewport. The canvas is transformed for zoom, while comment UI is inversely scaled to remain approximately the same visual size. Wheel zoom is clamped between 1% and 200%, animated, and anchored around the pointer; the controls also offer step changes and a 100% reset.

### Keep canvas content as static public assets

The current images are served from `public/images` and placed in the canvas grid in the UI. There is no content-management or remote asset-loading layer.

### 3D rendering is not part of the active app

An OBJ loader component exists as an experimental component, but its use in the canvas is commented out because my 4h has expired and I didn't have time to make is work perfectly but left the code if you where curious at a first attempt of rendering and working with .obj files.
