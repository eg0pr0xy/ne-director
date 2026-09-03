#!/bin/bash
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i -e 's/text-\[#0A0A0B\]/text-[color:var(--theme-text-inverted)]/g'
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i -e 's/bg-white/bg-[color:var(--theme-bg-inverted)]/g'
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i -e 's/hover:bg-gray-200/hover:bg-[color:var(--theme-bg-inverted-hover)]/g'
