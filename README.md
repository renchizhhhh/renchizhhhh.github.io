# Renchi Zhang — academic website

Bilingual academic homepage for Renchi Zhang, covering research, robotic systems, publications, notes and an interactive Conway's Game of Life easter egg.

## Repository structure

- `dist/`: complete static website published by GitHub Pages
- `build_content.py`: generates the English pages and invokes Chinese localisation
- `translations.zh.json`: English-to-Chinese content mappings
- `localize.py`: generates the Chinese routes under `dist/zh/`
- `.github/workflows/pages.yml`: automatically publishes `dist/` after every push to `main`

The committed files inside `dist/` are ready to deploy. No package installation or build step is required by GitHub Actions.

## Publish for the first time

This website uses root-relative URLs, so the recommended repository name is:

```text
renchizhhhh.github.io
```

From this directory, connect and push to the empty GitHub repository:

```bash
git init
git branch -M main
git remote add origin git@github.com:renchizhhhh/renchizhhhh.github.io.git
git add .
git commit -m "Publish academic website"
git push -u origin main
```

Then open the repository on GitHub and select:

```text
Settings → Pages → Build and deployment → Source → GitHub Actions
```

If the first workflow ran before Pages was enabled, open **Actions** and rerun it. The published site will be available at:

```text
https://renchizhhhh.github.io/
```

## Update the website

Edit `build_content.py` and/or `translations.zh.json`, then regenerate the HTML:

```bash
python build_content.py
```

Commit and push the changed files. GitHub Actions will deploy the new `dist/` automatically.

Optional replacement PDFs can be placed temporarily in an untracked `source_assets/` directory before rebuilding. Existing committed assets remain unchanged when that directory is absent.

## Local preview

```bash
python -m http.server 8000 --directory dist
```

Open `http://localhost:8000/`.

## Public files

Everything in `dist/`, including the CV, thesis chapters and research videos, is publicly downloadable after deployment. Do not commit private keys, passwords, API tokens or other sensitive files.
