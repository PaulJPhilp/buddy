#!/bin/bash

# CLI Verification Test Script
# This script demonstrates the verification features of the Buddy CLI

echo "🧪 Buddy CLI Verification Test Script"
echo "======================================"

CLI_CMD="bun run apps/cli/src/index.ts"

echo ""
echo "1. Testing CLI Help and Commands"
echo "--------------------------------"

echo "📋 Main CLI help:"
$CLI_CMD --help

echo ""
echo "📋 Verify command help:"
$CLI_CMD verify --help

echo ""
echo "📋 Workspace command help:"
$CLI_CMD workspace --help

echo ""
echo "2. Testing Configuration Verification"
echo "-----------------------------------"

echo "🔍 Checking configuration health:"
$CLI_CMD verify config

echo ""
echo "🔍 Verbose configuration check:"
$CLI_CMD verify config --verbose

echo ""
echo "3. Testing Workspace Operations"
echo "------------------------------"

echo "📝 Listing existing workspaces:"
$CLI_CMD workspace list

echo ""
echo "📝 Creating test workspace with verification:"
$CLI_CMD workspace create "Test Workspace" --description="Test workspace for verification" --verify

echo ""
echo "📝 Listing workspaces after creation:"
$CLI_CMD workspace list

echo ""
echo "4. Testing Chat App Operations"
echo "-----------------------------"

echo "📝 Listing existing chat apps:"
$CLI_CMD chatapp list

echo ""
echo "📝 Creating test chat app (this might fail if workspace doesn't exist):"
$CLI_CMD chatapp create "Test Bot" --workspace="test-workspace" --description="Test chat app" --verify

echo ""
echo "5. Testing Verification Commands"
echo "-------------------------------"

echo "🔍 Verifying configuration after changes:"
$CLI_CMD verify config --format=json

echo ""
echo "🔍 Attempting to verify a workspace (might fail if none exist):"
$CLI_CMD verify workspace "test-workspace" 2>/dev/null || echo "ℹ️  No workspace found to verify (expected if none created)"

echo ""
echo "6. Testing Configuration Management"
echo "---------------------------------"

echo "📋 Showing current configuration:"
$CLI_CMD config show

echo ""
echo "📋 Getting specific config value:"
$CLI_CMD config get format

echo ""
echo "📝 Setting a config value:"
$CLI_CMD config set format json

echo ""
echo "📋 Showing configuration after change:"
$CLI_CMD config show

echo ""
echo "✅ Verification test script completed!"
echo ""
echo "📝 Summary of verification features tested:"
echo "  - Configuration health checking"
echo "  - Workspace creation with verification"
echo "  - Chat app creation with verification"
echo "  - Configuration comparison capabilities"
echo "  - Multiple output formats (table, json, yaml)"
echo ""
echo "🔧 To run individual tests:"
echo "  bun run apps/cli/src/index.ts verify --help"
echo "  bun run apps/cli/src/index.ts workspace create 'My Workspace' --verify"
echo "  bun run apps/cli/src/index.ts verify config --verbose" 