# Deployment Guide — mycalcu.in on GitHub Pages

## One-time setup (do this once)

### Step 1: Create the GitHub repository

1. Go to https://github.com/new
2. Repository name: `mycalcu.in` (or any name you prefer)
3. Set visibility: **Public** (required for free GitHub Pages)
4. Do NOT initialise with README, .gitignore, or licence — the project already has these
5. Click **Create repository**

### Step 2: Push the project to GitHub

Run these commands from inside the project folder on your computer:

```bash
git init
git add .
git commit -m "Initial commit — Phase 1 architecture"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/mycalcu.in.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

### Step 3: Enable GitHub Pages with Actions

1. Go to your repository on GitHub
2. Click **Settings** → **Pages** (left sidebar)
3. Under **Source**, select **GitHub Actions**
4. That's it — the workflow will trigger automatically on the next push

### Step 4: Connect your custom domain

1. In **Settings → Pages**, under **Custom domain**, enter: `mycalcu.in`
2. Click **Save**
3. GitHub will create a `CNAME` file in your repo automatically

Then go to your domain registrar (GoDaddy, Namecheap, etc.) and add these DNS records:

```
Type    Name    Value
A       @       185.199.108.153
A       @       185.199.109.153
A       @       185.199.110.153
A       @       185.199.111.153
CNAME   www     YOUR_USERNAME.github.io
```

DNS changes take 10 minutes to 48 hours to propagate.

### Step 5: Enable HTTPS

Once DNS is confirmed, go back to **Settings → Pages** and check:
- **Enforce HTTPS** ✓

GitHub provides free SSL via Let's Encrypt.

---

## Every day after that

### Adding a new calculator

1. Add an entry to `data/calculators.json`
2. Add its content block to `build.py` (in the `CONTENT` dict)
3. Add its JS file to `assets/js/calculators/`
4. Run locally: `python build.py`
5. Commit and push:

```bash
git add .
git commit -m "Add: home-loan-emi-calculator"
git push
```

GitHub Actions will automatically build and deploy within ~60 seconds.

### Updating shared components

Edit `shared/navbar.html`, `shared/footer.html`, or `shared/header.html`, then:

```bash
python build.py   # regenerates all pages with updated components
git add .
git commit -m "Update: navbar — added new calculator link"
git push
```

### Updating CSS or JS

Edit `assets/css/main.css` or any JS file directly — no build step needed for these.

```bash
git add .
git commit -m "Fix: button hover state"
git push
```

---

## Verifying a deployment

After pushing, go to:
`https://github.com/YOUR_USERNAME/mycalcu.in/actions`

You will see the workflow running. Green tick = deployed successfully.

Live URL during development (before custom domain):
`https://YOUR_USERNAME.github.io/mycalcu.in/`

---

## Important: path note for GitHub Pages subdirectory

If your repo is named `mycalcu.in`, GitHub Pages will serve it at:
`https://YOUR_USERNAME.github.io/mycalcu.in/`

All asset paths in the HTML use absolute paths like `/assets/css/main.css`.
This works correctly once your **custom domain** (`mycalcu.in`) is connected.

If you want to test before connecting the domain, temporarily change asset
paths to relative (e.g. `../assets/css/main.css`) or use a custom domain
from day one.

The cleanest approach: connect `mycalcu.in` to GitHub Pages before
doing any live testing. This is free and takes under 5 minutes.
