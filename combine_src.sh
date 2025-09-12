#!/bin/bash

# Define the output file name
OUTPUT_FILE="combined_codebase.ts"

# Clear the output file to start fresh
> "$OUTPUT_FILE"

# --- Add TypeScript Files ---
# Define the directories to search
DIRECTORIES="script setup src test"

# Find all .ts files in the specified directories and loop through them
find $DIRECTORIES -type f -name "*.*" | while read file; do
  # Print a header with the file path to the output file
  echo "// ======================================================" >> "$OUTPUT_FILE"
  echo "// FILE: $file" >> "$OUTPUT_FILE"
  echo "// ======================================================" >> "$OUTPUT_FILE"
  
  # Append the content of the current file
  cat "$file" >> "$OUTPUT_FILE"
  
  # Add a couple of newlines for spacing between files
  echo -e "\n\n" >> "$OUTPUT_FILE"
done

echo "✅ All project files have been combined into: $OUTPUT_FILE"