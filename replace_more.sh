#!/bin/bash
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i -e 's/text-gray-200/text-text-primary/g'
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i -e 's/text-gray-300/text-text-primary/g'
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i -e 's/text-gray-600/text-text-muted/g'
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i -e 's/bg-black\/80/bg-overlay/g'
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i -e 's/bg-black\/60/bg-overlay/g'
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i -e 's/backdrop-blur-sm//g' 
