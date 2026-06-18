#!/bin/bash

git config --global user.name "vonubat-special-repo-ci-cd[bot]"
git config --global user.email "4084666+vonubat-special-repo-ci-cd[bot]@users.noreply.github.com"

git add README.md

git diff --quiet && git diff --staged --quiet || git commit -m "Update daily quote"
git push