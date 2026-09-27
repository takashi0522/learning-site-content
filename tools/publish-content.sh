#!/usr/bin/env bash
# コミット済みの HEAD を公開リポジトリ (takashi0522/learning-site-content) へ写す。
# CLAUDE.md・reports/・.claude/ は出さない。未コミットの変更も出ない (git archive を使うため)。
# このリポジトリの履歴は出さない。公開側は独立した履歴を積み、作者は GitHub の noreply アドレスにする。
set -euo pipefail
cd "$(dirname "$0")/.."

REPO=takashi0522/learning-site-content
DIR=.publish-content
EMAIL=52845529+takashi0522@users.noreply.github.com
EXCLUDE=(CLAUDE.md reports .claude)

if [ ! -d "$DIR/.git" ]; then
  git clone -q "https://github.com/$REPO.git" "$DIR"
fi
git -C "$DIR" config user.name takashi0522
git -C "$DIR" config user.email "$EMAIL"
git -C "$DIR" checkout -q -B main

find "$DIR" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
git archive --format=tar HEAD | tar -xf - -C "$DIR"
for p in "${EXCLUDE[@]}"; do rm -rf "${DIR:?}/$p"; done

git -C "$DIR" add -A
if git -C "$DIR" diff --cached --quiet; then
  echo "変化なし"
  exit 0
fi
git -C "$DIR" commit -q -m "Sync from learning-site ($(date +%Y-%m-%d))"
git -C "$DIR" push -q -u origin main
echo "https://github.com/$REPO"
