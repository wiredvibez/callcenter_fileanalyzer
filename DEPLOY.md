# 🚀 Deploy to Vercel - Quick Guide

## Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

## Step 2: Login to Vercel

```bash
vercel login
```

Follow the browser prompts to authenticate.

## Step 3: Deploy

```bash
cd web
vercel
```

Answer the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account
- **Link to existing project?** → No
- **Project name?** → call-analytics (or your choice)
- **Directory?** → `./` (current directory)
- **Override settings?** → No

## Step 4: Set Up Storage

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click **Storage** tab
4. Click **Create Database** → **Blob**
5. Name it (e.g., "call-analytics-storage")
6. Click **Create**

## Step 5: Add Environment Variable

In your terminal:

```bash
vercel env add BLOB_READ_WRITE_TOKEN
```

Paste the token from Step 4, then select:
- **Production?** → Yes
- **Preview?** → Yes  
- **Development?** → Yes

## Step 6: Deploy to Production

```bash
vercel --prod
```

## 🎉 Done!

You'll get a URL like:
```
https://call-analytics-abc123.vercel.app
```

Visit it and start uploading CSVs!

---

## 🔧 Common Issues

### "BLOB_READ_WRITE_TOKEN not found"

**Solution:**
```bash
vercel env add BLOB_READ_WRITE_TOKEN
vercel --prod
```

### "Module not found" errors

**Solution:**
```bash
cd web
rm -rf .next node_modules
npm install
npm run build
vercel --prod
```

### Need to redeploy?

```bash
cd web
vercel --prod
```

---

## 📱 Share Your App

Send users this link:
```
https://your-app.vercel.app
```

They can:
1. Upload CSV files
2. Get their own analytics
3. Share their unique results link

---

## 💡 Pro Tips

- **Custom Domain:** Add in Vercel Dashboard → Settings → Domains
- **Analytics:** View usage in Vercel Dashboard → Analytics  
- **Logs:** Check errors in Dashboard → Deployments → [Latest] → Logs
- **Redeploy:** Just run `vercel --prod` again

---

## 🆘 Need Help?

Check these files:
- `MIGRATION_COMPLETE.md` - Full overview
- `VERCEL_DEPLOYMENT.md` - Detailed guide
- `README_VERCEL.md` - Usage instructions

Or visit: [Vercel Documentation](https://vercel.com/docs)

