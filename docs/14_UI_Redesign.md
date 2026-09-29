# Elite Tamil Matrimony -- UI Redesign Requirements

## Objective

Redesign the existing **Elite Tamil Matrimony** website UI based on the
attached reference image.

The redesign must be **UI-only**. Existing functionality, navigation,
colors, fonts, and application behavior must remain unchanged.

------------------------------------------------------------------------

## 1. Reference Design

Use the attached reference image as the visual reference for the new UI.

Match the reference mainly in:

-   Overall layout
-   Header spacing
-   Hero section composition
-   Image placement
-   Section spacing
-   Image sizing and cropping
-   Card arrangement
-   Border radius
-   Visual hierarchy
-   Alignment
-   Premium matrimonial look
-   Clean and spacious layout

Do **not** copy the reference website's branding, logo, exact text, or
content.

Keep the existing Elite Tamil Matrimony branding and content.

------------------------------------------------------------------------

## 2. Logo

The existing logo image must be used.

### Logo location

``` text
public/logo
```

Use the appropriate existing logo asset from this folder.

### Requirements

-   Place the logo at the **top-left of the header**.
-   Maintain proper spacing between the logo and navigation.
-   Do not replace the logo with text or another logo.
-   Do not change the logo asset unnecessarily.
-   Keep the existing logo styling/appearance.

------------------------------------------------------------------------

## 3. Header

Maintain the existing header functionality and navigation.

The header navigation must contain:

-   Home
-   About Us
-   Success Stories
-   Features
-   Contact

### Important spacing requirement

There must be **clear and comfortable spacing** between:

``` text
Home     About Us     Success Stories     Features     Contact
```

Do not allow the navigation items to appear joined together or crowded.

### Header requirements

-   Logo on the left
-   Navigation in the center
-   Existing Login button
-   Existing Sign Up button
-   Proper horizontal spacing
-   Clean alignment
-   Premium appearance similar to the reference

### DO NOT CHANGE

-   Navigation functionality
-   Navigation routes
-   Button functionality
-   Existing color codes
-   Existing font family
-   Existing font styles
-   Existing hover behavior unless only a visual spacing/alignment
    correction is required

------------------------------------------------------------------------

## 4. Hero Section

The current hero image is not loading correctly.

Replace the broken/missing hero image reference with the existing image
from:

``` text
public/image/Sangeet Wedding
```

Use the appropriate **Sangeet Wedding** image available in that folder.

### Hero layout

The hero should visually follow the reference image:

-   Full-width large hero section
-   Large couple/wedding image
-   Text/content positioned elegantly over/alongside the image as
    appropriate
-   Premium and spacious composition
-   Proper image cropping
-   Responsive image behavior

The image should actually load from the existing local/public asset.

### Important

Do not use an external image URL.

Do not download a new image.

Use the existing image in the project's `public/image` folder.

------------------------------------------------------------------------

## 5. Hero Functionality

Keep the existing hero functionality exactly as it is.

Do not change:

-   CTA functionality
-   Search functionality
-   Registration functionality
-   Existing forms
-   Existing links
-   Existing buttons
-   Existing navigation behavior

Only improve the visual layout and image presentation.

------------------------------------------------------------------------

## 6. Success Stories Section

The **"Real People. Real Stories."** section should visually follow the
reference image.

Use existing images from:

``` text
public/image
```

Use the following existing image categories/assets:

-   Table Decor
-   Reception
-   Traditional Wedding

Use the actual matching image files available in the folder.

### Layout direction

Create an editorial-style image composition similar to the reference:

-   One large main image
-   Smaller supporting images
-   Proper spacing
-   Rounded corners
-   Clean image cropping
-   Premium composition
-   Optional existing testimonial/quote card if the current application
    already supports it

Do not change the existing Success Stories data or functionality.

------------------------------------------------------------------------

## 7. Images

All required images must come from the existing project.

### Use

``` text
public/logo
public/image
```

### Required image usage

  Area              Image source
  ----------------- ------------------------------------
  Header Logo       `public/logo`
  Main Hero         `public/image/Sangeet Wedding`
  Success Stories   `public/image/Table Decor`
  Success Stories   `public/image/Reception`
  Success Stories   `public/image/Traditional Wedding`

Before changing image references, inspect the folders and use the exact
available filenames/assets.

Do not assume filenames if the actual file names differ slightly.

------------------------------------------------------------------------

## 8. Existing Colors

**Do NOT change the existing color system.**

Keep all current color codes exactly as they are.

Do not:

-   Create a new color palette
-   Change primary colors
-   Change secondary colors
-   Change background colors
-   Change button colors
-   Change text colors
-   Change border colors
-   Change hover colors
-   Add new gradients
-   Replace existing Tailwind color classes unnecessarily

The reference image is for **layout and composition only**, not for
copying its colors.

------------------------------------------------------------------------

## 9. Existing Fonts

**Do NOT change any existing fonts.**

Keep:

-   Existing font family
-   Existing font configuration
-   Existing font styles
-   Existing typography system

Do not import new fonts.

Do not replace the current typography.

------------------------------------------------------------------------

## 10. Existing Functionality

This is an existing working application.

Do not modify any functionality.

Keep unchanged:

-   Login
-   Register
-   Logout
-   OTP
-   Authentication
-   Supabase
-   Profiles
-   Profile editing
-   Matches
-   Daily Matches
-   Search
-   Regular Search
-   Interests
-   Shortlist
-   Notifications
-   Payment
-   Success Stories
-   Admin functionality
-   API routes
-   Database
-   Existing routing
-   Existing navigation
-   Existing form behavior
-   Existing validation
-   Existing business logic

Only change the UI presentation.

------------------------------------------------------------------------

## 11. UI Changes Allowed

The following changes are allowed:

-   Layout
-   Spacing
-   Alignment
-   Width/height
-   Image sizing
-   Image cropping
-   Image positioning
-   Card arrangement
-   Border radius
-   Shadows
-   Section spacing
-   Header spacing
-   Responsive layout
-   Visual hierarchy
-   Existing CSS/Tailwind styling

------------------------------------------------------------------------

## 12. UI Changes NOT Allowed

Do not:

-   Change functionality
-   Change backend
-   Change APIs
-   Change database
-   Change Supabase logic
-   Change authentication
-   Change navigation routes
-   Change existing colors
-   Change existing fonts
-   Remove working features
-   Replace existing application logic
-   Add unrelated features
-   Create a new application structure unnecessarily

------------------------------------------------------------------------

## 13. Responsive Design

The redesigned UI must work correctly on:

-   Desktop
-   Laptop
-   Tablet
-   Mobile

Maintain all existing responsive functionality.

Ensure:

-   Header navigation does not overlap
-   Hero image scales correctly
-   Images do not stretch incorrectly
-   Text does not overflow
-   Success Stories images remain properly arranged
-   Navigation remains usable on mobile

------------------------------------------------------------------------

## 14. Implementation Approach

Before modifying the code:

1.  Inspect the existing project structure.
2.  Inspect the `public/logo` folder.
3.  Inspect the `public/image` folder.
4.  Identify the exact available image filenames.
5.  Inspect the existing header component.
6.  Inspect the existing home/hero section.
7.  Inspect the existing Success Stories section.
8.  Make only the UI changes required.

Do not rewrite the application from scratch.

Reuse existing components wherever possible.

------------------------------------------------------------------------

## 15. Final Quality Check

After making the changes:

-   Run the application.
-   Verify the logo loads.
-   Verify the hero image loads.
-   Verify the Success Stories images load.
-   Verify header spacing.
-   Verify Home navigation.
-   Verify About Us navigation.
-   Verify Success Stories navigation.
-   Verify Features navigation.
-   Verify Contact navigation.
-   Verify Login.
-   Verify Sign Up.
-   Check desktop layout.
-   Check mobile layout.
-   Check image cropping.
-   Check text overflow.
-   Check console errors.

If an existing function stops working, fix the UI implementation without
changing the intended functionality.

------------------------------------------------------------------------

## 16. Git Requirement

Do **NOT** commit the changes.

Do **NOT** push anything to GitHub.

The changes will be reviewed manually first.

------------------------------------------------------------------------

# Final Requirement

The final result should make the existing Elite Tamil Matrimony website
visually closer to the attached reference image while preserving
everything that already works.

### Keep unchanged

-   Existing colors
-   Existing fonts
-   Existing functionality
-   Existing navigation
-   Existing routes
-   Existing content
-   Existing business logic
-   Existing backend
-   Existing APIs
-   Existing database
-   Existing authentication

### Change only

-   UI layout
-   Spacing
-   Alignment
-   Image placement
-   Image sizing/cropping
-   Section composition
-   Header spacing
-   Overall visual presentation

**Primary goal: UI redesign only, with zero functional changes.**
