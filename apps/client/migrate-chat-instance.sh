#!/bin/bash
# migrate-chat-instance.sh
# Automated migration script: useChatInstance → useChatInstanceV2

set -e  # Exit on any error

echo "🚀 Starting useChatInstance → useChatInstanceV2 migration..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the apps/client directory"
    exit 1
fi

# Backup files before migration
echo "💾 Creating backup of files to be modified..."
BACKUP_DIR="migration-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Find and backup files that will be modified
find src -name "*.ts" -o -name "*.tsx" | while read file; do
    if grep -l "useChatInstance" "$file" 2>/dev/null; then
        mkdir -p "$BACKUP_DIR/$(dirname "$file")"
        cp "$file" "$BACKUP_DIR/$file"
        echo "  📁 Backed up: $file"
    fi
done

echo ""
echo "📝 Updating imports..."

# Update imports from useChatInstance to chat-instance
find src -name "*.ts" -o -name "*.tsx" -exec grep -l "from \"@/hooks/useChatInstance\"" {} \; | while read file; do
    echo "  🔄 Updating imports in: $file"
    sed -i '' 's/from "@\/hooks\/useChatInstance"/from "@\/hooks\/chat-instance"/g' "$file"
done

# Update imports with single quotes
find src -name "*.ts" -o -name "*.tsx" -exec grep -l "from '@/hooks/useChatInstance'" {} \; | while read file; do
    echo "  🔄 Updating imports in: $file"
    sed -i '' "s/from '@\/hooks\/useChatInstance'/from '@\/hooks\/chat-instance'/g" "$file"
done

echo ""
echo "🔄 Updating function calls..."

# Update function calls from useChatInstance to useChatInstanceV2
find src -name "*.ts" -o -name "*.tsx" -exec grep -l "useChatInstance(" {} \; | while read file; do
    echo "  🔧 Updating function calls in: $file"
    sed -i '' 's/useChatInstance(/useChatInstanceV2(/g' "$file"
done

echo ""
echo "🎭 Updating test mocks..."

# Update mock imports in test files
find src -name "*.test.ts" -o -name "*.test.tsx" -exec grep -l "@/hooks/useChatInstance" {} \; | while read file; do
    echo "  🧪 Updating mock imports in: $file"
    sed -i '' 's/"@\/hooks\/useChatInstance"/"@\/hooks\/chat-instance"/g' "$file"
    sed -i '' "s/'@\/hooks\/useChatInstance'/'@\/hooks\/chat-instance'/g" "$file"
done

# Update mock function names in test files
find src -name "*.test.ts" -o -name "*.test.tsx" -exec grep -l "useChatInstance:" {} \; | while read file; do
    echo "  🔧 Updating mock function names in: $file"
    sed -i '' 's/useChatInstance:/useChatInstanceV2:/g' "$file"
done

# Update vi.mock calls
find src -name "*.test.ts" -o -name "*.test.tsx" -exec grep -l "vi.mock.*useChatInstance" {} \; | while read file; do
    echo "  🎭 Updating vi.mock calls in: $file"
    sed -i '' 's/useChatInstance: vi\.fn/useChatInstanceV2: vi.fn/g' "$file"
done

echo ""
echo "🔍 Checking for any remaining references..."

# Check for any remaining useChatInstance references (excluding the old file itself)
REMAINING=$(find src -name "*.ts" -o -name "*.tsx" | grep -v "useChatInstance.ts" | xargs grep -l "useChatInstance" 2>/dev/null || true)

if [ -n "$REMAINING" ]; then
    echo "⚠️  Warning: Found remaining useChatInstance references in:"
    echo "$REMAINING" | while read file; do
        echo "  📄 $file"
        grep -n "useChatInstance" "$file" | head -3
        echo ""
    done
    echo "Please review these files manually."
else
    echo "✅ No remaining useChatInstance references found!"
fi

echo ""
echo "🧪 Running tests to verify migration..."

# Run tests to check if migration was successful
if command -v bun >/dev/null 2>&1; then
    echo "Running tests with bun..."
    if bun test --run 2>/dev/null; then
        echo "✅ Tests passed!"
    else
        echo "❌ Some tests failed. Please review the output above."
        echo "💡 You can restore from backup in: $BACKUP_DIR"
    fi
else
    echo "⚠️  Bun not found. Please run 'bun test' manually to verify migration."
fi

echo ""
echo "🏗️  Checking build..."

# Check if build still works
if command -v bun >/dev/null 2>&1; then
    echo "Running build check..."
    if bun run build 2>/dev/null; then
        echo "✅ Build successful!"
    else
        echo "❌ Build failed. Please review the output above."
        echo "💡 You can restore from backup in: $BACKUP_DIR"
    fi
else
    echo "⚠️  Please run 'bun run build' manually to verify build."
fi

echo ""
echo "✅ Migration complete!"
echo ""
echo "📋 Summary:"
echo "  • Updated imports from useChatInstance to chat-instance"
echo "  • Updated function calls from useChatInstance to useChatInstanceV2"
echo "  • Updated test mocks and vi.mock calls"
echo "  • Created backup in: $BACKUP_DIR"
echo ""
echo "🔍 Next steps:"
echo "  1. Review any remaining references shown above"
echo "  2. Run 'bun test' to ensure all tests pass"
echo "  3. Run 'bun run build' to ensure build works"
echo "  4. Test your application manually"
echo "  5. If everything works, you can remove the backup: rm -rf $BACKUP_DIR"
echo ""
echo "🚀 Happy coding with the new event-driven architecture!" 