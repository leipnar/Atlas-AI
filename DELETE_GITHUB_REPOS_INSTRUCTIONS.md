# Instructions to Delete Redundant GitHub Repositories

## Repositories to Delete

The following GitHub repositories are now redundant as their code has been merged into the main `Atlas-AI` monorepo:

1. **leipnar/atlas-frontend** - Frontend code now in `/frontend`
2. **leipnar/atlas-backend** - Backend code merged/superseded by `/backend`

## Deletion Steps

### Option 1: Via GitHub Web Interface (Recommended)

For each repository (`atlas-frontend` and `atlas-backend`):

1. Navigate to: `https://github.com/leipnar/[REPO-NAME]`
2. Click on **Settings** tab
3. Scroll to the bottom of the page
4. In the **Danger Zone** section, click **Delete this repository**
5. Type the repository name to confirm: `leipnar/[REPO-NAME]`
6. Click **I understand the consequences, delete this repository**

### Option 2: Via GitHub CLI (gh)

If you have GitHub CLI installed and authenticated:

```bash
# Delete atlas-frontend
gh repo delete leipnar/atlas-frontend --yes

# Delete atlas-backend
gh repo delete leipnar/atlas-backend --yes
```

### Option 3: Via GitHub API

```bash
# Delete atlas-frontend
curl -X DELETE \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  https://api.github.com/repos/leipnar/atlas-frontend

# Delete atlas-backend
curl -X DELETE \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  https://api.github.com/repos/leipnar/atlas-backend
```

## Verification

After deletion, verify only the main repository remains:

```bash
# List your repositories
curl -H "Authorization: token YOUR_GITHUB_TOKEN" \
  https://api.github.com/users/leipnar/repos | grep '"name"'
```

You should see only `Atlas-AI` (and any other non-Atlas projects).

## Important Notes

- ⚠️ **Deletion is permanent** - Make sure all code is safely in the main repo first
- ✅ All frontend code is now in `Atlas-AI/frontend/`
- ✅ All backend code is now in `Atlas-AI/backend/`
- ✅ All changes have been committed and pushed to `leipnar/Atlas-AI`

## Backup Check

Before deletion, verify the main repository contains everything:

```bash
cd "C:/Users/Sabar/Documents/Projects/Atlas/Atlas-AI"

# Check frontend files
ls frontend/components/
ls frontend/services/

# Check backend files  
ls backend/src/
ls backend/src/middleware/sessionTimeout.ts
```

If all files are present, it's safe to delete the redundant repos!

