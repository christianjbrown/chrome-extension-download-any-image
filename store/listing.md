# Chrome Web Store listing

Everything the developer dashboard asks for, ready to paste. The images are in this folder.

Live at https://chromewebstore.google.com/detail/jgfdiolaicdckcanemgipkcoljlimffe

## Package

Run `npm run package` and upload the `extension.zip` it makes. Bump `version` in `static/manifest.json` before uploading an update.

## Store listing

- **Name:** Christian's Download Any Image (read from the manifest)
- **Summary:** Download the images you can't right-click and save: click the button, then click any image on the page. (read from the manifest)
- **Category:** Productivity > Tools
- **Language:** English (United Kingdom)
- **Store icon:** `icon-128.png`
- **Screenshot:** `screenshot-1280x800.png`
- **Small promo tile:** `promo-440x280.png`
- **Homepage URL:** https://github.com/christianjbrown/chrome-extension-download-any-image
- **Support URL:** https://github.com/christianjbrown/chrome-extension-download-any-image/issues

**Description**

```text
One button in your toolbar. Click it, then click any picture on the page, and that picture lands in your downloads folder.

It saves the pictures right-click won't: photos hidden under invisible overlays, CSS backgrounds, images drawn on a canvas, inline SVG, and blob: images that only exist inside the page.

What it handles:
• Plain images, including srcset and <picture> (you get the version the browser actually picked)
• CSS backgrounds, ::before and ::after, image-set() (it takes the sharpest one), mask-image and content: url()
• <canvas>, saved as a PNG
• Inline <svg>, saved as a proper .svg file
• SVG <image>, <input type="image"> and a video's poster
• Pictures inside open shadow DOM, and ones with pointer-events: none

Good file names: a real name from the server is kept, a random one becomes the date, time and page title, and the extension always matches what the file really is.

No tracking, no accounts, nothing sent anywhere. It only touches the tab you click it in, and only when you click it.
```

## Privacy practices

**Single purpose**

```text
Download the image the user clicks on in the current tab.
```

**Permission justifications**

**activeTab**

```text
Gives the extension access to the current tab only after the user clicks its toolbar button, so it can find the image they click on next.
```

**scripting**

```text
Injects the script that lets the user pick an image on the page and reads that image, only into the tab where they clicked the button.
```

**downloads**

```text
Saves the picked image to the user's downloads folder with a sensible file name.
```

**Remote code:** No, I am not using remote code.

**Data usage:** tick none of the data types, then tick all three certifications.

**Privacy policy URL:** https://github.com/christianjbrown/chrome-extension-download-any-image/blob/main/PRIVACY.md

## Distribution

Free, public, all regions.
