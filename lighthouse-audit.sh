#!/bin/bash
# Comprehensive Lighthouse Audit Script for Bauhaus Portfolio
# Audits all pages and generates JSON reports

# Exit on error
set -e

# Configuration
SITE_URL="http://localhost:8081"
OUTPUT_DIR="/tmp/lighthouse-audits"
CHROME_FLAGS="--headless --no-sandbox --disable-gpu"
CATEGORIES="performance,accessibility,best-practices,seo"

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "🔦 Starting Comprehensive Lighthouse Audit..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Define all pages to audit
PAGES=(
  "home::/"
  "about::/about/"
  "contact::/contact/"
  "color-theory::/color-theory/"
  "projects::/projects/"
  "project-bauhaus::/projects/bauhaus-portfolio/"
  "project-design-system::/projects/design-system/"
  "project-ecommerce::/projects/ecommerce-redesign/"
  "blog::/blog/"
  "blog-welcome::/blog/welcome/"
  "blog-css::/blog/css-architecture/"
  "blog-docker::/blog/docker-frontend/"
  "robots::/robots/"
)

# Audit each page
for page in "${PAGES[@]}"; do
  IFS="::" read -r name path <<< "$page"
  
  echo "📊 Auditing: $name ($path)"
  
  /opt/homebrew/bin/lighthouse "${SITE_URL}${path}" \
    --output=json \
    --output-path="${OUTPUT_DIR}/audit-${name}.json" \
    --only-categories=$CATEGORIES \
    --chrome-flags="$CHROME_FLAGS" \
    --quiet || echo "  ⚠️  Warning: Audit may have issues"
  
  echo "  ✓ Complete"
  echo ""
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All audits complete!"
echo "📁 Results saved to: $OUTPUT_DIR"
echo ""

# Generate summary
echo "📋 AUDIT SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

for page in "${PAGES[@]}"; do
  IFS="::" read -r name path <<< "$page"
  JSON_FILE="${OUTPUT_DIR}/audit-${name}.json"
  
  if [ -f "$JSON_FILE" ]; then
    PERF=$(jq -r '.categories.performance.score * 100' "$JSON_FILE" 2>/dev/null || echo "N/A")
    A11Y=$(jq -r '.categories.accessibility.score * 100' "$JSON_FILE" 2>/dev/null || echo "N/A")
    BP=$(jq -r '.categories["best-practices"].score * 100' "$JSON_FILE" 2>/dev/null || echo "N/A")
    SEO=$(jq -r '.categories.seo.score * 100' "$JSON_FILE" 2>/dev/null || echo "N/A")
    
    printf "%-25s | Perf: %3s | A11y: %3s | BP: %3s | SEO: %3s\n" "$name" "$PERF" "$A11Y" "$BP" "$SEO"
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
